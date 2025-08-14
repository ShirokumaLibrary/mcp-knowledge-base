# 監視・ログガイド

## 1. 概要

本ドキュメントでは、Shirokuma MCP Knowledge Base v0.8.0における監視・ログ戦略を説明します。ローカルMCPサーバーの健全性を維持し、問題の早期発見と迅速な対応を実現するための包括的な監視システムを構築します。

## 2. 監視戦略

### 2.1 監視対象

| 監視項目 | 目的 | 重要度 | 監視方法 |
|---------|------|-------|---------|
| プロセス監視 | サーバー稼働状況確認 | 🔴 高 | プロセス存在チェック |
| データベース監視 | データ整合性確認 | 🔴 高 | 接続・整合性テスト |
| リソース監視 | システム資源使用量 | 🟡 中 | CPU・メモリ・ディスク監視 |
| パフォーマンス監視 | 応答時間監視 | 🟡 中 | レスポンス時間測定 |
| ログ監視 | エラー・警告検出 | 🟢 低 | ログ解析 |

### 2.2 監視アーキテクチャ

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Claude        │    │  Health Check   │    │   Log Monitor   │
│   Desktop       │────│     Scripts     │────│                 │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                        │                        │
         │                        │                        │
         ▼                        ▼                        ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  MCP Server     │    │   Metrics       │    │   Alert         │
│  (stdio)        │    │   Collection    │    │   System        │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                        │                        │
         └────────────────────────┼────────────────────────┘
                                  │
                                  ▼
                      ┌─────────────────┐
                      │   SQLite DB     │
                      │                 │
                      │                 │
                      └─────────────────┘
```

## 3. ログ設定

### 3.1 ログレベル定義

```typescript
// src/utils/logger.ts
export enum LogLevel {
  ERROR = 0,   // エラー: 実行不可能な問題
  WARN = 1,    // 警告: 注意が必要な状況
  INFO = 2,    // 情報: 一般的な動作情報
  DEBUG = 3,   // デバッグ: 開発者向け詳細情報
  TRACE = 4    // トレース: 最も詳細なログ
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  module: string;
  requestId?: string;
  data?: any;
}
```

### 3.2 ロガー実装

```typescript
// src/utils/logger.ts
import { promises as fs } from 'fs';
import path from 'path';

export class Logger {
  private static instance: Logger;
  private logLevel: LogLevel;
  private logDir: string;

  private constructor() {
    this.logLevel = this.parseLogLevel(process.env.LOG_LEVEL || 'info');
    this.logDir = process.env.LOG_DIR || './logs';
    this.ensureLogDirectory();
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private parseLogLevel(level: string): LogLevel {
    switch (level.toLowerCase()) {
      case 'error': return LogLevel.ERROR;
      case 'warn': return LogLevel.WARN;
      case 'info': return LogLevel.INFO;
      case 'debug': return LogLevel.DEBUG;
      case 'trace': return LogLevel.TRACE;
      default: return LogLevel.INFO;
    }
  }

  private async ensureLogDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.logDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create log directory:', error);
    }
  }

  private shouldLog(level: LogLevel): boolean {
    return level <= this.logLevel;
  }

  private async writeLog(entry: LogEntry): Promise<void> {
    if (!this.shouldLog(entry.level)) {
      return;
    }

    const logLine = JSON.stringify(entry) + '\n';
    
    // コンソール出力
    const levelName = LogLevel[entry.level];
    const timestamp = new Date(entry.timestamp).toISOString();
    console.log(`[${timestamp}] ${levelName} ${entry.module}: ${entry.message}`);

    // ファイル出力
    try {
      const logFile = path.join(this.logDir, this.getLogFileName(entry.level));
      await fs.appendFile(logFile, logLine);
    } catch (error) {
      console.error('Failed to write log file:', error);
    }
  }

  private getLogFileName(level: LogLevel): string {
    const date = new Date().toISOString().split('T')[0];
    const levelName = LogLevel[level].toLowerCase();
    return `${levelName}-${date}.log`;
  }

  async log(level: LogLevel, message: string, module: string, data?: any): Promise<void> {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      module,
      data
    };

    await this.writeLog(entry);
  }

  async error(message: string, module: string, error?: Error): Promise<void> {
    await this.log(LogLevel.ERROR, message, module, {
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : undefined
    });
  }

  async warn(message: string, module: string, data?: any): Promise<void> {
    await this.log(LogLevel.WARN, message, module, data);
  }

  async info(message: string, module: string, data?: any): Promise<void> {
    await this.log(LogLevel.INFO, message, module, data);
  }

  async debug(message: string, module: string, data?: any): Promise<void> {
    await this.log(LogLevel.DEBUG, message, module, data);
  }

  async trace(message: string, module: string, data?: any): Promise<void> {
    await this.log(LogLevel.TRACE, message, module, data);
  }
}

// シングルトンインスタンスをエクスポート
export const logger = Logger.getInstance();
```

### 3.3 構造化ログ形式

```typescript
// ログエントリの例
{
  "timestamp": "2024-12-09T10:30:45.123Z",
  "level": 2,
  "message": "Item created successfully",
  "module": "ItemService",
  "requestId": "req_12345",
  "data": {
    "itemId": 42,
    "type": "task",
    "title": "Sample Task",
    "duration": 150
  }
}
```

## 4. メトリクス収集

### 4.1 パフォーマンスメトリクス

```typescript
// src/utils/metrics.ts
export interface PerformanceMetrics {
  requestCount: number;
  averageResponseTime: number;
  errorRate: number;
  memoryUsage: NodeJS.MemoryUsage;
  cpuUsage: NodeJS.CpuUsage;
  databaseConnections: number;
  uptime: number;
}

export class MetricsCollector {
  private static instance: MetricsCollector;
  private metrics: Map<string, any> = new Map();
  private startTime: number = Date.now();
  private requestCount: number = 0;
  private errorCount: number = 0;
  private responseTimes: number[] = [];

  static getInstance(): MetricsCollector {
    if (!MetricsCollector.instance) {
      MetricsCollector.instance = new MetricsCollector();
    }
    return MetricsCollector.instance;
  }

  recordRequest(responseTime: number): void {
    this.requestCount++;
    this.responseTimes.push(responseTime);
    
    // 直近100件のレスポンス時間のみ保持
    if (this.responseTimes.length > 100) {
      this.responseTimes.shift();
    }
  }

  recordError(): void {
    this.errorCount++;
  }

