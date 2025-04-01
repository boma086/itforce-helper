# ITForce Helper

[![English](https://img.shields.io/badge/Language-English-blue.svg)](./README.md)
[![简体中文](https://img.shields.io/badge/语言-简体中文-red.svg)](./README.zh-CN.md)
[![日本語](https://img.shields.io/badge/言語-日本語-green.svg)](./README.ja-JP.md)

A powerful VS Code extension that enhances development workflow with AI assistance and code quality tools.

## Prerequisites

### DeepSeek API Key Configuration

Choose one of the following methods:

1. **VS Code Settings**
   - Open VS Code Settings
   - Search "itforceHelper.deepseekApiKey"
   - Enter your API key

2. **Environment Variable**
   
   **For MacOS/Linux:**
   ```bash
   export DEEPSEEK_API_KEY=sk-xxxxxxxxxxxxxxxx
   ```
   Add to `~/.bashrc` or `~/.zshrc` for permanent setting

   **For Windows:**
   ```cmd
   # CMD
   set DEEPSEEK_API_KEY=sk-xxxxxxxxxxxxxxxx

   # PowerShell
   $env:DEEPSEEK_API_KEY="sk-xxxxxxxxxxxxxxxx"
   ```
   Or set via System Properties > Environment Variables for permanent setting

## Key Features

🤖 **AI-Powered Development**
- Code generation using DeepSeek AI
- Smart development planning and suggestions
- Built-in AI chat interface

🛠️ **Code Quality**
- Real-time code validation
- Automatic code fixes
- TypeScript type checking

🔄 **Version Management**
- Smart code checkpoint system
- Quick checkpoint creation/restoration

## Installation

1. Install from VS Code Marketplace
2. Configure DeepSeek API key (required)

## Usage

### Commands
- `ITForce: Generate Code` - AI-powered code generation
- `ITForce: Hello World` - Test extension setup

### Settings
- `itforceHelper.deepseekApiKey`: DeepSeek API key
- `itforceHelper.deepseekApiUrl`: Custom API URL (optional)

## Development

### Prerequisites
- VS Code ^1.98.0
- Node.js
- npm

### Setup
1. Clone repository
2. Install dependencies: `npm install`
3. Run `npm run watch` for development

## License

[MIT License]

---

**Made with ❤️ by ITForce Team**


