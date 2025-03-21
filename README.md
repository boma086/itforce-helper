# ITForce Helper

VS Code extension integrating AI capabilities for development assistance.

## Features

### AI Integration
- Code generation powered by DeepSeek AI
- AI-assisted development planning
- Extensible architecture supporting multiple AI providers (OpenAI coming soon)

### Code Quality Tools
- Automatic code linting and fixing
- ESLint integration
- TypeScript type checking
- Real-time code validation

### Version Control
- Code checkpoint management
- Create, restore, and delete checkpoints
- Safe version control operations

### Security
- Safe command execution with whitelist protection
- Secure API key management
- Protected operation modes

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure DeepSeek API:
   - Open VS Code settings
   - Search for "ITForce"
   - Add your DeepSeek API key
   - (Optional) Configure custom API URL

## Development

```bash
npm run watch     # Start development mode
npm run compile   # Build extension
npm test         # Run tests
npm run lint     # Run linter
```

## Extension Settings

This extension contributes the following settings:

* `itforceHelper.deepseekApiKey`: DeepSeek API Key
* `itforceHelper.deepseekApiUrl`: DeepSeek API URL (default: https://api.deepseek.com/v1/chat/completions)
* `itforceHelper.autoValidate`: Enable/disable automatic code validation

## Commands

* `itforce-helper.generate`: Generate code using AI
* `itforce-helper.helloWorld`: Test command

## Requirements

- VS Code ^1.98.0
- Node.js
- npm

## Extension Development

1. Clone the repository
2. Install recommended VS Code extensions:
   - ESLint
   - Extension Test Runner
   - esbuild Problem Matchers

3. Start development:
   - Press F5 to open a new window with your extension loaded
   - Run tests using the Testing view in VS Code
   - Make changes in `src/extension.ts`
   - Reload VS Code window to load changes (`Ctrl+R` or `Cmd+R`)

### Making Changes

1. Code Structure:
   - `src/extension.ts`: Main extension entry point
   - `src/agents/`: AI and planning related functionality
   - `src/validation/`: Code validation and linting
   - `src/commands/`: Command implementations
   - `src/modals/`: AI service adapters

2. Development Workflow:
   ```bash
   # Start the development watch mode
   npm run watch

   # In a separate terminal, run tests in watch mode
   npm run watch-tests
   ```

3. Before Committing:
   ```bash
   # Run type checking
   npm run check-types

   # Run linter
   npm run lint

   # Run all tests
   npm test
   ```

### Testing

1. Unit Tests:
   - Located in `src/test/`
   - Run with `npm test`
   - Test files should end with `.test.ts`

2. Writing Tests:
   ```typescript
   suite('Feature Test Suite', () => {
     test('should do something', async () => {
       // Your test code
     });
   });
   ```

3. Test Coverage:
   - Run tests with coverage: `npm test -- --coverage`
   - Coverage reports are generated in `coverage/`

4. Integration Tests:
   - Use VS Code's Extension Testing API
   - Test real extension functionality
   - Located in `src/test/suite/`

### Debugging

1. Launch Configurations:
   - "Run Extension": Launches a new VS Code window with the extension
   - "Extension Tests": Runs the extension tests

2. Debug Tools:
   - Use breakpoints in VS Code
   - Check Debug Console for logs
   - Use `console.log()` for temporary debugging

3. Common Issues:
   - If watch mode isn't working, restart with `npm run watch`
   - Clear the extension host by reloading VS Code
   - Check Output panel for extension logs

### Building for Production

1. Prepare Release:
   ```bash
   # Run all checks
   npm run compile

   # Create VSIX package
   npm run package
   ```

2. Testing Release:
   - Install the VSIX in a clean VS Code instance
   - Test all major features
   - Verify settings and commands

## Testing

- Install the Extension Test Runner
- Run the "watch" task
- Use Testing view or run `npm test`

## Building

```bash
npm run package   # Create VSIX package
```

## Release Notes

### 0.0.1

- Initial release
- DeepSeek AI integration
- Basic code generation
- Automatic linting
- Version control features

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

[Add your license here]

---

**Enjoy!**