  getMetrics(): PerformanceMetrics {
    const now = Date.now();
    const uptime = now - this.startTime;
    
    const averageResponseTime = this.responseTimes.length > 0
      ? this.responseTimes.reduce((sum, time) => sum + time, 0) / this.responseTimes.length
      : 0;

    const errorRate = this.requestCount > 0
      ? (this.errorCount / this.requestCount) * 100
      : 0;

    return {
      requestCount: this.requestCount,
      averageResponseTime,
      errorRate,
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage(),
      databaseConnections: 1, // SQLiteは常に1接続
      uptime
    };
  }

  reset(): void {
    this.requestCount = 0;
    this.errorCount = 0;
    this.responseTimes = [];
    this.startTime = Date.now();
  }
}

export const metricsCollector = MetricsCollector.getInstance();
```

### 4.2 データベースメトリクス

```typescript
// src/infrastructure/database/metrics.ts
export interface DatabaseMetrics {
  queryCount: number;
  averageQueryTime: number;
  slowQueries: Array<{ query: string; duration: number }>;
  connectionPoolStatus: 'healthy' | 'degraded' | 'critical';
  databaseSize: number;
  lastBackupTime?: Date;
}

export class DatabaseMetricsCollector {
  private queryCount: number = 0;
  private queryTimes: number[] = [];
  private slowQueries: Array<{ query: string; duration: number }> = [];
  private readonly SLOW_QUERY_THRESHOLD = 1000; // 1秒

  recordQuery(query: string, duration: number): void {
    this.queryCount++;
    this.queryTimes.push(duration);

    if (duration > this.SLOW_QUERY_THRESHOLD) {
      this.slowQueries.push({ query, duration });
      
      // 直近10件のスローエリーのみ保持
      if (this.slowQueries.length > 10) {
        this.slowQueries.shift();
      }
    }

    // 直近100件のクエリ時間のみ保持
    if (this.queryTimes.length > 100) {
      this.queryTimes.shift();
    }
  }

  async getDatabaseSize(dbPath: string): Promise<number> {
    try {
      const { size } = await import('fs').then(fs => fs.promises.stat(dbPath));
      return size;
    } catch {
      return 0;
    }
  }

  async getMetrics(dbPath: string): Promise<DatabaseMetrics> {
    const averageQueryTime = this.queryTimes.length > 0
      ? this.queryTimes.reduce((sum, time) => sum + time, 0) / this.queryTimes.length
      : 0;

    const databaseSize = await this.getDatabaseSize(dbPath);
    
    const connectionPoolStatus: 'healthy' | 'degraded' | 'critical' = 
      averageQueryTime < 100 ? 'healthy' :
      averageQueryTime < 500 ? 'degraded' : 'critical';

    return {
      queryCount: this.queryCount,
      averageQueryTime,
      slowQueries: [...this.slowQueries],
      connectionPoolStatus,
      databaseSize
    };
  }
}
```

## 5. ヘルスチェック

### 5.1 総合ヘルスチェック

```typescript
// src/health/health-checker.ts
export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  checks: {
    process: HealthCheckResult;
    database: HealthCheckResult;
    memory: HealthCheckResult;
    disk: HealthCheckResult;
  };
}

export interface HealthCheckResult {
  status: 'pass' | 'warn' | 'fail';
  message: string;
  details?: any;
}

export class HealthChecker {
  private readonly dbPath: string;

  constructor(dbPath: string = './data/shirokuma.db') {
    this.dbPath = dbPath;
  }

  async checkHealth(): Promise<HealthStatus> {
    const checks = {
      process: await this.checkProcess(),
      database: await this.checkDatabase(),
      memory: await this.checkMemory(),
      disk: await this.checkDisk()
    };

    const overallStatus = this.determineOverallStatus(checks);

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      checks
    };
  }

  private async checkProcess(): Promise<HealthCheckResult> {
    try {
      // プロセスが正常に動作しているかチェック
      const isHealthy = process.uptime() > 0;
      
      return {
        status: isHealthy ? 'pass' : 'fail',
        message: isHealthy ? 'Process is running' : 'Process check failed',
        details: {
          pid: process.pid,
          uptime: process.uptime(),
          nodeVersion: process.version
        }
      };
    } catch (error) {
      return {
        status: 'fail',
        message: `Process check error: ${error}`,
        details: { error }
      };
    }
  }

  private async checkDatabase(): Promise<HealthCheckResult> {
    try {
      const { PrismaClient } = await import('@prisma/client');
      const prisma = new PrismaClient();
      
      // 簡単なクエリで接続をテスト
      await prisma.$executeRaw`SELECT 1`;
      await prisma.$disconnect();

      return {
        status: 'pass',
        message: 'Database connection successful',
        details: {
          path: this.dbPath
        }
      };
    } catch (error) {
      return {
        status: 'fail',
        message: `Database connection failed: ${error}`,
        details: { error }
      };
    }
  }

  private async checkMemory(): Promise<HealthCheckResult> {
    const memUsage = process.memoryUsage();
    const heapUsedMB = memUsage.heapUsed / 1024 / 1024;
    const heapTotalMB = memUsage.heapTotal / 1024 / 1024;
    const heapUtilization = (heapUsedMB / heapTotalMB) * 100;

    const status = heapUtilization > 90 ? 'fail' :
                   heapUtilization > 70 ? 'warn' : 'pass';

    return {
      status,
      message: `Memory utilization: ${heapUtilization.toFixed(2)}%`,
      details: {
        heapUsedMB: heapUsedMB.toFixed(2),
        heapTotalMB: heapTotalMB.toFixed(2),
        heapUtilization: heapUtilization.toFixed(2),
        rss: (memUsage.rss / 1024 / 1024).toFixed(2)
      }
    };
  }

  private async checkDisk(): Promise<HealthCheckResult> {
    try {
      const fs = await import('fs');
      const stats = await fs.promises.statvfs ? fs.promises.statvfs('.') : null;
      
      if (!stats) {
        // Windows環境など、statvfsがない場合
        return {
          status: 'warn',
          message: 'Disk space check not available on this platform',
          details: {}
        };
      }

      const totalSpace = stats.blocks * stats.bsize;
      const freeSpace = stats.bavail * stats.bsize;
      const usedSpace = totalSpace - freeSpace;
      const utilization = (usedSpace / totalSpace) * 100;

      const status = utilization > 95 ? 'fail' :
                     utilization > 85 ? 'warn' : 'pass';

      return {
        status,
        message: `Disk utilization: ${utilization.toFixed(2)}%`,
        details: {
          totalSpaceGB: (totalSpace / 1024 / 1024 / 1024).toFixed(2),
          freeSpaceGB: (freeSpace / 1024 / 1024 / 1024).toFixed(2),
          utilization: utilization.toFixed(2)
        }
      };
    } catch (error) {
      return {
        status: 'warn',
        message: `Disk check error: ${error}`,
        details: { error }
      };
    }
  }

  private determineOverallStatus(checks: HealthStatus['checks']): 'healthy' | 'degraded' | 'unhealthy' {
    const results = Object.values(checks);
    
    if (results.some(check => check.status === 'fail')) {
      return 'unhealthy';
    }
    
    if (results.some(check => check.status === 'warn')) {
      return 'degraded';
    }
    
    return 'healthy';
  }
}
```

### 5.2 ヘルスチェックスクリプト

```bash
#!/bin/bash
# scripts/health-check.sh

