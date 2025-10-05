import { useState, useEffect, useCallback } from 'react';
import { Expense, Filters, AppState } from '../types';
import { ApiService } from '../services/api';
import { STORAGE_KEY, defaultCategories, getDateRangePresets } from '../utils';
import { useAuth } from '../contexts/AuthContext';

export function useExpenses() {
  const { isAuthenticated } = useAuth();
  // Get default date range for last 30 days
  const defaultDateRange = getDateRangePresets().last30Days;
  
  const [state, setState] = useState<AppState>({
    expenses: [],
    categories: [...defaultCategories],
    filters: {
      from: defaultDateRange.from,
      to: defaultDateRange.to,
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
        
        setState(prevState => {
          // Check if saved filters have meaningful date values
          let filtersToUse = prevState.filters; // This has the default 30-day filter
          
          if (parsed.filters) {
            // If saved filters have date values, use them; otherwise keep default 30-day filter
            if (parsed.filters.from || parsed.filters.to) {
              filtersToUse = { ...prevState.filters, ...parsed.filters };
            } else {
              // Keep default 30-day filter but apply other filter settings
              filtersToUse = { 
                ...prevState.filters, 
                category: parsed.filters.category || '',
                search: parsed.filters.search || '',
                sort: parsed.filters.sort || 'date_desc'
              };
            }
          }
          
          return {
            ...prevState,
            expenses: parsed.expenses || [],
            categories: parsed.categories || [...defaultCategories],
            filters: filtersToUse,
            theme: parsed.theme || 'dark'
          };
        });
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
        // Load both expenses and categories from API
        const [expensesResponse, categoriesResponse] = await Promise.all([
          ApiService.getExpenses(),
          ApiService.getCategories()
        ]);
        
        if (expensesResponse.success && expensesResponse.data) {
          setState(prevState => ({
            ...prevState,
            expenses: expensesResponse.data as Expense[]
          }));
        }
        
        if (categoriesResponse.success && categoriesResponse.data) {
          setState(prevState => ({
            ...prevState,
            categories: categoriesResponse.data as string[]
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
  const addCategory = useCallback(async (category: string) => {
    // Add locally first for immediate UI update
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

    // Try to sync with API if authenticated and online
    if (isAuthenticated && isOnline) {
      try {
        const response = await ApiService.createCategory(category);
        if (!response.success) {
          console.warn('Failed to sync category to API:', response.error);
          // Revert local change if API fails
          setState(prevState => ({
            ...prevState,
            categories: prevState.categories.filter(cat => cat !== category)
          }));
        }
      } catch (error) {
        console.warn('Failed to sync category to API:', error);
        // Revert local change if API fails
        setState(prevState => ({
          ...prevState,
          categories: prevState.categories.filter(cat => cat !== category)
        }));
      }
    }
  }, [isAuthenticated, isOnline, saveState]);

  // Delete category with optional migration
  const deleteCategory = useCallback(async (category: string, migrateTo?: string) => {
    // Update locally first for immediate UI update
    setState(prevState => {
      const updated = {
        ...prevState,
        categories: prevState.categories.filter(cat => cat !== category)
      };

      // If migration target is specified, update all expenses with the old category
      if (migrateTo) {
        updated.expenses = prevState.expenses.map(exp => 
          exp.category === category ? { ...exp, category: migrateTo } : exp
        );
      } else {
        // If no migration target, remove all expenses with this category
        updated.expenses = prevState.expenses.filter(exp => exp.category !== category);
      }

      saveState(updated);
      return updated;
    });

    // Try to sync with API if authenticated and online
    if (isAuthenticated && isOnline) {
      try {
        const response = await ApiService.deleteCategory(category, migrateTo);
        if (!response.success) {
          console.warn('Failed to sync category deletion to API:', response.error);
          // Note: We don't revert here as the API handles the transaction
        }
      } catch (error) {
        console.warn('Failed to sync category deletion to API:', error);
      }
    }
  }, [isAuthenticated, isOnline, saveState]);

  // Rename category
  const renameCategory = useCallback(async (oldCategory: string, newCategory: string) => {
    // Update locally first for immediate UI update
    setState(prevState => {
      const updated = {
        ...prevState,
        categories: prevState.categories.map(cat => 
          cat === oldCategory ? newCategory : cat
        ),
        expenses: prevState.expenses.map(exp => 
          exp.category === oldCategory ? { ...exp, category: newCategory } : exp
        )
      };

      saveState(updated);
      return updated;
    });

    // Try to sync with API if authenticated and online
    if (isAuthenticated && isOnline) {
      try {
        const response = await ApiService.renameCategory(oldCategory, newCategory);
        if (!response.success) {
          console.warn('Failed to sync category rename to API:', response.error);
          // Note: We don't revert here as the API handles the transaction
        }
      } catch (error) {
        console.warn('Failed to sync category rename to API:', error);
      }
    }
  }, [isAuthenticated, isOnline, saveState]);

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
    // Temporarily disable transitions for better performance
    document.documentElement.classList.add('theme-transitioning');
    
    setState(prevState => {
      const newTheme: 'light' | 'dark' = prevState.theme === 'light' ? 'dark' : 'light';
      const updated = { ...prevState, theme: newTheme };
      
      saveState(updated);
      return updated;
    });

    // Re-enable transitions after a short delay
    setTimeout(() => {
      document.documentElement.classList.remove('theme-transitioning');
    }, 50);
  }, [saveState]);

  // Import expenses and categories
  const importExpenses = useCallback(async (importedData: { expenses: Expense[], categories: string[] }) => {
    const newExpenses = importedData.expenses || [];
    const newCategories = importedData.categories || [...defaultCategories];
    
    // Update local state immediately
    setState(prevState => {
      const updated = {
        ...prevState,
        expenses: newExpenses,
        categories: newCategories
      };
      
      saveState(updated);
      return updated;
    });

    // If authenticated and online, sync with API
    if (isAuthenticated && isOnline) {
      try {
        // Get existing categories first to avoid conflicts
        const existingCategoriesResponse = await ApiService.getCategories();
        const existingCategories = existingCategoriesResponse.success && existingCategoriesResponse.data 
          ? existingCategoriesResponse.data 
          : [];
        
        // Only create categories that don't already exist
        const categoriesToCreate = newCategories.filter(category => !existingCategories.includes(category));
        
        for (const category of categoriesToCreate) {
          try {
            const response = await ApiService.createCategory(category);
            if (!response.success && response.error && !response.error.includes('already exists')) {
              console.warn(`Failed to sync category ${category} to API:`, response.error);
            }
          } catch (error) {
            console.warn(`Failed to sync category ${category} to API:`, error);
          }
        }

        // Use bulk create for better performance
        const response = await ApiService.bulkCreateExpenses(newExpenses);
        if (!response.success) {
          console.warn('Failed to bulk sync expenses to API:', response.error);
          // Fallback to individual creation
          for (const expense of newExpenses) {
            try {
              await ApiService.createExpense(expense);
            } catch (error) {
              console.warn(`Failed to sync expense ${expense.id} to API:`, error);
            }
          }
        }
      } catch (error) {
        console.warn('Failed to sync imported data to API:', error);
      }
    }
  }, [saveState, isAuthenticated, isOnline]);

  // Apply theme to document immediately and on theme change
  useEffect(() => {
    document.documentElement.classList.toggle('light', state.theme === 'light');
  }, [state.theme]);

  // Apply initial theme immediately on mount
  useEffect(() => {
    document.documentElement.classList.toggle('light', state.theme === 'light');
  }, []); // Empty dependency array - runs only on mount

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

  return {
    ...state,
    isLoading,
    isOnline,
    isAuthenticated,
    addExpense,
    deleteExpense,
    updateExpense,
    addCategory,
    deleteCategory,
    renameCategory,
    updateFilters,
    toggleTheme,
    syncWithApi,
    importExpenses
  };
}
