import * as vscode from 'vscode';
import { ChatViewProvider } from './webview/ChatViewProvider';
import { AIService } from './services/aiService';

export function activate(context: vscode.ExtensionContext) {
    // 注册 WebView Provider
    const chatViewProvider = new ChatViewProvider(context.extensionUri);
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(
            ChatViewProvider.viewType,
            chatViewProvider
        )
    );

    // 注册原有的 generate 命令
    context.subscriptions.push(
        vscode.commands.registerCommand('itforce-helper.generate', async () => {
            const aiService = AIService.getInstance();

            // 获取用户输入
            const prompt = await vscode.window.showInputBox({
                prompt: '質問やリクエストを入力してください',
                placeHolder: '何を生成しますか？'
            });

            if (!prompt) {
                return;
            }

            try {
                const response = await aiService.generateResponse('DeepSeek AI', prompt);

                // 创建并显示输出通道
                const outputChannel = vscode.window.createOutputChannel('ITForce Helper');
                outputChannel.show();
                outputChannel.appendLine(response);
            } catch (error) {
                vscode.window.showErrorMessage(`エラー: ${error}`);
            }
        })
    );

    // 注册打开聊天视图的命令
    context.subscriptions.push(
        vscode.commands.registerCommand('itforce-helper.openChat', () => {
            vscode.commands.executeCommand('workbench.view.extension.itforce-helper');
        })
    );
}

export function deactivate() {}
