import { useState, useEffect, useCallback } from 'react';
import { Expense, Filters, AppState } from '../types';
import { ApiService } from '../services/api';
import { STORAGE_KEY, defaultCategories } from '../utils';
import { useAuth } from '../contexts/AuthContext';

export function useExpenses() {
  const { isAuthenticated } = useAuth();
  const [state, setState] = useState<AppState>({
    expenses: [],
    categories: [...defaultCategories],
    filters: {
      from: '',
      to: '',
      category: '',
      search: '',
      sort: 'date_desc'
    },
    theme: 'dark'
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(false);

  // Load state from localStorage
  const loadState = useCallback(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setState(prevState => ({
          ...prevState,
          expenses: parsed.expenses || [],
          categories: parsed.categories || [...defaultCategories],
          filters: { ...prevState.filters, ...parsed.filters },
          theme: parsed.theme || 'dark'
        }));
      }
    } catch (error) {
      console.warn('Failed to load saved data:', error);
    }
  }, []);

  // Save state to localStorage
  const saveState = useCallback((newState: Partial<AppState>) => {
    setState(prevState => {
      const updated = { ...prevState, ...newState };
      
      const toSave = {
        expenses: updated.expenses,
        categories: updated.categories,
        filters: updated.filters,
        theme: updated.theme
      };
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
      return updated;
    });
  }, []);

  // Try to sync with API
  const syncWithApi = useCallback(async () => {
    // Only sync with API if user is authenticated
    if (!isAuthenticated) {
      setIsOnline(false);
      return;
    }

    try {
      const isHealthy = await ApiService.healthCheck();
      setIsOnline(isHealthy);
      
      if (isHealthy) {
        const response = await ApiService.getExpenses();
        if (response.success && response.data) {
          setState(prevState => ({
            ...prevState,
            expenses: response.data as Expense[]
          }));
        }
      }
    } catch (error) {
      console.warn('Failed to sync with API:', error);
      setIsOnline(false);
    }
  }, [isAuthenticated]);

  // Add expense
  const addExpense = useCallback(async (expenseData: Omit<Expense, 'id'>) => {
    const tempId = Math.random().toString(36).slice(2) + Date.now().toString(36);
    const tempExpense = { ...expenseData, id: tempId };
    
    // Add locally first for immediate UI update
    setState(prevState => ({
      ...prevState,
      expenses: [...prevState.expenses, tempExpense]
    }));

    // Try to sync with API only if authenticated and online
    if (isAuthenticated && isOnline) {
      try {
        const response = await ApiService.createExpense(expenseData);
        if (response.success && response.data) {
          setState(prevState => ({
            ...prevState,
            expenses: prevState.expenses.map(exp => 
              exp.id === tempId ? response.data! : exp
            )
          }));
        }
      } catch (error) {
        console.warn('Failed to sync expense to API:', error);
      }
    }
  }, [isAuthenticated, isOnline]);

  // Delete expense
  const deleteExpense = useCallback(async (id: string) => {
    // Remove locally first
    setState(prevState => ({
      ...prevState,
      expenses: prevState.expenses.filter(exp => exp.id !== id)
    }));

    // Try to sync with API only if authenticated and online
    if (isAuthenticated && isOnline) {
      try {
        await ApiService.deleteExpense(id);
      } catch (error) {
        console.warn('Failed to delete expense from API:', error);
      }
    }
  }, [isAuthenticated, isOnline]);

  // Update expense
  const updateExpense = useCallback(async (id: string, expenseData: Omit<Expense, 'id'>) => {
    // Update locally first
    setState(prevState => ({
      ...prevState,
      expenses: prevState.expenses.map(exp => 
        exp.id === id ? { ...expenseData, id } : exp
      )
    }));

    // Try to sync with API only if authenticated and online
    if (isAuthenticated && isOnline) {
      try {
        const response = await ApiService.updateExpense(id, expenseData);
        if (response.success && response.data) {
          setState(prevState => ({
            ...prevState,
            expenses: prevState.expenses.map(exp => 
              exp.id === id ? response.data! : exp
            )
          }));
        }
      } catch (error) {
        console.warn('Failed to update expense in API:', error);
      }
    }
  }, [isAuthenticated, isOnline]);

  // Add category
  const addCategory = useCallback((category: string) => {
    setState(prevState => {
      if (prevState.categories.includes(category)) {
        return prevState;
      }
      
      const updated = {
        ...prevState,
        categories: [...prevState.categories, category]
      };
      
      saveState(updated);
      return updated;
    });
  }, [saveState]);

  // Update filters
  const updateFilters = useCallback((newFilters: Partial<Filters>) => {
    setState(prevState => {
      const updated = {
        ...prevState,
        filters: { ...prevState.filters, ...newFilters }
      };
      
      saveState(updated);
      return updated;
    });
  }, [saveState]);

  // Toggle theme
  const toggleTheme = useCallback(() => {
    setState(prevState => {
      const newTheme: 'light' | 'dark' = prevState.theme === 'light' ? 'dark' : 'light';
      const updated = { ...prevState, theme: newTheme };
      
      saveState(updated);
      return updated;
    });
  }, [saveState]);

  // Initialize
  useEffect(() => {
    const initialize = async () => {
      setIsLoading(true);
      loadState();
      await syncWithApi();
      setIsLoading(false);
    };

    initialize();
  }, [loadState, syncWithApi]);

  // Apply theme to document
  useEffect(() => {
    document.documentElement.classList.toggle('light', state.theme === 'light');
  }, [state.theme]);

  return {
    ...state,
    isLoading,
    isOnline,
    addExpense,
    deleteExpense,
    updateExpense,
    addCategory,
    updateFilters,
    toggleTheme,
    syncWithApi
  };
}
