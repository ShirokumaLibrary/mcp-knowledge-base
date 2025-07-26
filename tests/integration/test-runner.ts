import { spawn } from 'child_process';
import { testScenarios, TestScenario, TestStep } from './test-scenarios.js';

/**
 * シナリオベースのMCPテストランナー
 */
export class MCPTestRunner {
  private results: Map<string, TestResult> = new Map();
  private variables: Map<string, any> = new Map();
  private mcpProcess: any;

  async setup() {
    // MCPサーバーを起動
    this.mcpProcess = spawn('node', ['dist/server.js'], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    // 変数の初期化
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    this.variables.set('today', today.toISOString().split('T')[0]);
    this.variables.set('yesterday', yesterday.toISOString().split('T')[0]);
  }

  async teardown() {
    if (this.mcpProcess) {
      this.mcpProcess.kill();
    }
  }

  async runAllScenarios() {
    console.log('🚀 Starting MCP Integration Tests\n');

    for (const scenario of testScenarios) {
      await this.runScenario(scenario);
    }

    this.printResults();
  }

  private async runScenario(scenario: TestScenario) {
    console.log(`📋 Running: ${scenario.name}`);
    console.log(`   ${scenario.description}\n`);

    const result: TestResult = {
      name: scenario.name,
      passed: true,
      steps: [],
      errors: []
    };

    try {
      // 各ステップを実行
      for (const step of scenario.steps) {
        const stepResult = await this.executeStep(step);
        result.steps.push(stepResult);

        if (!stepResult.success) {
          result.passed = false;
          result.errors.push(stepResult.error || 'Unknown error');
        }
      }

      // 期待される結果を検証
      for (const expected of scenario.expectedResults) {
        const validationResult = this.validateResult(expected);
        if (!validationResult.success) {
          result.passed = false;
          result.errors.push(validationResult.error);
        }
      }

    } catch (error) {
      result.passed = false;
      result.errors.push(error.message);
    }

    this.results.set(scenario.name, result);
    this.printScenarioResult(result);
  }

  private async executeStep(step: TestStep): Promise<StepResult> {
    console.log(`   ▶ ${step.action}`);

    try {
      // パラメータ内の変数を展開
      const params = this.expandVariables(step.params);

      // MCPメソッドを呼び出し
      const response = await this.callMCP(step.method, params);

      // 結果を保存
      if (step.saveAs) {
        this.variables.set(step.saveAs, response);
      }

      return {
        action: step.action,
        success: true,
        response
      };

    } catch (error) {
      return {
        action: step.action,
        success: false,
        error: error.message
      };
    }
  }

  private expandVariables(obj: any): any {
    if (typeof obj === 'string' && obj.startsWith('{{') && obj.endsWith('}}')) {
      const varPath = obj.slice(2, -2);
      return this.getVariable(varPath);
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.expandVariables(item));
    }

    if (typeof obj === 'object' && obj !== null) {
      const expanded: any = {};
      for (const [key, value] of Object.entries(obj)) {
        expanded[key] = this.expandVariables(value);
      }
      return expanded;
    }

    return obj;
  }

  private getVariable(path: string): any {
    const parts = path.split('.');
    let value = this.variables.get(parts[0]);

    for (let i = 1; i < parts.length; i++) {
      value = value?.[parts[i]];
    }

    return value;
  }

  private async callMCP(method: string, params: any): Promise<any> {
    // JSONRPCメッセージを構築
    const request = {
      jsonrpc: '2.0',
      id: Math.floor(Math.random() * 100000),
      method: `tools/call`,
      params: {
        name: `mcp__shirokuma-knowledge-base__${method}`,
        arguments: params
      }
    };

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('MCP call timeout'));
      }, 10000);

      // レスポンスハンドラを設定
      const handleResponse = (data: Buffer) => {
        try {
          const lines = data.toString().split('\n');
          for (const line of lines) {
            if (line.trim()) {
              const response = JSON.parse(line);
              if (response.id === request.id) {
                clearTimeout(timeout);
                this.mcpProcess.stdout.removeListener('data', handleResponse);
                
                if (response.error) {
                  reject(new Error(response.error.message));
                } else {
                  resolve(response.result?.content?.[0]?.text || response.result);
                }
              }
            }
          }
        } catch (error) {
          // パース失敗時は継続
        }
      };

      this.mcpProcess.stdout.on('data', handleResponse);
      
      // リクエストを送信
      this.mcpProcess.stdin.write(JSON.stringify(request) + '\n');
    });
  }

  private validateResult(expected: any): ValidationResult {
    try {
      const value = this.getVariable(expected.field);

      switch (expected.matcher) {
        case 'exists':
          if (value === undefined || value === null) {
            return {
              success: false,
              error: `Expected ${expected.field} to exist`
            };
          }
          break;

        case 'equals':
          if (value !== expected.value) {
            return {
              success: false,
              error: `Expected ${expected.field} to equal ${expected.value}, got ${value}`
            };
          }
          break;

        case 'contains':
          if (!value?.includes?.(expected.value)) {
            return {
              success: false,
              error: `Expected ${expected.field} to contain ${expected.value}`
            };
          }
          break;

        case 'length':
          if (value?.length !== expected.value) {
            return {
              success: false,
              error: `Expected ${expected.field} length to be ${expected.value}, got ${value?.length}`
            };
          }
          break;
      }

      return { success: true };

    } catch (error) {
      return {
        success: false,
        error: `Validation error: ${error.message}`
      };
    }
  }

  private printScenarioResult(result: TestResult) {
    const status = result.passed ? '✅ PASSED' : '❌ FAILED';
    console.log(`\n   ${status}\n`);

    if (!result.passed) {
      console.log('   Errors:');
      result.errors.forEach(error => {
        console.log(`   - ${error}`);
      });
    }

    console.log('   ' + '─'.repeat(50) + '\n');
  }

  private printResults() {
    console.log('\n📊 Test Summary\n');

    let passed = 0;
    let failed = 0;

    for (const [name, result] of this.results) {
      const status = result.passed ? '✅' : '❌';
      console.log(`${status} ${name}`);
      
      if (result.passed) {
        passed++;
      } else {
        failed++;
      }
    }

    console.log(`\nTotal: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);

    if (failed === 0) {
      console.log('\n🎉 All tests passed!');
    } else {
      console.log('\n⚠️  Some tests failed.');
      process.exit(1);
    }
  }
}

// インターフェース定義
interface TestResult {
  name: string;
  passed: boolean;
  steps: StepResult[];
  errors: string[];
}

interface StepResult {
  action: string;
  success: boolean;
  response?: any;
  error?: string;
}

interface ValidationResult {
  success: boolean;
  error?: string;
}

// CLIから実行
if (import.meta.url === `file://${process.argv[1]}`) {
  const runner = new MCPTestRunner();
  
  runner.setup()
    .then(() => runner.runAllScenarios())
    .then(() => runner.teardown())
    .catch(error => {
      console.error('Test runner error:', error);
      process.exit(1);
    });
}