# ITForce 助手

[![English](https://img.shields.io/badge/Language-English-blue.svg)](./README.md)
[![简体中文](https://img.shields.io/badge/语言-简体中文-red.svg)](./README.zh-CN.md)
[![日本語](https://img.shields.io/badge/言語-日本語-green.svg)](./README.ja-JP.md)

一个强大的 VS Code 扩展，通过 AI 辅助和代码质量工具增强开发工作流程。

## 必要环境配置

### DeepSeek API 密钥配置

选择以下任一方式配置：

1. **VS Code 设置**
   - 打开 VS Code 设置
   - 搜索 "itforceHelper.deepseekApiKey"
   - 输入你的 API 密钥

2. **环境变量**
   
   **MacOS/Linux:**
   ```bash
   export DEEPSEEK_API_KEY=sk-xxxxxxxxxxxxxxxx
   ```
   添加到 `~/.bashrc` 或 `~/.zshrc` 永久生效

   **Windows:**
   ```cmd
   # CMD
   set DEEPSEEK_API_KEY=sk-xxxxxxxxxxxxxxxx

   # PowerShell
   $env:DEEPSEEK_API_KEY="sk-xxxxxxxxxxxxxxxx"
   ```
   或通过 系统属性 > 环境变量 永久设置

## 主要特性

🤖 **AI 驱动开发**
- 使用 DeepSeek AI 生成代码
- 智能开发规划和建议
- 内置 AI 聊天界面

🛠️ **代码质量**
- 实时代码验证
- 自动代码修复
- TypeScript 类型检查

🔄 **版本管理**
- 智能代码检查点系统
- 快速创建/恢复检查点

## 安装

1. 从 VS Code 市场安装
2. 配置 DeepSeek API 密钥（必需）

## 使用方法

### 命令
- `ITForce: Generate Code` - AI 驱动的代码生成
- `ITForce: Hello World` - 测试扩展设置

### 设置
- `itforceHelper.deepseekApiKey`: DeepSeek API 密钥
- `itforceHelper.deepseekApiUrl`: 自定义 API URL（可选）

## 开发

### 环境要求
- VS Code ^1.98.0
- Node.js
- npm

### 设置
1. 克隆仓库
2. 安装依赖: `npm install`
3. 运行 `npm run watch` 进行开发

## 许可证

[MIT License]

---

**由 ITForce 团队用 ❤️ 制作**
