import React, { useState } from 'react';
import { Plus, X, Check } from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Chip } from './ui/Chip';
import { ExpenseFormData } from '../types';
import { validateExpenseForm } from '../utils';
import { useTranslation } from '../hooks/useTranslation';

interface ExpenseFormProps {
  categories: string[];
  onAddExpense: (data: ExpenseFormData) => Promise<void>;
  onAddCategory: (category: string) => void;
  isLoading?: boolean;
}

export const ExpenseForm: React.FC<ExpenseFormProps> = ({
  categories,
  onAddExpense,
  onAddCategory,
  isLoading = false
}) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<ExpenseFormData>({
    date: new Date().toISOString().slice(0, 10),
    amount: 0,
    category: '',
    note: ''
  });

  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationErrors = validateExpenseForm(formData);
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors([]);
    setIsSuccess(false);
    
    try {
      await onAddExpense(formData);
      setIsSuccess(true);
      
      // Reset form after successful submission
      setTimeout(() => {
        setFormData({
          date: new Date().toISOString().slice(0, 10),
          amount: 0,
          category: '',
          note: ''
        });
        setSelectedCategory('');
        setIsSuccess(false);
      }, 1500); // Show success state for 1.5 seconds
    } catch (error) {
      // Error handling is done in the parent component
    }
  };

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    setFormData(prev => ({ ...prev, category }));
  };

  const handleAddCategory = () => {
    if (newCategory.trim()) {
      onAddCategory(newCategory.trim());
      setSelectedCategory(newCategory.trim());
      setFormData(prev => ({ ...prev, category: newCategory.trim() }));
      setNewCategory('');
      setShowAddCategory(false);
    }
  };

  const handleQuickDate = (days: number) => {
    const date = new Date();
    if (days !== 0) {
      date.setDate(date.getDate() + days);
    }
    setFormData(prev => ({ ...prev, date: date.toISOString().slice(0, 10) }));
  };

  return (
    <div className="panel">
      <h2 className="panel-title">➕ {t('expenseForm.title')}</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {errors.length > 0 && (
          <div className="p-3 bg-danger/10 border border-danger/20 rounded-lg">
            <ul className="text-sm text-danger space-y-1">
              {errors.map((error, index) => (
                <li key={index}>• {error}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="form-sections">
          <div className="form-section">
            <h3 className="form-section__title">💳 {t('expenseForm.transactionDetails')}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <Input
                label={t('expenseForm.date')}
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                required
              />
              <Input
                label={t('expenseForm.amount')}
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={formData.amount || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                required
              />
            </div>
            <div className="mini-actions">
              <Chip onClick={() => handleQuickDate(0)}>{t('expenseForm.today')}</Chip>
              <Chip onClick={() => handleQuickDate(-1)}>{t('expenseForm.yesterday')}</Chip>
            </div>
          </div>

          <div className="form-section">
            <h3 className="form-section__title">🏷️ {t('expenseForm.category')} & {t('expenseForm.note')}</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-text-secondary mb-2 block">
                  {t('expenseForm.category')}
                </label>
                <div className="category-buttons">
                  {categories.map((category) => (
                    <Chip
                      key={category}
                      variant="category"
                      active={selectedCategory === category}
                      onClick={() => handleCategorySelect(category)}
                    >
                      {category}
                    </Chip>
                  ))}
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowAddCategory(true)}
                  className="mt-2"
                >
                  <Plus size={14} />
                  {t('expenseForm.addNewCategory')}
                </Button>
              </div>

              {showAddCategory && (
                <div className="add-category">
                  <Input
                    placeholder={t('expenseForm.enterNewCategory')}
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    maxLength={20}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleAddCategory}
                    disabled={!newCategory.trim()}
                  >
                    <Check size={14} />
                    {t('actions.add')}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setShowAddCategory(false);
                      setNewCategory('');
                    }}
                  >
                    <X size={14} />
                    {t('actions.cancel')}
                  </Button>
                </div>
              )}

              <Input
                label={t('expenseForm.note')}
                type="text"
                placeholder={t('expenseForm.notePlaceholder')}
                value={formData.note}
                onChange={(e) => setFormData(prev => ({ ...prev, note: e.target.value }))}
                maxLength={140}
              />
            </div>
          </div>
        </div>

        <div className="actions">
          <Button
            type="submit"
            loading={isLoading}
            disabled={!formData.category || isSuccess}
            className={isSuccess ? "bg-success border-success text-white" : ""}
          >
            {isSuccess ? "✅ " + t('expenseForm.added') : "💾 " + t('expenseForm.addExpense')}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              setFormData({
                date: new Date().toISOString().slice(0, 10),
                amount: 0,
                category: '',
                note: ''
              });
              setSelectedCategory('');
              setErrors([]);
            }}
          >
            🔄 {t('actions.reset')}
          </Button>
        </div>
      </form>
    </div>
  );
};

