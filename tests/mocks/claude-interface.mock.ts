import { vi } from 'vitest';
import type { EnrichedMetadata } from '../../src/services/ai/claude-interface.js';

/**
 * Mock implementation of ClaudeInterface for testing
 * Returns deterministic results for stable testing
 */
export const mockClaudeInterface = {
  callClaude: vi.fn().mockResolvedValue(JSON.stringify({
    keywords: [
      { keyword: 'test', weight: 0.9 },
      { keyword: 'mock', weight: 0.8 },
      { keyword: 'stable', weight: 0.7 }
    ],
    concepts: [
      { concept: 'testing', confidence: 0.9 },
      { concept: 'mocking', confidence: 0.8 }
    ],
    summary: 'Mock summary for testing'
  })),
  
  extractWeightedKeywords: vi.fn().mockImplementation(async (content: any): Promise<EnrichedMetadata> => {
    // Return deterministic results based on content
    const text = `${content.title || ''} ${content.description || ''} ${content.content || ''}`.toLowerCase();
    
    // Extract simple keywords for predictable testing
    const keywords = [];
    const concepts = [];
    
    // Add predictable keywords based on content
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
      concepts.push({ concept: 'documentation', confidence: 0.7 });
    }
    if (text.includes('database')) {
      keywords.push({ keyword: 'database', weight: 0.9 });
      concepts.push({ concept: 'database', confidence: 0.9 });
    }
    if (text.includes('migration')) {
      keywords.push({ keyword: 'migration', weight: 0.85 });
      concepts.push({ concept: 'database', confidence: 0.8 });
    }
    if (text.includes('postgresql')) {
      keywords.push({ keyword: 'postgresql', weight: 0.9 });
      keywords.push({ keyword: 'database', weight: 0.8 });
      concepts.push({ concept: 'database', confidence: 0.9 });
    }
    if (text.includes('graphdb')) {
      keywords.push({ keyword: 'graph', weight: 0.85 });
      keywords.push({ keyword: 'database', weight: 0.85 });
      keywords.push({ keyword: 'graphdb', weight: 0.9 });
      concepts.push({ concept: 'database', confidence: 0.9 });
    }
    if (text.includes('graphrag')) {
      keywords.push({ keyword: 'graph', weight: 0.8 });
      keywords.push({ keyword: 'rag', weight: 0.8 });
      keywords.push({ keyword: 'retrieval', weight: 0.75 });
      keywords.push({ keyword: 'graphrag', weight: 0.9 });
      concepts.push({ concept: 'ai', confidence: 0.8 });
    }
    if (text.includes('authentication')) {
      keywords.push({ keyword: 'authentication', weight: 0.9 });
      keywords.push({ keyword: 'auth', weight: 0.8 });
      keywords.push({ keyword: 'security', weight: 0.85 });
      concepts.push({ concept: 'authentication', confidence: 0.9 });
      concepts.push({ concept: 'security', confidence: 0.8 });
    }
    if (text.includes('updated')) {
      keywords.push({ keyword: 'updated', weight: 0.7 });
    }
    if (text.includes('ai')) {
      keywords.push({ keyword: 'ai', weight: 0.85 });
      concepts.push({ concept: 'ai', confidence: 0.85 });
    }
    if (text.includes('enrichment')) {
      keywords.push({ keyword: 'enrichment', weight: 0.8 });
    }
    
    // Default keywords if none found
    if (keywords.length === 0) {
      keywords.push({ keyword: 'content', weight: 0.5 });
    }
    
    // Generate deterministic embedding
    const embedding = new Array(128).fill(0);
    for (let i = 0; i < Math.min(keywords.length, 10); i++) {
      embedding[i * 10] = keywords[i].weight;
    }
    
    // Convert to Buffer
    const quantized = new Uint8Array(128);
    for (let i = 0; i < 128; i++) {
      quantized[i] = Math.round(embedding[i] * 127.5 + 127.5);
    }
    
    return {
      keywords: keywords.slice(0, 15),
      concepts: concepts.slice(0, 5),
      embedding: Buffer.from(quantized),
      summary: text.substring(0, 200) || 'Mock summary',
      searchIndex: text.substring(0, 500)
    };
  })
};

// Create a mock constructor
export const MockClaudeInterface = vi.fn().mockImplementation(() => mockClaudeInterface);