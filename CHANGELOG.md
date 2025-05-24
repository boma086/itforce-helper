# Change Log / 更新日志

All notable changes to the "itforce-helper" extension will be documented in this file.
本扩展的所有重要更改都将记录在此文件中。

## [1.0.0] - 2024-12-XX

### 🎉 重大重构 - 简化版本发布 / Major Refactoring - Simplified Version

这是一个完全重构的版本，专注于核心功能的稳定实现。
This is a completely refactored version focusing on stable implementation of core features.

### ✅ 新增功能 / Added Features
- **简单流程图生成**: 从Java代码自动生成Mermaid流程图 / Simple flowchart generation from Java code
- **AI驱动分析**: 支持DeepSeek API和Ollama本地模型 / AI-driven analysis with DeepSeek API and Ollama support
- **即时预览**: 在新WebView面板中实时显示流程图 / Instant preview in new WebView panel
- **一键操作**: 聊天界面输入代码和"生成流程图"即可 / One-click operation via chat interface

### 🔧 技术改进 / Technical Improvements
- **大幅简化架构**: 从5000+行代码简化到2000行 / Drastically simplified architecture (5000+ → 2000 lines)
- **移除复杂依赖**: 删除Fabric.js等重型依赖 / Removed complex dependencies like Fabric.js
- **优化WebView**: 使用简单直接的WebView实现 / Optimized WebView with simple implementation
- **提升稳定性**: 减少消息传递复杂度 / Improved stability by reducing message complexity

### 🗑️ 移除功能 / Removed Features
- **复杂的FlowchartPanel类**: 移除3000+行的复杂实现 / Removed complex FlowchartPanel class (3000+ lines)
- **多格式输出**: 移除JSON、Fabric等复杂格式支持 / Removed multi-format output support
- **Canvas渲染**: 移除Fabric.js Canvas渲染功能 / Removed Fabric.js Canvas rendering
- **复杂配置系统**: 简化配置选项 / Simplified configuration system

## [0.0.4] - 2024-XX-XX (已废弃 / Deprecated)

### Added / 新增
- Built-in AI chat interface / 内置 AI 聊天界面
- Improved code generation capabilities / 改进的代码生成功能
- Enhanced error handling / 增强的错误处理

### Changed / 更改
- Updated documentation / 更新文档
- Improved configuration management / 改进配置管理
- Streamlined user interface / 简化用户界面

## [0.0.3]
- Added proper authentication status management / 添加正确的身份验证状态管理
- Added new command `authStatus.update` / 新增 `authStatus.update` 命令
- Fixed authentication status command not found error / 修复身份验证状态命令未找到错误
- Improved error handling in AI service / 改进 AI 服务中的错误处理

## [0.0.2]
- Intermediate updates and fixes / 中间更新和修复

## [0.0.1]
- Initial release / 初始发布
- DeepSeek AI integration / DeepSeek AI 集成
- Code generation / 代码生成
- Linting support / 代码检查支持
