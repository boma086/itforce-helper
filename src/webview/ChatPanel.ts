import * as vscode from 'vscode';
import { AIService } from '../services/aiService';

export class ChatPanel {
    private static currentPanel: ChatPanel | undefined;
    private readonly _panel: vscode.WebviewPanel;
    private _disposables: vscode.Disposable[] = [];

    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
        this._panel = panel;
        this._panel.webview.html = this._getWebviewContent();
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
        
        // Handle messages from the webview
        this._panel.webview.onDidReceiveMessage(
            async (message) => {
                switch (message.command) {
                    case 'sendMessage':
                        const response = await this._handleAIRequest(message.text, message.model);
                        // Send response back to webview
                        this._panel.webview.postMessage({ 
                            command: 'receiveResponse',
                            response: response 
                        });
                        break;
                }
            },
            null,
            this._disposables
        );
    }

    public static createOrShow(extensionUri: vscode.Uri) {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;

        if (ChatPanel.currentPanel) {
            ChatPanel.currentPanel._panel.reveal(column);
            return;
        }

        const panel = vscode.window.createWebviewPanel(
            'itforceChat',
            'ITForce Assistant',
            column || vscode.ViewColumn.Two,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
            }
        );

        ChatPanel.currentPanel = new ChatPanel(panel, extensionUri);
    }

    private async _handleAIRequest(prompt: string, model: string): Promise<string> {
        try {
            const aiService = AIService.getInstance();
            return await aiService.generateResponse(model, prompt);
        } catch (error) {
            console.error('AI request error:', error);
            throw error;
        }
    }

    private _getWebviewContent() {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body {
                        padding: 20px;
                    }
                    .tab-container {
                        display: flex;
                        margin-bottom: 20px;
                    }
                    .tab {
                        padding: 10px 20px;
                        cursor: pointer;
                        border: 1px solid #ccc;
                    }
                    .tab.active {
                        background-color: var(--vscode-button-background);
                        color: var(--vscode-button-foreground);
                    }
                    .input-container {
                        margin-bottom: 20px;
                    }
                    #messageInput {
                        width: 100%;
                        height: 100px;
                        margin-bottom: 10px;
                    }
                    .model-selector {
                        margin-bottom: 10px;
                    }
                    .chat-container {
                        margin-top: 20px;
                    }
                    .message {
                        margin-bottom: 10px;
                        padding: 10px;
                        border-radius: 5px;
                    }
                    .user-message {
                        background-color: var(--vscode-editor-background);
                    }
                    .ai-message {
                        background-color: var(--vscode-editor-selectionBackground);
                    }
                </style>
            </head>
            <body>
                <div class="tab-container">
                    <div class="tab active" onclick="switchTab('chat')">Chat</div>
                    <div class="tab" onclick="switchTab('agent')">Agent</div>
                    <div class="tab" onclick="switchTab('settings')">Settings</div>
                </div>
                
                <div class="input-container">
                    <textarea id="messageInput" placeholder="Type your message here..."></textarea>
                    <div class="model-selector">
                        <select id="modelSelect">
                            <option value="DeepSeek AI">DeepSeek AI</option>
                            <option value="OpenAI">OpenAI (Coming Soon)</option>
                            <option value="Claude">Claude (Coming Soon)</option>
                        </select>
                    </div>
                    <button onclick="sendMessage()">Send</button>
                </div>
                
                <div id="chatContainer" class="chat-container"></div>

                <script>
                    const vscode = acquireVsCodeApi();
                    
                    function switchTab(tabName) {
                        // Handle tab switching
                        document.querySelectorAll('.tab').forEach(tab => {
                            tab.classList.remove('active');
                        });
                        event.target.classList.add('active');
                    }

                    function sendMessage() {
                        const text = document.getElementById('messageInput').value;
                        const model = document.getElementById('modelSelect').value;
                        
                        // Add user message to chat
                        addMessageToChat(text, 'user');
                        
                        // Send to extension
                        vscode.postMessage({
                            command: 'sendMessage',
                            text: text,
                            model: model
                        });
                        
                        document.getElementById('messageInput').value = '';
                    }

                    function addMessageToChat(text, sender) {
                        const chatContainer = document.getElementById('chatContainer');
                        const messageDiv = document.createElement('div');
                        messageDiv.className = \`message \${sender}-message\`;
                        messageDiv.textContent = text;
                        chatContainer.appendChild(messageDiv);
                    }

                    // Handle messages from the extension
                    window.addEventListener('message', event => {
                        const message = event.data;
                        switch (message.command) {
                            case 'receiveResponse':
                                addMessageToChat(message.response, 'ai');
                                break;
                        }
                    });
                </script>
            </body>
            </html>
        `;
    }

    private dispose() {
        ChatPanel.currentPanel = undefined;
        this._panel.dispose();
        while (this._disposables.length) {
            const disposable = this._disposables.pop();
            if (disposable) {
                disposable.dispose();
            }
        }
    }
}
