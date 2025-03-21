import * as vscode from 'vscode';

// 临时定义 DeepSeek API 配置接口
interface DeepSeekConfig {
  apiKey: string;
  apiUrl: string;
}

// 获取 DeepSeek 配置
function getDeepSeekConfig(): DeepSeekConfig {
  const config = vscode.workspace.getConfiguration('itforceHelper');
  const configApiKey = config.get<string>('deepseekApiKey');
  // 这里可能在某处添加了花括号
  const envApiKey = process.env.DEEPSEEK_API_KEY;
  
  // 直接输出原始值看看
  console.log('Raw DEEPSEEK_API_KEY:', process.env.DEEPSEEK_API_KEY);
  
  const finalApiKey = configApiKey || envApiKey || '';

  return {
    apiKey: finalApiKey,
    apiUrl: config.get<string>('deepseekApiUrl') || 'https://api.deepseek.com/chat/completions'
  };
}

// 激活插件时的操作
export function activate(context: vscode.ExtensionContext) {
  const outputChannel = vscode.window.createOutputChannel('ITForce Helper');
  outputChannel.show();
  outputChannel.appendLine('ITForce Helper 插件已激活！');
  
  // 添加环境变量调试信息
  outputChannel.appendLine(`DEEPSEEK_API_KEY 环境变量状态: ${process.env.DEEPSEEK_API_KEY ? '已设置' : '未设置'}`);
  
  // 现有的 helloWorld 命令
  const helloWorldCommand = vscode.commands.registerCommand('itforce-helper.helloWorld', () => {
    vscode.window.showInformationMessage('Hello World from itforce!');
  });

  // 新增 generate 命令：获取用户输入并发送到 AI
  const generateCommand = vscode.commands.registerCommand('itforce-helper.generate', async () => {
    // 弹出选择框，让用户选择与哪个 AI 交互
    const aiChoice = await vscode.window.showQuickPick(
      [
        { label: 'DeepSeek AI', description: '(支持)' },
        { label: 'OpenAI', description: '(开发中)' },
        { label: 'AI B', description: '(开发中)' }
      ],
      { 
        placeHolder: '选择 AI 服务进行交互',
        ignoreFocusOut: true
      }
    );

    if (!aiChoice) {
      vscode.window.showWarningMessage('未选择 AI 服务！');
      return;
    }

    if (aiChoice.label !== 'DeepSeek AI') {
      vscode.window.showWarningMessage(`${aiChoice.label} 服务正在开发中，目前仅支持 DeepSeek AI！`);
      return;
    }

    // 获取用户输入的 prompt
    const prompt = await vscode.window.showInputBox({
      placeHolder: "请输入您想要生成的内容",
      ignoreFocusOut: true
    });

    if (!prompt) {
      vscode.window.showWarningMessage('未提供 prompt！');
      return;
    }

    try {
      // 根据选择的 AI 类型，调用不同的接口
      const generatedCode = await callAI(aiChoice.label, prompt);
      
      // 显示返回的 AI 内容
      vscode.window.showInformationMessage(`AI 生成的内容: ${generatedCode}`);

      // 插入生成的代码到当前编辑器
      const editor = vscode.window.activeTextEditor;
      if (editor) {
        await editor.edit(editBuilder => {
          editBuilder.insert(editor.selection.active, generatedCode);
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      vscode.window.showErrorMessage(`调用 AI 错误: ${errorMessage}`);
      console.error('AI 调用详细错误:', error);
    }
  });

  // 注册命令
  context.subscriptions.push(helloWorldCommand, generateCommand);
}

// DeepSeek AI 实现
async function generateWithDeepSeekAI(prompt: string): Promise<string> {
  const outputChannel = vscode.window.createOutputChannel('ITForce Helper');
  outputChannel.show(); // Ensure the output channel is visible
  try {
    let { apiKey, apiUrl } = getDeepSeekConfig();
    
    // Remove curly braces from the API key if present
    apiKey = apiKey.replace(/[{}]/g, '');

    console.log('实际API Key:', apiKey);
    outputChannel.appendLine(`实际API Key: ${apiKey}`);
    console.log('Authorization header:', `Bearer ${apiKey}`);
    outputChannel.appendLine(`Authorization header: Bearer ${apiKey}`);

    if (!apiKey) {
      throw new Error('未找到 DeepSeek API Key。请在环境变量 DEEPSEEK_API_KEY 中设置，或在 VS Code 设置中配置');
    }

    const headers = {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': 'ITForce-Helper/1.0',
    };

    console.log('完整请求headers:', headers);
    outputChannel.appendLine(`完整请求headers: ${JSON.stringify(headers)}`);

    outputChannel.appendLine(`Input prompt: ${prompt}`);

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: "You are a helpful coding assistant." },
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
        stream: false
      })
    });

    console.log('Response status:', response.status);
    outputChannel.appendLine(`Response status: ${response.status}`);
    if (!response.ok) {
      const errorText = await response.text();
      console.log('Error response:', errorText);
      outputChannel.appendLine(`Error response: ${errorText}`);
      throw new Error(`API 请求失败: ${response.status} - ${errorText}`);
    }

    const data = await response.json() as { 
      id: string;
      object: string;
      created: number;
      model: string;
      choices: { index: number; message: { role: string; content: string } }[];
      usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
      system_fingerprint: string;
    };

    outputChannel.appendLine('Response received successfully');
    outputChannel.appendLine(`Response ID: ${data.id}`);
    outputChannel.appendLine(`Model: ${data.model}`);
    outputChannel.appendLine(`Usage: ${JSON.stringify(data.usage)}`);

    if (!data.choices || !data.choices[0] || !data.choices[0].message || !data.choices[0].message.content) {
      outputChannel.appendLine(`Unexpected response format: ${JSON.stringify(data)}`);
      throw new Error('API 返回格式错误');
    }

    const outputContent = data.choices[0].message.content;
    outputChannel.appendLine(`Output content: ${outputContent}`);

    return outputContent;
  } catch (error) {
    outputChannel.appendLine(`Error details: ${error instanceof Error ? error.stack : String(error)}`);
    throw new Error(`DeepSeek AI 调用失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
}

// 调用不同的 AI 接口
async function callAI(aiChoice: string, prompt: string): Promise<string> {
  switch (aiChoice) {
    case 'DeepSeek AI':
      return await generateWithDeepSeekAI(prompt);
    case 'OpenAI':
      throw new Error('OpenAI 服务正在开发中');
    default:
      throw new Error('不支持的 AI 服务');
  }
}

export function deactivate() {}
