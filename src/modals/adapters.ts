import * as vscode from 'vscode';
import fetch from 'node-fetch';

export interface AIAdapter {
    generateResponse(prompt: string): Promise<string>;
}

export class DeepSeekAdapter implements AIAdapter {
    constructor(private apiKey: string, private apiUrl: string) {
        // 如果没有提供 apiUrl，使用默认值
        if (!this.apiUrl) {
            this.apiUrl = 'https://api.deepseek.com/v1/chat/completions';
        }
    }

    async generateResponse(prompt: string): Promise<string> {
        try {
            // 验证 API 密钥
            if (!this.apiKey) {
                throw new Error('DeepSeek API key is not configured');
            }

            console.log('Sending request to DeepSeek API:', this.apiUrl);
            
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: "deepseek-chat",
                    messages: [{ role: "user", content: prompt }]
                })
            });

            if (!response.ok) {
                const errorData = await response.text();
                console.error('DeepSeek API error response:', {
                    status: response.status,
                    statusText: response.statusText,
                    errorData
                });
                throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorData}`);
            }

            const data = await response.json();
            console.log('DeepSeek API response:', data);

            if (!data.choices || !data.choices[0] || !data.choices[0].message) {
                console.error('Unexpected API response structure:', data);
                throw new Error('Invalid response format from DeepSeek API');
            }

            return data.choices[0].message.content;
        } catch (error) {
            console.error('DeepSeek API error:', error);
            if (error instanceof Error) {
                throw new Error(`Failed to generate response from DeepSeek: ${error.message}`);
            }
            throw new Error('Failed to generate response from DeepSeek: Unknown error');
        }
    }
}

export class ClaudeAdapter implements AIAdapter {
    constructor(private apiKey: string) {}

    async generateResponse(prompt: string): Promise<string> {
        try {
            const response = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: {
                    'x-api-key': this.apiKey,
                    'anthropic-version': '2023-06-01',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: "claude-2",
                    messages: [{ role: "user", content: prompt }],
                    max_tokens: 4000
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
