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
                        
                        // 创建初始消息
                        webviewView.webview.postMessage({
                            command: 'startResponse'
                        });

                        // 使用流式响应
                        for await (const chunk of aiService.generateStreamResponse(message.model, message.text)) {
                            webviewView.webview.postMessage({ 
                                command: 'appendChunk',
                                chunk: chunk
                            });
                        }
                        
                        // 发送完成状态
                        webviewView.webview.postMessage({ 
                            command: 'completeResponse',
                            status: 'complete'
                        });
                    } catch (error) {
                        webviewView.webview.postMessage({ 
                            command: 'receiveError',
                            error: error instanceof Error ? error.message : 'Unknown error',
                            status: 'error'
                        });
                    }
                    break;
                case 'feedback':
                    // 处理反馈
                    console.log(`Received ${message.type} feedback for message:`, message.message);
                    // 这里可以添加将反馈发送到服务器的逻辑
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

                    .message-actions {
                        display: flex;
                        gap: 8px;
                        margin-top: 8px;
                        align-items: center;
                    }

                    .action-button {
                        background: none;
                        border: none;
                        cursor: pointer;
                        padding: 4px;
                        display: flex;
                        align-items: center;
                        color: var(--vscode-foreground);
                        opacity: 0.7;
                        transition: opacity 0.2s;
                    }

                    .action-button:hover {
                        opacity: 1;
                    }

                    .retry-dropdown {
                        position: relative;
                        display: inline-block;
                    }

                    .retry-menu {
                        display: none;
                        position: absolute;
                        background: var(--vscode-dropdown-background);
                        border: 1px solid var(--vscode-dropdown-border);
                        border-radius: 4px;
                        padding: 4px 0;
                        z-index: 1000;
                        min-width: 150px;
                    }

                    .retry-menu.show {
                        display: block;
                    }

                    .retry-menu-item {
                        padding: 4px 12px;
                        cursor: pointer;
                    }

                    .retry-menu-item:hover {
                        background: var(--vscode-list-hoverBackground);
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
                        } else {
                            // 添加消息内容
                            const contentDiv = document.createElement('div');
                            contentDiv.className = 'message-content';
                            if (type === 'ai') {
                                contentDiv.innerHTML = marked.parse(text);
                            } else {
                                const preElement = document.createElement('pre');
                                preElement.style.margin = '0';
                                preElement.style.whiteSpace = 'pre-wrap';
                                preElement.textContent = text;
                                contentDiv.appendChild(preElement);
                            }
                            messageDiv.appendChild(contentDiv);
                        }
                        
                        chatContainer.appendChild(messageDiv);
                        chatContainer.scrollTop = chatContainer.scrollHeight;
                        return messageDiv;
                    }

                    // 添加操作按钮的函数
                    function addActionButtons(messageDiv) {
                        const actionsDiv = document.createElement('div');
                        actionsDiv.className = 'message-actions';
                        
                        // 重试按钮和下拉菜单
                        const retryDropdown = document.createElement('div');
                        retryDropdown.className = 'retry-dropdown';
                        
                        const retryButton = document.createElement('button');
                        retryButton.className = 'action-button';
                        retryButton.innerHTML = '🔄 Retry';
                        retryButton.onclick = (e) => {
                            e.stopPropagation();
                            const menu = retryDropdown.querySelector('.retry-menu');
                            menu.classList.toggle('show');
                        };
                        
                        const retryMenu = document.createElement('div');
                        retryMenu.className = 'retry-menu';
                        
                        // 获取当前选择的模型
                        const currentModel = document.getElementById('modelSelect').value;
                        
                        // 添加所有模型选项
                        const models = [
                            { value: 'deepseek-chat', label: 'DeepSeek Chat' },
                            { value: 'deepseek-coder', label: 'DeepSeek Coder' },
                            { value: 'deepseek-reasoner', label: 'DeepSeek Reasoner' }
                        ];
                        
                        models.forEach(model => {
                            const menuItem = document.createElement('div');
                            menuItem.className = 'retry-menu-item';
                            menuItem.textContent = model.label;
                            menuItem.onclick = () => {
                                retryMessage(messageDiv, model.value);
                                retryMenu.classList.remove('show');
                            };
                            retryMenu.appendChild(menuItem);
                        });
                        
                        retryDropdown.appendChild(retryButton);
                        retryDropdown.appendChild(retryMenu);
                        
                        // 点赞按钮
                        const likeButton = document.createElement('button');
                        likeButton.className = 'action-button';
                        likeButton.innerHTML = '👍';
                        likeButton.onclick = () => handleFeedback(messageDiv, 'like');
                        
                        // 踩按钮
                        const dislikeButton = document.createElement('button');
                        dislikeButton.className = 'action-button';
                        dislikeButton.innerHTML = '👎';
                        dislikeButton.onclick = () => handleFeedback(messageDiv, 'dislike');
                        
                        actionsDiv.appendChild(retryDropdown);
                        actionsDiv.appendChild(likeButton);
                        actionsDiv.appendChild(dislikeButton);
                        messageDiv.appendChild(actionsDiv);
                    }

                    let currentAiMessage = null;
                    let currentMessageContent = '';  // 存储完整的消息内容

                    window.addEventListener('message', event => {
                        const message = event.data;
                        switch (message.command) {
                            case 'startResponse':
                                currentMessageContent = '';  // 重置消息内容
                                currentAiMessage = addMessageToChat('AI is thinking...', 'ai', true);
                                break;
                                
                            case 'appendChunk':
                                if (currentAiMessage) {
                                    const content = currentAiMessage.querySelector('.message-content') || currentAiMessage;
                                    // 如果是第一个响应块，清除"AI is thinking..."
                                    if (!currentMessageContent) {
                                        currentAiMessage.classList.remove('thinking');
                                        content.innerHTML = '';
                                    }
                                    // 累积消息内容
                                    currentMessageContent += message.chunk;
                                    // 重新渲染完整的消息
                                    content.innerHTML = marked.parse(currentMessageContent);
                                    // 处理代码块的语法高亮和添加复制按钮
                                    content.querySelectorAll('pre code').forEach((block) => {
                                        hljs.highlightElement(block);
                                        if (!block.parentElement.parentElement.classList.contains('code-block-wrapper')) {
                                            const wrapper = document.createElement('div');
                                            wrapper.className = 'code-block-wrapper';
                                            const copyButton = document.createElement('button');
                                            copyButton.className = 'copy-button';
                                            copyButton.textContent = 'Copy';
                                            copyButton.onclick = async () => {
                                                try {
                                                    await navigator.clipboard.writeText(block.textContent || '');
                                                    copyButton.textContent = 'Copied!';
                                                    setTimeout(() => {
                                                        copyButton.textContent = 'Copy';
                                                    }, 2000);
                                                } catch (err) {
                                                    console.error('Failed to copy:', err);
                                                }
                                            };
                                            block.parentElement.parentNode.insertBefore(wrapper, block.parentElement);
                                            wrapper.appendChild(block.parentElement);
                                            wrapper.insertBefore(copyButton, block.parentElement);
                                        }
                                    });
                                    content.scrollIntoView({ behavior: 'smooth', block: 'end' });
                                }
                                break;
                                
                            case 'completeResponse':
                                if (currentAiMessage) {
                                    // 在响应完成时添加操作按钮
                                    addActionButtons(currentAiMessage);
                                }
                                currentAiMessage = null;
                                currentMessageContent = '';  // 清理消息内容
                                document.getElementById('sendButton').disabled = false;
                                break;
                                
                            case 'receiveError':
                                if (currentAiMessage) {
                                    currentAiMessage.remove();
                                }
                                currentMessageContent = '';  // 清理消息内容
                                addMessageToChat(\`Error: \${message.error}\`, 'ai');
                                document.getElementById('sendButton').disabled = false;
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

                    // 重试消息
                    async function retryMessage(messageDiv, selectedModel) {
                        // 获取原始问题文本
                        const questionDiv = messageDiv.previousElementSibling;
                        if (!questionDiv || !questionDiv.classList.contains('user-message')) {
                            return;
                        }
                        
                        const questionText = questionDiv.querySelector('pre')?.textContent || '';
                        
                        // 发送消息
                        vscode.postMessage({
                            command: 'sendMessage',
                            text: questionText,
                            model: selectedModel
                        });
                    }

                    // 处理反馈
                    function handleFeedback(messageDiv, type) {
                        const button = type === 'like' ? '👍' : '👎';
                        vscode.postMessage({
                            command: 'feedback',
                            type: type,
                            message: messageDiv.querySelector('.message-content').textContent
                        });
                        
                        // 视觉反馈
                        const feedbackButton = messageDiv.querySelector(\`button:contains(\${button})\`);
                        if (feedbackButton) {
                            feedbackButton.style.opacity = '1';
                        }
                    }

                    // 点击页面任意位置关闭重试菜单
                    document.addEventListener('click', (e) => {
                        const menus = document.querySelectorAll('.retry-menu');
                        menus.forEach(menu => {
                            if (!menu.contains(e.target) && !e.target.closest('.retry-dropdown')) {
                                menu.classList.remove('show');
                            }
                        });
                    });
                </script>
            </body>
            </html>
        `;
    }
}
