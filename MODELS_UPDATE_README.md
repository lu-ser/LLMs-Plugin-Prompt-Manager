# Models Configuration Update Guide

## How to update AI models

To add new models or update existing ones, follow these steps:

### 1. Edit the `models-config.js` file

This file contains the configuration for all available models for each AI provider:

```javascript
const AI_MODELS = {
  openai: {
    name: "OpenAI",
    models: [
      { id: "gpt-4o", name: "GPT-4 Omni", description: "Most capable model" },
      // Add new OpenAI models here
    ],
    defaultModel: "gpt-4o-mini"
  },

  groq: {
    name: "Groq",
    models: [
      { id: "meta-llama/llama-4-maverick-17b-128e-instruct", name: "Llama 4 Maverick 17B", description: "Latest Llama 4 model" },
      // Add new Groq models here
    ],
    defaultModel: "llama-3.1-8b-instant"
  },
  // ...other providers
};
```

### 2. Format for adding new models

For each model, use this format:

```javascript
{
  id: "model-id-exactly-as-api-expects",
  name: "Display Name for Users",
  description: "Brief description of the model capabilities"
}
```

### 3. Examples of new Groq models to add

```javascript
// New Groq models (add these to the groq.models section)
{ id: "meta-llama/llama-4-maverick-17b-128e-instruct", name: "Llama 4 Maverick 17B", description: "Latest Llama 4 with extended context" },
{ id: "meta-llama/llama-4-scout-17b-16e-instruct", name: "Llama 4 Scout 17B", description: "Llama 4 Scout model" },
{ id: "openai/gpt-oss-20b", name: "GPT OSS 20B", description: "Open source GPT model" },
```

### 4. Auto-refresh in settings

After modifying the file:

1. Go to the plugin **Settings**
2. Find the **AI Models Configuration** section
3. Click the **🔄 Refresh Models** button
4. New models will be immediately available

### 5. Structure for new providers

To add a completely new AI provider:

```javascript
new_provider: {
  name: "Provider Name",
  models: [
    { id: "model-1", name: "Model 1", description: "Description" },
    { id: "model-2", name: "Model 2", description: "Description" }
  ],
  defaultModel: "model-1"
}
```

⚠️ **Note**: When adding a new provider, you'll also need to update the code in `ai-integration.js` to support the API calls for the new provider.

### 6. Best Practices

- **Accurate IDs**: Use the exact ID required by the provider's API
- **Descriptive names**: Use names that users can easily understand
- **Useful descriptions**: Add a brief description of the model's capabilities
- **Default model**: Choose a balanced model as default (not the most expensive one)

### 7. Testing changes

After updating models:

1. Reload the extension in Chrome
2. Test prompt improvement with the new models
3. Verify that keyword generation works
4. Check for any errors in the console

---

📝 **Quick update**: Just edit `models-config.js` → Refresh in settings → Done!