set -e

echo "🏥 Shirokuma MCP Health Check"
echo "=============================="

# 設定
DB_PATH="./data/shirokuma.db"
LOG_DIR="./logs"
MAX_LOG_SIZE_MB=100
MAX_MEMORY_PERCENT=80
MAX_DISK_PERCENT=90

# カラー定義
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

# ヘルス状態
HEALTH_STATUS="healthy"
WARNINGS=0
ERRORS=0

# 結果表示用関数
print_result() {
    local status=$1
    local message=$2
    local details=$3
    
    case $status in
        "pass")
            echo -e "${GREEN}✅ PASS${NC} $message"
            [[ -n "$details" ]] && echo "   $details"
            ;;
        "warn")
            echo -e "${YELLOW}⚠️  WARN${NC} $message"
            [[ -n "$details" ]] && echo "   $details"
            ((WARNINGS++))
            [[ "$HEALTH_STATUS" == "healthy" ]] && HEALTH_STATUS="degraded"
            ;;
        "fail")
            echo -e "${RED}❌ FAIL${NC} $message"
            [[ -n "$details" ]] && echo "   $details"
            ((ERRORS++))
            HEALTH_STATUS="unhealthy"
            ;;
    esac
}

# 1. プロセスチェック
echo
echo "📊 Process Check"
echo "----------------"

if pgrep -f "node.*shirokuma.*--serve" > /dev/null 2>&1; then
    PID=$(pgrep -f "node.*shirokuma.*--serve")
    UPTIME=$(ps -o etime= -p $PID | tr -d ' ')
    print_result "pass" "MCP server process running" "PID: $PID, Uptime: $UPTIME"
else
    print_result "fail" "MCP server process not running"
fi

# 2. データベースチェック
echo
echo "🗃️  Database Check"
echo "------------------"

if [[ -f "$DB_PATH" ]]; then
    if sqlite3 "$DB_PATH" "SELECT 1;" > /dev/null 2>&1; then
        DB_SIZE=$(stat -c%s "$DB_PATH" 2>/dev/null || stat -f%z "$DB_PATH" 2>/dev/null || echo "0")
        DB_SIZE_MB=$((DB_SIZE / 1024 / 1024))
        
        # データベース整合性チェック
        INTEGRITY_CHECK=$(sqlite3 "$DB_PATH" "PRAGMA integrity_check;" 2>/dev/null)
        if [[ "$INTEGRITY_CHECK" == "ok" ]]; then
            print_result "pass" "Database accessible and valid" "Size: ${DB_SIZE_MB}MB"
        else
            print_result "fail" "Database integrity check failed" "$INTEGRITY_CHECK"
        fi
    else
        print_result "fail" "Database connection failed"
    fi
else
    print_result "fail" "Database file not found" "$DB_PATH"
fi

# 3. メモリチェック
echo
echo "💾 Memory Check"
echo "---------------"

if command -v ps > /dev/null; then
    # プロセス固有のメモリ使用量
    if pgrep -f "node.*shirokuma.*--serve" > /dev/null 2>&1; then
        PID=$(pgrep -f "node.*shirokuma.*--serve")
        MEM_PERCENT=$(ps -p $PID -o %mem= | tr -d ' ' 2>/dev/null || echo "0.0")
        MEM_RSS=$(ps -p $PID -o rss= | tr -d ' ' 2>/dev/null || echo "0")
        MEM_RSS_MB=$((MEM_RSS / 1024))
        
        if (( $(echo "$MEM_PERCENT > $MAX_MEMORY_PERCENT" | bc -l 2>/dev/null || echo "0") )); then
            print_result "warn" "High memory usage" "${MEM_PERCENT}% (${MEM_RSS_MB}MB)"
        else
            print_result "pass" "Memory usage normal" "${MEM_PERCENT}% (${MEM_RSS_MB}MB)"
        fi
    else
        print_result "warn" "Cannot check memory usage" "Process not found"
    fi
else
    print_result "warn" "Memory check not available" "ps command not found"
fi

# 4. ディスクチェック
echo
echo "💽 Disk Check"
echo "-------------"

if command -v df > /dev/null; then
    DISK_USAGE=$(df . | tail -1 | awk '{print $5}' | sed 's/%//' 2>/dev/null || echo "0")
    DISK_AVAIL=$(df -h . | tail -1 | awk '{print $4}' 2>/dev/null || echo "unknown")
    
    if [[ $DISK_USAGE -gt $MAX_DISK_PERCENT ]]; then
        print_result "fail" "Disk space critical" "${DISK_USAGE}% used, ${DISK_AVAIL} available"
    elif [[ $DISK_USAGE -gt 80 ]]; then
        print_result "warn" "Disk space low" "${DISK_USAGE}% used, ${DISK_AVAIL} available"
    else
        print_result "pass" "Disk space sufficient" "${DISK_USAGE}% used, ${DISK_AVAIL} available"
    fi
else
    print_result "warn" "Disk check not available" "df command not found"
fi

# 5. ログファイルチェック
echo
echo "📋 Log Check"
echo "------------"

