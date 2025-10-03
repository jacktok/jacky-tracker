import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Plus, Settings } from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { useExpenses } from '../hooks/useExpenses';
import { useToast } from '../hooks/useToast';
import { Expense } from '../types';
import { api } from '../services/api';
import { UserPromptManagement } from './UserPromptManagement';

interface ChatMessage {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
  expense?: Expense;
  suggestedCategory?: string;
  isProcessing?: boolean;
}

interface CategorySuggestion {
  category: string;
  confidence: number;
  description?: string;
}

export const ChatMode: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPromptManagement, setShowPromptManagement] = useState(false);
  const [hasCustomPrompt, setHasCustomPrompt] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const { categories, addExpense, addCategory } = useExpenses();
  const { showSuccess, showError } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Focus input on mobile for better UX
  useEffect(() => {
    const isMobile = window.innerWidth < 640; // sm breakpoint
    if (isMobile && inputRef.current) {
      // Small delay to ensure the component is fully rendered
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, []);

  // Initialize with welcome message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{
        id: '1',
        type: 'bot',
        content: "Hi! I'm your expense tracking assistant. You can tell me about your expenses in natural language, and I'll help categorize them. For example, try saying 'I spent $25 on lunch today' or 'Coffee $4.50 at Starbucks'.",
        timestamp: new Date()
      }]);
    }
  }, []);

  const classifyExpense = async (message: string, amount: number, description: string): Promise<CategorySuggestion | null> => {
    try {
      const response = await api.classifyExpense(message, amount, description);
      
      if (response.success && response.data) {
        if (response.data.category) {
          return {
            category: response.data.category,
            confidence: response.data.confidence,
            description: response.data.description
          };
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error classifying expense:', error);
      return null;
    }
  };

  const extractExpenseData = (message: string): { amount: number; description: string } | null => {
    // Simple regex to extract amount and description
    const amountRegex = /\$?(\d+(?:\.\d{2})?)/;
    const match = message.match(amountRegex);
    
    if (match) {
      const amount = parseFloat(match[1]);
      const description = message.replace(amountRegex, '').trim();
      return { amount, description: description || 'Expense' };
    }
    
    return null;
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isProcessing) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsProcessing(true);

    // Add processing message
    const processingMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      type: 'bot',
      content: 'Processing your expense...',
      timestamp: new Date(),
      isProcessing: true
    };

    setMessages(prev => [...prev, processingMessage]);

    try {
      // Extract expense data
      const expenseData = extractExpenseData(inputValue);
      
      if (!expenseData) {
        setMessages(prev => prev.slice(0, -1).concat([{
          id: (Date.now() + 1).toString(),
          type: 'bot',
          content: "I couldn't find an amount in your message. Please include a dollar amount, like 'I spent $25 on lunch'.",
          timestamp: new Date()
        }]));
        setIsProcessing(false);
        return;
      }

      // Classify the expense
      const suggestion = await classifyExpense(inputValue, expenseData.amount, expenseData.description);
      
      if (suggestion) {
        // Check if category exists, if not, create it
        let categoryName = suggestion.category;
        if (!categories.includes(categoryName)) {
          try {
            await addCategory(categoryName);
            showSuccess(`Created new category: ${categoryName}`);
          } catch (error) {
            console.error('Failed to create category:', error);
          }
        }

        // Create the expense
        const newExpense: Omit<Expense, 'id'> = {
          date: new Date().toISOString().split('T')[0],
          amount: expenseData.amount,
          category: categoryName,
          note: expenseData.description
        };

        try {
          await addExpense(newExpense);
          
          setMessages(prev => prev.slice(0, -1).concat([{
            id: (Date.now() + 1).toString(),
            type: 'bot',
            content: `✅ Expense added! I categorized "${expenseData.description}" ($${expenseData.amount}) as "${categoryName}". ${suggestion.description ? `(${suggestion.description})` : ''}`,
            timestamp: new Date(),
            expense: { ...newExpense, id: Date.now().toString() } as Expense
          }]));
          
          showSuccess('Expense added successfully!');
        } catch (error) {
          setMessages(prev => prev.slice(0, -1).concat([{
            id: (Date.now() + 1).toString(),
            type: 'bot',
            content: "❌ Sorry, I couldn't add the expense. Please try again or use the regular form.",
            timestamp: new Date()
          }]));
          showError('Failed to add expense');
        }
      } else {
        setMessages(prev => prev.slice(0, -1).concat([{
          id: (Date.now() + 1).toString(),
          type: 'bot',
          content: `I found an expense: $${expenseData.amount} for "${expenseData.description}", but I'm not sure how to categorize it. Could you tell me what category this should be?`,
          timestamp: new Date(),
          suggestedCategory: 'New Category'
        }]));
      }
    } catch (error) {
      console.error('Error processing message:', error);
      setMessages(prev => prev.slice(0, -1).concat([{
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: "❌ Sorry, something went wrong. Please try again.",
        timestamp: new Date()
      }]));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleCreateCategory = async (categoryName: string) => {
    try {
      await addCategory(categoryName);
      showSuccess(`Created category: ${categoryName}`);
    } catch (error) {
      showError('Failed to create category');
    }
  };

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-120px)] sm:h-[calc(100vh-200px)] flex flex-col max-h-screen">
      {/* Chat Header */}
      <div className="bg-card border border-border rounded-t-lg p-3 sm:p-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-pink-400 via-purple-500 to-blue-500 rounded-full flex items-center justify-center shadow-lg">
              <Bot className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-semibold text-text">Expense Assistant</h2>
              <p className="text-xs sm:text-sm text-text-secondary hidden sm:block">Chat with me to add expenses naturally</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Current Prompt Display - Hidden on mobile */}
            <div className="text-xs sm:text-sm hidden sm:block">
              <span className="text-text-secondary">Using: </span>
              <span className="font-medium text-text">
                {hasCustomPrompt ? 'Custom' : 'Default'}
              </span>
            </div>
            <Button
              onClick={() => setShowPromptManagement(!showPromptManagement)}
              variant="secondary"
              size="sm"
              className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3"
            >
              <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">AI Prompts</span>
              <span className="sm:hidden">Prompts</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Prompt Management Section */}
      {showPromptManagement && (
        <div className="bg-panel-2 border-x border-border p-3 sm:p-4">
          <UserPromptManagement
            onPromptChange={setHasCustomPrompt}
          />
        </div>
      )}

      {/* Messages Container */}
      <div className="flex-1 bg-bg border-x border-border overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-2 sm:gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {message.type === 'bot' && (
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-pink-400 via-purple-500 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0 shadow-md">
                <Bot className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
              </div>
            )}
            
            <div
              className={`max-w-[85%] sm:max-w-[70%] rounded-lg p-2.5 sm:p-3 ${
                message.type === 'user'
                  ? 'bg-accent text-white'
                  : 'bg-card border border-border'
              }`}
            >
              <div className="flex items-start gap-2">
                <div className="flex-1">
                  <p className="text-sm leading-relaxed">{message.content}</p>
                  {message.isProcessing && (
                    <div className="flex items-center gap-2 mt-2">
                      <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
                      <span className="text-xs text-text-secondary">Processing...</span>
                    </div>
                  )}
                  {message.suggestedCategory && (
                    <div className="mt-2 flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleCreateCategory(message.suggestedCategory!)}
                        className="text-xs px-2 py-1"
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        <span className="hidden sm:inline">Create "{message.suggestedCategory}"</span>
                        <span className="sm:hidden">Create</span>
                      </Button>
                    </div>
                  )}
                </div>
                {message.type === 'user' && (
                  <div className="w-5 h-5 sm:w-6 sm:h-6 bg-accent/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-accent" />
                  </div>
                )}
              </div>
              <div className="text-xs text-text-secondary mt-1 opacity-70">
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-card border border-border rounded-b-lg border-t">
        {/* Mobile Layout - Full Width Input */}
        <div className="flex gap-2 p-3 sm:p-4 pb-2 sm:hidden">
          <input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Tell me about your expense..."
            disabled={isProcessing}
            className="flex-1 w-full px-3 py-3 text-sm font-medium bg-panel-2 border border-border text-text rounded-lg outline-none transition-colors duration-150 min-h-[48px] focus:border-accent focus:shadow-[0_0_0_4px_var(--ring)] focus:bg-panel focus:-translate-y-0.5 focus:transition-all focus:duration-150 hover:border-accent-light hover:bg-panel-2 placeholder:text-text-muted placeholder:opacity-70 disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isProcessing}
            className="px-3 py-3 flex-shrink-0 min-h-[48px] min-w-[48px]"
          >
            {isProcessing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
        
        {/* Desktop Layout - Original Input Component */}
        <div className="hidden sm:flex gap-2 p-4 pb-2">
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Tell me about your expense... (e.g., 'I spent $25 on lunch today')"
            disabled={isProcessing}
            className="flex-1"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isProcessing}
            className="px-4 flex-shrink-0"
          >
            {isProcessing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
        
        <div className="px-3 sm:px-4 pb-3 sm:pb-4 text-xs text-text-secondary">
          <span className="hidden sm:inline">💡 Try: "Coffee $4.50", "Lunch $25 at McDonald's", "Gas $45", "Movie tickets $30"</span>
          <span className="sm:hidden">💡 Try: "Coffee $4.50", "Lunch $25"</span>
        </div>
      </div>
    </div>
  );
};
