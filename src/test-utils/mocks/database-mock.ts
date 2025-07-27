/**
 * @ai-context Mock implementations for database interfaces
 * @ai-pattern Test doubles for isolated unit testing
 * @ai-critical Ensures tests don't depend on real database
 */

import type { Database } from '../../database/base.js';
import { Logger } from 'winston';
import { jest } from '@jest/globals';

/**
 * @ai-intent Create mock database with all repositories
 * @ai-pattern Factory function for test database
 */
export function createMockDatabase(): any {
  const mockDb = {
    // Core repositories
    statusRepository: createMockStatusRepository(),
    tagRepository: createMockTagRepository(),
    issueRepository: {},
    planRepository: {},
    documentRepository: {},
    sessionRepository: {},
    summaryRepository: {},
    typeManager: {},
    
    // Core methods
    initialize: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
    close: jest.fn<() => void>(),
    validateSchema: jest.fn<() => Promise<boolean>>().mockResolvedValue(true),
    rebuildSearchIndex: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
    runMigrations: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
    getVersion: jest.fn<() => string>().mockReturnValue('1.0.0'),
    isInitialized: jest.fn<() => boolean>().mockReturnValue(true),
    
    // Transaction support
    transaction: jest.fn<(fn: () => Promise<any>) => Promise<any>>().mockImplementation(async (fn: any) => fn()),
    
    // Search functionality
    search: jest.fn<() => Promise<any[]>>().mockResolvedValue([]),
    searchByTag: jest.fn<() => Promise<any[]>>().mockResolvedValue([]),
    
    // Type management
    getTypes: jest.fn<() => Promise<any>>().mockResolvedValue({
      tasks: ['issues', 'plans'],
      documents: ['docs', 'knowledge']
    }),
    createType: jest.fn<() => Promise<boolean>>().mockResolvedValue(true),
    deleteType: jest.fn<() => Promise<boolean>>().mockResolvedValue(true),
    
    // Utility methods
    getStats: jest.fn<() => Promise<any>>().mockResolvedValue({
      issues: 0,
      plans: 0,
      documents: 0,
      tags: 0
    })
  };
  
  return mockDb;
}

/**
 * @ai-intent Create mock status repository
 * @ai-pattern Stub implementation for status operations
 */
export function createMockStatusRepository(): any {
  const defaultStatuses = [
    { id: 1, name: 'Open', is_closed: false },
    { id: 2, name: 'In Progress', is_closed: false },
    { id: 3, name: 'Done', is_closed: true }
  ];
  
  return {
    getAll: jest.fn<() => Promise<any[]>>().mockResolvedValue(defaultStatuses),
    getById: jest.fn<(id: number) => Promise<any>>().mockImplementation(async (id: number) => 
      defaultStatuses.find(s => s.id === id) || null
    ),
    getByName: jest.fn<(name: string) => Promise<any>>().mockImplementation(async (name: string) =>
      defaultStatuses.find(s => s.name === name) || null
    ),
    create: jest.fn<() => Promise<any>>().mockResolvedValue({ id: 4, name: 'New Status', is_closed: false }),
    update: jest.fn<() => Promise<boolean>>().mockResolvedValue(true),
    delete: jest.fn<() => Promise<boolean>>().mockResolvedValue(true),
    isInUse: jest.fn<() => Promise<boolean>>().mockResolvedValue(false),
    getOpenStatuses: jest.fn<() => Promise<any[]>>().mockResolvedValue(
      defaultStatuses.filter(s => !s.is_closed)
    ),
    getClosedStatuses: jest.fn<() => Promise<any[]>>().mockResolvedValue(
      defaultStatuses.filter(s => s.is_closed)
    )
  };
}

/**
 * @ai-intent Create mock tag repository
 * @ai-pattern Stub implementation for tag operations
 */
