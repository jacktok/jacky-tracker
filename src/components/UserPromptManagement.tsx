import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useToast } from '../hooks/useToast';
import { Button } from './ui/Button';

interface UserPromptManagementProps {
  onPromptChange?: (hasCustomPrompt: boolean) => void;
}

export const UserPromptManagement: React.FC<UserPromptManagementProps> = ({ 
  onPromptChange 
}) => {
  const [prompt, setPrompt] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasCustomPrompt, setHasCustomPrompt] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    loadPrompt();
  }, []);

  const loadPrompt = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/user-prompt');
      if (response.success && response.data) {
        setPrompt(response.data.content);
        setHasCustomPrompt(true);
      } else {
        setHasCustomPrompt(false);
      }
    } catch (error) {
      setHasCustomPrompt(false);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!prompt.trim()) {
      addToast('Prompt content is required', 'error');
      return;
    }

    try {
      setSaving(true);
      const response = await api.put('/api/user-prompt', { content: prompt });
      if (response.success) {
        setHasCustomPrompt(true);
        addToast('Prompt saved successfully', 'success');
        if (onPromptChange) {
          onPromptChange(true);
        }
      } else {
        addToast(response.error || 'Failed to save prompt', 'error');
      }
    } catch (error) {
      console.error('Save prompt error:', error);
      addToast('Failed to save prompt', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete your custom prompt? This will reset to the default prompt.')) {
      return;
    }

    try {
      setSaving(true);
      const response = await api.delete('/api/user-prompt');
      if (response.success) {
        setPrompt('');
        setHasCustomPrompt(false);
        addToast('Custom prompt deleted, using default prompt', 'success');
        if (onPromptChange) {
          onPromptChange(false);
        }
      } else {
        addToast(response.error || 'Failed to delete prompt', 'error');
      }
    } catch (error) {
      console.error('Delete prompt error:', error);
      addToast('Failed to delete prompt', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setPrompt('');
    setHasCustomPrompt(false);
    if (onPromptChange) {
      onPromptChange(false);
    }
  };

  const handleLoadDefault = async () => {
    try {
      const response = await api.getDefaultPrompt();
      if (response.success && response.data) {
        setPrompt(response.data.content);
      } else {
        addToast('Failed to load default prompt', 'error');
      }
    } catch (error) {
      console.error('Load default prompt error:', error);
      addToast('Failed to load default prompt', 'error');
    }
  };

  if (loading) {
    return <div className="p-4 text-center text-text">Loading prompt...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-text">AI Prompt</h3>
        <div className="flex gap-2">
          <Button onClick={handleLoadDefault} variant="secondary" size="sm" disabled={saving}>
            Load Default
          </Button>
          {hasCustomPrompt && (
            <Button onClick={handleDelete} variant="danger" size="sm" disabled={saving}>
              Delete Custom
            </Button>
          )}
          <Button onClick={handleReset} variant="secondary" size="sm" disabled={saving}>
            Clear
          </Button>
        </div>
      </div>

      {/* Current Status */}
      <div className="bg-panel border border-border rounded-lg p-3">
        <div className="text-sm">
          <span className="text-text-secondary">Status: </span>
          <span className={`font-medium ${hasCustomPrompt ? 'text-success' : 'text-accent'}`}>
            {hasCustomPrompt ? 'Using Custom Prompt' : 'Using Default Prompt'}
          </span>
        </div>
      </div>

      {/* Prompt Editor */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-text">Custom Prompt Content:</label>
        <div className="space-y-2">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Enter your custom prompt for expense extraction. Use {categoriesList} for categories and {userDate} for today's date..."
            className="w-full p-3 border border-border rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent bg-panel text-text"
            rows={6}
          />
          <div className="text-xs text-text-muted">
            💡 Use <code className="bg-panel-2 px-1 rounded border border-border">{'{categoriesList}'}</code> to inject your available categories and <code className="bg-panel-2 px-1 rounded border border-border">{'{userDate}'}</code> for today's date
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleSave} variant="primary" disabled={saving}>
            {saving ? 'Saving...' : 'Save Prompt'}
          </Button>
          <Button onClick={handleLoadDefault} variant="secondary" disabled={saving}>
            Load Default Prompt
          </Button>
        </div>
      </div>

      {/* Default Prompt Info */}
      {!hasCustomPrompt && (
        <div className="bg-accent-bg border border-accent rounded-lg p-3">
          <div className="text-sm text-accent">
            <strong>Default Prompt:</strong> Using the built-in system prompt for expense extraction and classification.
          </div>
        </div>
      )}
    </div>
  );
};
