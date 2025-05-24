import * as vscode from 'vscode';
import fetch from 'node-fetch';

export interface AIAdapter {
    generateResponse(model:string, prompt: string): Promise<string>;
}

export class DeepSeekAdapter implements AIAdapter {
    constructor(private apiKey: string, private apiUrl: string) {
        if (!this.apiUrl) {
            this.apiUrl = 'https://api.deepseek.com/v1/chat/completions';
        }
    }

    async* generateStreamResponse(model: string, prompt: string): AsyncGenerator<string> {
        try {
            if (!this.apiKey) {
                throw new Error('DeepSeek API key is not configured');
            }

            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: model,
                    messages: [{ role: "user", content: prompt }],
                    stream: true,
                    temperature: 0.1,  // 低温度，更严格遵循指令
                    max_tokens: 8000,  // 增加到8K tokens，适合复杂流程图生成
                    top_p: 0.9
                })
            });

            if (!response.ok) {
                throw new Error(`API request failed: ${response.status} ${response.statusText}`);
            }

            // Use response.body as a Node.js Readable stream
            for await (const chunk of response.body) {
                const text = chunk.toString();
                const lines = text.split('\n').filter(line => line.trim() !== '');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6);
                        if (data === '[DONE]') {continue;}

                        try {
                            const parsed = JSON.parse(data);
                            if (parsed.choices[0]?.delta?.content) {
                                yield parsed.choices[0].delta.content;
                            }
                        } catch (e) {
                            console.error('Failed to parse chunk:', e);
                        }
                    }
                }
            }
        } catch (error) {
            console.error('DeepSeek API error:', error);
            throw error;
        }
    }

    // 保持原有的方法以兼容性
    async generateResponse(model: string, prompt: string): Promise<string> {
        try {
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: model,
                    messages: [{ role: "user", content: prompt }],
                    stream: false,
                    temperature: 0.1,  // 低温度，更严格遵循指令
                    max_tokens: 8000,  // 增加到8K tokens，适合复杂流程图生成
                    top_p: 0.9
                })
            });

            if (!response.ok) {
                throw new Error(`API request failed: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            return data.choices[0].message.content;
        } catch (error) {
            console.error('DeepSeek API error:', error);
            throw error;
        }
    }
}

export class ClaudeAdapter implements AIAdapter {
    constructor(private apiKey: string) {}

    async generateResponse(model: string, prompt: string): Promise<string> {
        try {
            const response = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: {
                    'x-api-key': this.apiKey,
                    'anthropic-version': '2023-06-01',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: "claude-3-5-sonnet-20241022",  // 更新到最新的Claude模型
                    messages: [{ role: "user", content: prompt }],
                    max_tokens: 8000  // 增加到8K tokens
                })
            });

            if (!response.ok) {
                throw new Error(`API request failed: ${response.statusText}`);
            }

            const data = await response.json();
            return data.content[0].text;
        } catch (error) {
            console.error('Claude API error:', error);
            throw new Error('Failed to generate response from Claude');
        }
    }
}
