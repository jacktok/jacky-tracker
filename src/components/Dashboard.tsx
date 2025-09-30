import { useCallback } from 'react';
import { Header } from './Header';
import { SummaryCards } from './SummaryCards';
import { ExpenseForm } from './ExpenseForm';
import { Filters } from './Filters';
import { ExpenseTable } from './ExpenseTable';
import { CategoryBreakdown } from './CategoryBreakdown';
import { ToastContainer } from './ui/Toast';
import { useExpenses } from '../hooks/useExpenses';
import { useToast } from '../hooks/useToast';
import { 
  filterExpenses, 
  sortExpenses, 
  calculateThisMonthTotal, 
  calculateCategoryBreakdown
} from '../utils';
import { ExpenseFormData } from '../types';

export function Dashboard() {
  const {
    expenses,
    categories,
    filters,
    theme,
    isLoading,
    isAuthenticated,
    isOnline,
    addExpense,
    deleteExpense,
    updateExpense,
    addCategory,
    updateFilters,
    toggleTheme,
    importExpenses
  } = useExpenses();

  const { toasts, removeToast, showSuccess, showError } = useToast();

  // Calculate filtered and sorted expenses
  const filteredExpenses = sortExpenses(
    filterExpenses(expenses, filters),
    filters.sort
  );

  // Calculate totals
  const totalFiltered = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  const totalThisMonth = calculateThisMonthTotal(expenses);
  const categoryBreakdown = calculateCategoryBreakdown(filteredExpenses);

  // Handle expense operations
  const handleAddExpense = useCallback(async (data: ExpenseFormData) => {
    try {
      await addExpense(data);
      showSuccess('Expense added successfully');
    } catch (error) {
      showError('Failed to add expense');
    }
  }, [addExpense, showSuccess, showError]);

  const handleDeleteExpense = useCallback(async (id: string) => {
    try {
      await deleteExpense(id);
      showSuccess('Expense deleted');
    } catch (error) {
      showError('Failed to delete expense');
    }
  }, [deleteExpense, showSuccess, showError]);

  const handleUpdateExpense = useCallback(async (id: string, data: Partial<ExpenseFormData>) => {
    try {
      await updateExpense(id, data as any);
      showSuccess('Expense updated');
    } catch (error) {
      showError('Failed to update expense');
    }
  }, [updateExpense, showSuccess, showError]);

  // Handle export/import
  const handleExport = useCallback(() => {
    const data = {
      version: 1,
      exportedAt: new Date().toISOString(),
      data: { expenses, categories }
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { 
      type: 'application/json' 
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'money-tracker.json';
    a.click();
    URL.revokeObjectURL(url);
    
    showSuccess('Data exported successfully');
  }, [expenses, categories, showSuccess]);

  const handleImport = useCallback(async (file: File) => {
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      
      // Validate the imported data structure
      if (!parsed.data) {
        showError('Invalid file format: missing data section');
        return;
      }
      
      if (!Array.isArray(parsed.data.expenses)) {
        showError('Invalid file format: expenses must be an array');
        return;
      }
      
      // Validate expense structure
      const validExpenses = parsed.data.expenses.filter((expense: any) => 
        expense && 
        typeof expense.id === 'string' &&
        typeof expense.date === 'string' &&
        typeof expense.amount === 'number' &&
        typeof expense.category === 'string' &&
        typeof expense.note === 'string'
      );
      
      if (validExpenses.length !== parsed.data.expenses.length) {
        showError('Some expenses were skipped due to invalid format');
      }
      
      // Show confirmation dialog if there are existing expenses
      if (expenses.length > 0) {
        const confirmed = window.confirm(
          `This will replace your current data (${expenses.length} expenses, ${categories.length} categories) with the imported data (${validExpenses.length} expenses, ${parsed.data.categories?.length || 0} categories). Are you sure?`
        );
        if (!confirmed) {
          showSuccess('Import cancelled');
          return;
        }
      }
      
      await importExpenses({
        expenses: validExpenses,
        categories: Array.isArray(parsed.data.categories) ? parsed.data.categories : []
      });
      
      // Show different messages based on authentication status
      const authStatus = isAuthenticated && isOnline ? 'and synced to database' : 'to local storage';
      showSuccess(`Data imported successfully ${authStatus}: ${validExpenses.length} expenses, ${parsed.data.categories?.length || 0} categories`);
    } catch (error) {
      console.error('Import error:', error);
      showError('Failed to import file: Invalid JSON format');
    }
  }, [importExpenses, showSuccess, showError, expenses.length, categories.length, isAuthenticated, isOnline]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-text-secondary">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg">
      <Header
        theme={theme}
        onToggleTheme={toggleTheme}
        onExport={handleExport}
        onImport={handleImport}
      />
      
      <main className="container">
        <SummaryCards
          totalFiltered={totalFiltered}
          totalThisMonth={totalThisMonth}
          entryCount={expenses.length}
        />
        
        <ExpenseForm
          categories={categories}
          onAddExpense={handleAddExpense}
          onAddCategory={addCategory}
          isLoading={isLoading}
        />
        
        <Filters
          filters={filters}
          categories={categories}
          onFiltersChange={updateFilters}
        />
        
        <ExpenseTable
          expenses={filteredExpenses}
          categories={categories}
          onUpdateExpense={handleUpdateExpense}
          onDeleteExpense={handleDeleteExpense}
        />
        
        <CategoryBreakdown breakdown={categoryBreakdown} />
      </main>
      
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
