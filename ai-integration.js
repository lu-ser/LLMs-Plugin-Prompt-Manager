class AIIntegration {
  constructor() {
    this.settings = null;
    this.init();
  }

  async init() {
    await this.loadSettings();
  }

  async loadSettings() {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        const result = await chrome.storage.local.get(['llm-settings']);
        this.settings = result['llm-settings'] || {};
      } else {
        console.warn('Chrome storage API not available');
        this.settings = {};
      }
    } catch (error) {
      console.warn('Error loading settings:', error);
      this.settings = {};
    }
  }

  async improvePrompt(originalPrompt) {
    await this.loadSettings();
    
    const preferredService = this.settings.preferredAiService || 'openai';
    const apiKey = this.settings.apiKeys?.[preferredService];

    if (!apiKey) {
      throw new Error(`API key for ${preferredService} not configured. Please check your settings.`);
    }

    switch (preferredService) {
      case 'openai':
        return await this.improveWithOpenAI(originalPrompt, apiKey);
      case 'anthropic':
        return await this.improveWithAnthropic(originalPrompt, apiKey);
      case 'groq':
        return await this.improveWithGroq(originalPrompt, apiKey);
      case 'google':
        return await this.improveWithGoogle(originalPrompt, apiKey);
      default:
        throw new Error(`Unsupported AI service: ${preferredService}`);
    }
  }

  async improveWithOpenAI(prompt, apiKey) {
    const selectedModel = this.settings.selectedModels?.openai || 'gpt-4o-mini';
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: selectedModel,
        messages: [
          {
            role: 'system',
            content: `You are an expert prompt engineer. Your task is to improve the given prompt to make it more effective, clear, and specific. Follow these guidelines:

1. Make the prompt more specific and detailed
2. Add context when needed
3. Specify the desired output format
4. Include examples if helpful
5. Define tone and style preferences
6. Add any necessary constraints or limitations

Respond ONLY with the improved prompt, without explanations or preamble.`
          },
          {
            role: 'user',
            content: `Please improve this prompt:\n\n${prompt}`
          }
        ],
        max_tokens: 1000,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`OpenAI API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    return data.choices[0].message.content.trim();
  }

  async improveWithAnthropic(prompt, apiKey) {
    const selectedModel = this.settings.selectedModels?.anthropic || 'claude-3-5-sonnet-20241022';
    
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: selectedModel,
        max_tokens: 1000,
        messages: [
          {
            role: 'user',
            content: `You are an expert prompt engineer. Your task is to improve the given prompt to make it more effective, clear, and specific. Follow these guidelines:

1. Make the prompt more specific and detailed
2. Add context when needed
3. Specify the desired output format
4. Include examples if helpful
5. Define tone and style preferences
6. Add any necessary constraints or limitations

Respond ONLY with the improved prompt, without explanations or preamble.

Please improve this prompt:

${prompt}`
          }
        ]
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Anthropic API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    return data.content[0].text.trim();
  }

  async improveWithGroq(prompt, apiKey) {
    const selectedModel = this.settings.selectedModels?.groq || 'llama-3.1-8b-instant';
    
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: selectedModel,
        messages: [
          {
            role: 'system',
            content: `You are an expert prompt engineer. Your task is to improve the given prompt to make it more effective, clear, and specific. Follow these guidelines:

1. Make the prompt more specific and detailed
2. Add context when needed
3. Specify the desired output format
4. Include examples if helpful
5. Define tone and style preferences
6. Add any necessary constraints or limitations

Respond ONLY with the improved prompt, without explanations or preamble.`
          },
          {
            role: 'user',
            content: `Please improve this prompt:\n\n${prompt}`
          }
        ],
        max_tokens: 1000,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Groq API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    return data.choices[0].message.content.trim();
  }

  async improveWithGoogle(prompt, apiKey) {
    const selectedModel = this.settings.selectedModels?.google || 'gemini-1.5-flash';
    
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `You are an expert prompt engineer. Your task is to improve the given prompt to make it more effective, clear, and specific. Follow these guidelines:

1. Make the prompt more specific and detailed
2. Add context when needed
3. Specify the desired output format
4. Include examples if helpful
5. Define tone and style preferences
6. Add any necessary constraints or limitations

Respond ONLY with the improved prompt, without explanations or preamble.

Please improve this prompt:

${prompt}`
          }]
        }],
        generationConfig: {
          maxOutputTokens: 1000,
          temperature: 0.7
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Google AI API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text.trim();
  }

  async generateKeywords(prompt) {
    await this.loadSettings();
    
    const preferredService = this.settings.preferredAiService || 'openai';
    const apiKey = this.settings.apiKeys?.[preferredService];

    if (!apiKey) {
      return []; // Return empty array if no API key
    }

    try {
      let keywords;
      switch (preferredService) {
        case 'openai':
          keywords = await this.generateKeywordsWithOpenAI(prompt, apiKey);
          break;
        case 'anthropic':
          keywords = await this.generateKeywordsWithAnthropic(prompt, apiKey);
          break;
        case 'groq':
          keywords = await this.generateKeywordsWithGroq(prompt, apiKey);
          break;
        case 'google':
          keywords = await this.generateKeywordsWithGoogle(prompt, apiKey);
          break;
        default:
          return [];
      }
      
      // Parse the keywords from the response
      return keywords.split(',').map(k => k.trim()).filter(k => k.length > 0).slice(0, 5);
    } catch (error) {
      console.warn('Failed to generate keywords:', error);
      return [];
    }
  }

  async generateKeywordsWithOpenAI(prompt, apiKey) {
    const selectedModel = this.settings.selectedModels?.openai || 'gpt-4o-mini';
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: selectedModel,
        messages: [
          {
            role: 'user',
            content: `Generate 3-5 relevant keywords or tags for this prompt, separated by commas. Only respond with the keywords, no explanations:\n\n${prompt}`
          }
        ],
        max_tokens: 100,
        temperature: 0.3
      })
    });

    if (!response.ok) throw new Error('OpenAI API error');
    
    const data = await response.json();
    return data.choices[0].message.content.trim();
  }

  async generateKeywordsWithAnthropic(prompt, apiKey) {
    const selectedModel = this.settings.selectedModels?.anthropic || 'claude-3-5-sonnet-20241022';
    
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: selectedModel,
        max_tokens: 100,
        messages: [
          {
            role: 'user',
            content: `Generate 3-5 relevant keywords or tags for this prompt, separated by commas. Only respond with the keywords, no explanations:\n\n${prompt}`
          }
        ]
      })
    });

    if (!response.ok) throw new Error('Anthropic API error');
    
    const data = await response.json();
    return data.content[0].text.trim();
  }

  async generateKeywordsWithGroq(prompt, apiKey) {
    const selectedModel = this.settings.selectedModels?.groq || 'llama-3.1-8b-instant';
    
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: selectedModel,
        messages: [
          {
            role: 'user',
            content: `Generate 3-5 relevant keywords or tags for this prompt, separated by commas. Only respond with the keywords, no explanations:\n\n${prompt}`
          }
        ],
        max_tokens: 100,
        temperature: 0.3
      })
    });

    if (!response.ok) throw new Error('Groq API error');
    
    const data = await response.json();
    return data.choices[0].message.content.trim();
  }

  async generateKeywordsWithGoogle(prompt, apiKey) {
    const selectedModel = this.settings.selectedModels?.google || 'gemini-1.5-flash';
    
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Generate 3-5 relevant keywords or tags for this prompt, separated by commas. Only respond with the keywords, no explanations:\n\n${prompt}`
          }]
        }],
        generationConfig: {
          maxOutputTokens: 100,
          temperature: 0.3
        }
      })
    });

    if (!response.ok) throw new Error('Google AI API error');
    
    const data = await response.json();
    return data.candidates[0].content.parts[0].text.trim();
  }

  async generatePromptName(prompt) {
    await this.loadSettings();
    
    const preferredService = this.settings.preferredAiService || 'openai';
    const apiKey = this.settings.apiKeys?.[preferredService];

    if (!apiKey) {
      return null; // Return null if no API key
    }

    try {
      let name;
      switch (preferredService) {
        case 'openai':
          name = await this.generateNameWithOpenAI(prompt, apiKey);
          break;
        case 'anthropic':
          name = await this.generateNameWithAnthropic(prompt, apiKey);
          break;
        case 'groq':
          name = await this.generateNameWithGroq(prompt, apiKey);
          break;
        case 'google':
          name = await this.generateNameWithGoogle(prompt, apiKey);
          break;
        default:
          return null;
      }
      
      // Clean up the generated name
      return name.replace(/['"]/g, '').trim().substring(0, 60);
    } catch (error) {
      console.warn('Failed to generate prompt name:', error);
      return null;
    }
  }

  async generateNameWithOpenAI(prompt, apiKey) {
    const selectedModel = this.settings.selectedModels?.openai || 'gpt-4o-mini';
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: selectedModel,
        messages: [
          {
            role: 'user',
            content: `Generate a short, descriptive title for this prompt (max 8 words). Only respond with the title, no explanations:\n\n${prompt}`
          }
        ],
        max_tokens: 50,
        temperature: 0.3
      })
    });

    if (!response.ok) throw new Error('OpenAI API error');
    
    const data = await response.json();
    return data.choices[0].message.content.trim();
  }

  async generateNameWithAnthropic(prompt, apiKey) {
    const selectedModel = this.settings.selectedModels?.anthropic || 'claude-3-5-sonnet-20241022';
    
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: selectedModel,
        max_tokens: 50,
        messages: [
          {
            role: 'user',
            content: `Generate a short, descriptive title for this prompt (max 8 words). Only respond with the title, no explanations:\n\n${prompt}`
          }
        ]
      })
    });

    if (!response.ok) throw new Error('Anthropic API error');
    
    const data = await response.json();
    return data.content[0].text.trim();
  }

  async generateNameWithGroq(prompt, apiKey) {
    const selectedModel = this.settings.selectedModels?.groq || 'meta-llama/llama-4-maverick-17b-128e-instruct';
    
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: selectedModel,
        messages: [
          {
            role: 'user',
            content: `Generate a short, descriptive title for this prompt (max 8 words). Only respond with the title, no explanations:\n\n${prompt}`
          }
        ],
        max_tokens: 50,
        temperature: 0.3
      })
    });

    if (!response.ok) throw new Error('Groq API error');
    
    const data = await response.json();
    return data.choices[0].message.content.trim();
  }

  async generateNameWithGoogle(prompt, apiKey) {
    const selectedModel = this.settings.selectedModels?.google || 'gemini-1.5-flash';
    
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Generate a short, descriptive title for this prompt (max 8 words). Only respond with the title, no explanations:\n\n${prompt}`
          }]
        }],
        generationConfig: {
          maxOutputTokens: 50,
          temperature: 0.3
        }
      })
    });

    if (!response.ok) throw new Error('Google AI API error');
    
    const data = await response.json();
    return data.candidates[0].content.parts[0].text.trim();
  }
}

// Make AIIntegration available globally immediately
(function() {
  if (typeof window !== 'undefined') {
    window.AIIntegration = AIIntegration;
    console.log('AIIntegration class registered on window object');
  }
})();