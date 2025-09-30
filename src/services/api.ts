import { Expense, ApiResponse } from '../types';

const API_BASE = '';

export class ApiService {
  private static async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return { data, success: true };
    } catch (error) {
      console.error('API request failed:', error);
      return { 
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false 
      };
    }
  }

  static async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE}/health`);
      return response.ok;
    } catch {
      return false;
    }
  }

  static async getExpenses(): Promise<ApiResponse<Expense[]>> {
    return this.request<Expense[]>('/api/expenses');
  }

  static async createExpense(expense: Omit<Expense, 'id'>): Promise<ApiResponse<Expense>> {
    return this.request<Expense>('/api/expenses', {
      method: 'POST',
      body: JSON.stringify(expense),
    });
  }

  static async updateExpense(id: string, expense: Omit<Expense, 'id'>): Promise<ApiResponse<Expense>> {
    return this.request<Expense>(`/api/expenses/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(expense),
    });
  }

  static async deleteExpense(id: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/api/expenses/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  }

  static async bulkCreateExpenses(expenses: Omit<Expense, 'id'>[]): Promise<ApiResponse<Expense[]>> {
    return this.request<Expense[]>('/api/expenses/bulk', {
      method: 'POST',
      body: JSON.stringify({ expenses }),
    });
  }
}

