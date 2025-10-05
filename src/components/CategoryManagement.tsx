import { useState, useCallback } from 'react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { Badge } from './ui/Badge';
import { useToast } from '../hooks/useToast';
import { useTranslation } from '../hooks/useTranslation';

interface CategoryManagementProps {
  categories: string[];
  expenses: Array<{ id: string; category: string; amount: number }>;
  onAddCategory: (category: string) => void;
  onDeleteCategory: (category: string, migrateTo?: string) => void;
  onRenameCategory: (oldCategory: string, newCategory: string) => void;
}

export function CategoryManagement({
  categories,
  expenses,
  onAddCategory,
  onDeleteCategory,
  onRenameCategory
}: CategoryManagementProps) {
  const { t } = useTranslation();
  const [newCategory, setNewCategory] = useState('');
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [migrateTo, setMigrateTo] = useState('');
  const { showSuccess, showError } = useToast();

  // Get category usage statistics
  const getCategoryStats = useCallback(() => {
    const stats = categories.map(category => {
      const categoryExpenses = expenses.filter(exp => exp.category === category);
      const totalAmount = categoryExpenses.reduce((sum, exp) => sum + exp.amount, 0);
      return {
        category,
        count: categoryExpenses.length,
        totalAmount
      };
    }).sort((a, b) => b.count - a.count);

    return stats;
  }, [categories, expenses]);

  const handleAddCategory = useCallback(() => {
    if (!newCategory.trim()) {
      showError(t('categoryManagement.categoryEmpty'));
      return;
    }

    if (categories.includes(newCategory.trim())) {
      showError(t('categoryManagement.categoryExists'));
      return;
    }

    onAddCategory(newCategory.trim());
    setNewCategory('');
    showSuccess(t('categoryManagement.categoryAdded'));
  }, [newCategory, categories, onAddCategory, showSuccess, showError, t]);

  const handleStartEdit = useCallback((category: string) => {
    setEditingCategory(category);
    setEditValue(category);
  }, []);

  const handleCancelEdit = useCallback(() => {
    setEditingCategory(null);
    setEditValue('');
  }, []);

  const handleSaveEdit = useCallback(() => {
    if (!editValue.trim()) {
      showError(t('categoryManagement.categoryEmpty'));
      return;
    }

    if (editValue.trim() !== editingCategory && categories.includes(editValue.trim())) {
      showError(t('categoryManagement.categoryExists'));
      return;
    }

    if (editValue.trim() !== editingCategory) {
      onRenameCategory(editingCategory!, editValue.trim());
      showSuccess(t('categoryManagement.categoryRenamed'));
    }

    setEditingCategory(null);
    setEditValue('');
  }, [editValue, editingCategory, categories, onRenameCategory, showSuccess, showError, t]);

  const handleDeleteClick = useCallback((category: string) => {
    const categoryExpenses = expenses.filter(exp => exp.category === category);
    if (categoryExpenses.length > 0) {
      setDeleteConfirm(category);
      setMigrateTo('');
    } else {
      onDeleteCategory(category);
      showSuccess(t('categoryManagement.categoryDeleted'));
    }
  }, [expenses, onDeleteCategory, showSuccess, t]);

  const handleConfirmDelete = useCallback(() => {
    if (!deleteConfirm) return;

    const categoryExpenses = expenses.filter(exp => exp.category === deleteConfirm);
    if (categoryExpenses.length > 0 && !migrateTo) {
      showError(t('categoryManagement.selectMigrateCategory'));
      return;
    }

    onDeleteCategory(deleteConfirm, migrateTo || undefined);
    setDeleteConfirm(null);
    setMigrateTo('');
    showSuccess(t('categoryManagement.categoryMigrated'));
  }, [deleteConfirm, migrateTo, expenses, onDeleteCategory, showSuccess, showError, t]);

  const handleCancelDelete = useCallback(() => {
    setDeleteConfirm(null);
    setMigrateTo('');
  }, []);

  const categoryStats = getCategoryStats();
  const availableCategories = categories.filter(cat => cat !== deleteConfirm);

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="bg-card rounded-lg p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-semibold text-text mb-3 sm:mb-4">{t('categoryManagement.addNewCategory')}</h2>
        <div className="flex gap-2">
          <Input
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            placeholder={t('categoryManagement.enterCategoryName')}
            onKeyPress={(e) => e.key === 'Enter' && handleAddCategory()}
            className="flex-1"
          />
          <Button onClick={handleAddCategory} disabled={!newCategory.trim()}>
            {t('categoryManagement.addCategory')}
          </Button>
        </div>
      </div>

      <div className="bg-card rounded-lg p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-semibold text-text mb-3 sm:mb-4">{t('categoryManagement.manageCategories')}</h2>
        
        {categoryStats.length === 0 ? (
          <div className="text-center py-8 text-text-muted">
            {t('categoryManagement.noCategories')}
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>{t('categoryManagement.category')}</th>
                  <th>{t('categoryManagement.expenses')}</th>
                  <th>{t('categoryManagement.totalAmount')}</th>
                  <th className="text-right">{t('categoryManagement.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {categoryStats.map(({ category, count, totalAmount }) => (
                  <tr key={category} className="table__row">
                    <td className="table__cell">
                      {editingCategory === category ? (
                        <div className="flex items-center gap-2">
                          <Input
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSaveEdit()}
                            className="w-full max-w-xs"
                            autoFocus
                          />
                        </div>
                      ) : (
                        <span className="font-medium text-text">{category}</span>
                      )}
                    </td>
                    <td className="table__cell">
                      <Badge variant="secondary">
                        {count} {count === 1 ? t('expenseTable.title').toLowerCase() : t('expenseTable.title').toLowerCase()}
                      </Badge>
                    </td>
                    <td className="table__cell">
                      <span className="font-mono text-text">${totalAmount.toFixed(2)}</span>
                    </td>
                    <td className="table__cell table__cell--actions">
                      {editingCategory === category ? (
                        <div className="table-actions">
                          <Button size="sm" onClick={handleSaveEdit}>
                            {t('categoryManagement.save')}
                          </Button>
                          <Button size="sm" variant="secondary" onClick={handleCancelEdit}>
                            {t('categoryManagement.cancel')}
                          </Button>
                        </div>
                      ) : (
                        <div className="table-actions">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleStartEdit(category)}
                          >
                            {t('categoryManagement.rename')}
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteClick(category)}
                          >
                            {t('categoryManagement.delete')}
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg p-4 sm:p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-text mb-3 sm:mb-4">
              {t('categoryManagement.deleteCategoryTitle')} "{deleteConfirm}"
            </h3>
            <p className="text-text-secondary mb-3 sm:mb-4">
              {t('categoryManagement.migrateExpenses', { count: expenses.filter(exp => exp.category === deleteConfirm).length })}
            </p>
            
            <div className="mb-3 sm:mb-4">
              <Select
                value={migrateTo}
                onChange={(e) => setMigrateTo(e.target.value)}
                options={[
                  { value: '', label: t('categoryManagement.selectCategory') },
                  ...availableCategories.map(cat => ({ value: cat, label: cat }))
                ]}
              />
            </div>
            
            <div className="flex gap-2 justify-end">
              <Button variant="secondary" onClick={handleCancelDelete}>
                {t('categoryManagement.cancel')}
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleConfirmDelete}
                disabled={!migrateTo}
              >
                {t('categoryManagement.deleteAndMigrate')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CategoryManagement;