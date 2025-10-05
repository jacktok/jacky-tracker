// LLM Service for expense classification
// Supports multiple providers: Groq, OpenAI, Gemini, and Claude

class LLMService {
  constructor() {
    this.provider = process.env.LLM_PROVIDER || 'keyword';
    this.groqApiKey = process.env.GROQ_API_KEY;
    this.geminiApiKey = process.env.GEMINI_API_KEY;
    this.claudeApiKey = process.env.CLAUDE_API_KEY;
    this.openaiApiKey = process.env.OPENAI_API_KEY;
  }


  async extractExpenseData(message, existingCategories = [], customPrompt = null, userDate = null) {
    try {
      switch (this.provider) {
        case 'groq':
          return await this.extractWithGroq(message, existingCategories, customPrompt, userDate);
        case 'gemini':
          return await this.extractWithGemini(message, existingCategories, customPrompt, userDate);
        case 'claude':
          return await this.extractWithClaude(message, existingCategories, customPrompt, userDate);
        case 'openai':
          return await this.extractWithOpenAI(message, existingCategories, customPrompt, userDate);
        default:
          throw new Error(`Unsupported LLM provider: ${this.provider}. Please configure a valid LLM provider.`);
      }
    } catch (error) {
      console.error('LLM extraction error:', error);
      throw error;
    }
  }











  getDefaultPrompt() {
    return `You are an expert expense data extraction and categorization assistant. Extract expense information from natural language input and classify it into the most appropriate category.

Today is: {userDate}

Available Categories: {categoriesList}

Rules:
1. Extract amount (numeric value only, no currency symbols)
2. Determine the most appropriate category from existing ones or suggest a new one
3. CRITICAL: Generate a clear, descriptive note in the EXACT same language as the input. If input is Thai, note must be Thai. If input is English, note must be English.
4. Parse date references:
   - "today" = {userDate}
   - "yesterday" = calculate the actual previous date (e.g., if today is 2025-10-06, yesterday is 2025-10-05)
   - Extract specific dates if mentioned
   - If no date is mentioned, use today's date ({userDate})
   - ALWAYS return actual dates in YYYY-MM-DD format, never descriptive text
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

6. Respond with ONLY a JSON object in this exact format:
{
  "amount": number,
  "category": "Category Name",
  "note": "Descriptive note in same language as input",
  "date": "YYYY-MM-DD",
  "is_new_category": true/false
}

Examples:
- "Bought coffee for 150 baht" → {"amount": 150, "category": "Food & Dining", "note": "Coffee purchase", "date": "{userDate}", "is_new_category": false}
- "Yesterday spent 500 on groceries" → {"amount": 500, "category": "Food & Dining", "note": "Grocery shopping", "date": "previous day from {userDate}", "is_new_category": false}
- "Paid 2000 for car repair today" → {"amount": 2000, "category": "Transportation", "note": "Car repair", "date": "{userDate}", "is_new_category": false}
- "ซื้อกาแฟ 150 บาท" → {"amount": 150, "category": "Food & Dining", "note": "ซื้อกาแฟ", "date": "{userDate}", "is_new_category": false}
- "เมื่อวานซื้อของ 500 บาท" → {"amount": 500, "category": "Food & Dining", "note": "ซื้อของเมื่อวาน", "date": "2025-10-05", "is_new_category": false}
- "จ่ายค่าซ่อมรถ 2000 บาทวันนี้" → {"amount": 2000, "category": "Transportation", "note": "ค่าซ่อมรถ", "date": "{userDate}", "is_new_category": false}`;
  }

  // Extraction methods for each provider
  async extractWithGroq(message, existingCategories, customPrompt = null, userDate = null) {
    if (!this.groqApiKey) {
      throw new Error('Groq API key not configured');
    }

    const { systemPrompt, userMessage } = this.buildExtractionPrompt(message, existingCategories, customPrompt, userDate);
    
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
        max_tokens: 300,
        temperature: 0.3,
        stream: false
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Groq API error details:', errorText);
      throw new Error(`Groq API error: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();
    return this.parseExtractionResponse(data.choices[0].message.content, existingCategories);
  }

  async extractWithGemini(message, existingCategories, customPrompt = null, userDate = null) {
    if (!this.geminiApiKey) {
      throw new Error('Gemini API key not configured');
    }

    const { systemPrompt, userMessage } = this.buildExtractionPrompt(message, existingCategories, customPrompt, userDate);
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
          maxOutputTokens: 300
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    return this.parseExtractionResponse(generatedText, existingCategories);
  }

  async extractWithClaude(message, existingCategories, customPrompt = null, userDate = null) {
    if (!this.claudeApiKey) {
      throw new Error('Claude API key not configured');
    }

    const { systemPrompt, userMessage } = this.buildExtractionPrompt(message, existingCategories, customPrompt, userDate);
    
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': this.claudeApiKey,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: process.env.CLAUDE_MODEL || 'claude-3-5-sonnet-20241022',
        max_tokens: 300,
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
    
    return this.parseExtractionResponse(generatedText, existingCategories);
  }

  async extractWithOpenAI(message, existingCategories, customPrompt = null, userDate = null) {
    if (!this.openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const { systemPrompt, userMessage } = this.buildExtractionPrompt(message, existingCategories, customPrompt, userDate);
    
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
        max_tokens: 300,
        temperature: 0.3
      })
    });

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error('OpenAI rate limit exceeded. Please wait a moment and try again.');
      } else if (response.status === 401) {
        throw new Error('OpenAI API key is invalid. Please check your OPENAI_API_KEY in the .env file.');
      } else if (response.status === 402) {
        throw new Error('OpenAI payment required. Your free credits may have been exhausted.');
      } else {
        throw new Error(`OpenAI API error: ${response.status} - ${response.statusText}`);
      }
    }

    const data = await response.json();
    return this.parseExtractionResponse(data.choices[0].message.content, existingCategories);
  }


  buildExtractionPrompt(message, existingCategories, customPrompt = null, userDate = null) {
    const categoriesList = existingCategories.length > 0 
      ? existingCategories.join(', ')
      : 'No existing categories - suggest new ones as needed';

    // Use user date if provided, otherwise use server date
    const now = userDate ? new Date(userDate) : new Date();
    const today = now.toISOString().split('T')[0]; // YYYY-MM-DD format

    // Get the base prompt (custom or default)
    let basePrompt;
    if (customPrompt) {
      basePrompt = customPrompt;
    } else {
      basePrompt = this.getDefaultPrompt();
    }

    // Replace placeholders with actual values
    let systemPrompt = basePrompt
      .replace(/{userDate}/g, today)
      .replace(/{categoriesList}/g, categoriesList);

    return {
      systemPrompt,
      userMessage: `Extract expense data from this message: "${message}"`
    };
  }

  parseExtractionResponse(response, existingCategories) {
    const cleanResponse = response.trim();
    
    try {
      // Try to parse as JSON first
      const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const jsonStr = jsonMatch[0];
        const parsed = JSON.parse(jsonStr);
        
        if (parsed.amount && parsed.category && parsed.note && parsed.date) {
          return {
            amount: parseFloat(parsed.amount),
            category: parsed.category,
            note: parsed.note,
            date: parsed.date,
            isNewCategory: parsed.is_new_category || false,
            confidence: 0.9
          };
        }
      }
    } catch (error) {
      console.log('Failed to parse JSON response:', error.message);
    }
    
    // No fallback - just throw an error
    throw new Error('Failed to extract expense data from LLM response');
  }

}

export default LLMService;
