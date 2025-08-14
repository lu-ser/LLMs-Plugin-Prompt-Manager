class SettingsManager {
  constructor() {
    this.defaultSettings = {
      autoSave: false,
      showNotifications: true,
      buttonTooltips: true,
      maxPrompts: 500,
      defaultTags: [],
      customSites: []
    };
    
    this.defaultSites = [
      { name: 'ChatGPT', url: 'https://chat.openai.com/*', enabled: true, removable: false },
      { name: 'Claude', url: 'https://claude.ai/*', enabled: true, removable: false },
      { name: 'Mistral', url: 'https://chat.mistral.ai/*', enabled: true, removable: false },
      { name: 'Gemini', url: 'https://gemini.google.com/*', enabled: true, removable: false },
      { name: 'Copilot', url: 'https://copilot.microsoft.com/*', enabled: true, removable: false },
      { name: 'Poe', url: 'https://poe.com/*', enabled: true, removable: false },
      { name: 'Perplexity', url: 'https://perplexity.ai/*', enabled: true, removable: false }
    ];
    
    this.init();
  }

  async init() {
    await this.loadSettings();
    await this.loadStats();
    this.renderSites();
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
    const allSites = [...this.defaultSites, ...this.settings.customSites];
    
    sitesList.innerHTML = allSites.map((site, index) => `
      <div class="site-item">
        <div class="site-info">
          <div class="site-icon">${site.name.charAt(0)}</div>
          <div class="site-details">
            <h4>${site.name}</h4>
            <p>${site.url}</p>
          </div>
        </div>
        <div class="site-controls">
          <div class="site-toggle ${site.enabled ? 'active' : ''}" data-index="${index}"></div>
          ${site.removable !== false ? `<button class="remove-site-btn" data-index="${index}">Remove</button>` : ''}
        </div>
      </div>
    `).join('');
  }

  setupEventListeners() {
    // Site toggles
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

    // Add site
    document.getElementById('add-site-btn').addEventListener('click', () => {
      this.addCustomSite();
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
  }

  toggleSite(index) {
    if (index < this.defaultSites.length) {
      this.defaultSites[index].enabled = !this.defaultSites[index].enabled;
    } else {
      const customIndex = index - this.defaultSites.length;
      this.settings.customSites[customIndex].enabled = !this.settings.customSites[customIndex].enabled;
    }
    this.renderSites();
  }

  removeSite(index) {
    if (index >= this.defaultSites.length) {
      const customIndex = index - this.defaultSites.length;
      this.settings.customSites.splice(customIndex, 1);
      this.renderSites();
    }
  }

  addCustomSite() {
    const url = document.getElementById('site-url').value.trim();
    const name = document.getElementById('site-name').value.trim();
    
    if (!url || !name) {
      this.showNotification('Please enter both URL and name', 'error');
      return;
    }
    
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      this.showNotification('URL must start with http:// or https://', 'error');
      return;
    }
    
    const newSite = {
      name: name,
      url: url.endsWith('/*') ? url : url + '/*',
      enabled: true,
      removable: true
    };
    
    this.settings.customSites.push(newSite);
    this.renderSites();
    
    // Clear form
    document.getElementById('site-url').value = '';
    document.getElementById('site-name').value = '';
    
    this.showNotification('Custom site added successfully!', 'success');
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
      enabledSites: this.getEnabledSites()
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