# LLM Prompt Manager

A Chrome extension for saving, managing, and improving prompts on AI platforms.

## Features

- **Quick Save**: Save your favorite prompts with one click
- **Smart Search**: Find saved prompts by title or content
- **Prompt Enhancement**: AI-powered suggestions to improve your prompts
- **Quick Copy**: Copy prompts to clipboard directly from the popup
- **Export/Import**: Sync prompts across different devices
- **Statistics**: View usage stats and most-used prompts

## Supported Sites

- ChatGPT (chat.openai.com)
- Claude (claude.ai)
- Mistral (chat.mistral.ai)
- Gemini (gemini.google.com)
- Microsoft Copilot (copilot.microsoft.com)

## Installation

### From Chrome Web Store (when available)
1. Go to Chrome Web Store
2. Search for "LLM Prompt Manager"
3. Click "Add to Chrome"

### Manual Installation (development)
1. Clone or download this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked"
5. Select the project folder

## How to Use

### On a supported LLM site:
1. Write your prompt in the text box
2. Click the save button to save the prompt
3. Use the load button to retrieve a saved prompt
4. Use the improve button to get enhancement suggestions

### From the extension popup:
1. Click the extension icon in the toolbar
2. View statistics and recent prompts
3. Export or import your prompts
4. Manage all saved prompts

### Context menu:
1. Select text on any webpage
2. Right-click → "Save as prompt"

## Detailed Features

### Prompt Saving
- Auto-save with generated title
- Associated with source site
- Creation timestamp
- Tag system (future)

### Prompt Management
- View complete list
- Search by title or content
- Sort by date or usage frequency
- Selective deletion

### Export/Import
- Standard JSON format
- Cross-device compatibility
- Data backup
- Smart merge during import

## Project Structure

```
Plugin_Prompt/
├── manifest.json          # Extension configuration
├── content.js             # Page interaction scripts
├── background.js          # Service worker for event handling
├── popup.html/css/js      # Extension popup interface
├── styles.css             # Content script styles
├── welcome.html           # Welcome page
├── icons/                 # Extension icons
└── README.md             # Documentation
```

## Development

### Prerequisites
- Google Chrome
- Code editor

### Local Setup
1. Clone the repository
2. Open Chrome and enable developer mode
3. Load unpacked extension
4. Code changes require extension reload

### Testing
- Test on all supported sites
- Verify prompt save/load
- Check export/import
- Validate responsive interface

## Privacy & Security

- **Local storage**: All prompts are saved locally in your browser
- **No servers**: No data sent to external servers
- **Minimal permissions**: Extension only requests necessary permissions
- **Open source**: Fully inspectable code

## Roadmap

### Version 1.1
- [ ] Tag system for prompts
- [ ] Customizable categories
- [ ] Pre-built prompt templates
- [ ] Advanced statistics

### Version 1.2
- [ ] Optional cloud sync
- [ ] Share prompts between users
- [ ] Google Drive integration
- [ ] Automatic backup

### Version 2.0
- [ ] AI-powered prompt improvement
- [ ] Smart templates
- [ ] Prompt performance analysis
- [ ] External API integrations

## Contributing

Contributions are welcome! To contribute:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is released under the MIT License. See the `LICENSE` file for details.

## Author

Created for the AI community

## Support

For issues, bugs, or feature requests:
- Open an issue on GitHub
- Contact via email
- Complete documentation available in the wiki

---

**Improve your AI experience, one prompt at a time.**
