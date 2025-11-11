class LLMPromptManager {
  constructor() {
    this.currentSite = this.detectSite();
    this.selectors = this.getSiteSelectors();
    this.init();
  }

  detectSite() {
    const hostname = window.location.hostname;
    const siteMap = {
      'chat.openai.com': 'chatgpt',
      'claude.ai': 'claude',
      'chat.mistral.ai': 'mistral',
      'gemini.google.com': 'gemini',
      'copilot.microsoft.com': 'copilot'
    };
    return siteMap[hostname] || 'unknown';
  }

  getSiteSelectors() {
    const selectors = {
      chatgpt: {
        input: '#prompt-textarea, textarea[data-id="root"], div[contenteditable="true"][data-testid*="message"], textarea[placeholder*="Message"], textarea[data-testid*="message"], div[data-testid*="composer"] textarea, textarea[aria-label*="Message"]',
        sendButton: '[data-testid="send-button"], button[aria-label*="Send"], button[type="submit"]',
        messages: '[data-testid="conversation-turn"], .group'
      },
      claude: {
        input: '.ProseMirror, div[contenteditable="true"], textarea[placeholder*="Talk"], .composer textarea, div[role="textbox"], fieldset div[contenteditable], div[data-testid*="composer"] div[contenteditable]',
        sendButton: 'button[aria-label*="Send"], button[type="submit"], .send-button',
        messages: '.font-user-message, [data-testid="message"]'
      },
      mistral: {
        input: 'textarea[placeholder*="message"], textarea[placeholder*="question"], div[contenteditable="true"]',
        sendButton: 'button[type="submit"], button[aria-label*="Send"], .send-button',
        messages: '.message, .chat-message'
      },
      gemini: {
        input: '.ql-editor, textarea[placeholder*="Enter"], div[contenteditable="true"], textarea[aria-label*="message"], div[role="textbox"]',
        sendButton: 'button[aria-label*="Send"], button[type="submit"], .send-button',
        messages: '.conversation-container, .message-content'
      },
      copilot: {
        input: '#userInput, textarea[placeholder*="Ask"], div[contenteditable="true"], .composer-input',
        sendButton: '[aria-label*="Submit"], button[type="submit"], .send-button',
        messages: '.message, .response-message'
      }
    };
    return selectors[this.currentSite] || {
      input: 'textarea, div[contenteditable="true"], input[type="text"], div[role="textbox"]',
      sendButton: 'button[type="submit"], button[aria-label*="Send"], .send-button',
      messages: '.message, .chat-message, .response'
    };
  }

  async init() {
    await this.loadAIIntegration();
    this.addPromptSaveButton();
    this.observeInputChanges();
    this.setupMessageListeners();
  }

  async loadAIIntegration() {
    try {
      // Create a simple AI integration directly here instead of loading external script
      this.aiIntegration = {
        settings: {},
        
        async loadSettings() {
          try {
            if (typeof chrome !== 'undefined' && chrome.storage) {
              const result = await chrome.storage.local.get(['llm-settings']);
              this.settings = result['llm-settings'] || {};
            } else {
              this.settings = {};
            }
          } catch (error) {
            this.settings = {};
          }
        },
        
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
        },
        
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
        },
        
        async improveWithGroq(prompt, apiKey) {
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
        },
        
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
        },
        
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
        },
        
        // Helper function to clean AI responses from reasoning tags
        cleanAIResponse(response) {
          if (!response) return '';
          
          // Remove thinking/reasoning tags and their content
          let cleaned = response
            .replace(/<think>[\s\S]*?<\/think>/gi, '')  // Remove <think>...</think>
            .replace(/<thinking>[\s\S]*?<\/thinking>/gi, '')  // Remove <thinking>...</thinking>  
            .replace(/<reasoning>[\s\S]*?<\/reasoning>/gi, '')  // Remove <reasoning>...</reasoning>
            .replace(/<reflection>[\s\S]*?<\/reflection>/gi, '')  // Remove <reflection>...</reflection>
            .trim();
            
          console.log('🧹 Cleaned response:', cleaned);
          return cleaned;
        },
        
        async generateKeywords(prompt) {
          console.log('🔧 generateKeywords called with prompt length:', prompt?.length);
          await this.loadSettings();
          console.log('🔧 Settings loaded:', this.settings);
          
          const preferredService = this.settings.preferredAiService || 'openai';
          const apiKey = this.settings.apiKeys?.[preferredService];
          console.log('🔧 Using service:', preferredService, 'API key available:', !!apiKey);

          if (!apiKey) {
            console.log('❌ No API key found for service:', preferredService);
            return [];
          }

          try {
            let keywords;
            console.log('🔧 Attempting to generate keywords with service:', preferredService);
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
                console.log('❌ Unsupported service:', preferredService);
                return [];
            }
            
            console.log('🔧 Raw keywords response:', keywords);
            
            // Clean the response from reasoning tags
            const cleanedKeywords = this.cleanAIResponse(keywords);
            console.log('🧹 Cleaned keywords response:', cleanedKeywords);
            
            // Parse the keywords from the response
            const parsedKeywords = cleanedKeywords.split(',').map(k => k.trim()).filter(k => k.length > 0).slice(0, 5);
            console.log('🔧 Parsed keywords:', parsedKeywords);
            return parsedKeywords;
          } catch (error) {
            console.error('❌ Failed to generate keywords:', error);
            return [];
          }
        },
        
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
        },

        async generateKeywordsWithGroq(prompt, apiKey) {
          const selectedModel = this.settings.selectedModels?.groq || 'meta-llama/llama-4-maverick-17b-128e-instruct';
          console.log('🦙 Using Groq model for keywords:', selectedModel);
          
          const requestBody = {
            model: selectedModel,
            messages: [
              {
                role: 'user',
                content: `Generate 3-5 relevant keywords or tags for this prompt, separated by commas. Only respond with the keywords, no explanations:\n\n${prompt}`
              }
            ],
            max_tokens: 100,
            temperature: 0.3
          };
          console.log('📤 Groq keywords request:', JSON.stringify(requestBody, null, 2));
          
          const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
          });

          console.log('🌐 Groq keywords response status:', response.status);
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Groq keywords API error:', response.status, errorText);
            throw new Error(`Groq API error: ${response.status} - ${errorText}`);
          }
          
          const data = await response.json();
          console.log('📥 Full Groq keywords response:', JSON.stringify(data, null, 2));
          
          const content = data.choices?.[0]?.message?.content;
          console.log('🎉 Raw keywords content from Groq:', content);
          
          // Clean thinking tags from Groq response
          const cleanedContent = this.cleanAIResponse(content);
          console.log('🧹 Groq keywords after cleaning:', cleanedContent);
          
          return cleanedContent || '';
        },

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
        },

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
        },
        
        async generatePromptName(prompt) {
          console.log('🎯 generatePromptName called with prompt length:', prompt.length);
          await this.loadSettings();
          
          const preferredService = this.settings.preferredAiService || 'openai';
          const apiKey = this.settings.apiKeys?.[preferredService];

          console.log('🔧 Settings loaded - Service:', preferredService, 'Has API key:', !!apiKey);

          if (!apiKey) {
            console.log('❌ No API key found for service:', preferredService);
            return null;
          }

          try {
            console.log('🚀 Attempting to generate name with service:', preferredService);
            let name;
            switch (preferredService) {
              case 'openai':
                name = await this.generateNameWithOpenAI(prompt, apiKey);
                break;
              case 'anthropic':
                name = await this.generateNameWithAnthropic(prompt, apiKey);
                break;
              case 'groq':
                console.log('🦙 Using Groq for name generation');
                name = await this.generateNameWithGroq(prompt, apiKey);
                break;
              case 'google':
                name = await this.generateNameWithGoogle(prompt, apiKey);
                break;
              default:
                console.log('❌ Unknown service:', preferredService);
                return null;
            }
            
            console.log('🎉 Raw name from API:', name);
            
            // Clean the response from reasoning tags first
            const cleanedName = this.cleanAIResponse(name);
            console.log('🧹 Cleaned reasoning tags:', cleanedName);
            
            // Clean up the generated name (remove quotes, trim, limit length)
            const finalName = cleanedName.replace(/['"]/g, '').trim().substring(0, 60);
            console.log('✨ Final cleaned name:', finalName);
            return finalName;
          } catch (error) {
            console.error('💥 Failed to generate prompt name:', error);
            return null;
          }
        },

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
        },

        async generateNameWithGroq(prompt, apiKey) {
          const selectedModel = this.settings.selectedModels?.groq || 'meta-llama/llama-4-maverick-17b-128e-instruct';
          console.log('🦙 Using Groq model for name:', selectedModel);
          
          const requestBody = {
            model: selectedModel,
            messages: [
              {
                role: 'user',
                content: `Generate a short, descriptive title for this prompt (max 8 words). Only respond with the title, no explanations:\n\n${prompt}`
              }
            ],
            max_tokens: 50,
            temperature: 0.3
          };
          console.log('📤 Groq name request:', JSON.stringify(requestBody, null, 2));
          
          const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
          });

          console.log('🌐 Groq name response status:', response.status);
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Groq name API error:', response.status, errorText);
            throw new Error(`Groq API error: ${response.status} - ${errorText}`);
          }
          
          const data = await response.json();
          console.log('📥 Full Groq name response:', JSON.stringify(data, null, 2));
          
          const content = data.choices?.[0]?.message?.content;
          console.log('🎉 Raw name content from Groq:', content);
          
          // Clean thinking tags from Groq response
          const cleanedContent = this.cleanAIResponse(content);
          console.log('🧹 Groq name after cleaning:', cleanedContent);
          
          return cleanedContent || '';
        },

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
        },

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
      };
      
      console.log('AI Integration created inline successfully');
    } catch (error) {
      console.error('Error creating AI integration:', error);
    }
  }

  addPromptSaveButton() {
    if (document.getElementById('llm-prompt-save-btn')) return;

    const inputElement = document.querySelector(this.selectors.input);
    if (!inputElement) {
      console.log(`LLM Prompt Manager: Input element not found for ${this.currentSite}, retrying...`);
      setTimeout(() => this.addPromptSaveButton(), 2000);
      return;
    }

    console.log(`LLM Prompt Manager: Input element found for ${this.currentSite}:`, inputElement);

    // Find the best container for buttons
    let container = inputElement.closest('form') || 
                   inputElement.closest('div[class*="input"]') || 
                   inputElement.closest('div[class*="composer"]') || 
                   inputElement.closest('div[class*="chat"]') ||
                   inputElement.closest('fieldset') ||
                   inputElement.closest('div[role="textbox"]')?.parentElement ||
                   inputElement.parentElement;

    // Create floating button container
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'llm-prompt-manager-buttons';
    buttonContainer.innerHTML = `
      <button id="llm-prompt-save-btn" class="llm-btn llm-save-btn" title="Save prompt">💾</button>
      <button id="llm-prompt-load-btn" class="llm-btn llm-load-btn" title="Load prompt">📁</button>
      <button id="llm-prompt-improve-btn" class="llm-btn llm-improve-btn" title="Improve prompt">✨</button>
    `;

    // Try to place buttons near the input field
    if (container) {
      // Check if container already has relative positioning
      const computedStyle = window.getComputedStyle(container);
      if (computedStyle.position === 'static') {
        container.style.position = 'relative';
      }
      
      // Insert buttons after the input element
      if (inputElement.nextSibling) {
        inputElement.parentElement.insertBefore(buttonContainer, inputElement.nextSibling);
      } else {
        container.appendChild(buttonContainer);
      }
    } else {
      // Fallback: add to body with fixed position
      buttonContainer.style.position = 'fixed';
      buttonContainer.style.top = '10px';
      buttonContainer.style.right = '10px';
      buttonContainer.style.zIndex = '10000';
      document.body.appendChild(buttonContainer);
    }

    // Event listeners
    document.getElementById('llm-prompt-save-btn').addEventListener('click', () => this.saveCurrentPrompt());
    document.getElementById('llm-prompt-load-btn').addEventListener('click', () => this.showPromptSelector());
    document.getElementById('llm-prompt-improve-btn').addEventListener('click', () => this.improvePrompt());
    
    console.log(`LLM Prompt Manager: Buttons added successfully for ${this.currentSite}`);
  }

  observeInputChanges() {
    const inputElement = document.querySelector(this.selectors.input);
    if (!inputElement) return;

    const observer = new MutationObserver(() => {
      if (!document.getElementById('llm-prompt-save-btn')) {
        this.addPromptSaveButton();
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }

  getCurrentPrompt() {
    const inputElement = document.querySelector(this.selectors.input);
    if (!inputElement) return '';

    if (inputElement.tagName === 'TEXTAREA' || inputElement.tagName === 'INPUT') {
      return inputElement.value || '';
    } else if (inputElement.contentEditable === 'true' || inputElement.hasAttribute('contenteditable')) {
      return inputElement.textContent || inputElement.innerText || '';
    }
    return '';
  }

  setPrompt(text) {
    const inputElement = document.querySelector(this.selectors.input);
    if (!inputElement) return;

    if (inputElement.tagName === 'TEXTAREA' || inputElement.tagName === 'INPUT') {
      inputElement.value = text;
      inputElement.focus();
      // Trigger multiple events to ensure it works across platforms
      inputElement.dispatchEvent(new Event('input', { bubbles: true }));
      inputElement.dispatchEvent(new Event('change', { bubbles: true }));
      inputElement.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));
    } else if (inputElement.contentEditable === 'true' || inputElement.hasAttribute('contenteditable')) {
      inputElement.textContent = text;
      inputElement.focus();
      // Place cursor at end
      const range = document.createRange();
      const sel = window.getSelection();
      range.selectNodeContents(inputElement);
      range.collapse(false);
      sel.removeAllRanges();
      sel.addRange(range);
      
      inputElement.dispatchEvent(new Event('input', { bubbles: true }));
      inputElement.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }

  async saveCurrentPrompt() {
    const prompt = this.getCurrentPrompt();
    if (!prompt.trim()) {
      alert('No prompt to save!');
      return;
    }

    this.showSavePromptModal(prompt);
  }

  showSavePromptModal(promptContent) {
    if (document.getElementById('llm-save-modal')) return;

    // Store references to maintain context
    const self = this;
    const aiIntegration = this.aiIntegration;
    console.log('💼 Setting up modal with aiIntegration:', !!aiIntegration);

    const modal = document.createElement('div');
    modal.id = 'llm-save-modal';
    modal.className = 'llm-modal';
    
    const defaultTitle = promptContent.substring(0, 50) + (promptContent.length > 50 ? '...' : '');
    
    modal.innerHTML = `
      <div class="llm-modal-content">
        <div class="llm-modal-header">
          <h3>Save Prompt</h3>
          <button class="llm-close-btn">&times;</button>
        </div>
        <div class="llm-modal-body">
          <div class="llm-form-group">
            <label for="llm-prompt-name">Prompt name:</label>
            <div class="llm-name-container">
              <input type="text" id="llm-prompt-name" value="${defaultTitle}" class="llm-form-input">
              <button type="button" id="llm-generate-name" class="llm-btn llm-btn-small">🤖 Generate</button>
            </div>
          </div>
          <div class="llm-form-group">
            <label for="llm-prompt-keywords">Keywords (comma separated):</label>
            <div class="llm-keywords-container">
              <input type="text" id="llm-prompt-keywords" placeholder="work, creative, research, AI..." class="llm-form-input">
              <button type="button" id="llm-generate-keywords" class="llm-btn llm-btn-small">🤖 Generate</button>
            </div>
          </div>
          <div class="llm-form-group">
            <label>Content preview:</label>
            <textarea class="llm-form-textarea" readonly>${promptContent}</textarea>
          </div>
          <div class="llm-form-actions">
            <button id="llm-cancel-save" class="llm-btn llm-btn-secondary">Cancel</button>
            <button id="llm-confirm-save" class="llm-btn llm-btn-primary">Save Prompt</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Event listeners
    const closeBtn = modal.querySelector('.llm-close-btn');
    const cancelBtn = modal.querySelector('#llm-cancel-save');
    const saveBtn = modal.querySelector('#llm-confirm-save');
    const nameInput = modal.querySelector('#llm-prompt-name');
    const generateBtn = modal.querySelector('#llm-generate-keywords');
    const generateNameBtn = modal.querySelector('#llm-generate-name');
    const keywordsInput = modal.querySelector('#llm-prompt-keywords');

    closeBtn.addEventListener('click', () => modal.remove());
    cancelBtn.addEventListener('click', () => modal.remove());
    
    generateBtn.addEventListener('click', async () => {
      console.log('🚀 Generate Keywords button clicked');
      generateBtn.disabled = true;
      generateBtn.textContent = '⏳ Generating...';

      try {
        console.log('🔍 Checking aiIntegration availability for keywords:', !!aiIntegration);
        
        if (aiIntegration) {
          console.log('📝 Attempting to generate keywords for prompt:', promptContent.substring(0, 100) + '...');
          
          const keywords = await aiIntegration.generateKeywords(promptContent);
          console.log('📋 Generated keywords result:', keywords);
          
          if (keywords && keywords.length > 0) {
            keywordsInput.value = keywords.join(', ');
            console.log('✅ Keywords generated successfully:', keywords);
          } else {
            console.log('⚠️ No keywords generated, using fallback');
            // Generate fallback keywords based on common terms
            const fallbackKeywords = self.generateFallbackKeywords(promptContent);
            keywordsInput.value = fallbackKeywords.join(', ');
            console.log('📝 Fallback keywords:', fallbackKeywords);
          }
        } else {
          console.log('❌ AI Integration not available for keywords, using fallback');
          // Generate fallback keywords
          const fallbackKeywords = this.generateFallbackKeywords(promptContent);
          keywordsInput.value = fallbackKeywords.join(', ');
          console.log('📝 Fallback keywords:', fallbackKeywords);
        }
      } catch (error) {
        console.error('❌ Error generating keywords:', error);
        // Generate fallback keywords
        const fallbackKeywords = this.generateFallbackKeywords(promptContent);
        keywordsInput.value = fallbackKeywords.join(', ');
        console.log('📝 Error fallback keywords:', fallbackKeywords);
      } finally {
        generateBtn.disabled = false;
        generateBtn.textContent = '🤖 Generate';
        console.log('🏁 Generate Keywords process completed');
      }
    });
    
    generateNameBtn.addEventListener('click', async () => {
      console.log('🚀 Generate Name button clicked');
      generateNameBtn.disabled = true;
      generateNameBtn.textContent = '⏳ Generating...';

      try {
        console.log('🔍 Checking aiIntegration availability:', !!aiIntegration);
        
        if (aiIntegration) {
          console.log('📝 Attempting to generate name for prompt:', promptContent.substring(0, 100) + '...');
          
          const generatedName = await aiIntegration.generatePromptName(promptContent);
          console.log('📋 Generated name result:', generatedName);
          
          if (generatedName && generatedName.trim()) {
            nameInput.value = generatedName;
            console.log('✅ Name generated successfully:', generatedName);
          } else {
            console.log('⚠️ No name generated, using fallback');
            // Generate fallback name
            const fallbackName = self.generateFallbackName(promptContent);
            nameInput.value = fallbackName;
            console.log('📝 Fallback name:', fallbackName);
          }
        } else {
          console.log('❌ AI Integration not available, using fallback');
          // Generate fallback name
          const fallbackName = this.generateFallbackName(promptContent);
          nameInput.value = fallbackName;
          console.log('📝 Fallback name:', fallbackName);
        }
      } catch (error) {
        console.error('❌ Error generating name:', error);
        // Generate fallback name
        const fallbackName = this.generateFallbackName(promptContent);
        nameInput.value = fallbackName;
        console.log('📝 Error fallback name:', fallbackName);
      } finally {
        generateNameBtn.disabled = false;
        generateNameBtn.textContent = '🤖 Generate';
        console.log('🏁 Generate Name process completed');
      }
    });
    
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });

    saveBtn.addEventListener('click', async () => {
      const name = nameInput.value.trim();
      const keywords = modal.querySelector('#llm-prompt-keywords').value.trim();

      if (!name) {
        alert('Prompt name is required!');
        return;
      }

      const savedPrompt = {
        id: Date.now(),
        title: name,
        content: promptContent,
        site: self.currentSite,
        createdAt: new Date().toISOString(),
        tags: keywords ? keywords.split(',').map(t => t.trim()).filter(t => t) : []
      };

      const prompts = await self.getStoredPrompts();
      prompts.unshift(savedPrompt);
      
      await chrome.storage.local.set({ 'llm-prompts': prompts });

      modal.remove();
      self.showNotification('Prompt saved!', 'success');
    });

    // Focus on name input
    nameInput.focus();
    nameInput.select();
  }

  generateFallbackKeywords(promptContent) {
    const keywords = [];
    const text = promptContent.toLowerCase();
    
    // Common keyword patterns
    const patterns = {
      'creative': ['creativ', 'write', 'story', 'poem', 'article'],
      'analysis': ['analy', 'review', 'evaluat', 'assess', 'compar'],
      'code': ['code', 'program', 'function', 'script', 'debug'],
      'research': ['research', 'find', 'search', 'information', 'data'],
      'business': ['business', 'market', 'strategy', 'plan', 'proposal'],
      'education': ['explain', 'teach', 'learn', 'understand', 'concept'],
      'technical': ['technical', 'how to', 'step', 'process', 'method'],
      'communication': ['email', 'letter', 'message', 'communicat', 'respond']
    };
    
    for (const [keyword, patterns_list] of Object.entries(patterns)) {
      if (patterns_list.some(pattern => text.includes(pattern))) {
        keywords.push(keyword);
      }
    }
    
    // Add site-specific keyword
    keywords.push(this.currentSite);
    
    // Ensure we have at least one keyword
    if (keywords.length === 1) {
      keywords.push('prompt');
    }
    
    return keywords.slice(0, 4); // Return max 4 keywords
  }

  generateFallbackName(promptContent) {
    const text = promptContent.trim();
    
    // Extract first meaningful sentence or phrase
    let name = text.split(/[.!?]/)[0].trim();
    
    // If too long, take first few words
    if (name.length > 50) {
      name = name.split(' ').slice(0, 8).join(' ');
    }
    
    // If still too long or too short, use a generic approach
    if (name.length < 10 || name.length > 50) {
      const keywords = this.generateFallbackKeywords(promptContent);
      if (keywords.length > 0) {
        name = `${keywords[0].charAt(0).toUpperCase() + keywords[0].slice(1)} prompt`;
      } else {
        name = `Prompt for ${this.currentSite}`;
      }
    }
    
    return name;
  }

  async getStoredPrompts() {
    const result = await chrome.storage.local.get(['llm-prompts']);
    return result['llm-prompts'] || [];
  }

  async showPromptSelector() {
    const prompts = await this.getStoredPrompts();
    if (prompts.length === 0) {
      alert('No saved prompts!');
      return;
    }

    this.createPromptModal(prompts);
  }

  createPromptModal(prompts) {
    if (document.getElementById('llm-prompt-modal')) return;

    const modal = document.createElement('div');
    modal.id = 'llm-prompt-modal';
    modal.className = 'llm-modal';
    
    modal.innerHTML = `
      <div class="llm-modal-content">
        <div class="llm-modal-header">
          <h3>Select Prompt</h3>
          <button class="llm-close-btn">&times;</button>
        </div>
        <div class="llm-modal-body">
          <input type="text" id="llm-search-input" placeholder="Search prompts..." class="llm-search-input">
          <div class="llm-prompt-list">
            ${prompts.map(prompt => `
              <div class="llm-prompt-item" data-id="${prompt.id}">
                <div class="llm-prompt-title">${prompt.title}</div>
                <div class="llm-prompt-meta">${this.formatDate(prompt.createdAt)} - ${prompt.site}</div>
                ${prompt.tags && prompt.tags.length > 0 ? `<div class="llm-prompt-tags">${prompt.tags.map(tag => `<span class="llm-tag">${tag}</span>`).join('')}</div>` : ''}
                <div class="llm-prompt-actions">
                  <button class="llm-btn-small llm-load-prompt" data-id="${prompt.id}">Load</button>
                  <button class="llm-btn-small llm-copy-prompt" data-id="${prompt.id}">Copy</button>
                  <button class="llm-btn-small llm-delete-prompt" data-id="${prompt.id}">Delete</button>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    this.setupModalEvents(modal, prompts);
  }

  setupModalEvents(modal, prompts) {
    const closeBtn = modal.querySelector('.llm-close-btn');
    const searchInput = modal.querySelector('#llm-search-input');

    closeBtn.addEventListener('click', () => modal.remove());
    
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });

    searchInput.addEventListener('input', (e) => {
      this.filterPrompts(e.target.value, prompts);
    });

    modal.addEventListener('click', async (e) => {
      const promptId = e.target.dataset.id;
      if (!promptId) return;

      const prompt = prompts.find(p => p.id == promptId);
      if (!prompt) return;

      if (e.target.classList.contains('llm-load-prompt')) {
        this.setPrompt(prompt.content);
        modal.remove();
        this.showNotification('Prompt loaded!', 'success');
      } else if (e.target.classList.contains('llm-copy-prompt')) {
        await navigator.clipboard.writeText(prompt.content);
        this.showNotification('Prompt copied!', 'success');
      } else if (e.target.classList.contains('llm-delete-prompt')) {
        if (confirm('Delete this prompt?')) {
          await this.deletePrompt(promptId);
          modal.remove();
          this.showNotification('Prompt deleted!', 'info');
        }
      }
    });
  }

  filterPrompts(searchTerm, prompts) {
    const filteredPrompts = prompts.filter(prompt => 
      prompt.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prompt.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (prompt.tags && prompt.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())))
    );

    const promptList = document.querySelector('.llm-prompt-list');
    promptList.innerHTML = filteredPrompts.map(prompt => `
      <div class="llm-prompt-item" data-id="${prompt.id}">
        <div class="llm-prompt-title">${prompt.title}</div>
        <div class="llm-prompt-meta">${this.formatDate(prompt.createdAt)} - ${prompt.site}</div>
        ${prompt.tags && prompt.tags.length > 0 ? `<div class="llm-prompt-tags">${prompt.tags.map(tag => `<span class="llm-tag">${tag}</span>`).join('')}</div>` : ''}
        <div class="llm-prompt-actions">
          <button class="llm-btn-small llm-load-prompt" data-id="${prompt.id}">Load</button>
          <button class="llm-btn-small llm-copy-prompt" data-id="${prompt.id}">Copy</button>
          <button class="llm-btn-small llm-delete-prompt" data-id="${prompt.id}">Delete</button>
        </div>
      </div>
    `).join('');
  }

  async deletePrompt(promptId) {
    const prompts = await this.getStoredPrompts();
    const filtered = prompts.filter(p => p.id != promptId);
    await chrome.storage.local.set({ 'llm-prompts': filtered });
  }

  async improvePrompt() {
    const currentPrompt = this.getCurrentPrompt();
    if (!currentPrompt.trim()) {
      alert('Enter a prompt to improve first!');
      return;
    }

    this.showNotification('Improving prompt...', 'info');

    try {
      if (this.aiIntegration) {
        const improvedPrompt = await this.aiIntegration.improvePrompt(currentPrompt);
        this.setPrompt(improvedPrompt);
        this.showNotification('Prompt improved successfully!', 'success');
        return;
      }
    } catch (error) {
      console.error('Error improving prompt with AI:', error);
    }

    // Fallback suggestions
    const improvements = [
      "Be more specific with details",
      "Add necessary context",
      "Specify desired output format",
      "Include examples if helpful",
      "Define tone and style",
      "Add constraints or limitations"
    ];

    const suggestion = improvements[Math.floor(Math.random() * improvements.length)];
    const improvedPrompt = `${currentPrompt}\n\n[Tip: ${suggestion}]`;
    this.setPrompt(improvedPrompt);

    this.showNotification('Used basic suggestion (AI unavailable)', 'info');
  }

  setupMessageListeners() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.action === 'getPrompts') {
        this.getStoredPrompts().then(sendResponse);
        return true;
      } else if (message.action === 'showPromptSelector') {
        this.showPromptSelector();
        return true;
      }
    });
  }

  formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US') + ' ' + date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }

  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `llm-notification llm-notification-${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.classList.add('llm-notification-show');
    }, 100);
    
    setTimeout(() => {
      notification.classList.remove('llm-notification-show');
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new LLMPromptManager());
} else {
  new LLMPromptManager();
}