import * as vscode from 'vscode';
import { DeepSeekAdapter } from '../modals/adapters';

interface PlanStep {
    type: 'FILE_EDIT' | 'COMMAND';
    content: string;
    path?: string;
}

export class PlanningAgent {
    private static instance: PlanningAgent;
    private model: DeepSeekAdapter;

    private constructor() {
        const config = vscode.workspace.getConfiguration('itforceHelper');
        const apiKey = config.get<string>('deepseekApiKey') || '';
        const apiUrl = config.get<string>('deepseekApiUrl') || '';
        this.model = new DeepSeekAdapter(apiKey, apiUrl);
    }

    public static getInstance(): PlanningAgent {
        if (!PlanningAgent.instance) {
            PlanningAgent.instance = new PlanningAgent();
        }
        return PlanningAgent.instance;
    }

    async createPlan(userPrompt: string): Promise<string> {
        const planPrompt = `
            用户需求：${userPrompt}
            请按步骤分解任务，包含：
            1. 需要修改的文件列表
            2. 终端命令执行序列
            3. 代码变更描述
        `;
        return this.model.generateResponse(planPrompt);
    }

    private parsePlan(plan: string): PlanStep[] {
        // TODO: 实现计划解析逻辑
        const steps: PlanStep[] = [];
        // 简单的解析示例
        const lines = plan.split('\n');
        for (const line of lines) {
            if (line.startsWith('文件:')) {
                steps.push({
                    type: 'FILE_EDIT',
                    content: line.substring(3).trim(),
                    path: line.substring(3).trim()
                });
            } else if (line.startsWith('命令:')) {
                steps.push({
                    type: 'COMMAND',
                    content: line.substring(3).trim()
                });
            }
        }
        return steps;
    }

    private async applyCodeChanges(step: PlanStep): Promise<void> {
        if (!step.path) return;
        
        // TODO: 实现文件修改逻辑
        console.log(`Applying changes to ${step.path}`);
    }

    private async executeCommand(step: PlanStep): Promise<void> {
        // TODO: 实现命令执行逻辑
        console.log(`Executing command: ${step.content}`);
    }

    async executePlan(plan: string): Promise<void> {
        const steps = this.parsePlan(plan);
        for (const step of steps) {
            if (step.type === 'FILE_EDIT') {
                await this.applyCodeChanges(step);
            } else if (step.type === 'COMMAND') {
                await this.executeCommand(step);
            }
        }
    }
}
