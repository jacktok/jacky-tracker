import React, { useState } from 'react';
import { Plus, X, Check } from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Chip } from './ui/Chip';
import { ExpenseFormData } from '../types';
import { validateExpenseForm } from '../utils';

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationErrors = validateExpenseForm(formData);
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors([]);
    await onAddExpense(formData);
    
    // Reset form
    setFormData({
      date: new Date().toISOString().slice(0, 10),
      amount: 0,
      category: '',
      note: ''
    });
    setSelectedCategory('');
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
      <h2 className="panel-title">➕ Add Expense</h2>
      
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
            <h3 className="form-section__title">💳 Transaction Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <Input
                label="Date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                required
              />
              <Input
                label="Amount"
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
              <Chip onClick={() => handleQuickDate(0)}>Today</Chip>
              <Chip onClick={() => handleQuickDate(-1)}>Yesterday</Chip>
            </div>
          </div>

          <div className="form-section">
            <h3 className="form-section__title">🏷️ Category & Description</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-text-secondary mb-2 block">
                  Category
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
                  Add New Category
                </Button>
              </div>

              {showAddCategory && (
                <div className="add-category">
                  <Input
                    placeholder="Enter new category name"
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
                    Add
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
                    Cancel
                  </Button>
                </div>
              )}

              <Input
                label="Note"
                type="text"
                placeholder="Optional description..."
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
            disabled={!formData.category}
          >
            💾 Add Expense
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
            🔄 Reset
          </Button>
        </div>
      </form>
    </div>
  );
};

