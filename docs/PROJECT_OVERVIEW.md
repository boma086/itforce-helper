# ITForce Helper - 项目概览

## 项目简介
ITForce Helper 是一个 VS Code 扩展，专注于为 Java 代码生成简单流程图。

## 当前实现状态 (v2.0 - 极简版本)

### ✅ 核心功能
1. **聊天界面** - 基于 WebView 的简洁聊天界面
2. **AI 集成** - 支持 DeepSeek API 和 Ollama 本地模型
3. **Java 代码解析** - 自动识别聊天输入中的 Java 代码
4. **流程图生成** - 使用 Mermaid.js 渲染流程图

### 🎯 工作流程
1. 用户在聊天窗口输入 Java 代码
2. 输入"生成流程图"命令
3. AI 生成 Mermaid 格式流程图
4. 在新窗口中显示流程图

### 📁 项目结构（已清理）
```
src/
├── extension.ts                          # 扩展入口点（简化）
├── services/
│   ├── aiService.ts                     # AI 服务（简化）
│   ├── flowchartGenerator_simple.ts    # 流程图生成（极简版）
│   ├── ollamaAdapter.ts                 # Ollama 适配器（简化）
└── webview/
    └── ChatViewProvider.ts              # 聊天界面（清理）
├── modals/
    └── adapters.ts                      # AI 模型适配器
└── test/                                # 测试文件
```

### 🔧 技术栈
- **前端**: HTML + CSS + JavaScript (WebView)
- **图表渲染**: Mermaid.js v10.6.1
- **AI 模型**: DeepSeek API, Ollama
- **开发语言**: TypeScript
- **平台**: VS Code Extension

## 设计决策和经验总结

### ✅ 成功的设计选择
1. **简单的 WebView 面板** - 使用 `vscode.window.createWebviewPanel` 直接创建
2. **最小化 HTML** - 只包含必要的 Mermaid 渲染代码
3. **直接 CDN 引用** - 使用 Mermaid.js CDN，避免本地依赖问题
4. **详细的调试日志** - 便于问题追踪和调试

### ❌ 避免的复杂实现
1. **复杂的 FlowchartPanel 类** - 过于复杂，消息传递容易出错
2. **多种输出格式** - JSON、Fabric 等格式增加复杂性
3. **复杂的配置系统** - 过多配置选项导致维护困难
4. **本地文件依赖** - 避免本地 Mermaid 文件，减少打包问题

### 🎯 用户体验优化
1. **即时反馈** - 生成过程中显示加载状态
2. **错误处理** - 清晰的错误信息显示
3. **简洁界面** - 专注于核心功能，避免功能过载
4. **响应式设计** - 适配不同屏幕尺寸

## 配置说明

### 必需配置
```json
{
  "itforceHelper.apiKey": "your-deepseek-api-key",
  "itforceHelper.apiUrl": "https://api.deepseek.com/v1/chat/completions"
}
```

### 可选配置
```json
{
  "itforceHelper.ollamaUrl": "http://localhost:11434",
  "itforceHelper.ollamaModel": "codellama:latest",
  "itforceHelper.flowchartRenderer": "dagre"
}
```

## 使用方法

### 基本使用
1. 打开 VS Code
2. 按 `Ctrl+Shift+P` 打开命令面板
3. 输入 "ITForce Helper: Open Chat" 打开聊天界面
4. 在聊天窗口粘贴 Java 代码
5. 输入 "生成流程图"
6. 查看在新面板中生成的流程图

### 支持的代码类型
- Java 类和方法
- 接口实现
- 简单的业务逻辑流程
- 条件判断和循环结构

## 开发指南

### 本地开发
```bash
# 安装依赖
npm install

# 编译
npm run compile

# 调试
F5 (在 VS Code 中)
```

### 调试技巧
1. 查看 VS Code 开发者控制台 (Help > Toggle Developer Tools)
2. 搜索 "=== Creating simple flowchart panel ===" 确认流程图创建
3. 搜索 "=== Simple Flowchart WebView Starting ===" 确认 WebView 加载
4. 检查 Mermaid 渲染日志

## 已知限制
1. 仅支持 Java 代码分析
2. 流程图复杂度有限，适合简单到中等复杂度的代码
3. 需要网络连接访问 AI API 和 CDN 资源
4. 暂不支持自定义流程图样式

## 未来规划 (v2.0+)
1. 支持更多编程语言 (Python, JavaScript, etc.)
2. 增加流程图导出功能 (PNG, SVG)
3. 支持更复杂的代码结构分析
4. 添加流程图编辑功能
5. 集成更多 AI 模型选择
