import * as vscode from 'vscode';
import fetch from 'node-fetch';

export interface AIAdapter {
    generateResponse(prompt: string): Promise<string>;
}

export class DeepSeekAdapter implements AIAdapter {
    constructor(private apiKey: string, private apiUrl: string) {}

    async generateResponse(prompt: string): Promise<string> {
        try {
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
                throw new Error(`API request failed: ${response.statusText}`);
            }

            const data = await response.json();
            return data.choices[0].message.content;
        } catch (error) {
            console.error('DeepSeek API error:', error);
            throw new Error('Failed to generate response from DeepSeek');
        }
    }
}

export class ClaudeAdapter implements AIAdapter {
    constructor(private apiKey: string) {}

    async generateResponse(prompt: string): Promise<string> {
        try {
            const response = await fetch('https://api.anthropic.com/v1/complete', {
                method: 'POST',
                headers: {
                    'X-API-Key': this.apiKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    prompt: `\n\nHuman: ${prompt}\n\nAssistant:`,
                    max_tokens: 4000
                })
            });

            if (!response.ok) {
                throw new Error(`API request failed: ${response.statusText}`);
            }

            const data = await response.json();
            return data.completion;
        } catch (error) {
            console.error('Claude API error:', error);
            throw new Error('Failed to generate response from Claude');
        }
    }
}
