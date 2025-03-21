import * as assert from 'assert';
import * as vscode from 'vscode';
import { DeepSeekAdapter } from '../modals/adapters';
import { PlanningAgent } from '../agents/planningAgent';

suite('ITForce Helper Test Suite', () => {
    // Setup before running tests
    suiteSetup(async () => {
        const ext = vscode.extensions.getExtension('itforce-helper');
        await ext?.activate();
    });

    vscode.window.showInformationMessage('开始测试');

    // 测试配置是否正确加载
    test('Configuration Test', () => {
        const config = vscode.workspace.getConfiguration('itforceHelper');
        assert.notStrictEqual(config.get('deepseekApiUrl'), undefined);
        assert.strictEqual(typeof config.get('autoValidate'), 'boolean');
    });

    // 测试 DeepSeek 适配器
    test('DeepSeek Adapter Test', async () => {
        const adapter = new DeepSeekAdapter('test-key', 'test-url');
        try {
            await adapter.generateResponse('test prompt');
            assert.fail('Should throw error with invalid API key');
        } catch (error) {
            assert.ok(error instanceof Error);
        }
    });

    // 测试 Planning Agent
    test('Planning Agent Test', () => {
        const agent = PlanningAgent.getInstance();
        assert.ok(agent instanceof PlanningAgent);
    });

    // 测试命令
    test('Command Registration Test', async () => {
        const commands = await vscode.commands.getCommands();
        assert.ok(commands.includes('itforce-helper.helloWorld'));
        assert.ok(commands.includes('itforce-helper.generate'));
    });
});