if [[ -d "$LOG_DIR" ]]; then
    LOG_COUNT=$(find "$LOG_DIR" -name "*.log" -type f | wc -l)
    
    if [[ $LOG_COUNT -gt 0 ]]; then
        # ログファイルサイズチェック
        LARGE_LOGS=$(find "$LOG_DIR" -name "*.log" -type f -size +${MAX_LOG_SIZE_MB}M | wc -l)
        
        if [[ $LARGE_LOGS -gt 0 ]]; then
            print_result "warn" "Large log files detected" "$LARGE_LOGS files > ${MAX_LOG_SIZE_MB}MB"
        else
            print_result "pass" "Log files normal" "$LOG_COUNT files"
        fi
        
        # 最近のエラーチェック
        ERROR_COUNT=$(find "$LOG_DIR" -name "error-*.log" -type f -mtime -1 -exec grep -c "ERROR" {} + 2>/dev/null | paste -sd+ | bc 2>/dev/null || echo "0")
        
        if [[ $ERROR_COUNT -gt 0 ]]; then
            print_result "warn" "Recent errors found" "$ERROR_COUNT errors in last 24h"
        else
            print_result "pass" "No recent errors" "Clean error log"
        fi
    else
        print_result "warn" "No log files found" "May indicate logging issue"
    fi
else
    print_result "warn" "Log directory not found" "$LOG_DIR"
fi

# 6. 設定ファイルチェック
echo
echo "⚙️  Configuration Check"
echo "----------------------"

# .env ファイルチェック
if [[ -f ".env" ]]; then
    if [[ -r ".env" ]]; then
        print_result "pass" "Environment file accessible" ".env"
    else
        print_result "warn" "Environment file not readable" ".env"
    fi
else
    print_result "warn" "Environment file not found" ".env"
fi

# package.json チェック
if [[ -f "package.json" ]]; then
    if command -v node > /dev/null && command -v jq > /dev/null; then
        VERSION=$(jq -r '.version' package.json 2>/dev/null || echo "unknown")
        print_result "pass" "Application version" "v$VERSION"
    else
        print_result "pass" "Package file found" "package.json"
    fi
else
    print_result "fail" "Package file not found" "package.json"
fi

# 最終結果
echo
echo "📊 Health Check Summary"
echo "======================="

case $HEALTH_STATUS in
    "healthy")
        echo -e "Overall Status: ${GREEN}HEALTHY${NC} ✅"
        echo "System is operating normally"
        ;;
    "degraded")
        echo -e "Overall Status: ${YELLOW}DEGRADED${NC} ⚠️"
        echo "System is functional but has $WARNINGS warning(s)"
        ;;
    "unhealthy")
        echo -e "Overall Status: ${RED}UNHEALTHY${NC} ❌"
        echo "System has $ERRORS error(s) and $WARNINGS warning(s)"
        ;;
esac

echo
echo "Timestamp: $(date -Iseconds)"
echo "Warnings: $WARNINGS"
echo "Errors: $ERRORS"

# 終了コード
if [[ "$HEALTH_STATUS" == "unhealthy" ]]; then
    exit 1
elif [[ "$HEALTH_STATUS" == "degraded" ]]; then
    exit 2
else
    exit 0
fi
```

## 6. アラートシステム

### 6.1 アラート設定

```typescript
// src/monitoring/alert-manager.ts
export interface AlertRule {
  name: string;
  condition: (metrics: PerformanceMetrics) => boolean;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  cooldownMinutes: number;
}

export interface Alert {
  id: string;
  rule: string;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  timestamp: Date;
  resolved: boolean;
}

export class AlertManager {
  private static instance: AlertManager;
  private rules: AlertRule[] = [];
  private activeAlerts: Map<string, Alert> = new Map();
  private lastTriggered: Map<string, Date> = new Map();

  static getInstance(): AlertManager {
    if (!AlertManager.instance) {
      AlertManager.instance = new AlertManager();
    }
    return AlertManager.instance;
  }

  addRule(rule: AlertRule): void {
    this.rules.push(rule);
  }

  private getDefaultRules(): AlertRule[] {
    return [
      {
        name: 'high_memory_usage',
        condition: (metrics) => {
          const heapUsedMB = metrics.memoryUsage.heapUsed / 1024 / 1024;
          const heapTotalMB = metrics.memoryUsage.heapTotal / 1024 / 1024;
          return (heapUsedMB / heapTotalMB) > 0.9;
        },
        severity: 'warning',
        message: 'Memory usage is above 90%',
        cooldownMinutes: 10
      },
      {
        name: 'high_error_rate',
        condition: (metrics) => metrics.errorRate > 5,
        severity: 'critical',
        message: 'Error rate is above 5%',
        cooldownMinutes: 5
      },
      {
        name: 'slow_response_time',
        condition: (metrics) => metrics.averageResponseTime > 2000,
        severity: 'warning',
        message: 'Average response time is above 2 seconds',
        cooldownMinutes: 15
      }
    ];
  }

  initializeDefaultRules(): void {
    this.getDefaultRules().forEach(rule => this.addRule(rule));
  }

  checkMetrics(metrics: PerformanceMetrics): Alert[] {
    const triggeredAlerts: Alert[] = [];

    for (const rule of this.rules) {
      const now = new Date();
      const lastTrigger = this.lastTriggered.get(rule.name);
      
      // クールダウン期間中はスキップ
      if (lastTrigger) {
        const timeDiff = now.getTime() - lastTrigger.getTime();
        const cooldownMs = rule.cooldownMinutes * 60 * 1000;
        if (timeDiff < cooldownMs) {
          continue;
        }
      }

      // 条件チェック
      if (rule.condition(metrics)) {
        const alertId = `${rule.name}_${now.getTime()}`;
        const alert: Alert = {
          id: alertId,
          rule: rule.name,
          severity: rule.severity,
          message: rule.message,
          timestamp: now,
          resolved: false
        };

        this.activeAlerts.set(alertId, alert);
        this.lastTriggered.set(rule.name, now);
        triggeredAlerts.push(alert);

        // ログ出力
        logger.warn(`Alert triggered: ${rule.name}`, 'AlertManager', {
          alert,
          metrics
        });
      }
    }

    return triggeredAlerts;
  }

  getActiveAlerts(): Alert[] {
    return Array.from(this.activeAlerts.values()).filter(alert => !alert.resolved);
  }

  resolveAlert(alertId: string): boolean {
    const alert = this.activeAlerts.get(alertId);
    if (alert) {
      alert.resolved = true;
      logger.info(`Alert resolved: ${alert.rule}`, 'AlertManager', { alertId });
      return true;
    }
    return false;
  }
}
```

### 6.2 通知システム

```typescript
// src/monitoring/notification-service.ts
export interface NotificationChannel {
  name: string;
  type: 'email' | 'webhook' | 'file' | 'console';
  config: any;
  enabled: boolean;
}

export class NotificationService {
  private channels: Map<string, NotificationChannel> = new Map();

  addChannel(channel: NotificationChannel): void {
    this.channels.set(channel.name, channel);
  }

