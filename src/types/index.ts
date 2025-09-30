export interface Expense {
  id: string;
  date: string;
  amount: number;
  category: string;
  note: string;
}

export interface Filters {
  from: string;
  to: string;
  category: string;
  search: string;
  sort: 'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc';
}

export interface AppState {
  expenses: Expense[];
  categories: string[];
  filters: Filters;
  theme: 'light' | 'dark';
}

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
}

export interface CategoryBreakdown {
  [category: string]: number;
}

export type SortOption = 'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc';

export interface ExpenseFormData {
  date: string;
  amount: number;
  category: string;
  note: string;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  success: boolean;
}

export interface User {
  id: string;
  email: string;
  name: string;
  picture?: string;
  provider: 'google' | 'line';
  providerId: string;
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginResponse {
  user: User;
  token: string;
}

