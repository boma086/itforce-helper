# ITForce ヘルパー

[![English](https://img.shields.io/badge/Language-English-blue.svg)](./README.md)
[![简体中文](https://img.shields.io/badge/语言-简体中文-red.svg)](./README.zh-CN.md)
[![日本語](https://img.shields.io/badge/言語-日本語-green.svg)](./README.ja-JP.md)

AI支援とコード品質ツールで開発ワークフローを強化するVS Code拡張機能です。

## 前提条件

### DeepSeek APIキーの設定

以下のいずれかの方法で設定してください：

1. **VS Code設定**
   - VS Code設定を開く
   - "itforceHelper.deepseekApiKey"を検索
   - APIキーを入力

2. **環境変数**
   
   **MacOS/Linux:**
   ```bash
   export DEEPSEEK_API_KEY=sk-xxxxxxxxxxxxxxxx
   ```
   永続的に設定するには`~/.bashrc`または`~/.zshrc`に追加

   **Windows:**
   ```cmd
   # CMD
   set DEEPSEEK_API_KEY=sk-xxxxxxxxxxxxxxxx

   # PowerShell
   $env:DEEPSEEK_API_KEY="sk-xxxxxxxxxxxxxxxx"
   ```
   または、システムプロパティ > 環境変数から永続的に設定

## 主な機能

🤖 **AI駆動の開発**
- DeepSeek AIによるコード生成
- スマートな開発計画と提案
- 内蔵AIチャットインターフェース

🛠️ **コード品質**
- リアルタイムコード検証
- 自動コード修正
- TypeScriptタイプチェック

🔄 **バージョン管理**
- スマートコードチェックポイントシステム
- クイックチェックポイントの作成/復元

## インストール

1. VS Code マーケットプレースからインストール
2. DeepSeek APIキーを設定（必須）

## 使用方法

### コマンド
- `ITForce: Generate Code` - AI駆動のコード生成
- `ITForce: Hello World` - 拡張機能の設定テスト

### 設定
- `itforceHelper.deepseekApiKey`: DeepSeek APIキー
- `itforceHelper.deepseekApiUrl`: カスタムAPI URL（オプション）

## 開発

### 必要条件
- VS Code ^1.98.0
- Node.js
- npm

### セットアップ
1. リポジトリをクローン
2. 依存関係をインストール: `npm install`
3. 開発用に `npm run watch` を実行

## ライセンス

[MIT License]

---

**ITForce チームが ❤️ を込めて作成**