  async sendAlert(alert: Alert): Promise<void> {
    const enabledChannels = Array.from(this.channels.values())
      .filter(channel => channel.enabled);

    for (const channel of enabledChannels) {
      try {
        await this.sendToChannel(alert, channel);
      } catch (error) {
        logger.error(`Failed to send alert to ${channel.name}`, 'NotificationService', error);
      }
    }
  }

  private async sendToChannel(alert: Alert, channel: NotificationChannel): Promise<void> {
    switch (channel.type) {
      case 'console':
        await this.sendToConsole(alert);
        break;
      case 'file':
        await this.sendToFile(alert, channel.config);
        break;
      case 'webhook':
        await this.sendToWebhook(alert, channel.config);
        break;
      case 'email':
        await this.sendToEmail(alert, channel.config);
        break;
    }
  }

  private async sendToConsole(alert: Alert): Promise<void> {
    const emoji = alert.severity === 'critical' ? '🔥' : 
                  alert.severity === 'warning' ? '⚠️' : 'ℹ️';
    
    console.log(`${emoji} ALERT [${alert.severity.toUpperCase()}]: ${alert.message}`);
    console.log(`   Rule: ${alert.rule}`);
    console.log(`   Time: ${alert.timestamp.toISOString()}`);
  }

  private async sendToFile(alert: Alert, config: { filePath: string }): Promise<void> {
    const fs = await import('fs');
    const alertLine = JSON.stringify({
      ...alert,
      timestamp: alert.timestamp.toISOString()
    }) + '\n';
    
    await fs.promises.appendFile(config.filePath, alertLine);
  }

