import React from 'react';
import { CategoryBreakdown as CategoryBreakdownType } from '../types';
import { formatCurrency } from '../utils';

interface CategoryBreakdownProps {
  breakdown: CategoryBreakdownType;
}

export const CategoryBreakdown: React.FC<CategoryBreakdownProps> = ({
  breakdown
}) => {
  const sortedCategories = Object.entries(breakdown)
    .sort(([, a], [, b]) => b - a);

  if (sortedCategories.length === 0) {
    return (
      <div className="panel">
        <h2 className="panel-title">📊 Category Breakdown (filtered)</h2>
        <div className="empty">
          No expenses to breakdown
        </div>
      </div>
    );
  }

  return (
    <div className="panel">
      <h2 className="panel-title">📊 Category Breakdown (filtered)</h2>
      
      <div className="breakdown">
        {sortedCategories.map(([category, amount]) => (
          <div key={category} className="breakdown__item">
            <div className="breakdown__row">
              <span>{category}</span>
              <span className="breakdown__value font-mono">
                <span className="hidden sm:inline">{formatCurrency(amount, true)}</span>
                <span className="sm:hidden">{formatCurrency(amount, false)}</span>
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

