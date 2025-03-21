import * as fs from 'fs';
import * as crypto from 'crypto';
import * as vscode from 'vscode';

export class CheckpointManager {
    private static instance: CheckpointManager;
    private checkpoints = new Map<string, { path: string, content: string }>();

    private constructor() {}

    public static getInstance(): CheckpointManager {
        if (!CheckpointManager.instance) {
            CheckpointManager.instance = new CheckpointManager();
        }
        return CheckpointManager.instance;
    }

    async createCheckpoint(filePath: string): Promise<string> {
        try {
            const content = await fs.promises.readFile(filePath, 'utf-8');
            const checkpointId = crypto.randomUUID();
            this.checkpoints.set(checkpointId, { path: filePath, content });
            return checkpointId;
        } catch (error) {
            console.error('创建检查点失败:', error);
            throw new Error(`无法为文件 ${filePath} 创建检查点`);
        }
    }

    async restoreCheckpoint(checkpointId: string): Promise<void> {
        const checkpoint = this.checkpoints.get(checkpointId);
        if (!checkpoint) {
            throw new Error(`检查点 ${checkpointId} 不存在`);
        }

        try {
            await fs.promises.writeFile(checkpoint.path, checkpoint.content);
            vscode.window.showInformationMessage(`已恢复到检查点: ${checkpointId}`);
        } catch (error) {
            console.error('恢复检查点失败:', error);
            throw new Error(`无法恢复检查点 ${checkpointId}`);
        }
    }

    deleteCheckpoint(checkpointId: string): void {
        if (!this.checkpoints.has(checkpointId)) {
            throw new Error(`检查点 ${checkpointId} 不存在`);
        }
        this.checkpoints.delete(checkpointId);
    }
}
