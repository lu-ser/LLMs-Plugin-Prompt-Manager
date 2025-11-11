class SettingsManager {
  constructor() {
    this.defaultSettings = {
      autoSave: false,
      showNotifications: true,
      buttonTooltips: true,
      maxPrompts: 500,
      defaultTags: [],
      customSites: [],
      apiKeys: {
        openai: '',
        anthropic: '',
        groq: '',
        google: ''
      },
      preferredAiService: 'openai',
      selectedModels: {
        openai: 'gpt-4o-mini',
        anthropic: 'claude-3-5-sonnet-20241022',
        groq: 'llama-3.1-8b-instant',
        google: 'gemini-1.5-flash'
      }
    };
    
    this.defaultSites = [
      { name: 'ChatGPT', url: 'https://chat.openai.com/*', enabled: true, removable: false },
      { name: 'Claude', url: 'https://claude.ai/*', enabled: true, removable: false },
      { name: 'Mistral', url: 'https://chat.mistral.ai/*', enabled: true, removable: false },
      { name: 'Gemini', url: 'https://gemini.google.com/*', enabled: true, removable: false },
      { name: 'Copilot', url: 'https://copilot.microsoft.com/*', enabled: true, removable: false }
    ];
    
    this.init();
  }

  async init() {
    await this.loadSettings();
    await this.loadStats();
    this.renderSites();
    this.renderModels();
    this.setupEventListeners();
  }

  async loadSettings() {
    const result = await chrome.storage.local.get(['llm-settings']);
    this.settings = { ...this.defaultSettings, ...(result['llm-settings'] || {}) };
    this.populateForm();
  }

  populateForm() {
    document.getElementById('auto-save').checked = this.settings.autoSave;
    document.getElementById('show-notifications').checked = this.settings.showNotifications;
    document.getElementById('button-tooltips').checked = this.settings.buttonTooltips;
    document.getElementById('max-prompts').value = this.settings.maxPrompts;
    document.getElementById('default-tags').value = this.settings.defaultTags.join(', ');
    
    // API Keys
    document.getElementById('openai-api-key').value = this.settings.apiKeys?.openai || '';
    document.getElementById('anthropic-api-key').value = this.settings.apiKeys?.anthropic || '';
    document.getElementById('groq-api-key').value = this.settings.apiKeys?.groq || '';
    document.getElementById('google-api-key').value = this.settings.apiKeys?.google || '';
    document.getElementById('preferred-ai-service').value = this.settings.preferredAiService || 'openai';
    
    // Populate selected models
    this.populateSelectedModels();
  }
  
  populateSelectedModels() {
    if (!window.AI_MODELS) return;
    
    Object.keys(window.AI_MODELS).forEach(provider => {
      const select = document.getElementById(`model-${provider}`);
      if (select && this.settings.selectedModels) {
        select.value = this.settings.selectedModels[provider] || window.AI_MODELS[provider].defaultModel;
      }
    });
  }
  
  renderModels() {
    if (!window.AI_MODELS) {
      console.warn('AI_MODELS not loaded');
      return;
    }
    
    const container = document.getElementById('models-container');
    if (!container) return;
    
    container.innerHTML = Object.entries(window.AI_MODELS).map(([provider, config]) => `
      <div class="model-provider">
        <h4 class="provider-title">${config.name}</h4>
        <div class="setting-item">
          <label class="setting-label">
            Model:
            <select id="model-${provider}" class="setting-select model-select" data-provider="${provider}">
              ${config.models.map(model => `
                <option value="${model.id}" title="${model.description}">
                  ${model.name}${model.description ? ` - ${model.description}` : ''}
                </option>
              `).join('')}
            </select>
          </label>
          <p class="setting-description">Choose the ${config.name} model for AI tasks</p>
        </div>
      </div>
    `).join('');
    
    // Populate with current selections
    this.populateSelectedModels();
  }

  async loadStats() {
    const result = await chrome.storage.local.get(['llm-prompts']);
    const prompts = result['llm-prompts'] || [];
    
    document.getElementById('total-prompts-stat').textContent = prompts.length;
    
    // Calculate storage size
    const storageSize = new Blob([JSON.stringify(prompts)]).size;
    const sizeKB = Math.round(storageSize / 1024 * 100) / 100;
    document.getElementById('storage-used-stat').textContent = `${sizeKB} KB`;
  }

  renderSites() {
    const sitesList = document.getElementById('sites-list');

    sitesList.innerHTML = this.defaultSites.map((site) => `
      <div class="site-item">
        <div class="site-info">
          <div class="site-icon">${site.name.charAt(0)}</div>
          <div class="site-details">
            <h4>${site.name}</h4>
            <p>${site.url}</p>
          </div>
        </div>
        <div class="site-controls">
          <span style="color: #059669; font-weight: 500;">✓ Active</span>
        </div>
      </div>
    `).join('');
  }

  setupEventListeners() {
    // Site toggles (disabled - all sites are always enabled)
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('site-toggle')) {
        const index = parseInt(e.target.dataset.index);
        this.toggleSite(index);
      }

      if (e.target.classList.contains('remove-site-btn')) {
        const index = parseInt(e.target.dataset.index);
        this.removeSite(index);
      }
    });

    // Data management
    document.getElementById('export-all-btn').addEventListener('click', () => {
      this.exportAllData();
    });
    
    document.getElementById('import-data-btn').addEventListener('click', () => {
      document.getElementById('import-file').click();
    });
    
    document.getElementById('import-file').addEventListener('change', (e) => {
      this.importData(e.target.files[0]);
    });
    
    document.getElementById('clear-all-btn').addEventListener('click', () => {
      this.clearAllData();
    });

    // Settings actions
    document.getElementById('save-settings-btn').addEventListener('click', () => {
      this.saveSettings();
    });
    
    document.getElementById('reset-settings-btn').addEventListener('click', () => {
      this.resetSettings();
    });

    // Help link
    document.getElementById('help-link').addEventListener('click', (e) => {
      e.preventDefault();
      this.openHelp();
    });

    // Refresh models
    document.getElementById('refresh-models-btn').addEventListener('click', () => {
      this.refreshModels();
    });
  }

  toggleSite(index) {
    // Sites cannot be toggled - kept for backward compatibility
  }

  removeSite(index) {
    // Sites cannot be removed - kept for backward compatibility
  }

  async exportAllData() {
    const [prompts, settings] = await Promise.all([
      chrome.storage.local.get(['llm-prompts']),
      chrome.storage.local.get(['llm-settings'])
    ]);
    
    const exportData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      prompts: prompts['llm-prompts'] || [],
      settings: settings['llm-settings'] || {}
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `llm-prompt-manager-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
    this.showNotification('Data exported successfully!', 'success');
  }

  async importData(file) {
    if (!file) return;
    
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      if (data.prompts) {
        await chrome.storage.local.set({ 'llm-prompts': data.prompts });
      }
      
      if (data.settings) {
        await chrome.storage.local.set({ 'llm-settings': data.settings });
        this.settings = { ...this.defaultSettings, ...data.settings };
        this.populateForm();
        this.renderSites();
      }
      
      await this.loadStats();
      this.showNotification('Data imported successfully!', 'success');
      
    } catch (error) {
      this.showNotification('Error importing data: Invalid file format', 'error');
    }
  }

  async clearAllData() {
    if (!confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
      return;
    }
    
    await chrome.storage.local.clear();
    await this.loadStats();
    this.showNotification('All data cleared successfully!', 'success');
  }

  async saveSettings() {
    const formData = {
      autoSave: document.getElementById('auto-save').checked,
      showNotifications: document.getElementById('show-notifications').checked,
      buttonTooltips: document.getElementById('button-tooltips').checked,
      maxPrompts: parseInt(document.getElementById('max-prompts').value),
      defaultTags: document.getElementById('default-tags').value.split(',').map(t => t.trim()).filter(t => t),
      customSites: this.settings.customSites,
      enabledSites: this.getEnabledSites(),
      apiKeys: {
        openai: document.getElementById('openai-api-key').value.trim(),
        anthropic: document.getElementById('anthropic-api-key').value.trim(),
        groq: document.getElementById('groq-api-key').value.trim(),
        google: document.getElementById('google-api-key').value.trim()
      },
      preferredAiService: document.getElementById('preferred-ai-service').value,
      selectedModels: this.getSelectedModels()
    };
    
    await chrome.storage.local.set({ 'llm-settings': formData });
    this.settings = formData;
    
    // Update manifest permissions if needed
    await this.updateSitePermissions();
    
    this.showNotification('Settings saved successfully!', 'success');
  }

  getEnabledSites() {
    const allSites = [...this.defaultSites, ...this.settings.customSites];
    return allSites.filter(site => site.enabled).map(site => ({
      name: site.name,
      url: site.url
    }));
  }
  
  getSelectedModels() {
    const selectedModels = {};
    if (!window.AI_MODELS) return selectedModels;
    
    Object.keys(window.AI_MODELS).forEach(provider => {
      const select = document.getElementById(`model-${provider}`);
      if (select) {
        selectedModels[provider] = select.value;
      } else {
        selectedModels[provider] = window.AI_MODELS[provider].defaultModel;
      }
    });
    
    return selectedModels;
  }

  async updateSitePermissions() {
    // Note: In Manifest V3, we can't dynamically add permissions
    // This would require the user to reload the extension
    // For now, we'll just store the enabled sites in settings
  }

  async resetSettings() {
    if (!confirm('Are you sure you want to reset all settings to defaults?')) {
      return;
    }
    
    this.settings = { ...this.defaultSettings };
    this.defaultSites.forEach(site => site.enabled = true);
    
    await chrome.storage.local.set({ 'llm-settings': this.settings });
    this.populateForm();
    this.renderSites();
    
    this.showNotification('Settings reset to defaults!', 'success');
  }

  openHelp() {
    chrome.tabs.create({ url: chrome.runtime.getURL('help.html') });
  }

  refreshModels() {
    // Force reload of models configuration
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL('models-config.js') + '?t=' + Date.now(); // Cache busting
    
    // Remove old script
    const existingScript = document.querySelector('script[src*="models-config.js"]');
    if (existingScript) {
      existingScript.remove();
    }
    
    script.onload = () => {
      this.renderModels();
      this.showNotification('Models refreshed successfully!', 'success');
    };
    
    script.onerror = () => {
      this.showNotification('Failed to refresh models', 'error');
    };
    
    document.head.appendChild(script);
  }

  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${type === 'error' ? '#dc2626' : type === 'success' ? '#059669' : '#4f46e5'};
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      z-index: 10000;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
      transform: translateX(100%);
      transition: transform 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    // Slide in
    setTimeout(() => {
      notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Remove after delay
    setTimeout(() => {
      notification.style.transform = 'translateX(100%)';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new SettingsManager();
});