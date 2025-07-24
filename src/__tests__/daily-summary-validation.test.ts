/**
 * @ai-context Test suite for daily summary validation and date format
 * @ai-pattern Unit tests for bug fixes discovered during functional testing
 * @ai-critical Tests duplicate prevention and date format validation
 */

import { WorkSessionManager } from '../session-manager';
import { FileIssueDatabase } from '../database';
import { CreateItemSchema } from '../schemas/unified-schemas';
import * as fs from 'fs';
import * as path from 'path';

describe('Daily Summary Validation', () => {
  const testDataDir = path.join(process.cwd(), 'tmp', 'mcp-test-summary-' + process.pid);
  const testSessionsDir = path.join(testDataDir, 'sessions');
  const testDbPath = path.join(testDataDir, 'test.db');
  let sessionManager: WorkSessionManager;
  let testDb: FileIssueDatabase;

  beforeEach(async () => {
    if (fs.existsSync(testDataDir)) {
      fs.rmSync(testDataDir, { recursive: true, force: true });
    }
    fs.mkdirSync(testDataDir, { recursive: true });
    
    testDb = new FileIssueDatabase(testDataDir, testDbPath);
    await testDb.initialize();
    sessionManager = new WorkSessionManager(testSessionsDir, testDb);
  });

  afterEach(() => {
    if (testDb) {
      testDb.close();
    }
    if (fs.existsSync(testDataDir)) {
      fs.rmSync(testDataDir, { recursive: true, force: true });
    }
  });

  describe('Duplicate Summary Prevention', () => {
    /**
     * @ai-intent Test that creating duplicate summaries for same date fails
     * @ai-critical Ensures one summary per day constraint
     */
    it('should prevent creating duplicate summaries for the same date', () => {
      const testDate = '2025-07-30';
      
      // Create first summary - should succeed
      const summary1 = sessionManager.createDailySummary(
        testDate,
        'First Summary',
        'This is the first summary',
        ['test']
      );
      expect(summary1).toBeDefined();
      expect(summary1.date).toBe(testDate);

      // Try to create duplicate - should throw
      expect(() => {
        sessionManager.createDailySummary(
          testDate,
          'Second Summary',
          'This should fail',
          ['test']
        );
      }).toThrow('Daily summary for 2025-07-30 already exists');
    });

    /**
     * @ai-intent Test that summaries for different dates work correctly
     * @ai-validation Ensures date is the unique key
     */
    it('should allow creating summaries for different dates', () => {
      const summary1 = sessionManager.createDailySummary(
        '2025-07-30',
        'July Summary',
        'Summary for July',
        []
      );
      
      const summary2 = sessionManager.createDailySummary(
        '2025-07-31',
        'August Summary',
        'Summary for August',
        []
      );

      expect(summary1.date).toBe('2025-07-30');
      expect(summary2.date).toBe('2025-07-31');
    });
  });

  describe('Date Format Validation', () => {
    /**
     * @ai-intent Test strict YYYY-MM-DD format validation
     * @ai-critical Prevents inconsistent date storage
     */
    it('should accept valid YYYY-MM-DD date format', () => {
      const validPlan = CreateItemSchema.parse({
        type: 'plan',
        title: 'Valid Date Test',
        content: 'Test content',
        start_date: '2025-01-01',
        end_date: '2025-12-31'
      });
      
      expect(validPlan.start_date).toBe('2025-01-01');
      expect(validPlan.end_date).toBe('2025-12-31');
    });

    /**
     * @ai-intent Test rejection of slash-separated dates
     * @ai-validation Common format error from user input
     */
    it('should reject date format with slashes', () => {
      expect(() => {
        CreateItemSchema.parse({
          type: 'plan',
          title: 'Invalid Date Test',
          content: 'Test content',
          start_date: '2025/01/01'
        });
      }).toThrow('Date must be in YYYY-MM-DD format');
    });

    /**
     * @ai-intent Test rejection of various invalid date formats
     * @ai-validation Comprehensive format validation
     */
    it('should reject various invalid date formats', () => {
      const invalidFormats = [
        { format: '01-01-2025', reason: 'Wrong order' },
        { format: '2025.01.01', reason: 'Dots instead of dashes' },
        { format: '2025-1-1', reason: 'No zero padding' },
        { format: '25-01-01', reason: 'Two-digit year' },
        { format: 'January 1, 2025', reason: 'Text format' },
      ];

      for (const { format, reason } of invalidFormats) {
        expect(() => {
          CreateItemSchema.parse({
            type: 'plan',
            title: 'Test',
            content: 'Test',
            start_date: format
          });
        }).toThrow('Date must be in YYYY-MM-DD format');
      }
    });

    /**
     * @ai-intent Test that date validation applies to end_date too
     * @ai-validation Both date fields use same validation
     */
    it('should validate end_date format as well', () => {
      expect(() => {
        CreateItemSchema.parse({
          type: 'plan',
          title: 'Test',
          content: 'Test',
          start_date: '2025-01-01', // Valid
          end_date: '2025/12/31'     // Invalid
        });
      }).toThrow('Date must be in YYYY-MM-DD format');
    });
  });
});