import { spawn, ChildProcess } from 'child_process';
import { EventEmitter } from 'events';

/**
 * 簡易MCPクライアント実装（テスト用）
 */
export class SimpleMCPClient extends EventEmitter {
  private process: ChildProcess | null = null;
  private messageId = 1;
  private pendingRequests = new Map<number, { resolve: Function; reject: Function }>();
  private buffer = '';

  constructor(private config: { name: string; version: string }) {
    super();
  }

  async connect(options: { transport: { command: string; args: string[] } } | { process: ChildProcess }) {
    if ('process' in options) {
      // 既存のプロセスを使用
      this.process = options.process;
    } else {
      // 新しいプロセスを起動
      this.process = spawn(options.transport.command, options.transport.args, {
        stdio: ['pipe', 'pipe', 'pipe']
      });
    }

    // 初期化メッセージを送信
    console.log('Sending initialize message...');
    try {
      await this.sendMessage('initialize', {
        protocolVersion: '2024-11-05',
        capabilities: {
          roots: { listChanged: true },
          sampling: {}
        },
        clientInfo: {
          name: this.config.name,
          version: this.config.version
        }
      });
      console.log('Initialize message sent successfully');
    } catch (error) {
      console.error('Failed to send initialize message:', error);
      throw error;
    }

    // stdoutからのデータを処理
    this.process.stdout?.on('data', (data: Buffer) => {
      this.buffer += data.toString();
      this.processBuffer();
    });

    // エラーハンドリング
    this.process.stderr?.on('data', (data: Buffer) => {
      console.error('Server error:', data.toString());
    });

    this.process.on('error', (error) => {
      console.error('Process error:', error);
      this.rejectAllPending(error);
    });

    this.process.on('exit', (code) => {
      console.log(`Process exited with code ${code}`);
      this.rejectAllPending(new Error(`Process exited with code ${code}`));
    });

    // 初期化完了を待つ
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  private processBuffer() {
    const lines = this.buffer.split('\n');
    this.buffer = lines.pop() || '';

    for (const line of lines) {
      if (!line.trim()) continue;
      
      try {
        const message = JSON.parse(line);
        this.handleMessage(message);
      } catch (error) {
        console.error('Failed to parse message:', line, error);
      }
    }
  }

  private handleMessage(message: any) {
    console.log('Received message:', JSON.stringify(message));
    if (message.id && this.pendingRequests.has(message.id)) {
      const { resolve, reject } = this.pendingRequests.get(message.id)!;
      this.pendingRequests.delete(message.id);

      if (message.error) {
        reject(new Error(message.error.message || 'Unknown error'));
      } else {
        resolve(message.result);
      }
    }
  }

  async call(method: string, params: any): Promise<any> {
    const result = await this.sendMessage('tools/call', {
      name: method,
      arguments: params
    });

    // レスポンスの処理
    if (result?.content?.[0]?.text) {
      const text = result.content[0].text;
      
      // Handle different response formats
      if (text.includes(' created: ')) {
        const parts = text.split(' created: ');
        return JSON.parse(parts[1]);
      } else if (text.includes(' updated: ')) {
        const parts = text.split(' updated: ');
        return JSON.parse(parts[1]);
      } else if (text.includes(' deleted')) {
        return text;
      } else {
        // Try to parse as JSON
        try {
          return JSON.parse(text);
        } catch {
          return text;
        }
      }
    }
    
    return result;
  }

  private sendMessage(method: string, params: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const id = this.messageId++;
      
      this.pendingRequests.set(id, { resolve, reject });

      const message = {
        jsonrpc: '2.0',
        method,
        params,
        id
      };

      this.process?.stdin?.write(JSON.stringify(message) + '\n');

      // タイムアウト設定
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          console.error(`Request timeout for message ${id}: ${method}`);
          reject(new Error(`Request timeout for ${method}`));
        }
      }, 30000);
    });
  }

  async close() {
    this.rejectAllPending(new Error('Client closing'));
    
    if (this.process) {
      this.process.kill();
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  private rejectAllPending(error: Error) {
    for (const { reject } of this.pendingRequests.values()) {
      reject(error);
    }
    this.pendingRequests.clear();
  }
}