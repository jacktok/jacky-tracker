import { Expense, ApiResponse } from '../types';

const API_BASE = '';

export class ApiService {
  private static authToken: string | null = null;

  static setAuthToken(token: string | null) {
    this.authToken = token;
  }

  private static async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string>),
      };

      if (this.authToken) {
        headers['Authorization'] = `Bearer ${this.authToken}`;
      }

      const response = await fetch(`${API_BASE}${endpoint}`, {
        headers,
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return { data, success: true };
    } catch (error) {
      console.error('API request failed endpoint:', endpoint, error);
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

  // Auth endpoints
  static async get(endpoint: string): Promise<ApiResponse<any>> {
    return this.request(endpoint, { method: 'GET' });
  }

  static async post(endpoint: string, data?: any): Promise<ApiResponse<any>> {
    return this.request(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  static async put(endpoint: string, data?: any): Promise<ApiResponse<any>> {
    return this.request(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  static async delete(endpoint: string): Promise<ApiResponse<any>> {
    return this.request(endpoint, { method: 'DELETE' });
  }

  // Category management endpoints
  static async getCategories(): Promise<ApiResponse<string[]>> {
    return this.request<string[]>('/api/categories');
  }

  static async createCategory(name: string): Promise<ApiResponse<string>> {
    return this.request<string>('/api/categories', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
  }

  static async renameCategory(oldName: string, newName: string): Promise<ApiResponse<{ message: string }>> {
    return this.request<{ message: string }>(`/api/categories/${encodeURIComponent(oldName)}`, {
      method: 'PUT',
      body: JSON.stringify({ newName }),
    });
  }

  static async deleteCategory(name: string, migrateTo?: string): Promise<ApiResponse<{ message: string }>> {
    return this.request<{ message: string }>(`/api/categories/${encodeURIComponent(name)}`, {
      method: 'DELETE',
      body: JSON.stringify({ migrateTo }),
    });
  }

  // LLM classification endpoint
  static async classifyExpense(message: string, amount: number, description?: string): Promise<ApiResponse<{
    category: string | null;
    confidence: number;
    description: string;
    isExisting: boolean;
  }>> {
    return this.request<{
      category: string | null;
      confidence: number;
      description: string;
      isExisting: boolean;
    }>('/api/classify-expense', {
      method: 'POST',
      body: JSON.stringify({ message, amount, description }),
    });
  }
}

export const api = ApiService;

