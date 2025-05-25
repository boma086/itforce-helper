import * as vscode from 'vscode';
import { AIService } from '../services/aiService';
import { FlowchartGenerator } from '../services/flowchartGenerator';

export class ChatViewProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'itforce-helper.chatView';
    private flowchartGenerator: FlowchartGenerator;

    constructor(private readonly _extensionUri: vscode.Uri) {
        const aiService = AIService.getInstance();
        this.flowchartGenerator = new FlowchartGenerator(aiService);
    }

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        _context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken,
    ) {

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [
                this._extensionUri
            ]
        };

        webviewView.webview.html = this._getHtmlForWebview();

        webviewView.webview.onDidReceiveMessage(async message => {
            const aiService = AIService.getInstance();

            switch (message.command) {
                case 'sendMessage':
                    try {
                        // 发送"正在思考"状态
                        webviewView.webview.postMessage({
                            command: 'updateStatus',
                            status: 'thinking'
                        });

                        // 检查是否是流程图生成请求
                        const isFlowchartRequest = this.flowchartGenerator.isFlowchartRequest(message.text);

                        if (isFlowchartRequest) {
                            // 创建初始消息
                            webviewView.webview.postMessage({
                                command: 'startResponse'
                            });

                            // 生成流程图（简化版本）
                            try {
                                // 直接使用简单的Mermaid流程图生成
                                const mermaidCode = await this.flowchartGenerator.generateSimpleMermaidFlowchart(message.text, message.model);

                                // 发送流程图生成成功消息
                                webviewView.webview.postMessage({
                                    command: 'appendChunk',
                                    chunk: `シンプル形式のフローチャートを生成しました。\n\n\`\`\`mermaid\n${mermaidCode}\n\`\`\``
                                });

                                // 在新窗口中显示流程图 - 使用简单的新方法
                                this.showSimpleFlowchart(mermaidCode);

                                // 发送完成状态
                                webviewView.webview.postMessage({
                                    command: 'completeResponse',
                                    status: 'complete'
                                });
                            } catch (error) {
                                const errorMessage = error instanceof Error ? error.message : 'Unknown error';

                                // 根据错误类型提供更有意义的错误信息（日文）
                                let userFriendlyMessage = '';
                                if (errorMessage.includes('本地模型处理超时')) {
                                    userFriendlyMessage = `⏰ **ローカルモデルの処理タイムアウト**

現在のコードが複雑すぎるため、ローカルモデルでは合理的な時間内に分析を完了できません。

**推奨解決策：**
1. 🚀 **クラウドモデルを使用** - DeepSeek モデルを選択（処理能力が高い）
2. 🔧 **ローカルモデルをアップグレード** - より大きなモデル（codellama:34b など）を使用
3. ✂️ **コードを簡素化** - より小さなコード片段で分析を実行

**なぜこうなるのか？**
ローカル7Bモデルの処理能力は限られており、複雑なJavaコード分析にはより多くの時間と計算リソースが必要です。`;
                                } else if (errorMessage.includes('AI服务未配置')) {
                                    userFriendlyMessage = `⚙️ **AIサービスが未設定**

AIサービスに接続できません。設定を確認してください。

**解決方法：**
1. 右上の歯車アイコンをクリックして設定画面へ
2. DeepSeek APIキーまたはOllamaサービスアドレスを設定
3. ネットワーク接続が正常であることを確認`;
                                } else {
                                    userFriendlyMessage = `❌ **フローチャート生成に失敗しました**

${errorMessage}

**推奨事項：**
- コードの構文が正しいかを確認
- 異なるAIモデルを試してみる
- 問題が続く場合は、コードを簡素化して再試行`;
                                }

                                webviewView.webview.postMessage({
                                    command: 'appendChunk',
                                    chunk: userFriendlyMessage
                                });

                                webviewView.webview.postMessage({
                                    command: 'completeResponse',
                                    status: 'error'
                                });
                            }
                        } else {
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
                        }
                    } catch (error) {
                        webviewView.webview.postMessage({
                            command: 'receiveError',
                            error: error instanceof Error ? error.message : 'Unknown error',
                            status: 'error'
                        });
                    }
                    break;

                case 'getOllamaModels':
                    try {
                        // Ollamaモデルのリストを取得
                        const models = await aiService.refreshOllamaModels(message.url);

                        // モデルリストをWebViewに送信
                        webviewView.webview.postMessage({
                            command: 'ollamaModelsLoaded',
                            models: models
                        });
                    } catch (error) {
                        webviewView.webview.postMessage({
                            command: 'ollamaModelsError',
                            error: error instanceof Error ? error.message : 'Unknown error'
                        });
                    }
                    break;

                case 'selectOllamaModel':
                    // 選択されたモデルを保存（今後の実装のために）
                    console.log('Selected Ollama model:', message.model);
                    // ここでモデル選択の状態を保存する処理を追加できます
                    break;

                case 'selectCloudModel':
                    // 選択されたクラウドモデルを保存
                    console.log('Selected Cloud model:', message.model);
                    // ここでクラウドモデル選択の状態を保存する処理を追加できます
                    break;

                case 'selectModel':
                    // 統一モデル選択を保存
                    try {
                        const config = vscode.workspace.getConfiguration('itforceHelper');
                        await config.update('selectedModel', message.model, vscode.ConfigurationTarget.Global);
                        console.log('Selected model saved:', message.model);
                    } catch (error) {
                        console.error('Failed to save selected model:', error);
                    }
                    break;

                case 'getSelectedModel':
                    // 保存された選択モデルを取得
                    try {
                        const config = vscode.workspace.getConfiguration('itforceHelper');
                        const selectedModel = config.get<string>('selectedModel') || null;

                        webviewView.webview.postMessage({
                            command: 'selectedModelLoaded',
                            model: selectedModel
                        });
                    } catch (error) {
                        console.error('Failed to get selected model:', error);
                    }
                    break;

                case 'feedback':
                    // 处理反馈
                    console.log(`Received ${message.type} feedback for message:`, message.message);
                    // 这里可以添加将反馈发送到服务器的逻辑
                    break;

                case 'saveCloudApiSettings':
                    try {
                        // 保存云端API设置到VSCode配置
                        const config = vscode.workspace.getConfiguration('itforceHelper');
                        await config.update('cloudApiUrl', message.apiUrl, vscode.ConfigurationTarget.Global);
                        await config.update('cloudApiKey', message.apiKey, vscode.ConfigurationTarget.Global);

                        // 更新AIService的配置
                        const aiService = AIService.getInstance();
                        aiService.updateCloudApiSettings(message.apiUrl, message.apiKey);

                        console.log('Cloud API settings saved successfully');
                    } catch (error) {
                        console.error('Failed to save cloud API settings:', error);
                    }
                    break;

                case 'getCloudApiSettings':
                    try {
                        // 从VSCode配置读取云端API设置
                        const config = vscode.workspace.getConfiguration('itforceHelper');
                        const apiUrl = config.get<string>('cloudApiUrl') || 'https://api.deepseek.com/v1/chat/completions';
                        const apiKey = config.get<string>('cloudApiKey') || '';

                        // 发送设置到WebView
                        webviewView.webview.postMessage({
                            command: 'cloudApiSettingsLoaded',
                            apiUrl: apiUrl,
                            apiKey: apiKey
                        });
                    } catch (error) {
                        console.error('Failed to get cloud API settings:', error);
                    }
                    break;

                case 'getCloudModels':
                    try {
                        // 获取云端模型列表
                        const models = await aiService.refreshCloudModels();

                        // 发送模型列表到WebView
                        webviewView.webview.postMessage({
                            command: 'cloudModelsLoaded',
                            models: models
                        });
                    } catch (error) {
                        webviewView.webview.postMessage({
                            command: 'cloudModelsError',
                            error: error instanceof Error ? error.message : 'Unknown error'
                        });
                    }
                    break;

                case 'refreshCloudModelsWithSettings':
                    try {
                        // 先更新API设置
                        aiService.updateCloudApiSettings(message.apiUrl, message.apiKey);

                        // 保存到VSCode配置
                        const config = vscode.workspace.getConfiguration('itforceHelper');
                        await config.update('cloudApiUrl', message.apiUrl, vscode.ConfigurationTarget.Global);
                        await config.update('cloudApiKey', message.apiKey, vscode.ConfigurationTarget.Global);

                        // 获取云端模型列表
                        const models = await aiService.refreshCloudModels();

                        // 发送模型列表到WebView
                        webviewView.webview.postMessage({
                            command: 'cloudModelsLoaded',
                            models: models
                        });
                    } catch (error) {
                        webviewView.webview.postMessage({
                            command: 'cloudModelsError',
                            error: error instanceof Error ? error.message : 'Unknown error'
                        });
                    }
                    break;

                case 'getAllModels':
                    try {
                        // 获取所有可用模型（Ollama + 云端）
                        const allModels = aiService.getAllAvailableModels();

                        // 发送所有模型列表到WebView
                        webviewView.webview.postMessage({
                            command: 'allModelsLoaded',
                            models: allModels
                        });
                    } catch (error) {
                        webviewView.webview.postMessage({
                            command: 'allModelsError',
                            error: error instanceof Error ? error.message : 'Unknown error'
                        });
                    }
                    break;
            }
        });
    }

    /**
     * 显示简单的流程图
     */
    private showSimpleFlowchart(mermaidCode: string) {
        console.log('=== Creating simple flowchart panel ===');
        console.log('Mermaid code length:', mermaidCode.length);
        console.log('Mermaid code preview:', mermaidCode.substring(0, 100) + '...');

        // 创建新的WebView面板
        const panel = vscode.window.createWebviewPanel(
            'simpleFlowchart',
            'フローチャート',
            vscode.ViewColumn.Beside,
            {
                enableScripts: true,
                retainContextWhenHidden: true
            }
        );

        // 设置HTML内容
        panel.webview.html = this._getSimpleFlowchartHtml(mermaidCode);

        console.log('Simple flowchart panel created successfully');
    }

    /**
     * 获取简单流程图的HTML
     */
    private _getSimpleFlowchartHtml(mermaidCode: string): string {
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
                        padding: 0;
                        background-color: var(--vscode-editor-background);
                        color: var(--vscode-editor-foreground);
                        font-family: var(--vscode-font-family);
                        overflow: hidden;
                        height: 100vh;
                    }

                    .toolbar {
                        position: fixed;
                        top: 10px;
                        right: 10px;
                        z-index: 1000;
                        display: flex;
                        gap: 8px;
                        background: var(--vscode-editor-background);
                        padding: 8px;
                        border-radius: 6px;
                        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
                        border: 1px solid var(--vscode-panel-border);
                    }

                    .toolbar button {
                        background: var(--vscode-button-background);
                        color: var(--vscode-button-foreground);
                        border: none;
                        padding: 6px 12px;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 12px;
                        display: flex;
                        align-items: center;
                        gap: 4px;
                    }

                    .toolbar button:hover {
                        background: var(--vscode-button-hoverBackground);
                    }

                    .toolbar button:disabled {
                        opacity: 0.5;
                        cursor: not-allowed;
                    }

                    .zoom-info {
                        background: var(--vscode-editor-background);
                        color: var(--vscode-editor-foreground);
                        padding: 4px 8px;
                        border-radius: 4px;
                        font-size: 12px;
                        border: 1px solid var(--vscode-panel-border);
                    }

                    .container {
                        width: 100%;
                        height: 100vh;
                        position: relative;
                        overflow: hidden;
                        cursor: grab;
                    }

                    .container.dragging {
                        cursor: grabbing;
                    }

                    .mermaid-container {
                        position: absolute;
                        background-color: white;
                        border-radius: 8px;
                        padding: 20px;
                        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                        transform-origin: center center;
                        transition: transform 0.1s ease-out;
                        min-width: 300px;
                        min-height: 200px;
                    }

                    .loading {
                        position: absolute;
                        top: 50%;
                        left: 50%;
                        transform: translate(-50%, -50%);
                        padding: 40px;
                        color: var(--vscode-editor-foreground);
                        opacity: 0.7;
                        text-align: center;
                    }

                    .error {
                        position: absolute;
                        top: 50%;
                        left: 50%;
                        transform: translate(-50%, -50%);
                        color: var(--vscode-errorForeground);
                        background-color: var(--vscode-inputValidation-errorBackground);
                        border: 1px solid var(--vscode-inputValidation-errorBorder);
                        padding: 16px;
                        border-radius: 4px;
                        max-width: 400px;
                        text-align: center;
                    }

                    .title {
                        position: fixed;
                        top: 10px;
                        left: 10px;
                        font-size: 16px;
                        font-weight: bold;
                        color: var(--vscode-editor-foreground);
                        background: var(--vscode-editor-background);
                        padding: 8px 12px;
                        border-radius: 6px;
                        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
                        border: 1px solid var(--vscode-panel-border);
                        z-index: 1000;
                    }
                </style>
            </head>
            <body>
                <div class="title">フローチャート</div>

                <div class="toolbar">
                    <button id="zoomIn" title="拡大">🔍+</button>
                    <button id="zoomOut" title="縮小">🔍-</button>
                    <button id="resetZoom" title="リセット">⚡</button>
                    <div class="zoom-info" id="zoomInfo">100%</div>
                    <button id="fitToScreen" title="画面に合わせる">📐</button>
                    <button id="saveImage" title="画像として保存">💾</button>
                    <button id="copyImage" title="クリップボードにコピー">📋</button>
                </div>

                <div class="container" id="container">
                    <div class="mermaid-container" id="mermaidContainer">
                        <div class="loading" id="loading">フローチャートを生成中...</div>
                        <div class="mermaid" id="mermaid-diagram" style="display: none;">
                            ${mermaidCode}
                        </div>
                        <div class="error" id="error" style="display: none;">
                            フローチャートの生成に失敗しました。
                        </div>
                    </div>
                </div>

                <script>
                    console.log('=== Simple Flowchart WebView Starting ===');

                    // 状态变量
                    let currentZoom = 1;
                    let isDragging = false;
                    let dragStart = { x: 0, y: 0 };
                    let currentTranslate = { x: 0, y: 0 };

                    // 初始化Mermaid
                    mermaid.initialize({
                        startOnLoad: false,
                        theme: 'default',
                        flowchart: {
                            useMaxWidth: false,
                            htmlLabels: true
                        }
                    });

                    console.log('Mermaid initialized');
                    console.log('Mermaid code to render:', \`${mermaidCode}\`);

                    // 更新变换
                    function updateTransform() {
                        const container = document.getElementById('mermaidContainer');
                        container.style.transform = \`translate(\${currentTranslate.x}px, \${currentTranslate.y}px) scale(\${currentZoom})\`;
                        document.getElementById('zoomInfo').textContent = Math.round(currentZoom * 100) + '%';
                    }

                    // 缩放功能
                    function zoomIn() {
                        currentZoom = Math.min(currentZoom * 1.2, 5);
                        updateTransform();
                    }

                    function zoomOut() {
                        currentZoom = Math.max(currentZoom / 1.2, 0.1);
                        updateTransform();
                    }

                    function resetZoom() {
                        currentZoom = 1;
                        currentTranslate = { x: 0, y: 0 };
                        updateTransform();
                        centerDiagram();
                    }

                    // 居中显示
                    function centerDiagram() {
                        const container = document.getElementById('container');
                        const mermaidContainer = document.getElementById('mermaidContainer');
                        const containerRect = container.getBoundingClientRect();
                        const mermaidRect = mermaidContainer.getBoundingClientRect();

                        currentTranslate.x = (containerRect.width - mermaidRect.width) / 2;
                        currentTranslate.y = (containerRect.height - mermaidRect.height) / 2;
                        updateTransform();
                    }

                    // 适应屏幕
                    function fitToScreen() {
                        const container = document.getElementById('container');
                        const mermaidContainer = document.getElementById('mermaidContainer');
                        const containerRect = container.getBoundingClientRect();
                        const mermaidRect = mermaidContainer.getBoundingClientRect();

                        const scaleX = (containerRect.width * 0.9) / mermaidRect.width;
                        const scaleY = (containerRect.height * 0.9) / mermaidRect.height;
                        currentZoom = Math.min(scaleX, scaleY, 1);

                        currentTranslate.x = (containerRect.width - mermaidRect.width * currentZoom) / 2;
                        currentTranslate.y = (containerRect.height - mermaidRect.height * currentZoom) / 2;
                        updateTransform();
                    }

                    // 保存为图片
                    async function saveAsImage() {
                        try {
                            const svg = document.querySelector('#mermaid-diagram svg');
                            if (!svg) return;

                            const canvas = document.createElement('canvas');
                            const ctx = canvas.getContext('2d');
                            const svgData = new XMLSerializer().serializeToString(svg);
                            const img = new Image();

                            img.onload = function() {
                                canvas.width = img.width;
                                canvas.height = img.height;
                                ctx.fillStyle = 'white';
                                ctx.fillRect(0, 0, canvas.width, canvas.height);
                                ctx.drawImage(img, 0, 0);

                                const link = document.createElement('a');
                                link.download = 'flowchart.png';
                                link.href = canvas.toDataURL();
                                link.click();
                            };

                            img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
                        } catch (error) {
                            console.error('Save image failed:', error);
                        }
                    }

                    // 复制到剪贴板
                    async function copyToClipboard() {
                        try {
                            const svg = document.querySelector('#mermaid-diagram svg');
                            if (!svg) return;

                            const canvas = document.createElement('canvas');
                            const ctx = canvas.getContext('2d');
                            const svgData = new XMLSerializer().serializeToString(svg);
                            const img = new Image();

                            img.onload = async function() {
                                canvas.width = img.width;
                                canvas.height = img.height;
                                ctx.fillStyle = 'white';
                                ctx.fillRect(0, 0, canvas.width, canvas.height);
                                ctx.drawImage(img, 0, 0);

                                canvas.toBlob(async (blob) => {
                                    await navigator.clipboard.write([
                                        new ClipboardItem({ 'image/png': blob })
                                    ]);
                                    console.log('Image copied to clipboard');
                                });
                            };

                            img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
                        } catch (error) {
                            console.error('Copy to clipboard failed:', error);
                        }
                    }

                    // 拖拽功能
                    function setupDragAndDrop() {
                        const container = document.getElementById('container');

                        container.addEventListener('mousedown', (e) => {
                            isDragging = true;
                            dragStart.x = e.clientX - currentTranslate.x;
                            dragStart.y = e.clientY - currentTranslate.y;
                            container.classList.add('dragging');
                        });

                        document.addEventListener('mousemove', (e) => {
                            if (!isDragging) return;
                            currentTranslate.x = e.clientX - dragStart.x;
                            currentTranslate.y = e.clientY - dragStart.y;
                            updateTransform();
                        });

                        document.addEventListener('mouseup', () => {
                            isDragging = false;
                            container.classList.remove('dragging');
                        });

                        // 鼠标滚轮缩放
                        container.addEventListener('wheel', (e) => {
                            e.preventDefault();
                            const delta = e.deltaY > 0 ? 0.9 : 1.1;
                            currentZoom = Math.max(0.1, Math.min(5, currentZoom * delta));
                            updateTransform();
                        });
                    }

                    // 渲染流程图
                    async function renderFlowchart() {
                        try {
                            const loadingEl = document.getElementById('loading');
                            const diagramEl = document.getElementById('mermaid-diagram');
                            const errorEl = document.getElementById('error');
                            const mermaidContainer = document.getElementById('mermaidContainer');

                            console.log('Starting to render mermaid diagram...');

                            // 验证Mermaid代码
                            const mermaidCode = \`${mermaidCode}\`;
                            if (!mermaidCode || mermaidCode.trim().length === 0) {
                                throw new Error('Mermaid code is empty');
                            }

                            console.log('Mermaid code validated, length:', mermaidCode.length);

                            // 渲染图表
                            const { svg } = await mermaid.render('flowchart-diagram', mermaidCode);

                            console.log('Mermaid rendering successful');

                            // 显示结果
                            loadingEl.style.display = 'none';
                            diagramEl.innerHTML = svg;
                            diagramEl.style.display = 'block';

                            // 初始化位置
                            setTimeout(() => {
                                centerDiagram();
                                setupDragAndDrop();
                            }, 100);

                            console.log('Flowchart displayed successfully');

                        } catch (error) {
                            console.error('Error rendering flowchart:', error);

                            const loadingEl = document.getElementById('loading');
                            const errorEl = document.getElementById('error');

                            loadingEl.style.display = 'none';
                            errorEl.style.display = 'block';
                            errorEl.textContent = 'フローチャートの生成に失敗しました: ' + error.message;
                        }
                    }

                    // 事件监听器
                    document.addEventListener('DOMContentLoaded', () => {
                        // 工具栏按钮事件
                        document.getElementById('zoomIn').addEventListener('click', zoomIn);
                        document.getElementById('zoomOut').addEventListener('click', zoomOut);
                        document.getElementById('resetZoom').addEventListener('click', resetZoom);
                        document.getElementById('fitToScreen').addEventListener('click', fitToScreen);
                        document.getElementById('saveImage').addEventListener('click', saveAsImage);
                        document.getElementById('copyImage').addEventListener('click', copyToClipboard);

                        // 键盘快捷键
                        document.addEventListener('keydown', (e) => {
                            if (e.ctrlKey || e.metaKey) {
                                switch (e.key) {
                                    case '=':
                                    case '+':
                                        e.preventDefault();
                                        zoomIn();
                                        break;
                                    case '-':
                                        e.preventDefault();
                                        zoomOut();
                                        break;
                                    case '0':
                                        e.preventDefault();
                                        resetZoom();
                                        break;
                                    case 's':
                                        e.preventDefault();
                                        saveAsImage();
                                        break;
                                }
                            }
                        });

                        console.log('DOM loaded, starting render...');
                        renderFlowchart();
                    });

                    // 如果DOM已经加载完成，立即渲染
                    if (document.readyState === 'loading') {
                        console.log('DOM is loading, waiting for DOMContentLoaded...');
                    } else {
                        console.log('DOM already loaded, rendering immediately...');
                        renderFlowchart();
                    }
                </script>
            </body>
            </html>
        `;
    }

    private _getHtmlForWebview(): string {
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
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
                    }

                    .chat-container {
                        flex: 1;
                        overflow-y: auto;
                        padding: 16px;
                        box-sizing: border-box;
                        background-color: var(--vscode-editor-background);
                    }

                    .message {
                        margin: 16px 0;
                        padding: 12px 16px;
                        border-radius: 6px;
                        max-width: 100%;
                        word-wrap: break-word;
                        position: relative;
                        animation: fadeIn 0.3s ease-in-out;
                    }

                    @keyframes fadeIn {
                        from { opacity: 0; transform: translateY(10px); }
                        to { opacity: 1; transform: translateY(0); }
                    }

                    .user-message {
                        background-color: var(--vscode-editor-background);
                        border: 1px solid var(--vscode-panel-border);
                        margin-left: 0;
                        margin-right: 0;
                        padding-left: 36px;
                        position: relative;
                    }

                    .user-message::before {
                        content: "";
                        position: absolute;
                        left: 10px;
                        top: 12px;
                        width: 16px;
                        height: 16px;
                        background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpath d='M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2'%3e%3c/path%3e%3ccircle cx='12' cy='7' r='4'%3e%3c/circle%3e%3c/svg%3e");
                        background-repeat: no-repeat;
                        background-position: center;
                        opacity: 0.7;
                    }

                    .ai-message {
                        background-color: var(--vscode-editor-selectionBackground);
                        color: var(--vscode-editor-foreground);
                        border-left: 2px solid var(--vscode-activityBarBadge-background);
                        margin-left: 0;
                        margin-right: 0;
                        padding-left: 36px;
                        position: relative;
                    }

                    .ai-message::before {
                        content: "";
                        position: absolute;
                        left: 10px;
                        top: 12px;
                        width: 16px;
                        height: 16px;
                        background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpath d='M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z'%3e%3c/path%3e%3ccircle cx='8' cy='16' r='1'%3e%3c/circle%3e%3ccircle cx='16' cy='16' r='1'%3e%3c/circle%3e%3cpath d='M9 12h6'%3e%3c/path%3e%3c/svg%3e");
                        background-repeat: no-repeat;
                        background-position: center;
                        opacity: 0.7;
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
                        flex: 0 0 auto;
                        border-top: 1px solid var(--vscode-panel-border);
                        padding: 12px;
                        background: var(--vscode-editor-background);
                        box-sizing: border-box;
                    }

                    .input-wrapper {
                        display: flex;
                        flex-direction: column;
                        width: 100%;
                    }

                    .input-row {
                        display: flex;
                        position: relative;
                        width: 100%;
                        margin-bottom: 8px;
                    }

                    #messageInput {
                        width: 100%;
                        min-height: 40px;
                        max-height: 200px;
                        padding: 10px 40px 10px 12px;
                        border: 1px solid var(--vscode-input-border);
                        background: var(--vscode-input-background);
                        color: var(--vscode-input-foreground);
                        resize: vertical;
                        box-sizing: border-box;
                        border-radius: 4px;
                        font-family: inherit;
                        font-size: 13px;
                        transition: border-color 0.2s, box-shadow 0.2s;
                    }

                    .model-selector-row {
                        display: flex;
                        width: 100%;
                        gap: 8px;
                        border-top: 1px solid var(--vscode-panel-border);
                        padding-top: 8px;
                    }

                    #outputFormatSelect {
                        flex: 1;
                        max-width: 60%;
                    }

                    #modelSelect {
                        flex: 1;
                        max-width: 40%;
                    }

                    #outputFormatSelect, #modelSelect {
                        padding: 6px 10px;
                        background: var(--vscode-dropdown-background);
                        color: var(--vscode-dropdown-foreground);
                        border: 1px solid var(--vscode-dropdown-border);
                        border-radius: 4px;
                        height: 28px;
                        cursor: pointer;
                        font-size: 12px;
                        appearance: none;
                        background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
                        background-repeat: no-repeat;
                        background-position: right 6px center;
                        background-size: 12px;
                        padding-right: 24px;
                        text-overflow: ellipsis;
                        white-space: nowrap;
                        overflow: hidden;
                    }

                    #sendButton {
                        position: absolute;
                        right: 8px;
                        bottom: 8px;
                        background: none;
                        border: none;
                        color: var(--vscode-button-background);
                        cursor: pointer;
                        padding: 4px;
                        border-radius: 4px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        transition: all 0.2s ease;
                    }

                    #sendButton svg {
                        width: 16px;
                        height: 16px;
                    }

                    #sendButton:hover {
                        background-color: rgba(255, 255, 255, 0.1);
                    }

                    #sendButton:disabled {
                        opacity: 0.4;
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

                    /* ヘッダースタイル */
                    .header {
                        display: flex;
                        justify-content: flex-end;
                        align-items: center;
                        padding: 10px 16px;
                        background-color: var(--vscode-editor-background);
                        border-bottom: 1px solid var(--vscode-panel-border);
                        height: 40px;
                    }

                    .actions {
                        display: flex;
                        gap: 8px;
                    }

                    .icon-button {
                        background: none;
                        border: none;
                        color: var(--vscode-foreground);
                        opacity: 0.7;
                        cursor: pointer;
                        padding: 4px;
                        border-radius: 4px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        transition: all 0.2s ease;
                    }

                    .icon-button:hover {
                        opacity: 1;
                        background-color: rgba(255, 255, 255, 0.1);
                    }

                    .icon-button:disabled {
                        opacity: 0.3;
                        cursor: not-allowed;
                    }

                    .icon-button svg {
                        width: 16px;
                        height: 16px;
                    }

                    .tab-content {
                        display: none;
                        height: calc(100vh - 42px); /* タブの高さを引く */
                    }

                    .tab-content.active {
                        display: flex;
                        flex-direction: column;
                        animation: fadeIn 0.2s ease-in-out;
                    }

                    /* 設定パネルのスタイル */
                    .settings-container {
                        padding: 16px;
                        overflow-y: auto;
                        height: 100%;
                        background-color: var(--vscode-editor-background);
                    }

                    .settings-group {
                        margin-bottom: 16px;
                        background: var(--vscode-editor-background);
                        border-radius: 6px;
                        border: 1px solid var(--vscode-panel-border);
                        overflow: hidden;
                    }

                    .settings-title {
                        font-weight: 500;
                        font-size: 13px;
                        color: var(--vscode-foreground);
                        padding: 8px 16px;
                        background-color: rgba(255, 255, 255, 0.05);
                        border-bottom: 1px solid var(--vscode-panel-border);
                        display: flex;
                        align-items: center;
                    }

                    .settings-title::before {
                        content: "";
                        display: inline-block;
                        width: 16px;
                        height: 16px;
                        margin-right: 8px;
                    }

                    .settings-title {
                        position: relative;
                    }

                    .settings-title svg {
                        position: absolute;
                        left: 16px;
                        top: 50%;
                        transform: translateY(-50%);
                        width: 16px;
                        height: 16px;
                        stroke: var(--vscode-foreground);
                    }

                    .settings-row {
                        display: flex;
                        align-items: center;
                        padding: 12px 16px;
                        gap: 12px;
                        flex-wrap: nowrap;
                    }

                    .settings-row label {
                        min-width: 90px;
                        font-size: 13px;
                        color: var(--vscode-foreground);
                        white-space: nowrap;
                    }

                    .settings-row input {
                        flex: 1;
                        min-width: 0; /* 防止input元素溢出 */
                        padding: 6px 10px;
                        background: var(--vscode-input-background);
                        color: var(--vscode-input-foreground);
                        border: 1px solid var(--vscode-input-border);
                        border-radius: 4px;
                        font-size: 13px;
                        height: 28px;
                        transition: border-color 0.2s, box-shadow 0.2s;
                    }

                    .settings-row input:focus {
                        outline: none;
                        border-color: var(--vscode-focusBorder);
                        box-shadow: 0 0 0 1px var(--vscode-focusBorder);
                    }

                    .settings-row button {
                        padding: 6px 12px;
                        background: var(--vscode-button-background);
                        color: var(--vscode-button-foreground);
                        border: none;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 12px;
                        height: 28px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        transition: background-color 0.2s;
                        white-space: nowrap;
                        flex-shrink: 0; /* 防止按钮被压缩 */
                        min-width: 80px;
                    }

                    .icon-only-button {
                        min-width: 32px !important;
                        width: 32px;
                        height: 32px;
                        padding: 0 !important;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        border: 1px solid var(--vscode-button-background);
                    }

                    .icon-only-button svg {
                        width: 16px;
                        height: 16px;
                        stroke: var(--vscode-button-foreground);
                    }

                    .settings-row button:not(.icon-only-button)::before {
                        content: "";
                        display: inline-block;
                        width: 16px;
                        height: 16px;
                        margin-right: 6px;
                        background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='1 4 1 10 7 10'%3e%3c/polyline%3e%3cpolyline points='23 20 23 14 17 14'%3e%3c/polyline%3e%3cpath d='M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15'%3e%3c/path%3e%3c/svg%3e");
                        background-repeat: no-repeat;
                        background-position: center;
                    }

                    .settings-row button:hover {
                        background: var(--vscode-button-hoverBackground);
                    }

                    .model-list {
                        max-height: 300px;
                        overflow-y: auto;
                        background: var(--vscode-editor-background);
                        padding: 8px 0;
                    }

                    .model-item {
                        padding: 8px 16px;
                        cursor: pointer;
                        transition: all 0.15s ease;
                        font-size: 13px;
                        display: flex;
                        align-items: center;
                        border-left: 2px solid transparent;
                    }

                    .model-item {
                        position: relative;
                        padding-left: 32px;
                    }

                    .model-item svg {
                        position: absolute;
                        left: 8px;
                        top: 50%;
                        transform: translateY(-50%);
                        width: 16px;
                        height: 16px;
                        stroke: var(--vscode-foreground);
                        opacity: 0.7;
                    }

                    .model-item:hover {
                        background-color: var(--vscode-list-hoverBackground);
                    }

                    .model-item.selected {
                        background-color: var(--vscode-list-activeSelectionBackground);
                        color: var(--vscode-list-activeSelectionForeground);
                        font-weight: 500;
                        border-left-color: var(--vscode-button-background);
                    }

                    .model-item.selected::before {
                        opacity: 1;
                    }

                    /* 自定义滚动条样式 */
                    .model-list::-webkit-scrollbar {
                        width: 6px;
                    }

                    .model-list::-webkit-scrollbar-track {
                        background: transparent;
                    }

                    .model-list::-webkit-scrollbar-thumb {
                        background: var(--vscode-scrollbarSlider-background);
                        border-radius: 3px;
                    }

                    .model-list::-webkit-scrollbar-thumb:hover {
                        background: var(--vscode-scrollbarSlider-hoverBackground);
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="actions">
                        <button class="icon-button" id="newChatButton" title="新しいチャット">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <line x1="12" y1="5" x2="12" y2="19"></line>
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                            </svg>
                        </button>
                        <button class="icon-button" id="userProfileButton" title="ユーザープロフィール" disabled>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                <circle cx="12" cy="7" r="4"></circle>
                            </svg>
                        </button>
                        <button class="icon-button" id="settingsButton" title="設定">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <circle cx="12" cy="12" r="3"></circle>
                                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                            </svg>
                        </button>
                    </div>
                </div>

                <div id="chatTab" class="tab-content active">
                    <div id="chatContainer" class="chat-container"></div>

                    <div class="input-container">
                        <div class="input-wrapper">
                            <div class="input-row">
                                <textarea id="messageInput" placeholder="メッセージを入力してください..."></textarea>
                                <button id="sendButton" onclick="sendMessage()" title="送信">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <line x1="22" y1="2" x2="11" y2="13"></line>
                                        <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                                    </svg>
                                </button>
                            </div>
                            <div class="model-selector-row">
                                <select id="outputFormatSelect" disabled style="opacity: 0.5;">
                                    <option value="simple" selected>シンプルMermaid（現在のみ対応）</option>
                                </select>
                                <select id="modelSelect">
                                    <optgroup label="クラウドモデル" id="cloudModels">
                                        <option value="no-cloud-models" disabled>クラウドモデルが見つかりません</option>
                                    </optgroup>
                                    <optgroup label="Ollama モデル" id="ollamaModels">
                                        <option value="no-models" disabled>読み込み中...</option>
                                    </optgroup>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                <div id="settingsTab" class="tab-content">
                    <div class="settings-container">
                        <!-- 出力形式設定 -->
                        <div class="settings-group">
                            <div class="settings-title">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M9 12l2 2 4-4"></path>
                                    <path d="M21 12c-1 0-3-1-3-3s2-3 3-3 3 1 3 3-2 3-3 3"></path>
                                    <path d="M3 12c1 0 3-1 3-3s-2-3-3-3-3 1-3 3 2 3 3 3"></path>
                                </svg>
                                出力形式
                            </div>
                            <div class="settings-row">
                                <label for="outputFormatConfig">形式:</label>
                                <select id="outputFormatConfig">
                                    <option value="simple" selected>シンプルMermaid</option>
                                    <option value="standard" disabled>標準Mermaid（未実装）</option>
                                    <option value="json" disabled>JSON形式（未実装）</option>
                                    <option value="enhanced" disabled>拡張Mermaid+JSON（未実装）</option>
                                </select>
                            </div>
                        </div>

                        <!-- Ollama設定 -->
                        <div class="settings-group">
                            <div class="settings-title">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <circle cx="12" cy="12" r="3"></circle>
                                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                                </svg>
                                ローカルモデル (Ollama)
                            </div>
                            <div class="settings-row">
                                <label for="ollamaUrl">URL:</label>
                                <div style="display: flex; flex: 1; gap: 8px;">
                                    <input type="text" id="ollamaUrl" value="http://localhost:11434" style="flex: 1;" />
                                    <button id="refreshModelsBtn" title="更新" class="icon-only-button">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                            <path d="M23 4v6h-6"></path>
                                            <path d="M1 20v-6h6"></path>
                                            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10"></path>
                                            <path d="M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
                                        </svg>
                                    </button>
                                </div>
                            </div>
                            <div class="model-list" id="modelListContainer">
                                <div class="loading" style="padding: 12px; text-align: center; color: var(--vscode-descriptionForeground);">
                                    <div style="margin-bottom: 8px;">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="animation: spin 1s linear infinite;">
                                            <circle cx="12" cy="12" r="10"></circle>
                                            <path d="M12 6v6l4 2"></path>
                                        </svg>
                                    </div>
                                    ローカルモデルを読み込み中...
                                </div>
                            </div>
                        </div>

                        <!-- クラウドAI設定 -->
                        <div class="settings-group">
                            <div class="settings-title">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                                    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
                                </svg>
                                クラウドモデル
                            </div>
                            <div class="settings-row">
                                <label for="cloudApiUrl">API URL:</label>
                                <div style="display: flex; flex: 1; gap: 8px;">
                                    <input type="text" id="cloudApiUrl" value="https://api.deepseek.com/v1/chat/completions" placeholder="https://api.deepseek.com/v1/chat/completions" style="flex: 1;" />
                                    <button id="refreshCloudModelsBtn" class="icon-only-button" title="更新">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                            <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path>
                                            <path d="M21 3v5h-5"></path>
                                            <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path>
                                            <path d="M3 21v-5h5"></path>
                                        </svg>
                                    </button>
                                </div>
                            </div>
                            <div class="settings-row">
                                <label for="cloudApiKey">API Key:</label>
                                <input type="password" id="cloudApiKey" placeholder="sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" />
                            </div>
                            <div class="model-list" id="cloudModelListContainer">
                                <div class="loading" style="padding: 12px; text-align: center; color: var(--vscode-descriptionForeground);">
                                    <div style="margin-bottom: 8px;">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="animation: spin 1s linear infinite;">
                                            <circle cx="12" cy="12" r="10"></circle>
                                            <path d="M12 6v6l4 2"></path>
                                        </svg>
                                    </div>
                                    クラウドモデルを読み込み中...
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <style>
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                </style>

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
                        const outputFormat = document.getElementById('outputFormatSelect').value;

                        // 禁用发送按钮
                        sendButton.disabled = true;

                        addMessageToChat(text, 'user');

                        vscode.postMessage({
                            command: 'sendMessage',
                            text: text,
                            model: model,
                            outputFormat: outputFormat
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
                        retryButton.innerHTML = '🔄 再試行';
                        retryButton.onclick = (e) => {
                            e.stopPropagation();
                            const menu = retryDropdown.querySelector('.retry-menu');
                            menu.classList.toggle('show');
                        };

                        const retryMenu = document.createElement('div');
                        retryMenu.className = 'retry-menu';

                        // 获取当前选择的模型
                        const currentModel = document.getElementById('modelSelect').value;

                        // 动态获取所有可用模型
                        const models = [];

                        // 添加云端模型
                        const cloudOptgroup = document.getElementById('cloudModels');
                        if (cloudOptgroup) {
                            Array.from(cloudOptgroup.options).forEach(option => {
                                if (!option.disabled && option.value !== 'no-cloud-models') {
                                    models.push({ value: option.value, label: '☁ ' + option.textContent });
                                }
                            });
                        }

                        // 添加Ollama模型
                        const ollamaOptgroup = document.getElementById('ollamaModels');
                        if (ollamaOptgroup) {
                            Array.from(ollamaOptgroup.options).forEach(option => {
                                if (!option.disabled && option.value !== 'no-models') {
                                    models.push({ value: option.value, label: '🏠 ' + option.textContent });
                                }
                            });
                        }

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
                                currentAiMessage = addMessageToChat('AIが考えています...', 'ai', true);
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
                                            copyButton.textContent = 'コピー';
                                            copyButton.onclick = async () => {
                                                try {
                                                    await navigator.clipboard.writeText(block.textContent || '');
                                                    copyButton.textContent = 'コピー完了！';
                                                    setTimeout(() => {
                                                        copyButton.textContent = 'コピー';
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
                                addMessageToChat(\`エラー: \${message.error}\`, 'ai');
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
                        const outputFormat = document.getElementById('outputFormatSelect').value;

                        // 发送消息
                        vscode.postMessage({
                            command: 'sendMessage',
                            text: questionText,
                            model: selectedModel,
                            outputFormat: outputFormat
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

                    // 設定ボタンの機能
                    document.getElementById('settingsButton').addEventListener('click', () => {
                        const chatTab = document.getElementById('chatTab');
                        const settingsTab = document.getElementById('settingsTab');

                        if (settingsTab.classList.contains('active')) {
                            // 設定タブが表示されている場合はチャットタブに切り替え
                            settingsTab.classList.remove('active');
                            chatTab.classList.add('active');
                        } else {
                            // チャットタブが表示されている場合は設定タブに切り替え
                            chatTab.classList.remove('active');
                            settingsTab.classList.add('active');
                        }
                    });

                    // 新しいチャットボタンの機能
                    document.getElementById('newChatButton').addEventListener('click', () => {
                        // チャット履歴をクリア
                        document.getElementById('chatContainer').innerHTML = '';
                        // 設定タブが表示されている場合はチャットタブに切り替え
                        document.getElementById('settingsTab').classList.remove('active');
                        document.getElementById('chatTab').classList.add('active');
                    });

                    // 選択されたモデルを保存する変数
                    let selectedModel = null;

                    // Ollamaモデルの読み込み
                    async function loadOllamaModels() {
                        try {
                            // VSCodeにモデル取得リクエストを送信
                            vscode.postMessage({
                                command: 'getOllamaModels',
                                url: document.getElementById('ollamaUrl').value
                            });
                        } catch (error) {
                            console.error('モデル読み込みエラー:', error);
                        }
                    }

                    // モデル更新ボタンのイベントリスナー
                    document.getElementById('refreshModelsBtn').addEventListener('click', loadOllamaModels);

                    // クラウドモデル更新ボタンのイベントリスナー
                    document.getElementById('refreshCloudModelsBtn').addEventListener('click', loadCloudModels);

                    // 统一模型选择逻辑 - 处理本地和云端模型的选择
                    function selectModel(modelValue, modelType) {
                        selectedModel = modelValue;

                        // 清除所有模型的选择状态
                        document.querySelectorAll('.model-item').forEach(item => {
                            item.classList.remove('selected');
                        });

                        // 设置当前选择的模型为选中状态
                        const currentItem = document.querySelector(\`[data-model="\${modelValue}"]\`);
                        if (currentItem) {
                            currentItem.classList.add('selected');
                        }

                        // 保存選択したモデル
                        vscode.postMessage({
                            command: 'selectModel',
                            model: modelValue
                        });

                        // チャットページのモデル選択器を更新
                        updateChatModelSelector();
                    }

                    // チャットページのモデル選択器を更新
                    function updateChatModelSelector() {
                        const modelSelect = document.getElementById('modelSelect');

                        // 選択されたモデルを設定
                        if (selectedModel) {
                            modelSelect.value = selectedModel;
                        } else {
                            // 選択されたモデルがない場合、最初の利用可能なモデルを選択
                            const firstOption = modelSelect.querySelector('option:not([disabled])');
                            if (firstOption) {
                                selectedModel = firstOption.value;
                                modelSelect.value = selectedModel;
                            }
                        }
                    }

                    // クラウドモデルの読み込み
                    async function loadCloudModels() {
                        try {
                            const button = document.getElementById('refreshCloudModelsBtn');
                            button.disabled = true;
                            button.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="animation: spin 1s linear infinite;"><circle cx="12" cy="12" r="10"></circle><path d="M12 6v6l4 2"></path></svg>';

                            // 先保存当前的API设置
                            const apiUrl = document.getElementById('cloudApiUrl').value;
                            const apiKey = document.getElementById('cloudApiKey').value;

                            // 发送API设置更新和模型获取请求
                            vscode.postMessage({
                                command: 'refreshCloudModelsWithSettings',
                                apiUrl: apiUrl,
                                apiKey: apiKey
                            });
                        } catch (error) {
                            console.error('クラウドモデル読み込みエラー:', error);
                        }
                    }

                    // クラウドAPI設定の保存
                    function saveCloudApiSettings() {
                        const apiUrl = document.getElementById('cloudApiUrl').value;
                        const apiKey = document.getElementById('cloudApiKey').value;

                        vscode.postMessage({
                            command: 'saveCloudApiSettings',
                            apiUrl: apiUrl,
                            apiKey: apiKey
                        });
                    }

                    // クラウドAPI設定の入力フィールドにイベントリスナーを追加
                    document.getElementById('cloudApiUrl').addEventListener('blur', saveCloudApiSettings);
                    document.getElementById('cloudApiKey').addEventListener('blur', saveCloudApiSettings);

                    // 設定の初期化
                    function initializeSettings() {
                        vscode.postMessage({
                            command: 'getCloudApiSettings'
                        });
                    }

                    // Ollamaモデルリストの更新
                    function updateModelList(models) {
                        const container = document.getElementById('modelListContainer');
                        if (models.length === 0) {
                            container.innerHTML = \`
                                <div class="empty" style="padding: 16px; text-align: center; color: var(--vscode-descriptionForeground);">
                                    <div style="margin-bottom: 8px;">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                            <circle cx="12" cy="12" r="10"></circle>
                                            <line x1="8" y1="12" x2="16" y2="12"></line>
                                        </svg>
                                    </div>
                                    利用可能なローカルモデルがありません
                                </div>\`;
                            return;
                        }

                        let html = '';
                        models.forEach(model => {
                            html += \`<div class="model-item" data-model="\${model}" data-type="ollama">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z"></path>
                                    <circle cx="8" cy="16" r="1"></circle>
                                    <circle cx="16" cy="16" r="1"></circle>
                                    <path d="M9 12h6"></path>
                                </svg>
                                \${model}
                            </div>\`;
                        });

                        container.innerHTML = html;

                        // モデル選択イベントの設定
                        document.querySelectorAll('#modelListContainer .model-item').forEach(item => {
                            item.addEventListener('click', () => {
                                const modelName = item.getAttribute('data-model');
                                const modelValue = \`ollama:\${modelName}\`;
                                selectModel(modelValue, 'ollama');
                            });
                        });
                    }

                    // クラウドモデルリストの更新
                    function updateCloudModelList(models) {
                        const container = document.getElementById('cloudModelListContainer');
                        if (models.length === 0) {
                            container.innerHTML = \`
                                <div class="empty" style="padding: 16px; text-align: center; color: var(--vscode-descriptionForeground);">
                                    <div style="margin-bottom: 8px;">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                            <circle cx="12" cy="12" r="10"></circle>
                                            <line x1="8" y1="12" x2="16" y2="12"></line>
                                        </svg>
                                    </div>
                                    利用可能なクラウドモデルがありません
                                </div>\`;
                            return;
                        }

                        let html = '';
                        models.forEach(model => {
                            html += \`<div class="model-item" data-model="\${model}" data-type="cloud">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                                    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
                                </svg>
                                \${model}
                            </div>\`;
                        });

                        container.innerHTML = html;

                        // モデル選択イベントの設定
                        document.querySelectorAll('#cloudModelListContainer .model-item').forEach(item => {
                            item.addEventListener('click', () => {
                                const modelValue = item.getAttribute('data-model');
                                selectModel(modelValue, 'cloud');
                            });
                        });
                    }

                    // ドロップダウンの更新
                    function updateModelDropdown(models, selectedModel = null) {
                        const optgroup = document.getElementById('ollamaModels');
                        optgroup.innerHTML = '';

                        if (models.length === 0) {
                            const option = document.createElement('option');
                            option.value = 'no-models';
                            option.disabled = true;
                            option.textContent = 'モデルが見つかりません';
                            optgroup.appendChild(option);
                            return;
                        }

                        models.forEach(model => {
                            const option = document.createElement('option');
                            option.value = \`ollama:\${model}\`;
                            option.textContent = model;
                            if (selectedModel === model) {
                                option.selected = true;
                            }
                            optgroup.appendChild(option);
                        });
                    }

                    // Ollamaドロップダウンで選択されたモデルを設定（モデルリストは変更しない）
                    function setSelectedOllamaModelInDropdown(selectedModel) {
                        const optgroup = document.getElementById('ollamaModels');

                        if (optgroup) {
                            // 全ての選択状態をクリア
                            Array.from(optgroup.options).forEach(option => {
                                option.selected = false;
                            });

                            // 指定されたモデルを選択状態にする
                            const targetValue = \`ollama:\${selectedModel}\`;
                            const targetOption = Array.from(optgroup.options).find(option => option.value === targetValue);
                            if (targetOption) {
                                targetOption.selected = true;
                                document.getElementById('modelSelect').value = targetValue;
                            }
                        }
                    }

                    // 保存されたモデルデータ
                    let currentOllamaModels = [];
                    let currentCloudModels = [];

                    // VSCodeからのメッセージ処理を拡張
                    window.addEventListener('message', event => {
                        const message = event.data;

                        // Ollamaモデルリスト受信処理を追加
                        if (message.command === 'ollamaModelsLoaded') {
                            const models = message.models || [];
                            currentOllamaModels = models;
                            updateModelDropdown(models);
                            updateModelList(models);
                            updateChatModelSelector();
                        } else if (message.command === 'ollamaModelsError') {
                            currentOllamaModels = [];
                            updateModelList([]);
                            updateChatModelSelector();
                        } else if (message.command === 'cloudApiSettingsLoaded') {
                            // クラウドAPI設定を画面に反映
                            if (message.apiUrl) {
                                document.getElementById('cloudApiUrl').value = message.apiUrl;
                            }
                            if (message.apiKey) {
                                document.getElementById('cloudApiKey').value = message.apiKey;
                            }
                        } else if (message.command === 'cloudModelsLoaded') {
                            // クラウドモデルリスト受信処理
                            const models = message.models || [];
                            currentCloudModels = models;
                            updateCloudModelDropdown(models);
                            updateCloudModelList(models);
                            updateChatModelSelector();
                            resetCloudModelsButton();
                        } else if (message.command === 'cloudModelsError') {
                            console.error('クラウドモデル取得エラー:', message.error);
                            currentCloudModels = [];
                            updateCloudModelList([]);
                            updateCloudModelDropdown([]);
                            updateChatModelSelector();
                            resetCloudModelsButton();
                        } else if (message.command === 'selectedModelLoaded') {
                            // 保存された選択モデルを復元
                            selectedModel = message.model;
                            updateChatModelSelector();
                        }
                    });

                    // クラウドモデルドロップダウンの更新
                    function updateCloudModelDropdown(models) {
                        const cloudOptgroup = document.getElementById('cloudModels');

                        if (cloudOptgroup) {
                            cloudOptgroup.innerHTML = '';

                            if (models.length === 0) {
                                const option = document.createElement('option');
                                option.value = 'no-cloud-models';
                                option.disabled = true;
                                option.textContent = 'クラウドモデルが見つかりません';
                                cloudOptgroup.appendChild(option);
                            } else {
                                models.forEach(model => {
                                    const option = document.createElement('option');
                                    option.value = model;
                                    option.textContent = model;
                                    cloudOptgroup.appendChild(option);
                                });
                            }
                        }
                    }

                    // ドロップダウンで選択されたモデルを設定（モデルリストは変更しない）
                    function setSelectedModelInDropdown(selectedModel) {
                        const modelSelect = document.getElementById('modelSelect');
                        const cloudOptgroup = document.getElementById('cloudModels');

                        if (cloudOptgroup) {
                            // 全ての選択状態をクリア
                            Array.from(cloudOptgroup.options).forEach(option => {
                                option.selected = false;
                            });

                            // 指定されたモデルを選択状態にする
                            const targetOption = Array.from(cloudOptgroup.options).find(option => option.value === selectedModel);
                            if (targetOption) {
                                targetOption.selected = true;
                                modelSelect.value = selectedModel;
                            }
                        }
                    }

                    // 全モデルドロップダウンの更新
                    function updateAllModelDropdowns(allModels) {
                        updateCloudModelList(allModels.cloud);
                        updateCloudModelDropdown(allModels.cloud);
                        updateModelList(allModels.ollama);
                        updateModelDropdown(allModels.ollama);
                    }

                    // クラウドモデルボタンのリセット
                    function resetCloudModelsButton() {
                        const button = document.getElementById('refreshCloudModelsBtn');
                        button.disabled = false;
                        button.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path><path d="M21 3v5h-5"></path><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path><path d="M3 21v-5h5"></path></svg>';
                    }

                    // 初期ロード時にモデルを取得
                    setTimeout(() => {
                        loadOllamaModels();
                        loadCloudModels();
                        // 保存された選択モデルを取得
                        vscode.postMessage({ command: 'getSelectedModel' });
                    }, 1000);

                    // 初期ロード時に設定を取得
                    setTimeout(initializeSettings, 500);
                </script>
            </body>
            </html>
        `;
    }
}
