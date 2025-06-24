import * as vscode from 'vscode';

export class FlowchartGenerator {
    private outputChannel: vscode.OutputChannel;
    private aiService: any;

    constructor(aiService?: any) {
        this.outputChannel = vscode.window.createOutputChannel('Flowchart Generator');
        this.aiService = aiService;
    }

    /**
     * 检测是否为流程图请求
     */
    isFlowchartRequest(text: string): boolean {
        const flowchartKeywords = [
            'flowchart', 'flow chart', '流程图', 'mermaid',
            'diagram', 'graph', 'workflow', '工作流'
        ];

        return flowchartKeywords.some(keyword =>
            text.toLowerCase().includes(keyword.toLowerCase())
        );
    }

    /**
     * 生成简单的Mermaid流程图
     */
    async generateSimpleMermaidFlowchart(code: string, modelId?: string): Promise<string> {
        try {
            console.log('开始生成Mermaid流程图...');

            // 检测代码语言
            const language = this.detectLanguage(code);

            // 创建提示词
            const prompt = this.createSimplePrompt(code, language, modelId);
            console.log('提示词生成完成');

            // 如果有AI服务，使用AI生成
            if (this.aiService && modelId) {
                console.log('使用AI服务生成流程图');
                console.log('发送给AI的提示词长度:', prompt.length);
                console.log('提示词前50000字符:', prompt.substring(0, 50000));

                const response = await this.aiService.generateResponse(modelId, prompt);
                console.log('AI响应长度:', response.length);
                console.log('AI响应内容:', response);

                const extractedCode = this.extractMermaidCode(response);
                console.log('提取的Mermaid代码:', extractedCode);

                return extractedCode;
            }

            // 如果没有AI服务，直接抛出错误
            throw new Error('AI服务未配置');

        } catch (error) {
            console.error('生成流程图失败:', error);

            // 根据错误类型给出具体的错误信息
            if (error instanceof Error && error.message.includes('aborted') && this.isLikelyLocalModel(modelId)) {
                throw new Error(`本地模型处理超时。建议：
1. 使用更强的模型（如codellama:34b）
2. 减少代码复杂度
3. 使用云端模型（DeepSeek）`);
            }

            // 重新抛出原始错误，不生成无意义的回退流程图
            throw error;
        }
    }

    /**
     * 检测代码语言
     */
    private detectLanguage(code: string): string {
        if (/public\s+class|import\s+java/.test(code)) {
            return 'java';
        } else if (/function\s+|const\s+|let\s+|var\s+/.test(code)) {
            return 'javascript';
        } else if (/def\s+|import\s+\w+|from\s+\w+\s+import/.test(code)) {
            return 'python';
        } else if (/using\s+|namespace\s+|public\s+static\s+void\s+Main/.test(code)) {
            return 'csharp';
        }
        return 'unknown';
    }

    /**
     * 创建简单提示词
     */
    createSimplePrompt(code: string, language: string, modelId?: string): string {
        // 分析代码复杂度
        const codeAnalysis = this.analyzeCodeComplexity(code);
        console.log('代码分析结果:', codeAnalysis);

        // 对于大型代码，先进行预处理
        let processedCode = code;
        if (codeAnalysis.isLargeFile) {
            processedCode = this.preprocessLargeCode(code);
            console.log('大型代码预处理完成，从', code.length, '字符减少到', processedCode.length, '字符');
        }

        // 检测是否为本地模型
        const isLocalModel = this.isLikelyLocalModel(modelId);
        console.log('模型类型检测:', {
            modelId,
            isLocalModel,
            codeLength: processedCode.length,
            originalCodeLength: code.length
        });

        if (isLocalModel) {
            console.log('使用详细提示词（本地模型）');
            const prompt = this.createDetailedPromptForLocalModel(processedCode, language, codeAnalysis);
            console.log('本地模型提示词长度:', prompt.length);
            return prompt;
        } else {
            console.log('使用标准提示词（云端模型）');
            const prompt = this.createStandardPrompt(processedCode, language, codeAnalysis);
            console.log('云端模型提示词长度:', prompt.length);
            return prompt;
        }
    }

    /**
     * 检测是否可能是本地模型
     */
    private isLikelyLocalModel(modelId?: string): boolean {
        if (!modelId) {
            return false;
        }

        const localModelPatterns = [
            /^ollama:/,                    // Ollama模型
            /codellama/i,                  // CodeLlama
            /llama.*[1-9]b/i,             // 小于10B的Llama模型
            /mistral.*[1-9]b/i,           // 小于10B的Mistral模型
            /starcoder.*[1-9]b/i,         // 小于10B的StarCoder模型
            /qwen.*[1-9]b/i,              // 小于10B的Qwen模型
        ];

        return localModelPatterns.some(pattern => pattern.test(modelId));
    }

