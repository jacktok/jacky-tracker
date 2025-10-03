// LLM Service for expense classification
// Supports multiple providers: Groq, OpenAI, Hugging Face, and keyword fallback

class LLMService {
  constructor() {
    this.provider = process.env.LLM_PROVIDER || 'keyword';
    this.groqApiKey = process.env.GROQ_API_KEY;
    this.geminiApiKey = process.env.GEMINI_API_KEY;
    this.claudeApiKey = process.env.CLAUDE_API_KEY;
    this.openaiApiKey = process.env.OPENAI_API_KEY;
    this.huggingfaceApiKey = process.env.HUGGINGFACE_API_KEY;
  }

  async classifyExpense(message, amount, description, existingCategories = [], customPrompt = null) {
    try {
      switch (this.provider) {
        case 'groq':
          return await this.classifyWithGroq(message, amount, description, existingCategories, customPrompt);
        case 'gemini':
          return await this.classifyWithGemini(message, amount, description, existingCategories, customPrompt);
        case 'claude':
          return await this.classifyWithClaude(message, amount, description, existingCategories, customPrompt);
        case 'openai':
          return await this.classifyWithOpenAI(message, amount, description, existingCategories, customPrompt);
        case 'huggingface':
          return await this.classifyWithHuggingFace(message, amount, description, existingCategories, customPrompt);
        default:
          throw new Error(`Unsupported LLM provider: ${this.provider}. Please configure a valid LLM provider.`);
      }
    } catch (error) {
      console.error('LLM classification error:', error);
      throw error; // Re-throw the error instead of falling back
    }
  }

