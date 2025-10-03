import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { AuthState } from '../types';
import { api } from '../services/api';

interface LinkedAccount {
  provider: string;
  email: string;
  name: string;
  picture?: string;
  created_at: string;
}

interface AuthContextType extends AuthState {
  login: (provider: 'google' | 'line') => void;
  logout: () => void;
  checkAuth: () => Promise<void>;
  linkAccount: (provider: 'google' | 'line') => void;
  linkedAccounts: LinkedAccount[];
  loadLinkedAccounts: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });
  const [linkedAccounts, setLinkedAccounts] = useState<LinkedAccount[]>([]);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
        return;
      }

      // Set the token for API calls
      api.setAuthToken(token);
      
      // Verify the token and get user info
      const response = await api.get('/api/auth/me');
      if (response.success && response.data) {
        setAuthState({
          user: response.data,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        // Token is invalid, remove it
        localStorage.removeItem('auth_token');
        api.setAuthToken(null);
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('auth_token');
      api.setAuthToken(null);
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  };

  const login = (provider: 'google' | 'line') => {
    // Redirect to OAuth provider
    window.location.href = `/api/auth/${provider}`;
  };

  const linkAccount = async (provider: 'google' | 'line') => {
    try {
      // First, call the prepare-link endpoint to set up the session
      const response = await api.post(`/api/auth/${provider}/prepare-link`);
      if (response.success) {
        // Then redirect to the linking endpoint
        window.location.href = `/api/auth/${provider}/link`;
      } else {
        console.error(`Failed to prepare ${provider} linking:`, response.error);
      }
    } catch (error) {
      console.error(`Failed to prepare ${provider} linking:`, error);
    }
  };

  const loadLinkedAccounts = async () => {
    if (!authState.isAuthenticated) return;
    
    try {
      const response = await api.get('/api/auth/linked-accounts');
      if (response.success) {
        setLinkedAccounts(response.data);
      }
    } catch (error) {
      console.error('Failed to load linked accounts:', error);
    }
  };

  const logout = async () => {
    try {
      await api.post('/api/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('auth_token');
      api.setAuthToken(null);
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  };

  // Handle OAuth callback
  useEffect(() => {
    const handleOAuthCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('token');
      const error = urlParams.get('error');

      if (error) {
        console.error('OAuth error:', error);
        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname);
        return;
      }

      if (token) {
        localStorage.setItem('auth_token', token);
        api.setAuthToken(token);
        
        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname);
        
        // Get user info
        await checkAuth();
        
        // Load linked accounts after successful auth
        await loadLinkedAccounts();
      }
    };

    handleOAuthCallback();
  }, []);

  // Check authentication on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const value: AuthContextType = {
    ...authState,
    login,
    logout,
    checkAuth,
    linkAccount,
    linkedAccounts,
    loadLinkedAccounts,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
