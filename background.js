chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    chrome.storage.local.set({
      'llm-prompts': [],
      'llm-settings': {
        autoSave: false,
        showNotifications: true,
        theme: 'light',
        defaultTags: []
      }
    });
    
    chrome.tabs.create({ url: chrome.runtime.getURL('welcome.html') });
  }
});

chrome.action.onClicked.addListener(async (tab) => {
  const llmSites = [
    'chat.openai.com',
    'claude.ai',
    'chat.mistral.ai',
    'gemini.google.com',
    'copilot.microsoft.com'
  ];
  
  const isLLMSite = llmSites.some(site => tab.url.includes(site));
  
  if (isLLMSite) {
    try {
      await chrome.tabs.sendMessage(tab.id, { action: 'showPromptSelector' });
    } catch (error) {
      console.log('Content script not loaded yet');
    }
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'getPrompts') {
    chrome.storage.local.get(['llm-prompts']).then(result => {
      sendResponse(result['llm-prompts'] || []);
    });
    return true;
  }
  
  if (message.action === 'savePrompt') {
    chrome.storage.local.get(['llm-prompts']).then(result => {
      const prompts = result['llm-prompts'] || [];
      prompts.unshift(message.prompt);
      chrome.storage.local.set({ 'llm-prompts': prompts }).then(() => {
        sendResponse({ success: true });
      });
    });
    return true;
  }
  
  if (message.action === 'deletePrompt') {
    chrome.storage.local.get(['llm-prompts']).then(result => {
      const prompts = result['llm-prompts'] || [];
      const filtered = prompts.filter(p => p.id !== message.promptId);
      chrome.storage.local.set({ 'llm-prompts': filtered }).then(() => {
        sendResponse({ success: true });
      });
    });
    return true;
  }
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'save-selection') {
    const selectedText = info.selectionText;
    if (selectedText && selectedText.length > 10) {
      const prompt = {
        id: Date.now(),
        title: selectedText.substring(0, 50) + (selectedText.length > 50 ? '...' : ''),
        content: selectedText,
        site: 'context-menu',
        createdAt: new Date().toISOString(),
        tags: ['selected-text']
      };
      
      chrome.storage.local.get(['llm-prompts']).then(result => {
        const prompts = result['llm-prompts'] || [];
        prompts.unshift(prompt);
        chrome.storage.local.set({ 'llm-prompts': prompts });

        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icons/icon48.png',
          title: 'Prompt Saved',
          message: 'Selected text saved as prompt'
        });
      });
    }
  }
});

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'save-selection',
    title: 'Save as prompt',
    contexts: ['selection']
  });
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes['llm-prompts']) {
    chrome.action.setBadgeText({
      text: changes['llm-prompts'].newValue.length.toString()
    });
    chrome.action.setBadgeBackgroundColor({ color: '#4f46e5' });
  }
});

chrome.storage.local.get(['llm-prompts']).then(result => {
  const promptCount = (result['llm-prompts'] || []).length;
  chrome.action.setBadgeText({ text: promptCount.toString() });
  chrome.action.setBadgeBackgroundColor({ color: '#4f46e5' });
});