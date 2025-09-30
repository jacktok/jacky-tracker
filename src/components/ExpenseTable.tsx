import React, { useState } from 'react';
import { Edit, Trash2, Save, X } from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { Badge } from './ui/Badge';
import { Expense } from '../types';
import { formatCurrency, escapeHtml } from '../utils';

interface ExpenseTableProps {
  expenses: Expense[];
  categories: string[];
  onUpdateExpense: (id: string, data: Partial<Expense>) => Promise<void>;
  onDeleteExpense: (id: string) => Promise<void>;
}

export const ExpenseTable: React.FC<ExpenseTableProps> = ({
  expenses,
  categories,
  onUpdateExpense,
  onDeleteExpense
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<Expense>>({});

  const handleEdit = (expense: Expense) => {
    setEditingId(expense.id);
    setEditData({
      date: expense.date,
      amount: expense.amount,
      category: expense.category,
      note: expense.note
    });
  };

  const handleSave = async () => {
    if (editingId && editData.date && editData.amount && editData.category) {
      await onUpdateExpense(editingId, editData);
      setEditingId(null);
      setEditData({});
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditData({});
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Delete this expense?')) {
      await onDeleteExpense(id);
    }
  };

  if (expenses.length === 0) {
    return (
      <div className="panel">
        <h2 className="panel-title">📋 Expenses</h2>
        <div className="empty">
          📝 No expenses yet - Add your first expense above!
        </div>
      </div>
    );
  }

  return (
    <div className="panel">
      <h2 className="panel-title">📋 Expenses</h2>
      
      <div className="responsive-table">
        <table className="table">
          <thead>
            <tr>
              <th className="table__header">Date</th>
              <th className="table__header">Amount</th>
              <th className="table__header">Category</th>
              <th className="table__header">Note</th>
              <th className="table__header">Actions</th>
            </tr>
          </thead>
          <tbody>
            {expenses.map((expense) => (
              <tr key={expense.id} className="table__row">
                <td className="table__cell">
                  {editingId === expense.id ? (
                    <Input
                      type="date"
                      value={editData.date || ''}
                      onChange={(e) => setEditData(prev => ({ ...prev, date: e.target.value }))}
                      className="w-full"
                    />
                  ) : (
                    expense.date
                  )}
                </td>
                
                <td className="table__cell">
                  {editingId === expense.id ? (
                    <Input
                      type="number"
                      step="0.01"
                      value={editData.amount || ''}
                      onChange={(e) => setEditData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                      className="w-full"
                    />
                  ) : (
                    <span className="font-mono text-danger font-semibold">
                      <span className="hidden sm:inline">{formatCurrency(expense.amount, true)}</span>
                      <span className="sm:hidden">{formatCurrency(expense.amount, false)}</span>
                    </span>
                  )}
                </td>
                
                <td className="table__cell">
                  {editingId === expense.id ? (
                    <Select
                      value={editData.category || ''}
                      onChange={(e) => setEditData(prev => ({ ...prev, category: e.target.value }))}
                      options={categories.map(cat => ({ value: cat, label: cat }))}
                      className="w-full"
                    />
                  ) : (
                    <Badge variant="category">{expense.category}</Badge>
                  )}
                </td>
                
                <td className="table__cell">
                  {editingId === expense.id ? (
                    <Input
                      type="text"
                      value={editData.note || ''}
                      onChange={(e) => setEditData(prev => ({ ...prev, note: e.target.value }))}
                      className="w-full"
                    />
                  ) : (
                    escapeHtml(expense.note)
                  )}
                </td>
                
                <td className="table__cell table__cell--actions">
                  {editingId === expense.id ? (
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={handleSave}
                        disabled={!editData.date || !editData.amount || !editData.category}
                      >
                        <Save size={14} />
                        <span className="hidden sm:inline">Save</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={handleCancel}
                      >
                        <X size={14} />
                        <span className="hidden sm:inline">Cancel</span>
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleEdit(expense)}
                      >
                        <Edit size={14} />
                        <span className="hidden sm:inline">Edit</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleDelete(expense.id)}
                      >
                        <Trash2 size={14} />
                        <span className="hidden sm:inline">Delete</span>
                      </Button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
