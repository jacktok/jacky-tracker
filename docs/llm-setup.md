# LLM Integration Setup Guide

This guide will help you set up free LLM APIs for intelligent expense categorization in your chat mode.

## 🆓 Free LLM Options

### 1. **Groq API (Recommended for Speed)**
- **Free Tier**: 14,400 requests per day
- **Speed**: Very fast (GPU-accelerated)
- **Models**: Llama 3, Mixtral, Gemma
- **Setup**: 
  1. Go to [console.groq.com](https://console.groq.com)
  2. Sign up for free
  3. Create an API key
  4. Add to your `.env` file:
     ```
     GROQ_API_KEY=your-groq-api-key-here
     LLM_PROVIDER=groq
     ```

### 2. **Google Gemini API (Recommended for Quality)**
- **Free Tier**: 60 requests per minute, no daily limit
- **Speed**: Fast
- **Models**: Gemini Pro, Gemini Pro Vision
- **Setup**:
  1. Go to [ai.google.dev](https://ai.google.dev)
  2. Sign in with Google account
  3. Create an API key
  4. Add to your `.env` file:
     ```
     GEMINI_API_KEY=your-gemini-api-key-here
     LLM_PROVIDER=gemini
     ```

### 3. **Anthropic Claude API (Best Quality)**
- **Free Tier**: Free credits for new users
- **Speed**: Medium
- **Models**: Claude 3.5 Sonnet, Claude 3 Haiku
- **Setup**:
  1. Go to [console.anthropic.com](https://console.anthropic.com)
  2. Sign up and get free credits
  3. Create an API key
  4. Add to your `.env` file:
     ```
     CLAUDE_API_KEY=your-claude-api-key-here
     LLM_PROVIDER=claude
     ```

### 4. **OpenAI API**
- **Free Tier**: $5 free credits for new users
- **Models**: GPT-3.5-turbo, GPT-4
- **Setup**:
  1. Go to [platform.openai.com](https://platform.openai.com)
  2. Sign up and add payment method
  3. Create an API key
  4. Add to your `.env` file:
     ```
     OPENAI_API_KEY=your-openai-api-key-here
     LLM_PROVIDER=openai
     ```

### 5. **Hugging Face API**
- **Free Tier**: 1,000 requests per month
- **Models**: Various pre-trained models
- **Setup**:
  1. Go to [huggingface.co](https://huggingface.co)
  2. Sign up and go to Settings > Access Tokens
  3. Create a new token
  4. Add to your `.env` file:
     ```
     HUGGINGFACE_API_KEY=your-huggingface-api-key-here
     LLM_PROVIDER=huggingface
     ```

## 🔧 Configuration

1. **Copy the environment file**:
   ```bash
   cp env.example .env
   ```

2. **Add your API key** to the `.env` file:
   ```env
   # Choose one provider
   GROQ_API_KEY=your-groq-api-key-here
   LLM_PROVIDER=groq
   ```

3. **Restart your server**:
   ```bash
   node server.js
   ```

## 🎯 How It Works

### Without LLM (Keyword Matching)
- Uses predefined keyword lists
- Matches against existing categories
- Fallback when LLM is unavailable

### With LLM (AI-Powered)
- Analyzes natural language descriptions
- Considers context and amount
- Suggests new categories when needed
- Higher accuracy and understanding

## 📊 Example Classifications

| Input | Keyword Match | LLM Match |
|-------|---------------|-----------|
| "Coffee $4.50 at Starbucks" | Food & Dining | Food & Dining |
| "Uber ride to airport $25" | Transportation | Transportation |
| "Netflix subscription $15" | Entertainment | Entertainment |
| "Dog grooming $80" | No match | NEW_CATEGORY: Pet Care |
| "Office supplies $45" | Shopping | NEW_CATEGORY: Office Supplies |

## 🚀 Testing

1. **Start the servers**:
   ```bash
   # Terminal 1 - Backend
   node server.js
   
   # Terminal 2 - Frontend
   npm run dev
   ```

2. **Test in Chat Mode**:
   - Go to the Chat tab
   - Try: "I spent $25 on lunch today"
   - Try: "Dog grooming $80"
   - Try: "Office supplies $45"

## 🔄 Fallback System

The system automatically falls back to keyword matching if:
- API key is not configured
- API request fails
- Rate limit exceeded
- Network error

## 💡 Tips

1. **Start with Groq** - Most generous free tier
2. **Monitor usage** - Check API dashboards regularly
3. **Test thoroughly** - Try various expense descriptions
4. **Customize categories** - Add your own category descriptions

## 🛠️ Troubleshooting

### "API key not configured"
- Check your `.env` file
- Ensure no extra spaces in the key
- Restart the server

### "API error: 401"
- Invalid API key
- Check key permissions

### "API error: 429"
- Rate limit exceeded
- Wait or switch providers

### "Classification error"
- Check network connection
- Verify API key is valid
- Ensure LLM provider is properly configured

## 📈 Performance

- **Groq**: ~200ms response time (Fastest)
- **Gemini**: ~300ms response time (Fast + High Quality)
- **Claude**: ~800ms response time (Best Quality)
- **OpenAI**: ~500ms response time (Good Balance)
- **Hugging Face**: ~1-2s response time (Slowest)

## 🎯 Recommendations

- **For Speed**: Use Groq (14,400 requests/day)
- **For Quality**: Use Claude (free credits)
- **For Balance**: Use Gemini (60 requests/minute, no daily limit)
- **For Budget**: Use Hugging Face (1,000 free requests/month)

Choose the provider that best fits your needs!
