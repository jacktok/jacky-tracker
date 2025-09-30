// LINE Bot Service for handling expense tracking messages
import { Client, middleware } from '@line/bot-sdk';
import fetch from 'node-fetch';

class LineBotService {
  constructor(config) {
    this.client = new Client(config);
    this.config = config;
  }

  // Create middleware for webhook validation
  getMiddleware() {
    return middleware(this.config);
  }

  // Handle incoming webhook events
  async handleEvent(event) {
    if (event.type !== 'message' || event.message.type !== 'text') {
      return null;
    }

    const userId = event.source.userId;
    const messageText = event.message.text;

    try {
      // Process the expense message
      const result = await this.processExpenseMessage(userId, messageText);
      
      if (result) {
        // Send response back to user
        await this.replyMessage(event.replyToken, result.message);
        return result;
      }
    } catch (error) {
      console.error('Error processing LINE message:', error);
      await this.replyMessage(event.replyToken, {
        type: 'text',
        text: 'Sorry, something went wrong. Please try again later.'
      });
    }

    return null;
  }

  // Process expense message using the same logic as ChatMode
  async processExpenseMessage(userId, messageText) {
    try {
      // Extract expense data
      const expenseData = this.extractExpenseData(messageText);
      
      if (!expenseData) {
        return {
          message: {
            type: 'text',
            text: "I couldn't find an amount in your message. Please include a dollar amount, like 'I spent $25 on lunch'."
          }
        };
      }

      // Get user's categories
      const categories = await this.getUserCategories(userId);
      
      // Classify the expense using LLM
      const suggestion = await this.classifyExpense(messageText, expenseData.amount, expenseData.description, categories);
      
      if (suggestion) {
        // Create or get category
        let categoryName = suggestion.category;
        if (!categories.includes(categoryName)) {
          await this.createCategory(userId, categoryName);
        }

        // Create the expense
        const expense = await this.createExpense(userId, {
          date: new Date().toISOString().split('T')[0],
          amount: expenseData.amount,
          category: categoryName,
          note: expenseData.description
        });

        return {
          message: {
            type: 'text',
            text: `✅ Expense added! I categorized "${expenseData.description}" ($${expenseData.amount}) as "${categoryName}". ${suggestion.description ? `(${suggestion.description})` : ''}`
          },
          expense
        };
      } else {
        return {
          message: {
            type: 'text',
            text: `I found an expense: $${expenseData.amount} for "${expenseData.description}", but I'm not sure how to categorize it. Could you tell me what category this should be?`
          }
        };
      }
    } catch (error) {
      console.error('Error processing expense message:', error);
      return {
        message: {
          type: 'text',
          text: 'Sorry, I couldn\'t process your expense. Please try again or use the web app.'
        }
      };
    }
  }

  // Extract expense data from message (same logic as ChatMode)
  extractExpenseData(message) {
    const amountRegex = /\$?(\d+(?:\.\d{2})?)/;
    const match = message.match(amountRegex);
    
    if (match) {
      const amount = parseFloat(match[1]);
      const description = message.replace(amountRegex, '').trim();
      return { amount, description: description || 'Expense' };
    }
    
    return null;
  }

  // Classify expense using LLM service
  async classifyExpense(message, amount, description, categories) {
    try {
      const response = await fetch(`${process.env.FRONTEND_URL?.replace('5173', '3001') || 'http://localhost:3001'}/api/expenses/classify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          amount,
          description,
          categories
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          return {
            category: result.data.category,
            confidence: result.data.confidence,
            description: result.data.description
          };
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error classifying expense:', error);
      return null;
    }
  }

  // Get user's categories from database
  async getUserCategories(userId) {
    try {
      const response = await fetch(`${process.env.FRONTEND_URL?.replace('5173', '3001') || 'http://localhost:3001'}/api/categories`, {
        headers: {
          'Authorization': `Bearer ${await this.getUserToken(userId)}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        return result.data || [];
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching categories:', error);
      return [];
    }
  }

  // Create category
  async createCategory(userId, categoryName) {
    try {
      await fetch(`${process.env.FRONTEND_URL?.replace('5173', '3001') || 'http://localhost:3001'}/api/categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getUserToken(userId)}`
        },
        body: JSON.stringify({ name: categoryName })
      });
    } catch (error) {
      console.error('Error creating category:', error);
    }
  }

  // Create expense
  async createExpense(userId, expenseData) {
    try {
      const response = await fetch(`${process.env.FRONTEND_URL?.replace('5173', '3001') || 'http://localhost:3001'}/api/expenses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getUserToken(userId)}`
        },
        body: JSON.stringify(expenseData)
      });

      if (response.ok) {
        const result = await response.json();
        return result.data;
      }
      
      return null;
    } catch (error) {
      console.error('Error creating expense:', error);
      return null;
    }
  }

  // Get user token for LINE users
  async getUserToken(userId) {
    try {
      // Check if LINE user exists in database
      const response = await fetch(`${process.env.FRONTEND_URL?.replace('5173', '3001') || 'http://localhost:3001'}/api/auth/line-user/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        return result.token;
      }
      
      // If user doesn't exist, create a new one
      return await this.createLineUser(userId);
    } catch (error) {
      console.error('Error getting user token:', error);
      return null;
    }
  }

  // Create a new user for LINE bot
  async createLineUser(lineUserId) {
    try {
      const response = await fetch(`${process.env.FRONTEND_URL?.replace('5173', '3001') || 'http://localhost:3001'}/api/auth/line-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          lineUserId: lineUserId,
          name: `LINE User ${lineUserId}`,
          email: `line-${lineUserId}@example.com`
        })
      });

      if (response.ok) {
        const result = await response.json();
        return result.token;
      }
      
      return null;
    } catch (error) {
      console.error('Error creating LINE user:', error);
      return null;
    }
  }

  // Send reply message
  async replyMessage(replyToken, message) {
    try {
      await this.client.replyMessage(replyToken, message);
    } catch (error) {
      console.error('Error sending reply:', error);
    }
  }

  // Send push message
  async pushMessage(userId, message) {
    try {
      await this.client.pushMessage(userId, message);
    } catch (error) {
      console.error('Error sending push message:', error);
    }
  }
}

export default LineBotService;