export function createMockTagRepository(): any {
  const mockTags = ['bug', 'feature', 'documentation'];
  
  return {
    getAll: jest.fn<() => Promise<string[]>>().mockResolvedValue(mockTags),
    create: jest.fn<() => Promise<string>>().mockResolvedValue('new-tag'),
    delete: jest.fn<() => Promise<boolean>>().mockResolvedValue(true),
    rename: jest.fn<() => Promise<boolean>>().mockResolvedValue(true),
    search: jest.fn<(pattern: string) => Promise<string[]>>().mockImplementation(async (pattern: string) =>
      mockTags.filter(tag => tag.includes(pattern))
    ),
    getUsageCount: jest.fn<() => Promise<number>>().mockResolvedValue(5),
    getUnusedTags: jest.fn<() => Promise<string[]>>().mockResolvedValue([]),
    bulkCreate: jest.fn<() => Promise<string[]>>().mockResolvedValue(['tag1', 'tag2']),
    bulkDelete: jest.fn<() => Promise<number>>().mockResolvedValue(2),
    ensureExists: jest.fn<(tag: string) => Promise<string>>().mockImplementation(async (tag: string) => tag)
  };
}

/**
 * @ai-intent Create mock repository with CRUD operations
 * @ai-pattern Generic mock for entity repositories
 */
export function createMockRepository<T extends { id: number }>(
  entityName: string,
  defaultItems: T[] = []
) {
  const items = [...defaultItems];
  let nextId = Math.max(0, ...items.map(i => i.id)) + 1;
  
  return {
    getAll: jest.fn<() => Promise<T[]>>().mockResolvedValue(items),
    getById: jest.fn<(id: number) => Promise<T | null>>().mockImplementation(async (id: number) =>
      items.find(item => item.id === id) || null
    ),
    create: jest.fn<(data: Omit<T, 'id'>) => Promise<T>>().mockImplementation(async (data: Omit<T, 'id'>) => {
      const newItem = { ...data, id: nextId++ } as T;
      items.push(newItem);
      return newItem;
    }),
    update: jest.fn<(id: number, data: Partial<T>) => Promise<boolean>>().mockImplementation(async (id: number, data: Partial<T>) => {
      const index = items.findIndex(item => item.id === id);
      if (index >= 0) {
        items[index] = { ...items[index], ...data };
        return true;
      }
      return false;
    }),
    delete: jest.fn<(id: number) => Promise<boolean>>().mockImplementation(async (id: number) => {
      const index = items.findIndex(item => item.id === id);
      if (index >= 0) {
        items.splice(index, 1);
        return true;
      }
      return false;
    }),
    search: jest.fn<() => Promise<T[]>>().mockResolvedValue(items),
    count: jest.fn<() => Promise<number>>().mockResolvedValue(items.length),
    exists: jest.fn<(id: number) => Promise<boolean>>().mockImplementation(async (id: number) =>
      items.some(item => item.id === id)
    )
  };
}

/**
 * @ai-intent Create mock logger
 * @ai-pattern Test logger that doesn't output
 */
export function createMockLogger(): Logger {
  return {
    error: jest.fn() as jest.Mock,
    warn: jest.fn() as jest.Mock,
    info: jest.fn() as jest.Mock,
    debug: jest.fn() as jest.Mock,
    verbose: jest.fn() as jest.Mock,
    silly: jest.fn() as jest.Mock,
    log: jest.fn() as jest.Mock
  } as unknown as Logger;
}

/**
 * @ai-intent Create spy on existing object methods
 * @ai-pattern Wrapper for partial mocking
 */
export function spyOnMethods<T extends object>(
  obj: T,
  methods: (keyof T)[]
): T {
  const spied = { ...obj };
  
  methods.forEach(method => {
    if (typeof obj[method] === 'function') {
      (spied[method] as any) = jest.fn(obj[method] as any);
    }
  });
  
  return spied;
}

/**
 * @ai-intent Reset all mock functions
 * @ai-pattern Clean state between tests
 */
export function resetAllMocks(mocks: any[]): void {
  mocks.forEach(mock => {
    if (mock && typeof mock === 'object') {
      Object.values(mock).forEach(value => {
        if (typeof value === 'function' && 'mockReset' in value) {
          (value as any).mockReset();
        }
      });
    }
  });
}