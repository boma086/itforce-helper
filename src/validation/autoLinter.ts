import * as vscode from 'vscode';
import { ESLint } from 'eslint';
import type { Linter } from 'eslint';

export class AutoLinter {
    private static instance: AutoLinter;
    private config: vscode.WorkspaceConfiguration;
    private eslint: ESLint;

    private constructor() {
        this.config = vscode.workspace.getConfiguration('itforceHelper');
        this.eslint = new ESLint({
            fix: true,  // 启用自动修复
            // useEslintrc: true  // 使用项目的 .eslintrc todo error
        });
    }

    public static getInstance(): AutoLinter {
        if (!AutoLinter.instance) {
            AutoLinter.instance = new AutoLinter();
        }
        return AutoLinter.instance;
    }

    private async validateCode(code: string): Promise<Linter.LintMessage[]> {
        try {
            const results = await this.eslint.lintText(code);
            return results[0]?.messages || [];
        } catch (error) {
            console.error('Lint error:', error);
            return [];
        }
    }

    private async fixErrors(code: string, errors: Linter.LintMessage[]): Promise<string> {
        try {
            const results = await this.eslint.lintText(code);
            const [{ output }] = results;
            return output || code;  // 如果没有修复，返回原始代码
        } catch (error) {
            console.error('Fix error:', error);
            return code;
        }
    }

    public async lint(document: vscode.TextDocument): Promise<void> {
        if (!this.config.get<boolean>('autoValidate')) {
            return;
        }

        const code = document.getText();
        const errors = await this.validateCode(code);
        
        if (errors.length > 0) {
            const fixedCode = await this.fixErrors(code, errors);
            if (fixedCode !== code) {
                const edit = new vscode.WorkspaceEdit();
                edit.replace(
                    document.uri,
                    new vscode.Range(
                        document.positionAt(0),
                        document.positionAt(code.length)
                    ),
                    fixedCode
                );
                
                try {
                    await vscode.workspace.applyEdit(edit);
                    vscode.window.showInformationMessage(
                        `已自动修复 ${errors.length} 个问题`
                    );
                } catch (error) {
                    console.error('Apply edit error:', error);
                    vscode.window.showErrorMessage('自动修复失败');
                }
            }
        }
    }
}
