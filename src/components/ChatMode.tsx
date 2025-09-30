import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Plus } from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { useExpenses } from '../hooks/useExpenses';
import { useToast } from '../hooks/useToast';
import { Expense } from '../types';
import { api } from '../services/api';

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
    <div className="max-w-4xl mx-auto h-[calc(100vh-200px)] flex flex-col">
      {/* Chat Header */}
      <div className="bg-card border border-border rounded-t-lg p-4 border-b">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-accent to-accent/80 rounded-lg flex items-center justify-center">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-text">Expense Assistant</h2>
            <p className="text-sm text-text-secondary">Chat with me to add expenses naturally</p>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 bg-bg border-x border-border overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {message.type === 'bot' && (
              <div className="w-8 h-8 bg-gradient-to-br from-accent to-accent/80 rounded-lg flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-white" />
              </div>
            )}
            
            <div
              className={`max-w-[70%] rounded-lg p-3 ${
                message.type === 'user'
                  ? 'bg-accent text-white'
                  : 'bg-card border border-border'
              }`}
            >
              <div className="flex items-start gap-2">
                <div className="flex-1">
                  <p className="text-sm">{message.content}</p>
                  {message.isProcessing && (
                    <div className="flex items-center gap-2 mt-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-xs text-text-secondary">Processing...</span>
                    </div>
                  )}
                  {message.suggestedCategory && (
                    <div className="mt-2 flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleCreateCategory(message.suggestedCategory!)}
                        className="text-xs"
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Create "{message.suggestedCategory}"
                      </Button>
                    </div>
                  )}
                </div>
                {message.type === 'user' && (
                  <div className="w-6 h-6 bg-accent/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-3 h-3 text-accent" />
                  </div>
                )}
              </div>
              <div className="text-xs text-text-secondary mt-1">
                {message.timestamp.toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-card border border-border rounded-b-lg p-4 border-t">
        <div className="flex gap-2">
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
            className="px-4"
          >
            {isProcessing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
        <div className="mt-2 text-xs text-text-secondary">
          💡 Try: "Coffee $4.50", "Lunch $25 at McDonald's", "Gas $45", "Movie tickets $30"
        </div>
      </div>
    </div>
  );
};