    /**
     * 分析代码复杂度和特征
     */
    private analyzeCodeComplexity(code: string) {
        const lines = code.split('\n');
        const lineCount = lines.length;
        const charCount = code.length;

        // 检测是否为大型文件（超过500行或25KB）
        const isLargeFile = lineCount > 500 || charCount > 25000;

        // 检测是否为自动生成的代码
        const isAutoGenerated = /auto generated|openapi-generator|do not edit/i.test(code);

        // 检测类型
        let classType: 'model' | 'service' | 'controller' | 'utility' | 'unknown' = 'unknown';
        if (/extends.*AbstractOpenApiSchema|@JsonProperty|@JsonDeserialize/i.test(code)) {
            classType = 'model';
        } else if (/@Service|@Component|@Repository/i.test(code)) {
            classType = 'service';
        } else if (/@Controller|@RestController/i.test(code)) {
            classType = 'controller';
        }

        // 提取主要方法（排除getter/setter）
        const methodMatches = Array.from(code.matchAll(/public\s+(?!static\s+final)(?:\w+\s+)*(\w+)\s*\([^)]*\)\s*\{/g));
        const mainMethods = methodMatches
            .map(m => m[1])
            .filter(method =>
                method &&
                !method.startsWith('get') &&
                !method.startsWith('set') &&
                !method.startsWith('is') &&
                !['equals', 'hashCode', 'toString', 'clone'].includes(method)
            )
            .slice(0, 10);

        // 检测是否有业务逻辑
        const hasBusinessLogic = mainMethods.length > 0 ||
            /if\s*\(|for\s*\(|while\s*\(|switch\s*\(/g.test(code);

        return {
            isLargeFile,
            isAutoGenerated,
            hasBusinessLogic,
            mainMethods,
            classType,
            lineCount,
            charCount
        };
    }

    /**
     * 简单的代码预处理（可选）
     */
    private preprocessLargeCode(code: string): string {
        console.log('开始预处理代码...');
        console.log('原始代码:', code.length, '字符,', code.split('\n').length, '行');

        // 简单过滤：移除明显无用的行
        const filteredCode = this.simpleCodeFilter(code);
        console.log('过滤后:', filteredCode.length, '字符,', filteredCode.split('\n').length, '行');

        return filteredCode;
    }

    /**
     * 简单的代码过滤器
     */
    private simpleCodeFilter(code: string): string {
        const lines = code.split('\n');
        const filteredLines: string[] = [];

        for (const line of lines) {
            const trimmed = line.trim();

            // 跳过import语句（对流程图无意义）
            if (trimmed.startsWith('import ')) {
                continue;
            }

            // 跳过空行和注释
            if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) {
                continue;
            }

            // 保留其他所有行
            filteredLines.push(line);
        }

        return filteredLines.join('\n');
    }

    /**
     * 标准提示词（适用于大模型）- 要求详细流程图
     */
    private createStandardPrompt(code: string, language: string, analysis: any): string {
        const contextInfo = this.buildContextInfo(analysis);

        return `
You are an expert code analyzer. Create a COMPREHENSIVE and DETAILED Mermaid flowchart for the following ${language} code.

${contextInfo}

REQUIREMENTS FOR COMPREHENSIVE FLOWCHART:
1. Include ALL methods and functions in the code
2. Show ALL conditional statements (if/else, switch, ternary)
3. Include ALL loops (for, while, foreach, do-while) with proper loop flow
4. Show method calls and their relationships
5. Include error handling flows (try/catch, exceptions)
6. Show variable assignments and important operations
7. Include return statements and exit points
8. Show class constructors and initialization
9. Include validation and business logic flows

CRITICAL SYNTAX RULES - NO EXCEPTIONS:
1. Start with "flowchart TD" - NEVER use "graph TD"
2. NEVER EVER use "subgraph" - it is COMPLETELY FORBIDDEN
3. NEVER use parentheses () ANYWHERE - they break the parser
4. Use descriptive but concise node names
5. Use --> for arrows

EXAMPLE OF COMPREHENSIVE FLOWCHART:
flowchart TD
    Start[Start] --> Constructor[Initialize class]
    Constructor --> SetDefaults[Set default values]
    SetDefaults --> ValidateInput{Input parameters valid}
    ValidateInput -->|No| ThrowException[Throw IllegalArgumentException]
    ValidateInput -->|Yes| ProcessMethod1[Execute main method]
    ProcessMethod1 --> CheckCondition1{Check business condition}
    CheckCondition1 -->|True| ExecuteBranch1[Execute branch 1]
    CheckCondition1 -->|False| ExecuteBranch2[Execute branch 2]
    ExecuteBranch1 --> LoopStart[Initialize loop]
    LoopStart --> LoopCondition{More items to process}
    LoopCondition -->|Yes| ProcessItem[Process current item]
    ProcessItem --> ValidateItem{Item valid}
    ValidateItem -->|No| SkipItem[Skip invalid item]
    ValidateItem -->|Yes| TransformItem[Transform item]
    TransformItem --> UpdateCounter[Update counter]
    SkipItem --> UpdateCounter
    UpdateCounter --> LoopCondition
    LoopCondition -->|No| FinalizeResults[Finalize results]
    ExecuteBranch2 --> AlternativeProcess[Alternative processing]
    AlternativeProcess --> FinalizeResults
    FinalizeResults --> ReturnResult[Return final result]
    ReturnResult --> End[End]
    ThrowException --> End

ANALYZE THIS CODE AND CREATE A DETAILED FLOWCHART:
\`\`\`${language}
${code}
\`\`\`

Generate a comprehensive Mermaid flowchart that captures ALL the logic flow, conditions, loops, and method calls in the code:
`;
    }

    /**
     * 本地模型专用提示词 - 要求详细流程图
     */
    private createDetailedPromptForLocalModel(code: string, language: string, analysis: any): string {
        const contextInfo = this.buildContextInfo(analysis);

        return `You are a code analysis expert. Create a DETAILED Mermaid flowchart for the following ${language} code.

${contextInfo}

REQUIREMENTS FOR DETAILED FLOWCHART:
1. Include ALL methods found in the code
2. Show ALL conditional statements (if/else, switch)
3. Include ALL loops (for, while, foreach) with proper loop flow
4. Show method calls and their relationships
5. Include error handling flows
6. Show variable assignments and operations
7. Include return statements and exit points

CRITICAL SYNTAX RULES:
1. Start with "flowchart TD"
2. NEVER use "subgraph"
3. NEVER use parentheses () in node labels
4. Use descriptive but simple node names
5. Use --> for arrows

EXAMPLE OF DETAILED FLOWCHART:
flowchart TD
    Start[Start] --> InitVars[Initialize variables]
    InitVars --> CheckInput{Input valid}
    CheckInput -->|No| ThrowError[Throw exception]
    CheckInput -->|Yes| ProcessData[Process input data]
    ProcessData --> LoopStart[Start loop]
    LoopStart --> LoopCondition{More items}
    LoopCondition -->|Yes| ProcessItem[Process current item]
    ProcessItem --> UpdateCounter[Update counter]
    UpdateCounter --> LoopCondition
    LoopCondition -->|No| CalculateResult[Calculate final result]
    CalculateResult --> ValidateResult{Result valid}
    ValidateResult -->|No| SetDefault[Set default value]
    ValidateResult -->|Yes| ReturnResult[Return result]
    SetDefault --> ReturnResult
    ReturnResult --> End[End]
    ThrowError --> End

ANALYZE THIS CODE AND CREATE A COMPREHENSIVE FLOWCHART:
\`\`\`${language}
${code}
\`\`\`

Generate a detailed Mermaid flowchart that shows the complete execution flow:`;
    }

    /**
     * 构建上下文信息
     */
    private buildContextInfo(analysis: any): string {
        let info = `# CODE ANALYSIS CONTEXT:\n`;
        info += `- File size: ${analysis.lineCount} lines (${Math.round(analysis.charCount / 1024)}KB)\n`;
        info += `- Type: ${analysis.classType} class\n`;

        if (analysis.isAutoGenerated) {
            info += `- This is AUTO-GENERATED code (likely API model/DTO)\n`;
            info += `- Focus on class structure and main data flow, not implementation details\n`;
        }

        if (analysis.mainMethods.length > 0) {
            info += `- Key methods: ${analysis.mainMethods.slice(0, 5).join(', ')}\n`;
        } else {
            info += `- Mainly contains getters/setters and constructors\n`;
        }

        if (!analysis.hasBusinessLogic) {
            info += `- Limited business logic detected - focus on data structure and initialization\n`;
        }

        return info;
    }

    /**
     * 从AI响应中提取Mermaid代码
     */
    private extractMermaidCode(response: string): string {
        // 查找```mermaid代码块
        const mermaidMatch = response.match(/```mermaid\s*([\s\S]*?)\s*```/);
        if (mermaidMatch) {
            return mermaidMatch[1].trim();
        }

        // 查找flowchart TD开头的代码
        const flowchartMatch = response.match(/flowchart\s+TD[\s\S]*?(?=\n\n|\n```|$)/);
        if (flowchartMatch) {
            return flowchartMatch[0].trim();
        }

        // 如果都没找到，返回原始响应
        return response.trim();
    }


}