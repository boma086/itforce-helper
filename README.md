# ITForce Helper - Java フローチャート生成

🚀 **Javaコードから美しいフローチャートを自動生成**

AI駆動のシンプルで高速なコード可視化ツール。複雑なJavaコードを直感的なフローチャートに変換し、コードの理解と文書化を支援します。

## ✨ 主な機能

- 🎯 **ワンクリック生成**: Javaコードを貼り付けて「生成流程图」と入力するだけ
- 🎨 **美しいビジュアル**: Mermaid.js による高品質なフローチャート
- ⚡ **高速処理**: 数秒でコードを解析してフローチャートを生成
- 🤖 **AI駆動**: DeepSeek API または Ollama ローカルモデル対応
- 🌐 **多言語対応**: 日本語、英語、中国語のインターフェース

## 🚀 クイックスタート

### 1. インストール
VS Code の拡張機能マーケットプレイスから「ITForce Helper」をインストール

### 2. API キー設定
以下のいずれかの方法で DeepSeek API キーを設定：

**方法A: VS Code 設定**
```json
{
  "itforceHelper.deepseekApiKey": "your-api-key-here"
}
```

**方法B: 環境変数**
```bash
export DEEPSEEK_API_KEY="your-api-key-here"
```

### 3. 使用開始
1. サイドバーの ITForce ヘルパーアイコンをクリック
2. Javaコードを貼り付け
3. 「生成流程图」と入力
4. 美しいフローチャートが新しいパネルに表示されます！

## 📖 使用例

### 入力例
```java
@Component
public class BCryptProvider implements HashProvider {
  @Override
  public String hashPassword(String plainPassword) {
    return BCrypt.hashpw(plainPassword, BCrypt.gensalt());
  }

  @Override
  public boolean isPasswordValid(String plainText, String hashed) {
    return BCrypt.checkpw(plainText, hashed);
  }
}
```

### 出力
美しいMermaidフローチャートが自動生成され、メソッドの流れと関係性が視覚化されます。

## ⚙️ 設定オプション

| 設定項目 | デフォルト値 | 説明 |
|---------|-------------|------|
| `itforceHelper.deepseekApiKey` | - | **必須**: DeepSeek API キー |
| `itforceHelper.deepseekApiUrl` | `https://api.deepseek.com/v1/chat/completions` | DeepSeek API URL |
| `itforceHelper.ollamaUrl` | `http://localhost:11434` | Ollama サーバー URL |
| `itforceHelper.ollamaModel` | `codellama:latest` | 使用する Ollama モデル |

## 🛠️ 開発者向け

### ローカル開発
```bash
# 依存関係のインストール
npm install

# コンパイル
npm run compile

# 開発モード（ウォッチ）
npm run watch

# テスト実行
npm test
```

### プロジェクト構造
```
src/
├── extension.ts              # 拡張機能エントリーポイント
├── services/
│   ├── aiService.ts         # AI サービス統合
│   └── flowchartGenerator.ts # フローチャート生成
├── webview/
│   └── ChatViewProvider.ts  # チャット UI とフローチャート表示
└── utils/
    └── codeExtractor.ts     # コード抽出ユーティリティ
```

## 📋 システム要件

- VS Code 1.98.0 以上
- インターネット接続（DeepSeek API 使用時）
- Node.js 20.x 以上（開発時）

## 🤝 コントリビューション

プルリクエストやイシューの報告を歓迎します！

## 📄 ライセンス

MIT License

## 🔗 リンク

- [GitHub Repository](https://github.com/boma086/itforce-helper)
- [DeepSeek API](https://platform.deepseek.com/)

---

**Made with ❤️ by ITForce Team**
