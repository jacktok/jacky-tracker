import { useCallback } from 'react';
import { SummaryCards } from './SummaryCards';
import { ExpenseForm } from './ExpenseForm';
import { Filters } from './Filters';
import { ExpenseTable } from './ExpenseTable';
import { CategoryBreakdown } from './CategoryBreakdown';
import { ToastContainer } from './ui/Toast';
import { useExpenses } from '../hooks/useExpenses';
import { useToast } from '../hooks/useToast';
import { useTranslation } from '../hooks/useTranslation';
import { 
  filterExpenses, 
  sortExpenses, 
  calculateThisMonthTotal, 
  calculateCategoryBreakdown
} from '../utils';
import { ExpenseFormData } from '../types';

export function Dashboard() {
  const { t } = useTranslation();
  const {
    expenses,
    categories,
    filters,
    isLoading,
    addExpense,
    deleteExpense,
    updateExpense,
    addCategory,
    updateFilters,
    syncWithApi
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
      addToast(`✅ ${t('messages.expenseAdded')}: ${data.category} - $${data.amount.toFixed(2)}`, 'success', 4000);
    } catch (error) {
      showError(t('messages.expenseAddFailed'));
    }
  }, [addExpense, addToast, showError, t]);

  const handleDeleteExpense = useCallback(async (id: string) => {
    try {
      await deleteExpense(id);
      showSuccess(t('messages.expenseDeleted'));
    } catch (error) {
      showError(t('messages.expenseDeleteFailed'));
    }
  }, [deleteExpense, showSuccess, showError, t]);

  const handleUpdateExpense = useCallback(async (id: string, data: Partial<ExpenseFormData>) => {
    try {
      await updateExpense(id, data as any);
      showSuccess(t('messages.expenseUpdated'));
    } catch (error) {
      showError(t('messages.expenseUpdateFailed'));
    }
  }, [updateExpense, showSuccess, showError, t]);


  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-text-secondary">{t('app.loading')}</p>
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
        onReload={syncWithApi}
      />
      
      <CategoryBreakdown breakdown={categoryBreakdown} />
      
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}

export default Dashboard;