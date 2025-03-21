// src/commands/safeExecutor.ts
import { exec } from 'child_process';

class SafeCommandExecutor {
  private whitelist = ['npm', 'git', 'echo'];

  async execute(cmd: string) {
    const [baseCmd] = cmd.split(' ');
    if (!this.whitelist.includes(baseCmd)) {
      throw new Error(`禁止执行未授权的命令: ${baseCmd}`);
    }
    
    return new Promise((resolve, reject) => {
      exec(cmd, (error, stdout) => {
        if (error) reject(error);
        else resolve(stdout);
      });
    });
  }
}
