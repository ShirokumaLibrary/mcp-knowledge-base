/**
 * Configuration for automatic export functionality
 */
export interface AutoExportConfig {
  /** Whether auto-export is enabled (based on SHIROKUMA_EXPORT_DIR env var) */
  enabled: boolean;
  
  /** Base directory for exports */
  baseDir: string;
  
  /** Timeout for export operations in milliseconds */
  timeout: number;
}

/**
 * Result of an auto-export operation
 */
export interface AutoExportResult {
  /** Whether the export succeeded */
  success: boolean;
  
  /** Path to the exported file (if successful) */
  filePath?: string;
  
  /** Error message (if failed) */
  error?: string;
  
  /** Duration of the export in milliseconds */
  duration: number;
}

/**
 * Options for configuring auto-export behavior
 */
export interface AutoExportOptions {
  /** Maximum concurrent exports */
  maxConcurrent?: number;
  
  /** Whether to batch writes */
  batchWrites?: boolean;
  
  /** Batch flush interval in milliseconds */
  batchFlushInterval?: number;
  
  /** Whether to use directory caching */
  useDirectoryCache?: boolean;
}

/**
 * Metrics for monitoring auto-export performance
 */
export interface AutoExportMetrics {
  /** Total number of successful exports */
  successCount: number;
  
  /** Total number of failed exports */
  errorCount: number;
  
  /** Average export duration in milliseconds */
  averageDuration: number;
  
  /** Current queue size */
  queueSize: number;
  
  /** Last export timestamp */
  lastExportTime?: Date;
}