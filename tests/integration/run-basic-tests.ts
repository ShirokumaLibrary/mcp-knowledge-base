#!/usr/bin/env node

/**
 * 基本的な統合テストを実行
 */

import { SimpleMCPClient } from './mcp-test-client.js';
import path from 'path';

const testResults: Array<{ name: string; status: 'passed' | 'failed'; error?: string }> = [];

async function test(name: string, fn: () => Promise<void>) {
  process.stdout.write(`Testing ${name}... `);
  try {
    await fn();
    testResults.push({ name, status: 'passed' });
    console.log('✅ PASSED');
  } catch (error: any) {
    testResults.push({ name, status: 'failed', error: error.message });
    console.log(`❌ FAILED: ${error.message}`);
  }
}

async function runTests() {
  console.log('🚀 Starting Basic Integration Tests\n');

  const client = new SimpleMCPClient({
    name: 'test-client',
    version: '1.0.0'
  });

  try {
    // サーバーに接続
    await client.connect({
      transport: {
        command: 'node',
        args: [path.join(process.cwd(), 'dist/server.js')]
      }
    });

    // Test 1: 初期状態の確認
    await test('Initial state - empty database', async () => {
      const issues = await client.call('get_items', { type: 'issues' });
      if (issues.data.length !== 0) {
        throw new Error(`Expected 0 issues, got ${issues.data.length}`);
      }
    });

    // Test 2: アイテムの作成
    let createdIssueId: number;
    await test('Create issue', async () => {
      const issue = await client.call('create_item', {
        type: 'issues',
        title: 'Test Issue',
        content: 'This is a test issue',
        priority: 'high',
        status: 'Open',
        tags: ['test', 'integration']
      });
      
      if (!issue.id) {
        throw new Error('Issue creation failed - no ID returned');
      }
      createdIssueId = issue.id;
    });

    // Test 3: Unicode サポート
    let unicodeItemId: number;
    await test('Unicode support', async () => {
      const item = await client.call('create_item', {
        type: 'knowledge',
        title: '日本語タイトル 🚀',
        content: '## テスト内容\n特殊文字: !@#$%^&*()_+{}[]|\\:;<>?,./\n絵文字: 😀🎉',
        tags: ['日本語', 'unicode', 'テスト']
      });
      
      if (item.title !== '日本語タイトル 🚀') {
        throw new Error('Unicode title not preserved');
      }
      unicodeItemId = item.id;
    });

    // Test 4: タグの自動登録
    await test('Tag auto-registration', async () => {
      const tags = await client.call('get_tags', {});
      
      if (!tags.includes('test')) {
        throw new Error('Tag "test" was not auto-registered');
      }
      if (!tags.includes('日本語')) {
        throw new Error('Unicode tag "日本語" was not auto-registered');
      }
    });

    // Test 5: ステータスフィルタリング
    let closedIssueId: number;
    await test('Status filtering', async () => {
      // Closedなissueを作成
      const closedIssue = await client.call('create_item', {
        type: 'issues',
        title: 'Closed Issue',
        content: 'This issue is closed',
        status: 'Closed'
      });
      closedIssueId = closedIssue.id;

      // デフォルトでは閉じたアイテムは含まれない
      const defaultList = await client.call('get_items', { type: 'issues' });
      const foundClosed = defaultList.data.find((item: any) => item.id === closedIssueId);
      
      if (foundClosed) {
        throw new Error('Closed issue should not be included by default');
      }

      // includeClosedStatusesを指定すると含まれる
      const allList = await client.call('get_items', { 
        type: 'issues', 
        includeClosedStatuses: true 
      });
      const foundInAll = allList.data.find((item: any) => item.id === closedIssueId);
      
      if (!foundInAll) {
        throw new Error('Closed issue should be included with includeClosedStatuses');
      }
    });

    // Test 6: セッション管理
    await test('Session management', async () => {
      const session = await client.call('create_item', {
        type: 'sessions',
        title: 'Test Session',
        content: 'Testing session functionality',
        tags: ['test', 'session']
      });

      if (!session.id.match(/^\d{4}-\d{2}-\d{2}-\d{2}\.\d{2}\.\d{2}\.\d{3}$/)) {
        throw new Error('Invalid session ID format');
      }

      // 最新セッションの取得
      const latestResults = await client.call('get_items', {
        type: 'sessions',
        limit: 1
      });
      const latest = latestResults.data?.[0] || latestResults[0];
      if (!latest || latest.id !== session.id) {
        throw new Error('Latest session does not match created session');
      }
    });

    // Test 7: カスタムタイプ
    await test('Custom type creation', async () => {
      const result = await client.call('create_type', {
        name: 'test_custom_type',
        base_type: 'documents'
      });

      if (!result.includes('successfully')) {
        throw new Error('Custom type creation failed');
      }

      // カスタムタイプでアイテム作成
      const item = await client.call('create_item', {
        type: 'test_custom_type',
        title: 'Custom Type Item',
        content: 'Testing custom types'
      });

      if (item.type !== 'test_custom_type') {
        throw new Error('Item not created with custom type');
      }
    });

    // Test 8: エラーハンドリング
    await test('Error handling - missing required fields', async () => {
      try {
        await client.call('create_item', {
          type: 'issues',
          title: 'No content'
          // contentが欠落
        });
        throw new Error('Should have thrown an error for missing content');
      } catch (error: any) {
        if (!error.message.includes('Content is required')) {
          throw error;
        }
      }
    });

    // Test 9: クリーンアップ
    await test('Cleanup', async () => {
      // 作成したアイテムを削除
      if (createdIssueId!) {
        await client.call('delete_item', { type: 'issues', id: createdIssueId });
      }
      if (unicodeItemId!) {
        await client.call('delete_item', { type: 'knowledge', id: unicodeItemId });
      }
      if (closedIssueId!) {
        await client.call('delete_item', { type: 'issues', id: closedIssueId });
      }
      
      // カスタムタイプを削除
      await client.call('delete_type', { name: 'test_custom_type' });
    });

  } catch (error) {
    console.error('\nFatal error:', error);
  } finally {
    await client.close();
  }

  // 結果サマリー
  console.log('\n📊 Test Summary\n');
  console.log('─'.repeat(50));
  
  let passed = 0;
  let failed = 0;
  
  for (const result of testResults) {
    if (result.status === 'passed') {
      passed++;
    } else {
      failed++;
    }
  }
  
  console.log(`Total: ${testResults.length} | Passed: ${passed} | Failed: ${failed}`);
  
  if (failed === 0) {
    console.log('\n🎉 All tests passed!');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some tests failed.');
    process.exit(1);
  }
}

// 実行
runTests().catch(error => {
  console.error('Test runner error:', error);
  process.exit(1);
});