import React, { useState, useEffect } from 'react';
import { Link, Unlink, User, Mail, Calendar, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import { Button } from './ui/Button';
import { useToast } from '../hooks/useToast';

interface LinkedAccount {
  provider: string;
  email: string;
  name: string;
  picture?: string;
  created_at: string;
}

export const AccountManagement: React.FC = () => {
  const { user, linkAccount } = useAuth();
  const { showSuccess, showError } = useToast();
  const [linkedAccounts, setLinkedAccounts] = useState<LinkedAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLinking, setIsLinking] = useState<string | null>(null);

  useEffect(() => {
    loadLinkedAccounts();
    
    // Check for linking success/error messages from URL
    const urlParams = new URLSearchParams(window.location.search);
    const linked = urlParams.get('linked');
    const error = urlParams.get('error');
    
    if (linked) {
      showSuccess(`${linked} account linked successfully!`);
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (error) {
      if (error === 'line_oauth_failed') {
        showError('LINE OAuth failed. Please check your LINE Channel configuration.');
      } else if (error === 'line_auth_failed') {
        showError('LINE authentication failed. Please try again.');
      } else {
        showError('Account linking failed. Please try again.');
      }
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const loadLinkedAccounts = async () => {
    try {
      const response = await api.get('/api/auth/linked-accounts');
      if (response.success) {
        setLinkedAccounts(response.data);
      }
    } catch (error) {
      console.error('Failed to load linked accounts:', error);
      showError('Failed to load linked accounts');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLinkAccount = async (provider: 'google' | 'line') => {
    setIsLinking(provider);
    
    try {
      await linkAccount(provider);
    } catch (error: any) {
      console.error('Failed to link account:', error);
      showError(`Failed to link ${provider} account`);
      setIsLinking(null);
    }
  };

  const handleUnlinkAccount = async (provider: string) => {
    if (!confirm(`Are you sure you want to unlink your ${provider} account?`)) {
      return;
    }

    try {
      const response = await api.delete(`/api/auth/linked-accounts/${provider}`);
      if (response.success) {
        showSuccess(`${provider} account unlinked successfully`);
        await loadLinkedAccounts();
      } else {
        showError(response.error || 'Failed to unlink account');
      }
    } catch (error: any) {
      console.error('Failed to unlink account:', error);
      showError(error.response?.data?.error || 'Failed to unlink account');
    }
  };

  const isProviderLinked = (provider: string) => {
    return linkedAccounts.some(account => account.provider === provider);
  };

  const getProviderIcon = (provider: string) => {
    if (provider === 'google') {
      return (
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="currentColor"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="currentColor"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="currentColor"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
      );
    } else if (provider === 'line') {
      return (
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .63.285.63.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"
          />
        </svg>
      );
    }
    return <User className="w-5 h-5" />;
  };

  if (isLoading) {
    return (
      <div className="bg-background rounded-lg border p-6">
        <div className="flex items-center justify-center py-8">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background rounded-lg border p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-text-primary mb-2">Account Management</h2>
        <p className="text-text-secondary text-sm">
          Link multiple accounts to sign in with different providers while keeping your data unified.
        </p>
      </div>

      {/* Current User Info */}
      {user && (
        <div className="mb-6 p-4 bg-accent/10 rounded-lg border border-accent/20">
          <div className="flex items-center gap-3">
            {user.picture ? (
              <img
                src={user.picture}
                alt={user.name}
                className="w-12 h-12 rounded-full"
              />
            ) : (
              <div className="w-12 h-12 bg-accent rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
            )}
            <div>
              <h3 className="font-medium text-text-primary">{user.name}</h3>
              <div className="flex items-center gap-1 text-sm text-text-secondary">
                <Mail className="w-4 h-4" />
                {user.email}
              </div>
              <div className="flex items-center gap-1 text-sm text-text-secondary">
                <Calendar className="w-4 h-4" />
                Member since {new Date(user.createdAt).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Linked Accounts */}
      <div className="space-y-4">
        <h3 className="font-medium text-text-primary">Linked Accounts</h3>
        
        {/* Google Account */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center gap-3">
            <div className="text-blue-600">{getProviderIcon('google')}</div>
            <div>
              <div className="font-medium text-text-primary">Google</div>
              {isProviderLinked('google') ? (
                <div className="text-sm text-green-600 flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-600 rounded-full" />
                  Connected
                </div>
              ) : (
                <div className="text-sm text-text-secondary">Not connected</div>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            {isProviderLinked('google') ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleUnlinkAccount('google')}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Unlink className="w-4 h-4 mr-2" />
                Unlink
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleLinkAccount('google')}
                disabled={isLinking === 'google'}
              >
                {isLinking === 'google' ? (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                ) : (
                  <Link className="w-4 h-4 mr-2" />
                )}
                Link
              </Button>
            )}
          </div>
        </div>

        {/* LINE Account */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center gap-3">
            <div className="text-green-600">{getProviderIcon('line')}</div>
            <div>
              <div className="font-medium text-text-primary">LINE</div>
              {isProviderLinked('line') ? (
                <div className="text-sm text-green-600 flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-600 rounded-full" />
                  Connected
                </div>
              ) : (
                <div className="text-sm text-text-secondary">Not connected</div>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            {isProviderLinked('line') ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleUnlinkAccount('line')}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Unlink className="w-4 h-4 mr-2" />
                Unlink
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleLinkAccount('line')}
                disabled={isLinking === 'line'}
              >
                {isLinking === 'line' ? (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                ) : (
                  <Link className="w-4 h-4 mr-2" />
                )}
                Link
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">How account linking works:</p>
            <ul className="space-y-1 text-xs">
              <li>• Link multiple accounts to access your data with any provider</li>
              <li>• Your expenses and categories are shared across all linked accounts</li>
              <li>• You must keep at least one account linked at all times</li>
              <li>• Unlinking an account will remove that sign-in method</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountManagement;