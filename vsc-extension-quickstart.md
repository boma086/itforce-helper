# Welcome to ITForce Helper Extension Development

## Project Structure

### Core Files
* `package.json` - Extension manifest file containing:
  * Extension metadata
  * Command definitions
  * Contribution points
  * Dependencies
  * Scripts
* `src/extension.ts` - Main extension file containing:
  * `activate` function - Entry point called when extension activates
  * Command implementations
  * AI service integrations
  * Core business logic

### Key Directories
* `src/` - TypeScript source files
  * `agents/` - AI and planning logic
  * `validation/` - Code quality tools
  * `commands/` - Command implementations
  * `modals/` - AI service adapters
  * `test/` - Test files
* `dist/` - Compiled extension output
* `.vscode/` - VS Code specific settings

## Development Setup

### Required Extensions
Install these recommended extensions:
* `dbaeumer.vscode-eslint` - ESLint integration
* `ms-vscode.extension-test-runner` - Test runner
* `connor4312.esbuild-problem-matchers` - esbuild support

### Getting Started
1. Press `F5` to:
   * Launch extension development host
   * Load your extension
   * Enable debugging
2. Test commands:
   * Open command palette (`Ctrl+Shift+P` or `Cmd+Shift+P`)
   * Type "ITForce" to see available commands
3. Set breakpoints in `src/extension.ts` for debugging

### Development Workflow
1. Make code changes in `src/extension.ts` or other source files
2. Choose reload method:
   * Use debug toolbar to relaunch extension
   * Use `Ctrl+R` or `Cmd+R` to reload window
3. Test changes in development host
4. Check debug console for output

## Testing

### Setup Test Environment
1. Install Extension Test Runner
2. Run watch task:
   * Open command palette
   * Execute "Tasks: Run Task"
   * Select "npm: watch"

### Running Tests
* Use Testing view in activity bar
* Click "Run Test" button
* Use hotkey `Ctrl/Cmd + ; A`
* View results in Test Results panel

### Test Files
* Create tests in `src/test/` directory
* Use `**.test.ts` naming pattern
* Organize tests in subdirectories as needed

## API Reference
* Full VS Code API documentation:
  * Open `node_modules/@types/vscode/index.d.ts`
  * Visit [VS Code API Documentation](https://code.visualstudio.com/api)

## Deployment

### Optimization
* Bundle extension using esbuild (configured in `esbuild.js`)
* Minimize extension size for better performance
* Use production builds for release

### Publishing
1. Update version in `package.json`
2. Create VSIX package:
   ```bash
   npm run package
   ```
3. Test packaged extension
4. Publish to VS Code Marketplace

### CI/CD
* Configure GitHub Actions for automated:
  * Building
  * Testing
  * Publishing

## Additional Resources
* [VS Code Extension Guidelines](https://code.visualstudio.com/api/references/extension-guidelines)
* [Extension Marketplace](https://marketplace.visualstudio.com/vscode)
* [Publishing Extensions](https://code.visualstudio.com/api/working-with-extensions/publishing-extension)
* [Continuous Integration](https://code.visualstudio.com/api/working-with-extensions/continuous-integration)
