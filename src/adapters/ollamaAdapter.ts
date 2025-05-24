import fetch from 'node-fetch';
import { AIAdapter } from './cloudAdapters';

export class OllamaAdapter implements AIAdapter {
    private baseUrl: string;

    constructor(baseUrl: string = 'http://localhost:11434') {
        this.baseUrl = baseUrl;
    }

    async getAvailableModels(): Promise<string[]> {
        try {
            console.log('简化版本：直接请求Ollama模型列表');

            // 简化版本：直接请求，不设置复杂的超时
            const response = await fetch(`${this.baseUrl}/api/tags`);

            if (!response.ok) {
                throw new Error(`Ollamaサーバーからのレスポンスエラー: ${response.status} ${response.statusText}`);
            }

            const data = await response.json() as any;
            console.log('Ollama API response:', JSON.stringify(data));

            // 检查响应格式并提取模型名称
            if (data && data.models && Array.isArray(data.models)) {
                // 如果models是对象数组，提取name属性
                if (data.models.length > 0 && typeof data.models[0] === 'object') {
                    return data.models.map((model: any) => model.name || '未知モデル');
                }
                // 如果models已经是字符串数组，直接返回
                return data.models;
            } else if (data && data.models) {
                // 如果models存在但不是数组，尝试转换
                console.warn('Unexpected models format:', data.models);
                return [String(data.models)];
            } else {
                // 尝试其他可能的响应格式
                const modelNames: string[] = [];

                // 检查是否有名为"models"的属性
                if (data) {
                    for (const key in data) {
                        if (key === 'models' && Array.isArray(data[key])) {
                            return data[key].map((model: any) =>
                                typeof model === 'object' ? (model.name || String(model)) : String(model)
                            );
                        }
                    }

                    // 检查顶级属性
                    for (const key in data) {
                        if (Array.isArray(data[key])) {
                            console.log('Found array property:', key);
                            modelNames.push(...data[key].map((item: any) =>
                                typeof item === 'object' ? (item.name || String(item)) : String(item)
                            ));
                        } else if (typeof data[key] === 'object' && data[key] !== null) {
                            console.log('Found object property:', key);
                            modelNames.push(key);
                        }
                    }
                }

                return modelNames.length > 0 ? modelNames : ['モデルが見つかりません'];
            }
        } catch (error) {
            console.error('Ollama models fetch error:', error);
            if (error instanceof Error) {
                throw new Error(`Ollamaサーバーからモデルリストを取得できませんでした: ${error.message}`);
            } else {
                throw new Error('Ollamaサーバーからモデルリストを取得できませんでした');
            }
        }
    }

    async generateResponse(model: string, prompt: string): Promise<string> {
        try {
            console.log('Ollama请求参数:', {
                model,
                promptLength: prompt.length,
                baseUrl: this.baseUrl
            });

            // 添加超时控制 - 本地模型需要更长时间
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 300000); // 5分钟超时

            const response = await fetch(`${this.baseUrl}/api/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                signal: controller.signal,
                body: JSON.stringify({
                    model,
                    prompt,
                    stream: false,
                    options: {
                        temperature: 0.05,   // 极低温度，严格遵循指令
                        top_p: 0.8,         // 限制输出随机性
                        top_k: 20,          // 减少候选词，更确定性
                        repeat_penalty: 1.3, // 强力减少重复
                        num_predict: 8000,  // 增加输出token限制（重要）
                        num_ctx: 16384,     // 大幅增加上下文窗口（关键）
                        stop: ["```", "\n\n---", "END", "STOP"] // 明确停止词
                    }
                }),
            });

            clearTimeout(timeoutId); // 清理超时

            const data = await response.json();
            console.log('Ollama响应状态:', response.status);
            console.log('Ollama响应数据:', {
                hasResponse: !!data.response,
                responseLength: data.response?.length || 0,
                responsePreview: data.response?.substring(0, 200) || 'No response'
            });

            return data.response || '';
        } catch (error) {
            console.error('Ollama generation error:', error);
            // 开发者日志用中文，但错误信息保持简洁，让上层处理用户友好的日文消息
            throw new Error('Ollamaモデルからの応答生成に失敗しました');
        }
    }

    async *generateStreamResponse(model: string, prompt: string): AsyncGenerator<string> {
        try {
            const response = await fetch(`${this.baseUrl}/api/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model,
                    prompt,
                    stream: true,
                    options: {
                        temperature: 0.05,   // 极低温度，严格遵循指令
                        top_p: 0.8,         // 限制输出随机性
                        top_k: 20,          // 减少候选词，更确定性
                        repeat_penalty: 1.3, // 强力减少重复
                        num_predict: 8000,  // 增加输出token限制（重要）
                        num_ctx: 16384,     // 大幅增加上下文窗口（关键）
                        stop: ["```", "\n\n---", "END", "STOP"] // 明确停止词
                    }
                }),
            });

            // node-fetch的ReadableStream不支持getReader()方法
            // 使用response.body作为Node.js的可读流
            if (!response.body) {
                throw new Error('レスポンスボディを読み取れません');
            }

            // 使用Node.js流处理
            let buffer = '';

            // 处理流数据
            for await (const chunk of response.body) {
                // 将Buffer转换为字符串
                const textChunk = chunk.toString('utf-8');
                buffer += textChunk;

                // JSONレスポンスを行ごとに処理
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    if (line.trim()) {
                        try {
                            const data = JSON.parse(line);
                            if (data.response) {
                                yield data.response;
                            }
                        } catch (e) {
                            console.warn('Invalid JSON in stream:', line);
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Ollama stream error:', error);
            throw new Error('Ollamaストリーミングに失敗しました');
        }
    }
}
