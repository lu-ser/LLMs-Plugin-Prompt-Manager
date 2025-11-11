// AI models configuration
// Update this file to add new models for each provider

// Prevent redeclaration
if (typeof window !== 'undefined' && window.AI_MODELS) {
  // Already loaded, skip
} else {
  const AI_MODELS = {
  openai: {
    name: "OpenAI",
    models: [
      { id: "gpt-4o", name: "GPT-4 Omni", description: "Most capable model" },
      { id: "gpt-4o-mini", name: "GPT-4 Omni Mini", description: "Fast and efficient" },
      { id: "gpt-4-turbo", name: "GPT-4 Turbo", description: "Latest GPT-4 with improved performance" },
      { id: "gpt-4", name: "GPT-4", description: "High intelligence model" },
      { id: "gpt-3.5-turbo", name: "GPT-3.5 Turbo", description: "Fast and cost-effective" }
    ],
    defaultModel: "gpt-4o-mini"
  },
  
  anthropic: {
    name: "Anthropic",
    models: [
      { id: "claude-3-5-sonnet-20241022", name: "Claude 3.5 Sonnet (New)", description: "Latest and most capable" },
      { id: "claude-3-5-sonnet-20240620", name: "Claude 3.5 Sonnet", description: "High performance model" },
      { id: "claude-3-opus-20240229", name: "Claude 3 Opus", description: "Most powerful model" },
      { id: "claude-3-sonnet-20240229", name: "Claude 3 Sonnet", description: "Balanced performance" },
      { id: "claude-3-haiku-20240307", name: "Claude 3 Haiku", description: "Fast and lightweight" }
    ],
    defaultModel: "claude-3-5-sonnet-20241022"
  },
  
  groq: {
    name: "Groq",
    models: [
      { id: "meta-llama/llama-4-maverick-17b-128e-instruct", name: "Llama 4 Maverick 17B", description: "Latest Llama 4 model with extended context" },
      { id: "meta-llama/llama-4-scout-17b-16e-instruct", name: "Llama 4 Scout 17B", description: "Llama 4 Scout model" },
      { id: "deepseek-r1-distill-llama-70b", name: "Deepseek distill llama 70B", description: "Large versatile model" },
      { id: "openai/gpt-oss-20b", name: "OpenAI model 20B", description: "Fast inference model" },
      { id: "openai/gpt-oss-120bt", name: "OpenAI model 210B", description: "High-capacity model" },
    ],
    defaultModel: "meta-llama/llama-4-maverick-17b-128e-instruct"
  },
  
  google: {
    name: "Google AI",
    models: [
      { id: "gemini-1.5-pro", name: "Gemini 1.5 Pro", description: "Most capable Gemini model" },
      { id: "gemini-1.5-flash", name: "Gemini 1.5 Flash", description: "Fast and efficient" },
      { id: "gemini-1.5-flash-8b", name: "Gemini 1.5 Flash 8B", description: "Lightweight version" },
      { id: "gemini-1.0-pro", name: "Gemini 1.0 Pro", description: "Original Gemini Pro" }
    ],
    defaultModel: "gemini-1.5-flash"
  }
  };

  // Make models available globally
  if (typeof window !== 'undefined') {
    window.AI_MODELS = AI_MODELS;
  }

  // For Node.js environments
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = AI_MODELS;
  }
}