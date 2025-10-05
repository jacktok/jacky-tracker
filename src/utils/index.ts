import { Expense, CategoryBreakdown } from '../types';

export const STORAGE_KEY = 'jacky_money_tracker_v1';

export const defaultCategories = [
  'Food',
  'Transport',
  'Housing',
  'Utilities',
  'Health',
  'Entertainment',
  'Shopping',
  'Education',
  'Travel',
  'Loan',
  'Other'
];

export function generateId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function formatCurrency(value: number, showCurrencyCode: boolean = true): string {
  if (showCurrencyCode) {
    return value.toLocaleString(undefined, { 
      style: 'currency', 
      currency: 'USD' 
    });
  } else {
    // For mobile view, show just the number with $ symbol
    return '$' + value.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }
}

export function parseDate(dateStr: string): Date {
  return new Date(dateStr + 'T00:00:00');
}

export function isWithinDateRange(dateStr: string, fromStr: string, toStr: string): boolean {
  if (!fromStr && !toStr) return true;
  
  const date = parseDate(dateStr).getTime();
  if (fromStr && date < parseDate(fromStr).getTime()) return false;
  if (toStr && date > parseDate(toStr).getTime()) return false;
  
  return true;
}

export function filterExpenses(expenses: Expense[], filters: any) {
  const { from, to, category, search } = filters;
  
  let filtered = expenses.filter(expense => 
    isWithinDateRange(expense.date, from, to)
  );
  
  if (category) {
    filtered = filtered.filter(expense => expense.category === category);
  }
  
  if (search) {
    filtered = filtered.filter(expense => 
      expense.note.toLowerCase().includes(search.toLowerCase())
    );
  }
  
  return filtered;
}

export function sortExpenses(expenses: Expense[], sortBy: string): Expense[] {
  const sorted = [...expenses];
  
  switch (sortBy) {
    case 'date_asc':
      return sorted.sort((a, b) => a.date.localeCompare(b.date));
    case 'amount_desc':
      return sorted.sort((a, b) => b.amount - a.amount);
    case 'amount_asc':
      return sorted.sort((a, b) => a.amount - b.amount);
    case 'date_desc':
    default:
      return sorted.sort((a, b) => b.date.localeCompare(a.date));
  }
}

export function calculateThisMonthTotal(expenses: Expense[]): number {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  
  return expenses.reduce((total, expense) => {
    const expenseDate = parseDate(expense.date);
    return (expenseDate.getFullYear() === year && expenseDate.getMonth() === month) 
      ? total + expense.amount 
      : total;
  }, 0);
}

export function calculateCategoryBreakdown(expenses: Expense[]): CategoryBreakdown {
  const breakdown: CategoryBreakdown = {};
  
  expenses.forEach(expense => {
    breakdown[expense.category] = (breakdown[expense.category] || 0) + expense.amount;
  });
  
  return breakdown;
}

export function escapeHtml(str: string): string {
  return str.replace(/[&<>"']/g, (match) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[match] || match));
}

export function getDateRangePresets() {
  // Use local date to avoid timezone issues
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 6);
  
  const monthAgo = new Date(today);
  monthAgo.setDate(monthAgo.getDate() - 29); // 29 days ago + today = 30 days total
  
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  
  // Format dates as YYYY-MM-DD
  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  return {
    today: {
      from: formatDate(today),
      to: formatDate(today)
    },
    yesterday: {
      from: formatDate(yesterday),
      to: formatDate(yesterday)
    },
    last7Days: {
      from: formatDate(weekAgo),
      to: formatDate(today)
    },
    last30Days: {
      from: formatDate(monthAgo),
      to: formatDate(today)
    },
    thisMonth: {
      from: formatDate(startOfMonth),
      to: formatDate(endOfMonth)
    }
  };
}

export function validateExpenseForm(data: any): string[] {
  const errors: string[] = [];
  
  if (!data.date) {
    errors.push('Date is required');
  }
  
  if (!data.amount || data.amount <= 0) {
    errors.push('Amount must be greater than 0');
  }
  
  if (!data.category) {
    errors.push('Category is required');
  }
  
  if (data.note && data.note.length > 140) {
    errors.push('Note must be 140 characters or less');
  }
  
  return errors;
}
