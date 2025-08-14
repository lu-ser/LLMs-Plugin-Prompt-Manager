class PromptsManager {
  constructor() {
    this.prompts = [];
    this.filteredPrompts = [];
    this.currentFilter = 'all';
    this.searchQuery = '';
    this.init();
  }

  async init() {
    await this.loadPrompts();
    this.setupEventListeners();
    this.renderPrompts();
    this.updateStats();
  }

  async loadPrompts() {
    const result = await chrome.storage.local.get(['llm-prompts']);
    this.prompts = result['llm-prompts'] || [];
    this.filteredPrompts = [...this.prompts];
  }

  setupEventListeners() {
    // Search
    document.getElementById('search-input').addEventListener('input', (e) => {
      this.searchQuery = e.target.value.toLowerCase();
      this.applyFilters();
    });

    // Filters
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        this.currentFilter = e.target.dataset.filter;
        this.applyFilters();
      });
    });

    // Toolbar actions
    document.getElementById('export-btn').addEventListener('click', () => this.exportPrompts());
    document.getElementById('import-btn').addEventListener('click', () => document.getElementById('import-file').click());
    document.getElementById('import-file').addEventListener('change', (e) => this.importPrompts(e.target.files[0]));
    document.getElementById('settings-btn').addEventListener('click', () => this.openSettings());

    // Prompt actions (event delegation)
    document.getElementById('prompts-grid').addEventListener('click', (e) => {
      const promptId = e.target.closest('.prompt-card')?.dataset.promptId;
      if (!promptId) return;

      if (e.target.classList.contains('btn-copy')) {
        this.copyPrompt(promptId);
      } else if (e.target.classList.contains('btn-delete')) {
        this.deletePrompt(promptId);
      } else if (e.target.closest('.prompt-card')) {
        this.selectPrompt(promptId);
      }
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Delete' && this.selectedPrompt) {
        this.deletePrompt(this.selectedPrompt);
      } else if (e.ctrlKey && e.key === 'c' && this.selectedPrompt) {
        this.copyPrompt(this.selectedPrompt);
      }
    });
  }

  applyFilters() {
    this.filteredPrompts = this.prompts.filter(prompt => {
      // Site filter
      const siteMatch = this.currentFilter === 'all' || 
                       this.currentFilter === prompt.site ||
                       (this.currentFilter === 'other' && !['chatgpt', 'claude', 'mistral', 'gemini', 'copilot'].includes(prompt.site));

      // Search filter
      const searchMatch = !this.searchQuery || 
                         prompt.title.toLowerCase().includes(this.searchQuery) ||
                         prompt.content.toLowerCase().includes(this.searchQuery);

      return siteMatch && searchMatch;
    });

    this.renderPrompts();
    this.updateStats();
  }

  renderPrompts() {
    const grid = document.getElementById('prompts-grid');
    const emptyState = document.getElementById('empty-state');

    if (this.filteredPrompts.length === 0) {
      grid.style.display = 'none';
      emptyState.style.display = 'block';
      return;
    }

    grid.style.display = 'grid';
    emptyState.style.display = 'none';

    grid.innerHTML = this.filteredPrompts.map(prompt => `
      <div class="prompt-card" data-prompt-id="${prompt.id}">
        <div class="prompt-header">
          <div class="prompt-title">${this.escapeHtml(prompt.title)}</div>
          <div class="prompt-meta">
            <span class="site-badge">${this.formatSiteName(prompt.site)}</span>
            <span>${this.formatDate(prompt.createdAt)}</span>
          </div>
        </div>
        <div class="prompt-content">${this.escapeHtml(prompt.content)}</div>
        <div class="prompt-actions">
          <button class="btn btn-small btn-copy">📋 Copy</button>
          <button class="btn btn-small btn-delete">🗑️ Delete</button>
        </div>
      </div>
    `).join('');
  }

  updateStats() {
    const count = this.filteredPrompts.length;
    const total = this.prompts.length;
    
    document.getElementById('prompts-count').textContent = `${total} prompt${total !== 1 ? 's' : ''}`;
    
    let filterInfo = 'Showing all prompts';
    if (this.currentFilter !== 'all') {
      filterInfo = `Showing ${count} ${this.currentFilter} prompt${count !== 1 ? 's' : ''}`;
    } else if (this.searchQuery) {
      filterInfo = `Showing ${count} search result${count !== 1 ? 's' : ''}`;
    }
    
    document.getElementById('filter-info').textContent = filterInfo;
  }

  selectPrompt(promptId) {
    // Remove previous selection
    document.querySelectorAll('.prompt-card').forEach(card => {
      card.classList.remove('selected');
    });
    
    // Select new prompt
    const card = document.querySelector(`[data-prompt-id="${promptId}"]`);
    if (card) {
      card.classList.add('selected');
      this.selectedPrompt = promptId;
    }
  }

  async copyPrompt(promptId) {
    const prompt = this.prompts.find(p => p.id == promptId);
    if (!prompt) return;

    try {
      await navigator.clipboard.writeText(prompt.content);
      this.showNotification('Prompt copied to clipboard!', 'success');
    } catch (error) {
      this.showNotification('Failed to copy prompt', 'error');
    }
  }

  async deletePrompt(promptId) {
    if (!confirm('Are you sure you want to delete this prompt?')) return;

    this.prompts = this.prompts.filter(p => p.id != promptId);
    await chrome.storage.local.set({ 'llm-prompts': this.prompts });
    
    this.applyFilters();
    this.showNotification('Prompt deleted', 'info');
  }

  async exportPrompts() {
    const exportData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      prompts: this.prompts
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `llm-prompts-${new Date().toISOString().split('T')[0]}.json`;
    a.click();

    URL.revokeObjectURL(url);
    this.showNotification('Prompts exported successfully!', 'success');
  }

  async importPrompts(file) {
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (!data.prompts || !Array.isArray(data.prompts)) {
        throw new Error('Invalid file format');
      }

      const newPrompts = data.prompts.map(p => ({
        ...p,
        id: Date.now() + Math.random(),
        imported: true
      }));

      this.prompts = [...newPrompts, ...this.prompts];
      await chrome.storage.local.set({ 'llm-prompts': this.prompts });

      this.applyFilters();
      this.showNotification(`Imported ${newPrompts.length} prompts!`, 'success');

    } catch (error) {
      this.showNotification('Error importing file: Invalid format', 'error');
    }

    // Reset file input
    document.getElementById('import-file').value = '';
  }

  openSettings() {
    chrome.tabs.create({ url: chrome.runtime.getURL('settings.html') });
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
    return siteNames[site] || site.charAt(0).toUpperCase() + site.slice(1);
  }

  formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays} days ago`;

    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
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
  new PromptsManager();
});