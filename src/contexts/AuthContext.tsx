import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { AuthState } from '../types';
import { api } from '../services/api';

interface AuthContextType extends AuthState {
  login: (provider: 'google' | 'line') => void;
  logout: () => void;
  checkAuth: () => Promise<void>;
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
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
