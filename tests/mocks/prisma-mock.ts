/**
 * Shared Prisma mock for tests
 * Provides default export for ESM/CommonJS compatibility
 */

import { vi } from 'vitest';

export const createPrismaMock = () => ({
  item: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },
  status: {
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
  },
  tag: {
    findMany: vi.fn(),
    createMany: vi.fn(),
    create: vi.fn(),
  },
  itemTag: {
    deleteMany: vi.fn(),
    createMany: vi.fn(),
    findMany: vi.fn(),
  },
  keyword: {
    findMany: vi.fn(),
    createMany: vi.fn(),
    findFirst: vi.fn(),
  },
  concept: {
    findMany: vi.fn(),
    createMany: vi.fn(),
    findFirst: vi.fn(),
  },
  itemKeyword: {
    deleteMany: vi.fn(),
    createMany: vi.fn(),
    findMany: vi.fn(),
  },
  itemConcept: {
    deleteMany: vi.fn(),
    createMany: vi.fn(),
    findMany: vi.fn(),
  },
  itemRelation: {
    findMany: vi.fn(),
    createMany: vi.fn(),
    deleteMany: vi.fn(),
  },
  systemState: {
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  $transaction: vi.fn(function(this: any, callback: any) { 
    return callback(this); 
  }),
});

export const MockPrismaClient = vi.fn(() => createPrismaMock());

// Mock Prisma errors
export const MockPrisma = {
  PrismaClientKnownRequestError: class PrismaClientKnownRequestError extends Error {
    code: string;
    constructor(message: string, { code }: { code: string }) {
      super(message);
      this.code = code;
    }
  },
};