  private async sendToWebhook(alert: Alert, config: { url: string; format: string }): Promise<void> {
    const fetch = (await import('node-fetch')).default;
    
    let payload;
    if (config.format === 'slack') {
      payload = {
        text: `🚨 Shirokuma MCP Alert`,
        attachments: [{
          color: alert.severity === 'critical' ? 'danger' : 'warning',
          fields: [
            { title: 'Rule', value: alert.rule, short: true },
            { title: 'Severity', value: alert.severity, short: true },
            { title: 'Message', value: alert.message, short: false },
            { title: 'Time', value: alert.timestamp.toISOString(), short: true }
          ]
        }]
      };
    } else {
      payload = {
        alert: {
          ...alert,
          timestamp: alert.timestamp.toISOString()
        }
      };
    }

    await fetch(config.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  }

  private async sendToEmail(alert: Alert, config: { to: string; smtp: any }): Promise<void> {
    // メール送信の実装（必要に応じて）
    // nodemailerなどを使用
    logger.info('Email notification not implemented', 'NotificationService');
  }
}
```

## 7. 監視ダッシュボード

### 7.1 簡易Web監視UI

```html
<!-- monitoring/dashboard.html -->
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Shirokuma MCP Monitor</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        .header { background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
        .card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .metric { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
        .metric-value { font-size: 24px; font-weight: bold; }
        .status-healthy { color: #28a745; }
        .status-degraded { color: #ffc107; }
        .status-unhealthy { color: #dc3545; }
        .chart { height: 200px; margin-top: 15px; }
        .alert { padding: 10px; border-radius: 4px; margin-bottom: 10px; }
        .alert-critical { background: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; }
        .alert-warning { background: #fff3cd; border: 1px solid #ffeaa7; color: #856404; }
        .logs { font-family: 'Monaco', 'Menlo', monospace; font-size: 12px; background: #2d3748; color: #e2e8f0; padding: 15px; border-radius: 4px; max-height: 300px; overflow-y: auto; }
        .refresh-btn { background: #007bff; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; }
        .timestamp { color: #666; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🐻 Shirokuma MCP Monitor</h1>
            <div class="metric">
                <span>Overall Status:</span>
                <span id="overall-status" class="metric-value">Loading...</span>
            </div>
            <div class="timestamp" id="last-update">Last Update: Loading...</div>
            <button class="refresh-btn" onclick="refreshData()">Refresh</button>
        </div>
        
        <div class="grid">
            <!-- パフォーマンスメトリクス -->
            <div class="card">
                <h3>📊 Performance</h3>
                <div class="metric">
                    <span>Requests:</span>
                    <span id="request-count" class="metric-value">-</span>
                </div>
                <div class="metric">
                    <span>Avg Response Time:</span>
                    <span id="response-time" class="metric-value">-</span>
                </div>
                <div class="metric">
                    <span>Error Rate:</span>
                    <span id="error-rate" class="metric-value">-</span>
                </div>
                <div class="metric">
                    <span>Uptime:</span>
                    <span id="uptime" class="metric-value">-</span>
                </div>
            </div>
            
            <!-- システムリソース -->
            <div class="card">
                <h3>💻 System Resources</h3>
                <div class="metric">
                    <span>Memory Usage:</span>
                    <span id="memory-usage" class="metric-value">-</span>
                </div>
                <div class="metric">
                    <span>Heap Used:</span>
                    <span id="heap-used" class="metric-value">-</span>
                </div>
                <div class="metric">
                    <span>Database Size:</span>
                    <span id="db-size" class="metric-value">-</span>
                </div>
            </div>
            
            <!-- アクティブアラート -->
            <div class="card">
                <h3>🚨 Active Alerts</h3>
                <div id="alerts-container">
                    <p>No active alerts</p>
                </div>
            </div>
            
            <!-- 最新ログ -->
            <div class="card">
                <h3>📋 Recent Logs</h3>
                <div id="logs-container" class="logs">
                    Loading logs...
                </div>
            </div>
        </div>
    </div>

    <script>
        let monitoringData = {};
        
        async function refreshData() {
            try {
                // 本来はAPIエンドポイントから取得
                // この例では静的データを使用
                const response = await fetch('/api/monitoring/status');
                monitoringData = await response.json();
                updateUI();
            } catch (error) {
                console.error('Failed to refresh data:', error);
                // フォールバック: 静的データまたはローカルストレージから読み込み
                loadMockData();
                updateUI();
            }
        }
        
        function loadMockData() {
            monitoringData = {
                overall: { status: 'healthy' },
                performance: {
                    requestCount: 1523,
                    averageResponseTime: 145,
                    errorRate: 0.2,
                    uptime: 3600 * 24 * 3 // 3日
                },
                system: {
                    memoryUsage: { heapUsed: 45 * 1024 * 1024, heapTotal: 100 * 1024 * 1024 },
                    databaseSize: 15 * 1024 * 1024
                },
                alerts: [],
                logs: [
                    '[2024-12-09T10:30:00.000Z] INFO ItemService: Item created successfully',
                    '[2024-12-09T10:29:55.000Z] DEBUG MCPServer: Handling create_item request',
                    '[2024-12-09T10:29:50.000Z] INFO DatabaseService: Connection established'
                ]
            };
        }
        
        function updateUI() {
            // 全体ステータス
            const overallStatus = document.getElementById('overall-status');
            const status = monitoringData.overall?.status || 'unknown';
            overallStatus.textContent = status.toUpperCase();
            overallStatus.className = `metric-value status-${status}`;
            
            // パフォーマンスメトリクス
            if (monitoringData.performance) {
                const perf = monitoringData.performance;
                document.getElementById('request-count').textContent = perf.requestCount || '-';
                document.getElementById('response-time').textContent = `${perf.averageResponseTime || 0}ms`;
                document.getElementById('error-rate').textContent = `${(perf.errorRate || 0).toFixed(2)}%`;
                
                const uptimeHours = Math.floor((perf.uptime || 0) / 3600);
                const uptimeDays = Math.floor(uptimeHours / 24);
                document.getElementById('uptime').textContent = `${uptimeDays}d ${uptimeHours % 24}h`;
            }
            
            // システムリソース
            if (monitoringData.system) {
                const sys = monitoringData.system;
                if (sys.memoryUsage) {
                    const heapUsedMB = (sys.memoryUsage.heapUsed / 1024 / 1024).toFixed(1);
                    const heapTotalMB = (sys.memoryUsage.heapTotal / 1024 / 1024).toFixed(1);
                    const heapPercent = ((sys.memoryUsage.heapUsed / sys.memoryUsage.heapTotal) * 100).toFixed(1);
                    
                    document.getElementById('memory-usage').textContent = `${heapPercent}%`;
                    document.getElementById('heap-used').textContent = `${heapUsedMB}MB`;
                }
                
                if (sys.databaseSize) {
                    const dbSizeMB = (sys.databaseSize / 1024 / 1024).toFixed(2);
                    document.getElementById('db-size').textContent = `${dbSizeMB}MB`;
                }
            }
            
            // アラート
            const alertsContainer = document.getElementById('alerts-container');
            if (monitoringData.alerts && monitoringData.alerts.length > 0) {
                alertsContainer.innerHTML = monitoringData.alerts
                    .map(alert => `
                        <div class="alert alert-${alert.severity}">
                            <strong>${alert.rule}</strong>: ${alert.message}
                            <div style="font-size: 12px; color: #666;">
                                ${new Date(alert.timestamp).toLocaleString()}
                            </div>
                        </div>
                    `).join('');
            } else {
                alertsContainer.innerHTML = '<p>No active alerts</p>';
            }
            
            // ログ
            const logsContainer = document.getElementById('logs-container');
            if (monitoringData.logs) {
                logsContainer.innerHTML = monitoringData.logs.join('\n');
                logsContainer.scrollTop = logsContainer.scrollHeight;
            }
            
            // 更新時刻
            document.getElementById('last-update').textContent = 
                `Last Update: ${new Date().toLocaleString()}`;
        }
        
        // 初期化
        loadMockData();
        updateUI();
        
        // 自動更新（30秒間隔）
        setInterval(refreshData, 30000);
    </script>
</body>
</html>
```

## 8. ログローテーションと保持

### 8.1 ログローテーション設定

```bash
# scripts/setup-log-rotation.sh
#!/bin/bash

echo "📋 Setting up log rotation..."

LOG_DIR="./logs"
ROTATE_CONFIG="$LOG_DIR/logrotate.conf"

# ログディレクトリ作成
mkdir -p "$LOG_DIR"

# logrotate設定ファイル作成
cat > "$ROTATE_CONFIG" << 'EOF'
# Shirokuma MCP Log Rotation Configuration

./logs/*.log {
    # 毎日ローテーション
    daily
    
    # 7世代保持
    rotate 7
    
    # 圧縮する
    compress
    
    # 1世代遅れて圧縮（最新のログは圧縮しない）
    delaycompress
    
    # ログファイルが存在しなくてもエラーにしない
    missingok
    
    # 空のログファイルはローテーションしない
    notifempty
    
    # ローテーション後のファイル作成（権限644）
    create 644
    
    # 1MB以上のファイルは即座にローテーション
    size 1M
    
    # ローテーション後に実行するスクリプト
    postrotate
        # プロセスにSIGHUPを送信してログファイルを再オープン
        pkill -HUP -f "node.*shirokuma.*--serve" 2>/dev/null || true
    endscript
}

# エラーログは別設定（より長期保持）
./logs/error-*.log {
    weekly
    rotate 4
    compress
    delaycompress
    missingok
    notifempty
    create 644
    size 5M
}
EOF

echo "✅ Log rotation configuration created: $ROTATE_CONFIG"

# crontab設定の提案
echo ""
echo "To enable automatic log rotation, add this to your crontab:"
echo "# Daily log rotation at 2 AM"
echo "0 2 * * * cd $(pwd) && logrotate -s logs/.logrotate.state logs/logrotate.conf"
echo ""
echo "Run 'crontab -e' to edit your crontab"
```

### 8.2 ログ保持ポリシー

```typescript
// src/utils/log-retention.ts
export interface LogRetentionPolicy {
  logLevel: LogLevel;
  retentionDays: number;
  maxFileSize: number;
  archiveAfterDays: number;
}

export class LogRetentionManager {
  private policies: Map<LogLevel, LogRetentionPolicy> = new Map();

  constructor() {
    this.initializeDefaultPolicies();
  }

  private initializeDefaultPolicies(): void {
    // デフォルトの保持ポリシー
    this.policies.set(LogLevel.ERROR, {
      logLevel: LogLevel.ERROR,
      retentionDays: 90,      // エラーログは90日保持
      maxFileSize: 10 * 1024 * 1024, // 10MB
      archiveAfterDays: 30
    });

    this.policies.set(LogLevel.WARN, {
      logLevel: LogLevel.WARN,
      retentionDays: 30,      // 警告ログは30日保持
      maxFileSize: 5 * 1024 * 1024,  // 5MB
      archiveAfterDays: 7
    });

    this.policies.set(LogLevel.INFO, {
      logLevel: LogLevel.INFO,
      retentionDays: 14,      // 情報ログは14日保持
      maxFileSize: 5 * 1024 * 1024,  // 5MB
      archiveAfterDays: 3
    });

    this.policies.set(LogLevel.DEBUG, {
      logLevel: LogLevel.DEBUG,
      retentionDays: 7,       // デバッグログは7日保持
      maxFileSize: 2 * 1024 * 1024,  // 2MB
      archiveAfterDays: 1
    });
  }

  async cleanupLogs(logDir: string): Promise<void> {
    const fs = await import('fs');
    const path = await import('path');

    for (const [level, policy] of this.policies) {
      const levelName = LogLevel[level].toLowerCase();
      const pattern = new RegExp(`^${levelName}-\\d{4}-\\d{2}-\\d{2}\\.log$`);

      try {
        const files = await fs.promises.readdir(logDir);
        const logFiles = files.filter(file => pattern.test(file));

        for (const file of logFiles) {
          const filePath = path.join(logDir, file);
          const stats = await fs.promises.stat(filePath);
          const ageDays = (Date.now() - stats.mtime.getTime()) / (1000 * 60 * 60 * 24);

          // 保持期間を超えたファイルを削除
          if (ageDays > policy.retentionDays) {
            await fs.promises.unlink(filePath);
            logger.info(`Log file deleted: ${file}`, 'LogRetentionManager');
          }
          // アーカイブ対象のファイルを圧縮
          else if (ageDays > policy.archiveAfterDays && !file.endsWith('.gz')) {
            await this.compressLogFile(filePath);
          }
        }
      } catch (error) {
        logger.error(`Log cleanup failed for level ${levelName}`, 'LogRetentionManager', error);
      }
    }
  }

  private async compressLogFile(filePath: string): Promise<void> {
    const fs = await import('fs');
    const zlib = await import('zlib');
    const path = await import('path');

    const compressedPath = `${filePath}.gz`;
    const readStream = fs.createReadStream(filePath);
    const writeStream = fs.createWriteStream(compressedPath);
    const gzip = zlib.createGzip();

    return new Promise((resolve, reject) => {
      readStream
        .pipe(gzip)
        .pipe(writeStream)
        .on('finish', async () => {
          try {
            await fs.promises.unlink(filePath);
            logger.info(`Log file compressed: ${path.basename(filePath)}`, 'LogRetentionManager');
            resolve();
          } catch (error) {
            reject(error);
          }
        })
        .on('error', reject);
    });
  }
}
```

## 9. 運用スクリプト

### 9.1 監視スクリプト統合

```bash
#!/bin/bash
# scripts/monitor-system.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# 色設定
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# ログファイル
LOG_FILE="$PROJECT_DIR/logs/monitor-$(date +%Y%m%d).log"

log() {
    echo "$(date -Iseconds) $1" | tee -a "$LOG_FILE"
}

echo -e "${BLUE}🔍 Shirokuma MCP System Monitor${NC}"
echo "=================================="

# 1. ヘルスチェック実行
log "INFO: Starting health check..."
if "$SCRIPT_DIR/health-check.sh" >> "$LOG_FILE" 2>&1; then
    echo -e "${GREEN}✅ Health check: PASS${NC}"
    log "INFO: Health check completed successfully"
else
    HEALTH_EXIT_CODE=$?
    if [[ $HEALTH_EXIT_CODE -eq 2 ]]; then
        echo -e "${YELLOW}⚠️  Health check: DEGRADED${NC}"
        log "WARN: Health check completed with warnings"
    else
        echo -e "${RED}❌ Health check: FAIL${NC}"
        log "ERROR: Health check failed"
    fi
fi

# 2. メトリクス収集
log "INFO: Collecting metrics..."
if command -v node > /dev/null && [[ -f "$PROJECT_DIR/dist/utils/collect-metrics.js" ]]; then
    node "$PROJECT_DIR/dist/utils/collect-metrics.js" >> "$LOG_FILE" 2>&1
    echo -e "${GREEN}✅ Metrics: COLLECTED${NC}"
    log "INFO: Metrics collection completed"
else
    echo -e "${YELLOW}⚠️  Metrics: SKIPPED${NC}"
    log "WARN: Metrics collection skipped (script not available)"
fi

# 3. ログローテーション
log "INFO: Running log rotation..."
if [[ -f "$PROJECT_DIR/logs/logrotate.conf" ]]; then
    if command -v logrotate > /dev/null; then
        logrotate -s "$PROJECT_DIR/logs/.logrotate.state" "$PROJECT_DIR/logs/logrotate.conf" >> "$LOG_FILE" 2>&1
        echo -e "${GREEN}✅ Log rotation: COMPLETED${NC}"
        log "INFO: Log rotation completed"
    else
        echo -e "${YELLOW}⚠️  Log rotation: SKIPPED${NC}"
        log "WARN: Log rotation skipped (logrotate not available)"
    fi
else
    echo -e "${YELLOW}⚠️  Log rotation: NO CONFIG${NC}"
    log "WARN: Log rotation configuration not found"
fi

# 4. バックアップチェック
log "INFO: Checking backup status..."
BACKUP_DIR="$PROJECT_DIR/backups"
if [[ -d "$BACKUP_DIR" ]]; then
    LATEST_BACKUP=$(find "$BACKUP_DIR" -name "shirokuma_backup_*.db.gz" -type f -printf '%T@ %p\n' 2>/dev/null | sort -n | tail -1 | cut -d' ' -f2-)
    
    if [[ -n "$LATEST_BACKUP" ]]; then
        BACKUP_AGE=$(( ($(date +%s) - $(stat -c %Y "$LATEST_BACKUP" 2>/dev/null || stat -f %m "$LATEST_BACKUP" 2>/dev/null || echo "0")) / 3600 ))
        
        if [[ $BACKUP_AGE -lt 25 ]]; then  # 25時間以内
            echo -e "${GREEN}✅ Backup: RECENT (${BACKUP_AGE}h ago)${NC}"
            log "INFO: Recent backup found: $LATEST_BACKUP"
        else
            echo -e "${YELLOW}⚠️  Backup: OLD (${BACKUP_AGE}h ago)${NC}"
            log "WARN: Backup is old: $LATEST_BACKUP"
        fi
    else
        echo -e "${RED}❌ Backup: NOT FOUND${NC}"
        log "ERROR: No backup files found"
    fi
else
    echo -e "${YELLOW}⚠️  Backup: NO DIRECTORY${NC}"
    log "WARN: Backup directory not found"
fi

# 5. ディスク容量警告
log "INFO: Checking disk space..."
if command -v df > /dev/null; then
    DISK_USAGE=$(df "$PROJECT_DIR" | tail -1 | awk '{print $5}' | sed 's/%//')
    if [[ $DISK_USAGE -gt 90 ]]; then
        echo -e "${RED}❌ Disk: CRITICAL (${DISK_USAGE}%)${NC}"
        log "ERROR: Disk usage critical: ${DISK_USAGE}%"
    elif [[ $DISK_USAGE -gt 80 ]]; then
        echo -e "${YELLOW}⚠️  Disk: WARNING (${DISK_USAGE}%)${NC}"
        log "WARN: Disk usage high: ${DISK_USAGE}%"
    else
        echo -e "${GREEN}✅ Disk: OK (${DISK_USAGE}%)${NC}"
        log "INFO: Disk usage normal: ${DISK_USAGE}%"
    fi
fi

echo ""
echo "Monitor log: $LOG_FILE"
log "INFO: System monitoring completed"

# アラート送信（必要に応じて）
if [[ $HEALTH_EXIT_CODE -eq 1 ]] || [[ $DISK_USAGE -gt 90 ]]; then
    if [[ -n "$ALERT_WEBHOOK_URL" ]]; then
        log "INFO: Sending critical alert..."
        curl -X POST "$ALERT_WEBHOOK_URL" \
             -H "Content-Type: application/json" \
             -d "{\"text\":\"🚨 Shirokuma MCP Critical Alert: System health check failed or disk space critical\"}" \
             >> "$LOG_FILE" 2>&1 || true
    fi
fi
```

## 10. トラブルシューティング

### 10.1 よくある監視問題

```bash
# scripts/troubleshoot-monitoring.sh
#!/bin/bash

echo "🔍 Monitoring Troubleshooting Guide"
echo "==================================="

# ログファイル権限チェック
echo
echo "📋 Log File Permissions:"
if [[ -d "./logs" ]]; then
    ls -la ./logs/
    echo
    
    # 書き込み権限チェック
    if [[ -w "./logs" ]]; then
        echo "✅ Log directory is writable"
    else
        echo "❌ Log directory is not writable"
        echo "Fix: chmod 755 ./logs"
    fi
else
    echo "❌ Log directory not found"
    echo "Fix: mkdir -p ./logs"
fi

# データベースアクセスチェック
echo
echo "🗃️  Database Access:"
DB_PATH="./data/shirokuma.db"
if [[ -f "$DB_PATH" ]]; then
    if [[ -r "$DB_PATH" && -w "$DB_PATH" ]]; then
        echo "✅ Database file accessible"
        
        # 整合性チェック
        if sqlite3 "$DB_PATH" "PRAGMA integrity_check;" 2>/dev/null | grep -q "ok"; then
            echo "✅ Database integrity OK"
        else
            echo "❌ Database integrity check failed"
            echo "Fix: Run database repair or restore from backup"
        fi
    else
        echo "❌ Database file permission error"
        echo "Fix: chmod 600 $DB_PATH"
    fi
else
    echo "❌ Database file not found"
    echo "Fix: Initialize database with 'npm run db:push'"
fi

# プロセス監視チェック
echo
echo "⚙️  Process Monitoring:"
if command -v ps > /dev/null; then
    PROCESS_COUNT=$(pgrep -f "node.*shirokuma.*--serve" | wc -l)
    if [[ $PROCESS_COUNT -eq 1 ]]; then
        echo "✅ Single MCP server process running"
    elif [[ $PROCESS_COUNT -gt 1 ]]; then
        echo "⚠️  Multiple MCP server processes detected"
        echo "PIDs: $(pgrep -f "node.*shirokuma.*--serve" | tr '\n' ' ')"
        echo "Fix: Kill extra processes"
    else
        echo "❌ No MCP server process found"
        echo "Fix: Start server with 'npm start -- --serve'"
    fi
else
    echo "❌ ps command not available"
fi

# ログレベル設定チェック
echo
echo "📊 Log Configuration:"
if [[ -f ".env" ]]; then
    LOG_LEVEL=$(grep "LOG_LEVEL=" .env | cut -d'=' -f2 | tr -d '"' 2>/dev/null || echo "not set")
    echo "Log Level: $LOG_LEVEL"
    
    case $LOG_LEVEL in
        "error"|"warn"|"info"|"debug"|"trace")
            echo "✅ Valid log level"
            ;;
        "not set")
            echo "⚠️  Log level not set (using default: info)"
            ;;
        *)
            echo "❌ Invalid log level"
            echo "Fix: Set LOG_LEVEL to one of: error, warn, info, debug, trace"
            ;;
    esac
else
    echo "❌ .env file not found"
    echo "Fix: Copy .env.example to .env and configure"
fi

# メトリクス出力チェック
echo
echo "📈 Metrics Output:"
METRICS_FILE="./logs/metrics-$(date +%Y-%m-%d).json"
if [[ -f "$METRICS_FILE" ]]; then
    if jq . "$METRICS_FILE" > /dev/null 2>&1; then
        echo "✅ Metrics file format valid"
        METRICS_COUNT=$(jq '. | length' "$METRICS_FILE" 2>/dev/null || echo "0")
        echo "Metrics entries: $METRICS_COUNT"
    else
        echo "❌ Metrics file format invalid"
        echo "Fix: Check metrics collection script"
    fi
else
    echo "⚠️  No metrics file for today"
    echo "Note: File will be created when metrics are collected"
fi

echo
echo "🔧 Common Fixes:"
echo "---------------"
echo "1. Reset permissions: ./scripts/set-permissions.sh"
echo "2. Restart monitoring: systemctl restart shirokuma-mcp"
echo "3. Clear old logs: find ./logs -name '*.log' -mtime +7 -delete"
echo "4. Reset metrics: rm ./logs/metrics-*.json"
echo "5. Database repair: sqlite3 ./data/shirokuma.db 'REINDEX; VACUUM;'"
```

## 11. 次のステップ

監視・ログシステムの設定が完了したら、以下の追加改善を検討してください：

### 11.1 高度な監視機能

- **APM (Application Performance Monitoring)** ツールの統合
- **分散トレーシング** システムの実装
- **カスタムメトリクス** の追加
- **異常検知** アルゴリズムの実装

### 11.2 運用自動化

- **自動復旧** スクリプトの実装
- **容量計画** ツールの開発
- **パフォーマンス分析** の自動化
- **レポート生成** の自動化

### 11.3 セキュリティ監視

- **セキュリティログ** の分析
- **不審なアクティビティ** の検出
- **アクセスログ** の監視
- **脆弱性スキャン** の自動化

本監視・ログガイドを活用して、Shirokuma MCP Knowledge Baseの安定稼働と効率的な運用を実現してください。