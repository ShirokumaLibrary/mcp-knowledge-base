import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PrismaClient } from '@prisma/client';

describe('EnhancedAIService - Title/Description/Content Integration', () => {
  let EnhancedAIService: any;
  let service: any;
  let prisma: any;
  let mockExtractWeightedKeywords: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();
    
    // Mock dependencies
    vi.doMock('../../../src/utils/logger.js', () => ({
      logger: {
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
        debug: vi.fn()
      }
    }));
    
    vi.doMock('@prisma/client', () => ({
      PrismaClient: vi.fn(() => ({}))
    }));
    
    // Mock ClaudeInterface with dynamic responses
    mockExtractWeightedKeywords = vi.fn();
    vi.doMock('../../../src/services/ai/claude-interface.js', () => ({
      ClaudeInterface: vi.fn(() => ({
        extractWeightedKeywords: mockExtractWeightedKeywords
      }))
    }));
    
    // Import after mocks
    const module = await import('../../../src/services/enhanced-ai.service.js');
    EnhancedAIService = module.EnhancedAIService;
    
    prisma = new PrismaClient();
    service = new EnhancedAIService(prisma);
    
    // Default mock implementation with content-aware responses
    mockExtractWeightedKeywords.mockImplementation(async (content) => {
      const fullText = `${content.title || ''} ${content.description || ''} ${content.content || ''}`;
      const text = fullText.toLowerCase();
      const keywords = [];
      const concepts = [];
      
      // Generate keywords based on content
      if (text.includes('react')) {
        keywords.push({ keyword: 'react', weight: 0.9 });
        concepts.push({ concept: 'frontend', confidence: 0.8 });
      }
      if (text.includes('performance')) {
        keywords.push({ keyword: 'performance', weight: 0.85 });
        concepts.push({ concept: 'optimization', confidence: 0.8 });
      }
      if (text.includes('optimization')) {
        keywords.push({ keyword: 'optimization', weight: 0.85 });
      }
      if (text.includes('guide')) {
        keywords.push({ keyword: 'guide', weight: 0.7 });
      }
      if (text.includes('database')) {
        keywords.push({ keyword: 'database', weight: 0.9 });
        concepts.push({ concept: 'database', confidence: 0.9 });
      }
      if (text.includes('migration')) {
        keywords.push({ keyword: 'migration', weight: 0.85 });
      }
      if (text.includes('postgresql')) {
        keywords.push({ keyword: 'postgresql', weight: 0.9 });
        keywords.push({ keyword: 'database', weight: 0.8 });
      }
      if (text.includes('api')) {
        keywords.push({ keyword: 'api', weight: 0.85 });
      }
      if (text.includes('security')) {
        keywords.push({ keyword: 'security', weight: 0.9 });
      }
      if (text.includes('authentication')) {
        keywords.push({ keyword: 'authentication', weight: 0.85 });
        keywords.push({ keyword: 'security', weight: 0.85 });
        concepts.push({ concept: 'authentication', confidence: 0.9 });
      }
      if (text.includes('docker')) {
        keywords.push({ keyword: 'docker', weight: 0.9 });
      }
      if (text.includes('kubernetes')) {
        keywords.push({ keyword: 'kubernetes', weight: 0.9 });
      }
      if (text.includes('machine learning')) {
        concepts.push({ concept: 'machine learning', confidence: 0.9 });
      }
      if (text.includes('artificial intelligence')) {
        concepts.push({ concept: 'artificial intelligence', confidence: 0.9 });
      }
      if (text.includes('graphql')) {
        keywords.push({ keyword: 'graphql', weight: 0.9 });
      }
      if (text.includes('typescript')) {
        keywords.push({ keyword: 'typescript', weight: 0.9 });
      }
      if (text.includes('javascript')) {
        keywords.push({ keyword: 'javascript', weight: 0.85 });
      }
      if (text.includes('python')) {
        keywords.push({ keyword: 'python', weight: 0.8 });
      }
      if (text.includes('programming')) {
        keywords.push({ keyword: 'programming', weight: 0.85 });
      }
      
      // Default keyword if none found
      if (keywords.length === 0) {
        keywords.push({ keyword: 'content', weight: 0.5 });
      }
      
      return {
        keywords: keywords.slice(0, 20),
        concepts: concepts.slice(0, 10),
        embedding: Buffer.from(new Array(128).fill(0)),
        summary: fullText.substring(0, 200) || 'Mock summary',
        searchIndex: keywords.map(k => k.keyword).join(' ')
      };
    });
  });

  describe('generateEnrichments with integrated text', () => {
    it('should include title in keyword extraction', async () => {
      const enrichments = await service.generateEnrichments({
        title: 'React Performance Optimization Guide',
        description: 'A guide about improving React app performance',
        content: 'This article covers various techniques for optimizing React applications.'
      });

      expect(enrichments.keywords).toContainEqual(
        expect.objectContaining({
          keyword: 'react',
          weight: expect.any(Number)
        })
      );
      expect(enrichments.keywords).toContainEqual(
        expect.objectContaining({
          keyword: 'performance',
          weight: expect.any(Number)
        })
      );
      expect(enrichments.keywords).toContainEqual(
        expect.objectContaining({
          keyword: 'optimization',
          weight: expect.any(Number)
        })
      );
    });

    it('should include description in keyword extraction', async () => {
      const enrichments = await service.generateEnrichments({
        title: 'Technical Document',
        description: 'Database migration strategies for PostgreSQL',
        content: 'This document explains various approaches.'
      });

      expect(enrichments.keywords).toContainEqual(
        expect.objectContaining({
          keyword: 'database',
          weight: expect.any(Number)
        })
      );
      expect(enrichments.keywords).toContainEqual(
        expect.objectContaining({
          keyword: 'migration',
          weight: expect.any(Number)
        })
      );
      expect(enrichments.keywords).toContainEqual(
        expect.objectContaining({
          keyword: 'postgresql',
          weight: expect.any(Number)
        })
      );
    });

    it('should apply weight priorities (title > description > content)', async () => {
      const enrichments = await service.generateEnrichments({
        title: 'TypeScript Best Practices',
        description: 'JavaScript coding standards',
        content: 'Python programming guidelines'
      });

      const tsKeyword = enrichments.keywords.find(k => k.keyword === 'typescript');
      const jsKeyword = enrichments.keywords.find(k => k.keyword === 'javascript');
      const pyKeyword = enrichments.keywords.find(k => k.keyword === 'python');

      expect(tsKeyword).toBeDefined();
      expect(jsKeyword).toBeDefined();
      
      if (tsKeyword && jsKeyword) {
        expect(tsKeyword.weight).toBeGreaterThan(jsKeyword.weight);
      }
    });

    it('should handle missing title gracefully', async () => {
      const enrichments = await service.generateEnrichments({
        title: undefined,
        description: 'API documentation for REST endpoints',
        content: 'This covers GET, POST, PUT, DELETE methods'
      });

      expect(enrichments.keywords).toContainEqual(
        expect.objectContaining({
          keyword: 'api'
        })
      );
      expect(enrichments.keywords.length).toBeGreaterThan(0);
    });

    it('should handle missing description gracefully', async () => {
      const enrichments = await service.generateEnrichments({
        title: 'Security Best Practices',
        description: undefined,
        content: 'Authentication and authorization guidelines'
      });

      expect(enrichments.keywords).toContainEqual(
        expect.objectContaining({
          keyword: 'security'
        })
      );
      expect(enrichments.keywords.length).toBeGreaterThan(0);
    });

    it('should handle all fields missing except content', async () => {
      const enrichments = await service.generateEnrichments({
        title: undefined,
        description: undefined,
        content: 'Docker containerization and Kubernetes orchestration'
      });

      expect(enrichments.keywords).toContainEqual(
        expect.objectContaining({
          keyword: 'docker'
        })
      );
      expect(enrichments.keywords).toContainEqual(
        expect.objectContaining({
          keyword: 'kubernetes'
        })
      );
    });

    it('should include title and description in concept extraction', async () => {
      const enrichments = await service.generateEnrichments({
        title: 'Machine Learning Introduction',
        description: 'Artificial Intelligence fundamentals',
        content: 'Basic concepts of neural networks'
      });

      const concepts = enrichments.concepts.map(c => c.concept.toLowerCase());
      
      expect(concepts).toContain('machine learning');
      expect(concepts).toContain('artificial intelligence');
    });

    it('should generate summary considering all fields', async () => {
      const enrichments = await service.generateEnrichments({
        title: 'GraphQL vs REST API',
        description: 'Comparison of API architectures',
        content: 'This article compares GraphQL and REST approaches'
      });

      expect(enrichments.summary).toContain('GraphQL');
      expect(enrichments.summary.length).toBeGreaterThan(20);
    });

    it('should create embeddings from combined text', async () => {
      const enrichments = await service.generateEnrichments({
        title: 'Cloud Architecture Patterns',
        description: 'AWS and Azure best practices',
        content: 'Microservices deployment strategies'
      });

      expect(enrichments.embedding).toBeDefined();
      expect(enrichments.embedding.length).toBe(128);
      expect(enrichments.embedding.every((v: number) => v >= -128 && v <= 127)).toBe(true);
    });

    it('should handle very long combined text appropriately', async () => {
      const longContent = 'Lorem ipsum '.repeat(1000);
      
      const enrichments = await service.generateEnrichments({
        title: 'Performance Testing Results',
        description: 'Comprehensive benchmark analysis',
        content: longContent
      });

      expect(enrichments.keywords.length).toBeLessThanOrEqual(20);
      expect(enrichments.concepts.length).toBeLessThanOrEqual(10);
      expect(enrichments.summary.length).toBeLessThanOrEqual(500);
    });
  });

  describe('edge cases', () => {
    it('should handle empty strings differently from undefined', async () => {
      const enrichments = await service.generateEnrichments({
        title: '',
        description: '',
        content: 'Actual content here'
      });

      expect(enrichments.keywords.length).toBeGreaterThan(0);
      expect(enrichments.summary).toBeDefined();
    });

    it('should handle special characters in title and description', async () => {
      const enrichments = await service.generateEnrichments({
        title: 'C++ & C# Programming',
        description: 'Java/JavaScript & TypeScript',
        content: 'Programming languages comparison'
      });

      const keywords = enrichments.keywords.map(k => k.keyword);
      expect(keywords).toContain('programming');
    });

    it('should maintain consistency in keyword weights', async () => {
      const enrichments = await service.generateEnrichments({
        title: 'React React React',
        description: 'React framework',
        content: 'React library'
      });

      const reactKeywords = enrichments.keywords.filter(k => k.keyword === 'react');
      expect(reactKeywords.length).toBe(1);
      expect(reactKeywords[0].weight).toBeGreaterThan(0.5);
    });
  });
});