# ITForce Helper

A powerful VS Code extension that enhances development workflow with AI assistance and code quality tools.

## Key Features

🤖 **AI-Powered Development**
- Code generation using DeepSeek AI
- Smart development planning and suggestions
- Multi-AI provider support (DeepSeek, OpenAI coming soon)

🛠️ **Code Quality**
- Real-time code validation
- Automatic ESLint integration
- TypeScript type checking
- Intelligent code fixes

🔄 **Version Management**
- Smart code checkpoint system
- Quick checkpoint creation/restoration
- Safe version control operations

🔒 **Security**
- Secure API key management
- Whitelisted command execution
- Protected operation modes

## Installation

1. Install from VS Code Marketplace or download `.vsix` file
2. Install dependencies:
```bash
npm install
```

3. Configure DeepSeek API:
   - Open VS Code settings (`Ctrl+,` or `Cmd+,`)
   - Search for "ITForce"
   - Add your DeepSeek API key
   - Optional: Set custom API URL

## Usage

### Available Commands
- `ITForce: Generate Code` - AI-powered code generation
- `ITForce: Hello World` - Test extension setup

### Settings
- `itforceHelper.deepseekApiKey`: Your DeepSeek API key
- `itforceHelper.deepseekApiUrl`: Custom API URL (default: https://api.deepseek.com/v1/chat/completions)
- `itforceHelper.autoValidate`: Toggle automatic code validation

## Development

### Prerequisites
- VS Code ^1.98.0
- Node.js
- npm

### Setup
1. Clone repository
2. Install recommended extensions:
   - ESLint
   - Extension Test Runner
   - esbuild Problem Matchers
3. Install dependencies:
```bash
npm install
```

### Development Commands
```bash
npm run watch     # Start development mode
npm run compile   # Build extension
npm test         # Run tests
npm run lint     # Run linter
```

### Project Structure
```
src/
├── extension.ts     # Extension entry point
├── agents/         # AI and planning logic
├── validation/     # Code validation
├── commands/       # Command implementations
├── modals/         # AI service adapters
└── test/          # Test files
```

### Testing
```bash
npm test           # Run all tests
npm test -- --coverage  # Run with coverage
```

### Building
```bash
npm run package    # Create VSIX package
```

## Contributing

1. Fork repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Submit pull request

## Version History

### 0.0.1
- Initial release
- DeepSeek AI integration
- Code generation
- Linting support
- Version control features

## License

[Add your license here]

---

**Made with ❤️ by ITForce Team**


