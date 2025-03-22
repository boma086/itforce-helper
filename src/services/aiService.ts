import * as vscode from 'vscode';
import { DeepSeekAdapter, ClaudeAdapter } from '../modals/adapters';

export class AIService {
    private static instance: AIService;
    private deepseekAdapter: DeepSeekAdapter;
    private claudeAdapter: ClaudeAdapter;

    private constructor() {
        const config = vscode.workspace.getConfiguration('itforceHelper');
        
        // 添加调试日志
        console.log('Environment API Key:', process.env.DEEPSEEK_API_KEY);
        console.log('Config API Key:', config.get<string>('deepseekApiKey'));
        
        // 获取 API 密钥
        const deepseekApiKey = config.get<string>('deepseekApiKey') || process.env.DEEPSEEK_API_KEY || '';
        const deepseekApiUrl = config.get<string>('deepseekApiUrl') || 'https://api.deepseek.com/v1/chat/completions';

        // 添加调试日志
        console.log('Final API Key:', deepseekApiKey ? '已设置' : '未设置');
        console.log('API URL:', deepseekApiUrl);
        
        this.deepseekAdapter = new DeepSeekAdapter(deepseekApiKey, deepseekApiUrl);
        this.claudeAdapter = new ClaudeAdapter(config.get<string>('claudeApiKey') || '');
    }

    public static getInstance(): AIService {
        if (!AIService.instance) {
            AIService.instance = new AIService();
        }
        return AIService.instance;
    }

    public async generateResponse(model: string, prompt: string): Promise<string> {
        try {
            console.log('Generating response for model:', model); // 添加调试日志
            
            switch (model) {
                case 'DeepSeek AI':
                    return await this.deepseekAdapter.generateResponse(prompt);
                case 'Claude':
                    return await this.claudeAdapter.generateResponse(prompt);
                default:
                    throw new Error(`Unsupported model: ${model}`);
            }
        } catch (error) {
            console.error('AI Service error:', error);
            throw error;
        }
    }
}
