import * as vscode from 'vscode';
import { AIService } from '../services/aiService';

export class ChatViewProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'itforce-helper.chatView';
    private _view?: vscode.WebviewView;

    constructor(
        private readonly _extensionUri: vscode.Uri,
    ) {}

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken,
    ) {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [
                this._extensionUri
            ]
        };

        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

        webviewView.webview.onDidReceiveMessage(async message => {
            switch (message.command) {
                case 'sendMessage':
                    try {
                        // 发送"正在思考"状态
                        webviewView.webview.postMessage({ 
                            command: 'updateStatus',
                            status: 'thinking'
                        });

                        const aiService = AIService.getInstance();
                        const response = await aiService.generateResponse(message.model, message.text);
                        
                        // 发送AI响应
                        webviewView.webview.postMessage({ 
                            command: 'receiveResponse',
                            response: response,
                            status: 'complete'
                        });
                    } catch (error) {
                        // 发送错误状态
                        webviewView.webview.postMessage({ 
                            command: 'receiveError',
                            error: error instanceof Error ? error.message : 'Unknown error',
                            status: 'error'
                        });
                        
                        if (error instanceof Error) {
                            vscode.window.showErrorMessage(`Error: ${error.message}`);
                        } else {
                            vscode.window.showErrorMessage(`An unknown error occurred`);
                        }
                    }
                    break;
            }
        });
    }

    private _getHtmlForWebview(webview: vscode.Webview): string {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
                <script src="https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.8.0/build/highlight.min.js"></script>
                <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.8.0/build/styles/github-dark.min.css">
                <style>
                    html, body {
                        padding: 0;
                        margin: 0;
                        height: 100vh;
                        overflow: hidden;
                    }

                    body {
                        display: flex;
                        flex-direction: column;
                    }

                    .chat-container {
                        flex: 1;
                        overflow-y: auto;
                        padding: 20px;
                        padding-right: 16px; /* 为滚动条预留空间 */
                        box-sizing: border-box;
                    }

                    .message {
                        margin: 8px 0;
                        padding: 8px 12px;
                        border-radius: 6px;
                        max-width: 100%;
                        word-wrap: break-word;
                    }

                    .user-message {
                        background-color: var(--vscode-editor-background);
                        border: 1px solid var(--vscode-editor-foreground);
                    }

                    .ai-message {
                        background-color: var(--vscode-editor-selectionBackground);
                        color: var(--vscode-editor-foreground);
                    }

                    /* Markdown 样式 */
                    .message.ai-message pre {
                        background-color: var(--vscode-editor-background);
                        padding: 1em;
                        border-radius: 4px;
                        overflow-x: auto;
                    }

                    .message.ai-message code {
                        font-family: var(--vscode-editor-font-family);
                        font-size: var(--vscode-editor-font-size);
                    }

                    .message.ai-message p {
                        margin: 0.5em 0;
                    }

                    .message.ai-message ul, 
                    .message.ai-message ol {
                        margin: 0.5em 0;
                        padding-left: 2em;
                    }

                    .message.ai-message table {
                        border-collapse: collapse;
                        margin: 1em 0;
                    }

                    .message.ai-message th,
                    .message.ai-message td {
                        border: 1px solid var(--vscode-editor-foreground);
                        padding: 6px 13px;
                    }

                    .copy-button {
                        position: absolute;
                        right: 8px;
                        top: 8px;
                        background: var(--vscode-button-background);
                        color: var(--vscode-button-foreground);
                        border: none;
                        padding: 4px 8px;
                        border-radius: 2px;
                        cursor: pointer;
                        opacity: 0;
                        transition: opacity 0.2s;
                    }

                    .code-block-wrapper {
                        position: relative;
                    }

                    .code-block-wrapper:hover .copy-button {
                        opacity: 1;
                    }

                    .input-container {
                        flex: 0 0 auto; /* 防止输入区域被压缩 */
                        border-top: 1px solid var(--vscode-input-border);
                        padding: 16px;
                        background: var(--vscode-editor-background);
                        width: 100%;
                        box-sizing: border-box;
                    }

                    .input-row {
                        display: flex;
                        gap: 8px;
                        margin-top: 8px;
                        padding-right: 0;  /* 移除右侧内边距 */
                    }

                    #messageInput {
                        width: 100%;
                        min-height: 60px;
                        max-height: 200px;
                        padding: 8px;
                        border: 1px solid var(--vscode-input-border);
                        background: var(--vscode-input-background);
                        color: var(--vscode-input-foreground);
                        resize: vertical;
                        box-sizing: border-box;
                    }

                    #modelSelect {
                        flex: 1;  /* 让选择框占据所有剩余空间 */
                        padding: 4px 8px;
                        background: var(--vscode-dropdown-background);
                        color: var(--vscode-dropdown-foreground);
                        border: 1px solid var(--vscode-dropdown-border);
                        margin-right: 0;  /* 移除右侧外边距 */
                    }

                    #sendButton {
                        padding: 4px 12px;
                        background: var(--vscode-button-background);
                        color: var(--vscode-button-foreground);
                        border: none;
                        cursor: pointer;
                        white-space: nowrap;  /* 防止按钮文字换行 */
                    }

                    #sendButton:disabled {
                        opacity: 0.6;
                        cursor: not-allowed;
                    }

                    /* 自定义滚动条样式 */
                    .chat-container::-webkit-scrollbar {
                        width: 8px;
                    }

                    .chat-container::-webkit-scrollbar-track {
                        background: var(--vscode-editor-background);
                    }

                    .chat-container::-webkit-scrollbar-thumb {
                        background: var(--vscode-scrollbarSlider-background);
                        border-radius: 4px;
                    }

                    .chat-container::-webkit-scrollbar-thumb:hover {
                        background: var(--vscode-scrollbarSlider-hoverBackground);
                    }
                </style>
            </head>
            <body>
                <div id="chatContainer" class="chat-container"></div>
                
                <div class="input-container">
                    <textarea id="messageInput" placeholder="Type your message here..."></textarea>
                    <div class="input-row">
                        <select id="modelSelect">
                            <optgroup label="DeepSeek Models">
                                <option value="deepseek-chat">DeepSeek Chat - 通用对话</option>
                                <option value="deepseek-coder">DeepSeek Coder - 代码优化</option>
                                <option value="deepseek-reasoner">DeepSeek Reasoner 推理</option>
                            </optgroup>
                            <optgroup label="Coming Soon">
                                <option value="claude" disabled>Claude (即将推出)</option>
                            </optgroup>
                        </select>
                        <button id="sendButton" onclick="sendMessage()">Send</button>
                    </div>
                </div>

                <script>
                    const vscode = acquireVsCodeApi();
                    const sendButton = document.getElementById('sendButton');
                    
                    // 配置 marked
                    marked.setOptions({
                        highlight: function(code, lang) {
                            if (lang && hljs.getLanguage(lang)) {
                                return hljs.highlight(code, { language: lang }).value;
                            }
                            return hljs.highlightAuto(code).value;
                        }
                    });

                    function sendMessage() {
                        const text = document.getElementById('messageInput').value;
                        if (!text.trim()) return;
                        
                        const model = document.getElementById('modelSelect').value;
                        
                        // 禁用发送按钮
                        sendButton.disabled = true;
                        
                        addMessageToChat(text, 'user');
                        
                        vscode.postMessage({
                            command: 'sendMessage',
                            text: text,
                            model: model
                        });
                        
                        document.getElementById('messageInput').value = '';
                    }

                    function addMessageToChat(text, type, isThinking = false) {
                        const chatContainer = document.getElementById('chatContainer');
                        const messageDiv = document.createElement('div');
                        messageDiv.className = \`message \${type}-message\`;
                        
                        if (isThinking) {
                            messageDiv.classList.add('thinking');
                            messageDiv.textContent = text;
                        } else if (type === 'ai') {
                            // AI 消息保持原样
                            messageDiv.innerHTML = marked.parse(text);
                            
                            // 为代码块添加复制按钮
                            messageDiv.querySelectorAll('pre code').forEach((block) => {
                                const wrapper = document.createElement('div');
                                wrapper.className = 'code-block-wrapper';
                                const copyButton = document.createElement('button');
                                copyButton.className = 'copy-button';
                                copyButton.textContent = 'Copy';
                                copyButton.onclick = () => {
                                    navigator.clipboard.writeText(block.textContent);
                                    copyButton.textContent = 'Copied!';
                                    setTimeout(() => {
                                        copyButton.textContent = 'Copy';
                                    }, 2000);
                                };
                                
                                block.parentNode.parentNode.insertBefore(wrapper, block.parentNode);
                                wrapper.appendChild(block.parentNode);
                                wrapper.appendChild(copyButton);
                            });
                        } else {
                            // 用户消息使用 pre 标签包装，保持格式
                            const preElement = document.createElement('pre');
                            preElement.style.margin = '0';
                            preElement.style.whiteSpace = 'pre-wrap';
                            preElement.textContent = text;
                            messageDiv.appendChild(preElement);
                        }
                        
                        chatContainer.appendChild(messageDiv);
                        chatContainer.scrollTop = chatContainer.scrollHeight;
                        return messageDiv;
                    }

                    let thinkingMessage = null;

                    window.addEventListener('message', event => {
                        const message = event.data;
                        switch (message.command) {
                            case 'updateStatus':
                                if (message.status === 'thinking') {
                                    thinkingMessage = addMessageToChat('AI is thinking...', 'ai', true);
                                }
                                break;
                            case 'receiveResponse':
                                if (thinkingMessage) {
                                    thinkingMessage.remove();
                                    thinkingMessage = null;
                                }
                                addMessageToChat(message.response, 'ai');
                                sendButton.disabled = false;
                                break;
                            case 'receiveError':
                                if (thinkingMessage) {
                                    thinkingMessage.remove();
                                    thinkingMessage = null;
                                }
                                addMessageToChat(\`Error: \${message.error}\`, 'error');
                                sendButton.disabled = false;
                                break;
                        }
                    });

                    // 支持按 Enter 发送消息
                    document.getElementById('messageInput').addEventListener('keydown', (e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            sendMessage();
                        }
                    });
                </script>
            </body>
            </html>
        `;
    }
}
