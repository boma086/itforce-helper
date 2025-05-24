import * as vscode from 'vscode';
import { ChatViewProvider } from './webview/ChatViewProvider';
import { AIService } from './services/aiService';
import { FlowchartGenerator } from './services/flowchartGenerator';

export function activate(context: vscode.ExtensionContext) {
    // 注册聊天视图
    const chatViewProvider = new ChatViewProvider(context.extensionUri);
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(
            ChatViewProvider.viewType,
            chatViewProvider
        )
    );

    // 注册打开聊天视图的命令
    context.subscriptions.push(
        vscode.commands.registerCommand('itforce-helper.openChat', () => {
            vscode.commands.executeCommand('workbench.view.extension.itforce-helper');
        })
    );

    // 注册右键菜单生成流程图命令
    context.subscriptions.push(
        vscode.commands.registerCommand('itforce-helper.generateFlowchart', async (uri: vscode.Uri) => {
            try {
                // 获取文件内容
                let code: string;
                if (uri) {
                    // 从文件URI读取
                    const document = await vscode.workspace.openTextDocument(uri);
                    code = document.getText();
                } else {
                    // 从当前编辑器读取
                    const editor = vscode.window.activeTextEditor;
                    if (!editor) {
                        vscode.window.showErrorMessage('Javaファイルを開いてください');
                        return;
                    }
                    code = editor.document.getText();
                }

                if (!code.trim()) {
                    vscode.window.showErrorMessage('ファイルが空です');
                    return;
                }

                // 显示模型选择对话框
                const selectedModel = await showModelSelectionDialog();
                if (!selectedModel) {
                    return; // 用户取消了选择
                }

                // 生成流程图
                const aiService = AIService.getInstance();
                const flowchartGenerator = new FlowchartGenerator(aiService);

                vscode.window.showInformationMessage('フローチャートを生成中...');

                const mermaidCode = await flowchartGenerator.generateSimpleMermaidFlowchart(code, selectedModel);

                // 创建并显示流程图面板
                await createFlowchartPanel(mermaidCode);

            } catch (error) {
                console.error('Flowchart generation error:', error);
                vscode.window.showErrorMessage(`フローチャート生成エラー: ${error}`);
            }
        })
    );
}

/**
 * 显示模型选择对话框
 */
async function showModelSelectionDialog(): Promise<string | undefined> {
    const aiService = AIService.getInstance();

    // 创建选择项
    const modelItems: vscode.QuickPickItem[] = [
        {
            label: '🚀 DeepSeek Chat',
            description: 'クラウドAI（推奨）',
            detail: '高速で高品質なフローチャート生成',
            picked: true
        }
    ];

    // 添加Ollama模型
    try {
        const ollamaModels = aiService.getAvailableOllamaModels();
        if (ollamaModels && ollamaModels.length > 0) {
            ollamaModels.forEach((model: string) => {
                modelItems.push({
                    label: `🏠 ${model}`,
                    description: 'ローカルAI',
                    detail: 'プライベートで安全な処理'
                });
            });
        }
    } catch (error) {
        // Ollama模型获取失败，忽略
        console.warn('Failed to get Ollama models:', error);
    }

    // 显示选择对话框
    const selected = await vscode.window.showQuickPick(modelItems, {
        placeHolder: 'フローチャート生成に使用するAIモデルを選択してください',
        title: 'AIモデル選択'
    });

    if (!selected) {
        return undefined;
    }

    // 返回模型ID
    if (selected.label.includes('DeepSeek')) {
        return 'deepseek-chat';
    } else {
        // Ollama模型
        const modelName = selected.label.replace('🏠 ', '');
        return `ollama:${modelName}`;
    }
}

/**
 * 创建流程图显示面板
 */
async function createFlowchartPanel(mermaidCode: string) {
    const panel = vscode.window.createWebviewPanel(
        'flowchartView',
        'フローチャート',
        vscode.ViewColumn.Beside,
        {
            enableScripts: true,
            retainContextWhenHidden: true
        }
    );

    panel.webview.html = getFlowchartHtml(mermaidCode);
}

/**
 * 生成流程图HTML
 */
function getFlowchartHtml(mermaidCode: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>フローチャート</title>
    <script src="https://cdn.jsdelivr.net/npm/mermaid@10.6.1/dist/mermaid.min.js"></script>
    <style>
        body {
            margin: 0;
            padding: 20px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background-color: var(--vscode-editor-background);
            color: var(--vscode-editor-foreground);
        }
        .container {
            max-width: 100%;
            margin: 0 auto;
        }
        .mermaid {
            text-align: center;
            background-color: white;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
        }
        .title {
            text-align: center;
            margin-bottom: 20px;
            font-size: 24px;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="title">🔄 フローチャート</div>
        <div class="mermaid">
            ${mermaidCode}
        </div>
    </div>
    <script>
        mermaid.initialize({
            startOnLoad: true,
            theme: 'default',
            flowchart: {
                useMaxWidth: true,
                htmlLabels: true
            }
        });
    </script>
</body>
</html>`;
}

export function deactivate() {}
