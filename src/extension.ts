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
    const modelItems: vscode.QuickPickItem[] = [];

    // 添加云端模型
    try {
        const cloudModels = aiService.getAvailableCloudModels();
        if (cloudModels && cloudModels.length > 0) {
            cloudModels.forEach((model: string) => {
                modelItems.push({
                    label: `☁️ ${model}`,
                    description: 'クラウドAI',
                    detail: '高速で高品質なフローチャート生成',
                    picked: model === 'deepseek-chat' // 默认选择deepseek-chat
                });
            });
        } else {
            // 如果没有云端模型，添加默认的
            modelItems.push({
                label: '☁️ deepseek-chat',
                description: 'クラウドAI（推奨）',
                detail: '高速で高品質なフローチャート生成',
                picked: true
            });
        }
    } catch (error) {
        console.warn('Failed to get cloud models:', error);
        // 添加默认云端模型
        modelItems.push({
            label: '☁️ deepseek-chat',
            description: 'クラウドAI（推奨）',
            detail: '高速で高品質なフローチャート生成',
            picked: true
        });
    }

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
    if (selected.label.includes('☁️')) {
        // 云端模型
        const modelName = selected.label.replace('☁️ ', '');
        return modelName;
    } else {
        // Ollama模型
        const modelName = selected.label.replace('🏠 ', '');
        return `ollama:${modelName}`;
    }
}

/**
 * 创建流程图显示面板（使用增强版显示）
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

    // 使用增强版的流程图HTML（与聊天页面相同的功能）
    panel.webview.html = getEnhancedFlowchartHtml(mermaidCode);
}

/**
 * 生成增强版流程图HTML（与聊天页面功能一致）
 */
function getEnhancedFlowchartHtml(mermaidCode: string): string {
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
                console.log('=== Enhanced Flowchart WebView Starting ===');

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

export function deactivate() {}