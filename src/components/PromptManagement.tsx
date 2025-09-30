import React, { useState, useEffect } from 'react';
import { Prompt } from '../types';
import { api } from '../services/api';
import { useToast } from '../hooks/useToast';
import { Button } from './ui/Button';
import { Input } from './ui/Input';

interface PromptManagementProps {
  onPromptSelect?: (promptId: string | null) => void;
  selectedPromptId?: string | null;
}

export const PromptManagement: React.FC<PromptManagementProps> = ({ 
  onPromptSelect, 
  selectedPromptId 
}) => {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({ name: '', content: '' });
  const { addToast } = useToast();

  useEffect(() => {
    loadPrompts();
  }, []);

  const loadPrompts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/prompts');
      if (response.success && response.data) {
        setPrompts(response.data);
      }
    } catch (error) {
      addToast('Failed to load prompts', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setIsCreating(true);
    setEditingPrompt(null);
    setFormData({ name: '', content: '' });
  };

  const handleEdit = (prompt: Prompt) => {
    if (prompt.is_default) {
      addToast('Cannot edit default prompts', 'warning');
      return;
    }
    setEditingPrompt(prompt);
    setIsCreating(false);
    setFormData({ name: prompt.name, content: prompt.content });
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.content.trim()) {
      addToast('Name and content are required', 'error');
      return;
    }

    try {
      if (editingPrompt) {
        // Update existing prompt
        const response = await api.put(`/api/prompts/${editingPrompt.id}`, { 
          name: formData.name, 
          content: formData.content 
        });
        if (response.success && response.data) {
          setPrompts(prompts.map(p => p.id === editingPrompt.id ? response.data : p));
          addToast('Prompt updated successfully', 'success');
        } else {
          addToast(response.error || 'Failed to update prompt', 'error');
        }
      } else {
        // Create new prompt
        const response = await api.post('/api/prompts', { 
          name: formData.name, 
          content: formData.content 
        });
        if (response.success && response.data) {
          setPrompts([...prompts, response.data]);
          addToast('Prompt created successfully', 'success');
        } else {
          addToast(response.error || 'Failed to create prompt', 'error');
        }
      }
      
      setEditingPrompt(null);
      setIsCreating(false);
      setFormData({ name: '', content: '' });
    } catch (error) {
      console.error('Save prompt error:', error);
      addToast('Failed to save prompt', 'error');
    }
  };

  const handleDelete = async (prompt: Prompt) => {
    if (prompt.is_default) {
      addToast('Cannot delete default prompts', 'warning');
      return;
    }

    if (!confirm(`Are you sure you want to delete "${prompt.name}"?`)) {
      return;
    }

    try {
      const response = await api.delete(`/api/prompts/${prompt.id}`);
      if (response.success) {
        setPrompts(prompts.filter(p => p.id !== prompt.id));
        addToast('Prompt deleted successfully', 'success');
        
        // If the deleted prompt was selected, clear selection
        if (selectedPromptId === prompt.id && onPromptSelect) {
          onPromptSelect(null);
        }
      } else {
        addToast(response.error || 'Failed to delete prompt', 'error');
      }
    } catch (error) {
      console.error('Delete prompt error:', error);
      addToast('Failed to delete prompt', 'error');
    }
  };

  const handleCancel = () => {
    setEditingPrompt(null);
    setIsCreating(false);
    setFormData({ name: '', content: '' });
  };

  const handleSelect = (promptId: string | null) => {
    if (onPromptSelect) {
      onPromptSelect(promptId);
    }
  };

  if (loading) {
    return <div className="p-4 text-center text-text">Loading prompts...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-text">AI Prompts</h3>
        <Button onClick={handleCreate} variant="primary">
          Create New Prompt
        </Button>
      </div>

      {/* Current Prompt Display */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-text">Current Prompt:</label>
        <div className="bg-panel border border-border rounded-lg p-3">
          {selectedPromptId ? (
            prompts.find(p => p.id === selectedPromptId) ? (
              <div>
                <div className="font-medium text-sm mb-2 text-text">
                  {prompts.find(p => p.id === selectedPromptId)?.name}
                </div>
                <div className="text-sm text-text-secondary whitespace-pre-wrap">
                  {prompts.find(p => p.id === selectedPromptId)?.content}
                </div>
              </div>
            ) : (
              <div className="text-sm text-text-muted">Loading...</div>
            )
          ) : (
            <div>
              <div className="font-medium text-sm mb-2 text-text">Default System Prompt</div>
              <div className="text-sm text-text-secondary">
                Using the built-in system prompt for expense classification.
              </div>
            </div>
          )}
        </div>
        
        {/* Prompt Selection */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleSelect(null)}
            className={`px-3 py-1 rounded-full text-sm transition-colors duration-150 ${
              selectedPromptId === null
                ? 'bg-accent text-white shadow-custom'
                : 'bg-panel-2 text-text border border-border hover:bg-panel-3 hover:border-accent'
            }`}
          >
            Use Default
          </button>
          {prompts.map((prompt) => (
            <button
              key={prompt.id}
              onClick={() => handleSelect(prompt.id)}
              className={`px-3 py-1 rounded-full text-sm transition-colors duration-150 ${
                selectedPromptId === prompt.id
                  ? 'bg-accent text-white shadow-custom'
                  : 'bg-panel-2 text-text border border-border hover:bg-panel-3 hover:border-accent'
              }`}
            >
              {prompt.name}
            </button>
          ))}
        </div>
      </div>

      {/* Create/Edit Form */}
      {(isCreating || editingPrompt) && (
        <div className="border border-border rounded-lg p-4 bg-panel-2">
          <h4 className="font-medium mb-3 text-text">
            {editingPrompt ? 'Edit Prompt' : 'Create New Prompt'}
          </h4>
          <div className="space-y-3">
            <Input
              label="Prompt Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter prompt name"
            />
            <div>
              <label className="block text-sm font-medium mb-1 text-text">Prompt Content</label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Enter your custom prompt for expense classification..."
                className="w-full p-3 border border-border rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent bg-panel text-text"
                rows={4}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSave} variant="primary">
                {editingPrompt ? 'Update' : 'Create'}
              </Button>
              <Button onClick={handleCancel} variant="secondary">
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Prompts List */}
      <div className="space-y-2">
        {prompts.map((prompt) => (
          <div
            key={prompt.id}
            className={`border rounded-lg p-3 transition-colors duration-150 ${
              selectedPromptId === prompt.id ? 'border-accent bg-accent-bg' : 'border-border bg-panel'
            }`}
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium text-text">{prompt.name}</h4>
                  {prompt.is_default && (
                    <span className="px-2 py-1 text-xs bg-panel-2 text-text-secondary rounded border border-border">
                      Default
                    </span>
                  )}
                </div>
                <p className="text-sm text-text-secondary mt-1 line-clamp-2">
                  {prompt.content}
                </p>
                <p className="text-xs text-text-muted mt-1">
                  Created: {new Date(prompt.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex gap-1 ml-2">
                <Button
                  onClick={() => handleEdit(prompt)}
                  variant="secondary"
                  size="sm"
                  disabled={prompt.is_default}
                >
                  Edit
                </Button>
                <Button
                  onClick={() => handleDelete(prompt)}
                  variant="danger"
                  size="sm"
                  disabled={prompt.is_default}
                >
                  Delete
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {prompts.length === 0 && (
        <div className="text-center py-8 text-text-muted">
          No custom prompts yet. Create your first prompt to customize AI classification.
        </div>
      )}
    </div>
  );
};
