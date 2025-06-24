import * as vscode from 'vscode';
import { DeepSeekAdapter, ClaudeAdapter } from '../adapters/cloudAdapters';
import { OllamaAdapter } from '../adapters/ollamaAdapter';

export class AIService {
    private static instance: AIService;
    private deepseekAdapter: DeepSeekAdapter;
    private claudeAdapter: ClaudeAdapter;
    private ollamaAdapter: OllamaAdapter;
    private ollamaUrl: string = 'http://localhost:11434';
    private availableOllamaModels: string[] = [];
    private availableCloudModels: string[] = [];

    private constructor() {
        const config = vscode.workspace.getConfiguration('itforceHelper');

        // 获取云端API配置（优先使用新的配置字段）
        const cloudApiKey = config.get<string>('cloudApiKey') || config.get<string>('deepseekApiKey') || process.env.DEEPSEEK_API_KEY || '';
        const cloudApiUrl = config.get<string>('cloudApiUrl') || config.get<string>('deepseekApiUrl') || 'https://api.deepseek.com/v1/chat/completions';

        this.deepseekAdapter = new DeepSeekAdapter(cloudApiKey, cloudApiUrl);
        this.claudeAdapter = new ClaudeAdapter(config.get<string>('claudeApiKey') || '');
        this.ollamaAdapter = new OllamaAdapter(config.get<string>('ollamaUrl') || this.ollamaUrl);

        // 初始化Ollama模型
        this.refreshOllamaModels().catch(() => {
            // 忽略初始化失败
        });

        // 初始化云端模型
        this.refreshCloudModels().catch(() => {
            // 忽略初始化失败
        });
    }

    public static getInstance(): AIService {
        if (!AIService.instance) {
            AIService.instance = new AIService();
        }
        return AIService.instance;
    }

    /**
     * 更新云端API设置
     */
    public updateCloudApiSettings(apiUrl: string, apiKey: string): void {
        try {
            // 更新DeepSeek适配器的配置
            this.deepseekAdapter = new DeepSeekAdapter(apiKey, apiUrl);
            console.log('Cloud API settings updated successfully');

            // 重新获取云端模型列表
            this.refreshCloudModels().catch(() => {
                console.warn('Failed to refresh cloud models after settings update');
            });
        } catch (error) {
            console.error('Failed to update cloud API settings:', error);
            throw error;
        }
    }



    /**
     * Ollamaの利用可能なモデルを更新します
     */
    public async refreshOllamaModels(customUrl?: string): Promise<string[]> {
        try {
            if (customUrl) {
                this.ollamaUrl = customUrl;
                this.ollamaAdapter = new OllamaAdapter(customUrl);
            }

            this.availableOllamaModels = await this.ollamaAdapter.getAvailableModels();
            console.log('Available Ollama models:', this.availableOllamaModels);
            return this.availableOllamaModels;
        } catch (error) {
            console.error('Failed to refresh Ollama models:', error);
            this.availableOllamaModels = [];
            throw error;
        }
    }

    /**
     * 利用可能なOllamaモデルのリストを取得します
     */
    public getAvailableOllamaModels(): string[] {
        return this.availableOllamaModels;
    }

    /**
     * 云端模型列表を更新します
     */
    public async refreshCloudModels(): Promise<string[]> {
        try {
            console.log('Refreshing cloud models...');
            this.availableCloudModels = await this.deepseekAdapter.getAvailableModels();
            console.log('Available cloud models:', this.availableCloudModels);
            return this.availableCloudModels;
        } catch (error) {
            console.error('Failed to refresh cloud models:', error);
            this.availableCloudModels = [];
            throw error;
        }
    }

    /**
     * 利用可能な云端モデルのリストを取得します
     */
    public getAvailableCloudModels(): string[] {
        return this.availableCloudModels;
    }

    /**
     * 所有可用模型（Ollama + 云端）を取得します
     */
    public getAllAvailableModels(): { ollama: string[], cloud: string[] } {
        return {
            ollama: this.availableOllamaModels,
            cloud: this.availableCloudModels
        };
    }

    /**
     * 指定されたモデルを使用して応答を生成します
     */
    public async generateResponse(model: string, prompt: string): Promise<string> {
        try {
            console.log('Generating response for model:', model); // 添加调试日志

            // Ollamaモデルの場合（ollama:modelname形式）
            if (model.startsWith('ollama:')) {
                const ollamaModel = model.substring(7); // 'ollama:'の後の部分を取得
                return await this.ollamaAdapter.generateResponse(ollamaModel, prompt);
            }

            switch (model) {
                case 'deepseek-chat':
                case 'deepseek-coder':
                case 'deepseek-reasoner':
                    return await this.deepseekAdapter.generateResponse(model, prompt);
                case 'Claude':
                    return await this.claudeAdapter.generateResponse('claude', prompt);
                default:
                    throw new Error(`Unsupported model: ${model}`);
            }
        } catch (error) {
            console.error('AI Service error:', error);
            throw error;
        }
    }

    /**
     * 指定されたモデルを使用してストリーミング応答を生成します
     */
    public async* generateStreamResponse(model: string, prompt: string): AsyncGenerator<string> {
        try {
            console.log('Generating stream response for model:', model);

            // Ollamaモデルの場合（ollama:modelname形式）
            if (model.startsWith('ollama:')) {
                const ollamaModel = model.substring(7); // 'ollama:'の後の部分を取得
                yield* this.ollamaAdapter.generateStreamResponse(ollamaModel, prompt);
                return;
            }

            switch (model) {
                case 'deepseek-chat':
                case 'deepseek-coder':
                case 'deepseek-reasoner':
                    yield* this.deepseekAdapter.generateStreamResponse(model, prompt);
                    break;
                default:
                    throw new Error(`Unsupported model: ${model}`);
            }
        } catch (error) {
            console.error('AI Service error:', error);
            throw error;
        }
    }
}
