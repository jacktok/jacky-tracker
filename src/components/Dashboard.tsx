import { useCallback } from 'react';
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
    isLoading,
    addExpense,
    deleteExpense,
    updateExpense,
    addCategory,
    updateFilters
  } = useExpenses();

  const { toasts, removeToast, showSuccess, showError, addToast } = useToast();

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
      // Show success toast for 4 seconds to ensure mobile users see it
      addToast(`✅ Expense added: ${data.category} - $${data.amount.toFixed(2)}`, 'success', 4000);
    } catch (error) {
      showError('Failed to add expense');
    }
  }, [addExpense, addToast, showError]);

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
    <div className="space-y-4 sm:space-y-6">
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
      
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}

export default Dashboard;