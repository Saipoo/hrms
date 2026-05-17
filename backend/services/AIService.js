import { GoogleGenerativeAI } from '@google/generative-ai';

// Using native fetch available in Node 18+


/**
 * Unified AI Service with Multi-Model Fallback
 * Order: Gemini -> Groq -> OpenRouter -> Dummy Fallback
 */
class AIService {
  constructor() {
    this.gemini = null;
    this.groqKey = null;
    this.openRouterKey = null;
    this.initialized = false;
  }

  /**
   * Ensure keys are loaded from process.env
   */
  init() {
    if (this.initialized) return;

    if (process.env.GEMINI_API_KEY) {
      this.gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    }
    this.groqKey = process.env.GROQ_API_KEY || null;
    this.openRouterKey = process.env.OPENROUTER_API_KEY || null;
    this.initialized = true;

    console.log('🤖 AI Service Initialized:', {
      gemini: !!this.gemini,
      groq: !!this.groqKey,
      openRouter: !!this.openRouterKey
    });
  }

  /**
   * Main generation method with fallback logic
   */
  async generateContent(prompt, options = {}) {
    this.init(); // Ensure keys are loaded

    const {
      systemPrompt = "You are a helpful assistant.",
      temperature = 0.7,
      maxTokens = 2000,
      jsonMode = true
    } = options;

    // 1. Try Gemini
    if (this.gemini) {
      try {
        console.log('🤖 Attempting generation with Gemini...');
        const model = this.gemini.getGenerativeModel({ model: 'gemini-2.5-flash' });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        return this.cleanResponse(text, jsonMode);
      } catch (error) {
        console.error('❌ Gemini Error:', error.message);
        // If it's a quota error or other failure, proceed to next
      }
    }

    // 2. Try Groq (Llama 3 70B)
    if (this.groqKey) {
      try {
        console.log('🤖 Fallback: Attempting generation with Groq...');
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.groqKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: prompt }
            ],
            temperature,
            max_tokens: maxTokens
          })
        });

        if (!response.ok) throw new Error(`Groq API error: ${response.status}`);

        const data = await response.json();
        const text = data.choices[0].message.content;
        return this.cleanResponse(text, jsonMode);
      } catch (error) {
        console.error('❌ Groq Error:', error.message);
      }
    }

    // 3. Try OpenRouter (Claude/GPT-4o mini)
    if (this.openRouterKey) {
      try {
        console.log('🤖 Fallback: Attempting generation with OpenRouter...');
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.openRouterKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://worksphere-hrms.com',
            'X-Title': 'WorkSphere HRMS'
          },
          body: JSON.stringify({
            model: 'deepseek/deepseek-chat',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: prompt }
            ],
            temperature,
            max_tokens: maxTokens
          })
        });

        if (!response.ok) throw new Error(`OpenRouter API error: ${response.status}`);

        const data = await response.json();
        const text = data.choices[0].message.content;
        return this.cleanResponse(text, jsonMode);
      } catch (error) {
        console.error('❌ OpenRouter Error:', error.message);
      }
    }

    // 4. Final Fallback: Throw error (calling service should handle with dummy data)
    throw new Error('All AI services failed or no API keys available');
  }

  /**
   * Helper to clean and parse AI response
   */
  cleanResponse(text, jsonMode) {
    if (!jsonMode) return text.trim();

    try {
      // Find JSON block
      const jsonMatch = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return JSON.parse(text);
    } catch (error) {
      console.error('Parsing Error:', error.message);
      // Try to clean common AI artifacts
      const cleaned = text
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();
      try {
        return JSON.parse(cleaned);
      } catch (e) {
        throw new Error('Failed to parse JSON from AI response');
      }
    }
  }
}

export default new AIService();
