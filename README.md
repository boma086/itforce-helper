# ITForce Helper / ITForce 助手

A powerful VS Code extension that enhances development workflow with AI assistance and code quality tools.
一个强大的 VS Code 扩展，通过 AI 辅助和代码质量工具增强开发工作流程。

## Key Features / 主要特性

🤖 **AI-Powered Development / AI 驱动开发**
- Code generation using DeepSeek AI / 使用 DeepSeek AI 生成代码
- Smart development planning and suggestions / 智能开发规划和建议
- Built-in AI chat interface / 内置 AI 聊天界面

🛠️ **Code Quality / 代码质量**
- Real-time code validation / 实时代码验证
- Automatic code fixes / 自动代码修复
- TypeScript type checking / TypeScript 类型检查

🔄 **Version Management / 版本管理**
- Smart code checkpoint system / 智能代码检查点系统
- Quick checkpoint creation/restoration / 快速创建和恢复检查点

## Installation / 安装

1. Install from VS Code Marketplace / 从 VS Code 商店安装
2. Configure DeepSeek API key (required) / 配置 DeepSeek API 密钥（必需）

## Configuration / 配置

Configure the DeepSeek API key using one of these methods:
通过以下方式之一配置 DeepSeek API 密钥：

1. **VS Code Settings (Recommended) / VS Code 设置（推荐）**:
   - Open VS Code settings (`Ctrl+,` or `Cmd+,`) / 打开 VS Code 设置
   - Search for "ITForce" / 搜索 "ITForce"
   - Add your DeepSeek API key in `itforceHelper.deepseekApiKey` / 在 `itforceHelper.deepseekApiKey` 中添加你的 API 密钥

2. **Environment Variable / 环境变量**:
   ```bash
   # Windows
   set DEEPSEEK_API_KEY=your-api-key-here

   # Linux/Mac
   export DEEPSEEK_API_KEY=your-api-key-here
   ```

> **Note/注意**: VS Code settings take precedence over environment variables. / VS Code 设置优先于环境变量。

## Usage / 使用方法

### Commands / 命令
- `ITForce: Generate Code` - AI-powered code generation / AI 驱动的代码生成
- `ITForce: Hello World` - Test extension setup / 测试扩展设置

### Settings / 设置
- `itforceHelper.deepseekApiKey`: DeepSeek API key / DeepSeek API 密钥
- `itforceHelper.deepseekApiUrl`: Custom API URL (optional) / 自定义 API URL（可选）

## Development / 开发

### Prerequisites / 前提条件
- VS Code ^1.98.0
- Node.js
- npm

### Setup / 设置
1. Clone repository / 克隆仓库
2. Install dependencies / 安装依赖: `npm install`
3. Run `npm run watch` for development / 运行开发模式

## License / 许可证

[MIT License / MIT 许可证]

---

**Made with ❤️ by ITForce Team / 由 ITForce 团队用 ❤️ 制作**


