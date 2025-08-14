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
      'copilot.microsoft.com': 'copilot',
      'poe.com': 'poe',
      'perplexity.ai': 'perplexity'
    };
    return siteMap[hostname] || 'unknown';
  }

  getSiteSelectors() {
    const selectors = {
      chatgpt: {
        input: '#prompt-textarea, textarea[data-id="root"], div[contenteditable="true"][data-testid="message-input"], textarea[placeholder*="Message"]',
        sendButton: '[data-testid="send-button"], button[aria-label*="Send"], button[type="submit"]',
        messages: '[data-testid="conversation-turn"], .group'
      },
      claude: {
        input: '.ProseMirror, div[contenteditable="true"], textarea[placeholder*="Talk"], .composer textarea',
        sendButton: 'button[aria-label*="Send"], button[type="submit"], .send-button',
        messages: '.font-user-message, [data-testid="message"]'
      },
      mistral: {
        input: 'textarea[placeholder*="message"], textarea[placeholder*="question"], div[contenteditable="true"]',
        sendButton: 'button[type="submit"], button[aria-label*="Send"], .send-button',
        messages: '.message, .chat-message'
      },
      gemini: {
        input: '.ql-editor, textarea[placeholder*="Enter"], div[contenteditable="true"], textarea[aria-label*="message"]',
        sendButton: 'button[aria-label*="Send"], button[type="submit"], .send-button',
        messages: '.conversation-container, .message-content'
      },
      copilot: {
        input: '#userInput, textarea[placeholder*="Ask"], div[contenteditable="true"], .composer-input',
        sendButton: '[aria-label*="Submit"], button[type="submit"], .send-button',
        messages: '.message, .response-message'
      },
      poe: {
        input: 'textarea[placeholder*="message"], div[contenteditable="true"], .ChatMessageInput',
        sendButton: 'button[class*="send"], button[type="submit"], .SendButton',
        messages: '.Message, .ChatMessage'
      },
      perplexity: {
        input: 'textarea[placeholder*="Ask"], div[contenteditable="true"], .search-input',
        sendButton: 'button[aria-label*="Submit"], button[type="submit"], .search-button',
        messages: '.prose, .answer-content'
      }
    };
    return selectors[this.currentSite] || {
      input: 'textarea, div[contenteditable="true"], input[type="text"]',
      sendButton: 'button[type="submit"], button[aria-label*="Send"], .send-button',
      messages: '.message, .chat-message, .response'
    };
  }

  init() {
    this.addPromptSaveButton();
    this.observeInputChanges();
    this.setupMessageListeners();
  }

  addPromptSaveButton() {
    if (document.getElementById('llm-prompt-save-btn')) return;

    const inputElement = document.querySelector(this.selectors.input);
    if (!inputElement) {
      setTimeout(() => this.addPromptSaveButton(), 2000);
      return;
    }

    // Find the best container for buttons
    let container = inputElement.closest('form') || 
                   inputElement.closest('div[class*="input"]') || 
                   inputElement.closest('div[class*="composer"]') || 
                   inputElement.closest('div[class*="chat"]') ||
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
      container.style.position = 'relative';
      container.appendChild(buttonContainer);
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
      alert('Nessun prompt da salvare!');
      return;
    }

    const title = prompt.substring(0, 50) + (prompt.length > 50 ? '...' : '');
    const savedPrompt = {
      id: Date.now(),
      title: title,
      content: prompt,
      site: this.currentSite,
      createdAt: new Date().toISOString(),
      tags: []
    };

    const prompts = await this.getStoredPrompts();
    prompts.unshift(savedPrompt);
    
    await chrome.storage.local.set({ 'llm-prompts': prompts });
    
    this.showNotification('Prompt salvato!', 'success');
  }

  async getStoredPrompts() {
    const result = await chrome.storage.local.get(['llm-prompts']);
    return result['llm-prompts'] || [];
  }

  async showPromptSelector() {
    const prompts = await this.getStoredPrompts();
    if (prompts.length === 0) {
      alert('Nessun prompt salvato!');
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
          <h3>Seleziona Prompt</h3>
          <button class="llm-close-btn">&times;</button>
        </div>
        <div class="llm-modal-body">
          <input type="text" id="llm-search-input" placeholder="Cerca prompt..." class="llm-search-input">
          <div class="llm-prompt-list">
            ${prompts.map(prompt => `
              <div class="llm-prompt-item" data-id="${prompt.id}">
                <div class="llm-prompt-title">${prompt.title}</div>
                <div class="llm-prompt-meta">${this.formatDate(prompt.createdAt)} - ${prompt.site}</div>
                <div class="llm-prompt-actions">
                  <button class="llm-btn-small llm-load-prompt" data-id="${prompt.id}">Carica</button>
                  <button class="llm-btn-small llm-copy-prompt" data-id="${prompt.id}">Copia</button>
                  <button class="llm-btn-small llm-delete-prompt" data-id="${prompt.id}">Elimina</button>
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
        this.showNotification('Prompt caricato!', 'success');
      } else if (e.target.classList.contains('llm-copy-prompt')) {
        await navigator.clipboard.writeText(prompt.content);
        this.showNotification('Prompt copiato!', 'success');
      } else if (e.target.classList.contains('llm-delete-prompt')) {
        if (confirm('Eliminare questo prompt?')) {
          await this.deletePrompt(promptId);
          modal.remove();
          this.showNotification('Prompt eliminato!', 'info');
        }
      }
    });
  }

  filterPrompts(searchTerm, prompts) {
    const filteredPrompts = prompts.filter(prompt => 
      prompt.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prompt.content.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const promptList = document.querySelector('.llm-prompt-list');
    promptList.innerHTML = filteredPrompts.map(prompt => `
      <div class="llm-prompt-item" data-id="${prompt.id}">
        <div class="llm-prompt-title">${prompt.title}</div>
        <div class="llm-prompt-meta">${this.formatDate(prompt.createdAt)} - ${prompt.site}</div>
        <div class="llm-prompt-actions">
          <button class="llm-btn-small llm-load-prompt" data-id="${prompt.id}">Carica</button>
          <button class="llm-btn-small llm-copy-prompt" data-id="${prompt.id}">Copia</button>
          <button class="llm-btn-small llm-delete-prompt" data-id="${prompt.id}">Elimina</button>
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
      alert('Inserisci prima un prompt da migliorare!');
      return;
    }

    const improvements = [
      "Sii più specifico nei dettagli richiesti",
      "Aggiungi il contesto necessario",
      "Specifica il formato di output desiderato",
      "Includi esempi se necessario",
      "Definisci il tono e lo stile",
      "Aggiungi vincoli o limitazioni"
    ];

    const suggestion = improvements[Math.floor(Math.random() * improvements.length)];
    
    const improvedPrompt = `${currentPrompt}\n\n[Suggerimento: ${suggestion}]`;
    this.setPrompt(improvedPrompt);
    
    this.showNotification('Prompt migliorato con suggerimento!', 'info');
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
    return date.toLocaleDateString('it-IT') + ' ' + date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
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