  async classifyWithGroq(message, amount, description, existingCategories, customPrompt = null) {
    if (!this.groqApiKey) {
      throw new Error('Groq API key not configured');
    }

    const { systemPrompt, userMessage } = this.buildClassificationPrompt(message, amount, description, existingCategories, customPrompt);
    
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.groqApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL || 'llama-3.1-8b-instant',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: userMessage
          }
        ],
        max_tokens: 150,
        temperature: 0.3,
        stream: false
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Groq API error details:', errorText);
      
      if (response.status === 429) {
        throw new Error('Groq rate limit exceeded. Please wait a moment and try again.');
      } else if (response.status === 401) {
        throw new Error('Groq API key is invalid. Please check your GROQ_API_KEY in the .env file.');
      } else if (response.status === 400) {
        throw new Error(`Groq API bad request. Please check your model name and request format. Error: ${errorText}`);
      } else {
        throw new Error(`Groq API error: ${response.status} - ${response.statusText}. Details: ${errorText}`);
      }
    }

    const data = await response.json();
    return this.parseLLMResponse(data.choices[0].message.content, existingCategories);
  }

  async classifyWithGemini(message, amount, description, existingCategories, customPrompt = null) {
    if (!this.geminiApiKey) {
      throw new Error('Gemini API key not configured');
    }

    const { systemPrompt, userMessage } = this.buildClassificationPrompt(message, amount, description, existingCategories, customPrompt);
    const fullPrompt = `${systemPrompt}\n\n${userMessage}`;
    
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${process.env.GEMINI_MODEL || 'gemini-pro'}:generateContent?key=${this.geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: fullPrompt
          }]
        }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 150
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    return this.parseLLMResponse(generatedText, existingCategories);
  }

  async classifyWithClaude(message, amount, description, existingCategories, customPrompt = null) {
    if (!this.claudeApiKey) {
      throw new Error('Claude API key not configured');
    }

    const { systemPrompt, userMessage } = this.buildClassificationPrompt(message, amount, description, existingCategories, customPrompt);
    
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': this.claudeApiKey,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: process.env.CLAUDE_MODEL || 'claude-3-5-sonnet-20241022',
        max_tokens: 150,
        system: systemPrompt,
        messages: [{
          role: 'user',
          content: userMessage
        }]
      })
    });

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.status}`);
    }

    const data = await response.json();
    const generatedText = data.content?.[0]?.text || '';
    
    return this.parseLLMResponse(generatedText, existingCategories);
  }

  async classifyWithOpenAI(message, amount, description, existingCategories, customPrompt = null) {
    if (!this.openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const { systemPrompt, userMessage } = this.buildClassificationPrompt(message, amount, description, existingCategories, customPrompt);
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: userMessage
          }
        ],
        max_tokens: 150,
        temperature: 0.3
      })
    });

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error('OpenAI rate limit exceeded. Please wait a moment and try again, or consider using a different LLM provider like Groq or Gemini.');
      } else if (response.status === 401) {
        throw new Error('OpenAI API key is invalid. Please check your OPENAI_API_KEY in the .env file.');
      } else if (response.status === 402) {
        throw new Error('OpenAI payment required. Your free credits may have been exhausted. Please add payment method or use a different provider.');
      } else {
        throw new Error(`OpenAI API error: ${response.status} - ${response.statusText}`);
      }
    }

    const data = await response.json();
    return this.parseLLMResponse(data.choices[0].message.content, existingCategories);
  }

  async classifyWithHuggingFace(message, amount, description, existingCategories, customPrompt = null) {
    if (!this.huggingfaceApiKey) {
      throw new Error('Hugging Face API key not configured');
    }

    // Use a text classification model
    const response = await fetch('https://api-inference.huggingface.co/models/facebook/bart-large-mnli', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.huggingfaceApiKey}`,
        'Content-Type': 'application/json',
      },
       body: JSON.stringify({
         inputs: `${message} ${description}`,
         parameters: {
           candidate_labels: existingCategories.length > 0 ? existingCategories : [
             'Food & Dining', 'Transportation', 'Shopping', 'Entertainment', 
             'Healthcare', 'Utilities', 'Groceries', 'Education', 'Travel', 
             'Insurance', 'Housing', 'Personal Care', 'Subscriptions', 
             'Savings & Investment', 'Gifts & Donations', 'Pet Care', 
             'Office Supplies', 'Miscellaneous'
           ]
         }
       })
    });

    if (!response.ok) {
      throw new Error(`Hugging Face API error: ${response.status}`);
    }

    const data = await response.json();
    return this.parseHuggingFaceResponse(data, existingCategories);
  }


  getDefaultPrompt(categoriesList = '{categoriesList}') {
    return `You are an expert expense categorization assistant. Your job is to classify expenses into the most appropriate category.

Available Categories: ${categoriesList}

Rules:
1. Choose the category that best matches the expense description
2. Consider the amount and context when classifying
3. If no existing category fits well, suggest a new category
4. Respond with ONLY a JSON object in this exact format: {"field": "Category Name", "is_new": true/false}
5. Be consistent with similar expenses
6. User living in Thailand consider Thailand merchant

OVERLAPPING CATEGORIES - Choose the most specific one:
- House loan/mortgage → "Housing" (not Loans)
- Car loan → "Loans" (not Transportation)
- Student loan → "Loans" (not Education)
- Credit card payment → "Loans" (not Shopping)
- Groceries → "Food & Dining" (not Shopping)
- Restaurant meal → "Food & Dining" (not Entertainment)
- Gym membership → "Healthcare" (not Entertainment)
- Work lunch → "Food & Dining" (not Miscellaneous)

Examples:
- "Coffee $4.50" → {"field": "Food & Dining", "is_new": false}
- "House loan payment $1200" → {"field": "Housing", "is_new": false}
- "Car loan $400" → {"field": "Loans", "is_new": false}
- "Student loan $300" → {"field": "Loans", "is_new": false}
- "Grocery shopping $80" → {"field": "Food & Dining", "is_new": false}`;
  }

  // Shared method to inject categories into any prompt
  injectCategoriesIntoPrompt(prompt, categoriesList) {
    // Replace {categoriesList} placeholder with actual categories
    let systemPrompt = prompt.replace('{categoriesList}', categoriesList);
    
    // If no placeholder was found, append categories info
    if (!prompt.includes('{categoriesList}')) {
      systemPrompt += `\n\nAvailable Categories: ${categoriesList}`;
    }
    
    return systemPrompt;
  }

  buildClassificationPrompt(message, amount, description, existingCategories, customPrompt = null) {
    const categoriesList = existingCategories.length > 0 
      ? existingCategories.join(', ')
      : 'No existing categories - suggest new ones as needed';

    // Get the base prompt (custom or default)
    let basePrompt;
    if (customPrompt) {
      basePrompt = customPrompt;
    } else {
      basePrompt = this.getDefaultPrompt('{categoriesList}');
    }

    // Inject categories into the prompt
    const systemPrompt = this.injectCategoriesIntoPrompt(basePrompt, categoriesList);

    return {
      systemPrompt,
      userMessage: `Classify this expense:
Message: "${message}"
Amount: $${amount}
Description: "${description}"

Respond with JSON:`
    };
  }

  parseLLMResponse(response, existingCategories) {
    const cleanResponse = response.trim();
    
    try {
      // Try to parse as JSON first
      const jsonMatch = cleanResponse.match(/\{.*\}/);
      if (jsonMatch) {
        const jsonStr = jsonMatch[0];
        const parsed = JSON.parse(jsonStr);
        
        if (parsed.field && typeof parsed.is_new === 'boolean') {
          return {
            category: parsed.field,
            confidence: 0.9,
            description: parsed.is_new ? 'AI suggested new category' : 'AI classified using existing category',
            isExisting: !parsed.is_new
          };
        }
      }
    } catch (error) {
      console.log('Failed to parse JSON response, falling back to text parsing:', error.message);
    }
    
    // Fallback to old parsing method for backward compatibility
    if (cleanResponse.startsWith('NEW_CATEGORY:')) {
      const newCategory = cleanResponse.replace('NEW_CATEGORY:', '').trim();
      return {
        category: newCategory,
        confidence: 0.8,
        description: 'AI suggested new category',
        isExisting: false
      };
    }

    // Check if it matches existing categories
    const matchedCategory = existingCategories.find(cat => 
      cleanResponse.toLowerCase().includes(cat.toLowerCase())
    );

    if (matchedCategory) {
      return {
        category: matchedCategory,
        confidence: 0.9,
        description: 'AI classified based on context',
        isExisting: true
      };
    }

    // If no clear match, suggest a new category
    return {
      category: cleanResponse || 'Miscellaneous',
      confidence: 0.6,
      description: 'AI suggested category',
      isExisting: false
    };
  }

  parseHuggingFaceResponse(data, existingCategories) {
    if (data.labels && data.scores) {
      const bestMatch = data.labels[0];
      const confidence = data.scores[0];
      
      return {
        category: bestMatch,
        confidence: confidence,
        description: 'Hugging Face classification',
        isExisting: existingCategories.includes(bestMatch)
      };
    }

    return {
      category: null,
      confidence: 0,
      description: 'No clear classification',
      isExisting: false
    };
  }
}

export default LLMService;
