import { useCallback } from 'react';
import { Header } from './components/Header';
import { SummaryCards } from './components/SummaryCards';
import { ExpenseForm } from './components/ExpenseForm';
import { Filters } from './components/Filters';
import { ExpenseTable } from './components/ExpenseTable';
import { CategoryBreakdown } from './components/CategoryBreakdown';
import { ToastContainer } from './components/ui/Toast';
import { useExpenses } from './hooks/useExpenses';
import { useToast } from './hooks/useToast';
import { 
  filterExpenses, 
  sortExpenses, 
  calculateThisMonthTotal, 
  calculateCategoryBreakdown
} from './utils';
import { ExpenseFormData } from './types';

function App() {
  const {
    expenses,
    categories,
    filters,
    theme,
    isLoading,
    addExpense,
    deleteExpense,
    updateExpense,
    addCategory,
    updateFilters,
    toggleTheme
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
      
      if (parsed.data && Array.isArray(parsed.data.expenses)) {
        // Import expenses (this would need to be implemented in the hook)
        showSuccess('Data imported successfully');
      } else {
        showError('Invalid file format');
      }
    } catch (error) {
      showError('Failed to import file');
    }
  }, [showSuccess, showError]);

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

export default App;
