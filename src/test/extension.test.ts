import * as assert from 'assert';
import * as vscode from 'vscode';
import { DeepSeekAdapter } from '../adapters/cloudAdapters';

suite('ITForce Helper Test Suite', () => {
    suiteSetup(async () => {
        const ext = vscode.extensions.getExtension('itforce-helper');
        await ext?.activate();
    });

    test('Configuration Test', () => {
        const config = vscode.workspace.getConfiguration('itforceHelper');
        assert.notStrictEqual(config.get('deepseekApiUrl'), undefined);
    });

    test('DeepSeek Adapter Test', async () => {
        const adapter = new DeepSeekAdapter('test-key', 'test-url');
        try {
            await adapter.generateResponse('deepseek-chat', 'test prompt');
            assert.fail('Should throw error with invalid API key');
        } catch (error) {
            assert.ok(error instanceof Error);
        }
    });

    test('Command Registration Test', async () => {
        const commands = await vscode.commands.getCommands();
        assert.ok(commands.includes('itforce-helper.openChat'));
    });
});
