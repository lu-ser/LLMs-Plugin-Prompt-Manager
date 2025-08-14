class PopupManager {
  constructor() {
    this.init();
  }

  async init() {
    await this.loadStats();
    await this.loadRecentPrompts();
    this.setupEventListeners();
  }

  async loadStats() {
    const prompts = await this.getStoredPrompts();
    
    document.getElementById('prompt-count').textContent = `${prompts.length} prompt salvati`;
    document.getElementById('total-prompts').textContent = prompts.length;
    
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const thisWeekCount = prompts.filter(p => new Date(p.createdAt) > oneWeekAgo).length;
    document.getElementById('this-week').textContent = thisWeekCount;
    
    const siteCounts = {};
    prompts.forEach(p => {
      siteCounts[p.site] = (siteCounts[p.site] || 0) + 1;
    });
    
    const favoriteSite = Object.keys(siteCounts).reduce((a, b) => 
      siteCounts[a] > siteCounts[b] ? a : b, Object.keys(siteCounts)[0] || '-'
    );
    
    document.getElementById('favorite-site').textContent = this.formatSiteName(favoriteSite);
  }

  async loadRecentPrompts() {
    const prompts = await this.getStoredPrompts();
    const recentPrompts = prompts.slice(0, 3);
    
    const container = document.getElementById('recent-prompts');
    
    if (recentPrompts.length === 0) {
      container.innerHTML = '<div class="no-prompts">Nessun prompt salvato</div>';
      return;
    }
    
    container.innerHTML = recentPrompts.map(prompt => `
      <div class="prompt-item" data-id="${prompt.id}">
        <div class="prompt-title">${prompt.title}</div>
        <div class="prompt-meta">${this.formatDate(prompt.createdAt)} - ${this.formatSiteName(prompt.site)}</div>
      </div>
    `).join('');
    
    container.querySelectorAll('.prompt-item').forEach(item => {
      item.addEventListener('click', async () => {
        const promptId = item.dataset.id;
        const prompt = prompts.find(p => p.id == promptId);
        if (prompt) {
          await navigator.clipboard.writeText(prompt.content);
          this.showNotification('Prompt copiato negli appunti!');
        }
      });
    });
  }

  setupEventListeners() {
    document.getElementById('view-prompts').addEventListener('click', () => {
      this.openPromptsManager();
    });
    
    document.getElementById('export-prompts').addEventListener('click', () => {
      this.exportPrompts();
    });
    
    document.getElementById('import-prompts').addEventListener('click', () => {
      document.getElementById('import-file').click();
    });
    
    document.getElementById('import-file').addEventListener('change', (e) => {
      this.importPrompts(e.target.files[0]);
    });
    
    document.getElementById('settings-btn').addEventListener('click', () => {
      this.openSettings();
    });
    
    document.getElementById('help-btn').addEventListener('click', () => {
      this.openHelp();
    });
  }

  async openPromptsManager() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    const llmSites = [
      'chat.openai.com',
      'claude.ai',
      'chat.mistral.ai',
      'gemini.google.com',
      'copilot.microsoft.com',
      'poe.com',
      'perplexity.ai'
    ];
    
    const isLLMSite = llmSites.some(site => tab.url.includes(site));
    
    if (isLLMSite) {
      await chrome.tabs.sendMessage(tab.id, { action: 'showPromptSelector' });
      window.close();
    } else {
      chrome.tabs.create({ url: chrome.runtime.getURL('prompts.html') });
    }
  }

  async exportPrompts() {
    const prompts = await this.getStoredPrompts();
    
    const exportData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      prompts: prompts
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `llm-prompts-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
    this.showNotification('Prompt esportati con successo!');
  }

  async importPrompts(file) {
    if (!file) return;
    
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      if (!data.prompts || !Array.isArray(data.prompts)) {
        throw new Error('Formato file non valido');
      }
      
      const existingPrompts = await this.getStoredPrompts();
      const newPrompts = data.prompts.map(p => ({
        ...p,
        id: Date.now() + Math.random(),
        imported: true
      }));
      
      const mergedPrompts = [...newPrompts, ...existingPrompts];
      await chrome.storage.local.set({ 'llm-prompts': mergedPrompts });
      
      await this.loadStats();
      await this.loadRecentPrompts();
      
      this.showNotification(`Importati ${newPrompts.length} prompt!`);
    } catch (error) {
      this.showNotification('Errore durante l\'importazione', 'error');
    }
  }

  openSettings() {
    chrome.tabs.create({ url: chrome.runtime.getURL('settings.html') });
  }

  openHelp() {
    chrome.tabs.create({ url: chrome.runtime.getURL('help.html') });
  }

  async getStoredPrompts() {
    const result = await chrome.storage.local.get(['llm-prompts']);
    return result['llm-prompts'] || [];
  }

  formatSiteName(site) {
    const siteNames = {
      'chatgpt': 'ChatGPT',
      'claude': 'Claude',
      'mistral': 'Mistral',
      'gemini': 'Gemini',
      'copilot': 'Copilot',
      'poe': 'Poe',
      'perplexity': 'Perplexity'
    };
    return siteNames[site] || site;
  }

  formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Oggi';
    if (diffDays === 2) return 'Ieri';
    if (diffDays <= 7) return `${diffDays} giorni fa`;
    
    return date.toLocaleDateString('it-IT');
  }

  showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      background: ${type === 'error' ? '#dc2626' : '#059669'};
      color: white;
      padding: 12px 16px;
      border-radius: 6px;
      font-size: 14px;
      z-index: 1000;
      animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new PopupManager();
});

const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  
  @keyframes slideOut {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(100%); opacity: 0; }
  }
`;
document.head.appendChild(style);