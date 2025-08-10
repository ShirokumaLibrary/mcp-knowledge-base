// Compatibility layer for bidirectional type conversion

import type {
  Request,
  ConvertedRequest,
  ConversionOptions
} from '../types/migration-types';
import {
  PATTERN_INDICATORS,
  DOCUMENTATION_INDICATORS,
  WORKFLOW_INDICATORS,
  SESSION_INDICATORS
} from '../types/migration-types';

export class TypeCompatibilityLayer {
  constructor() {
    // Minimal constructor for GREEN phase
  }

  legacyToNew(request: Request): ConvertedRequest {
    // Validate request structure
    if (!request || request.data === undefined) {
      throw new Error('Invalid request structure');
    }

    const { type, data } = request;

    // Handle obsolete types
    if (type === 'state') {
      return {
        type: 'obsolete',
        data,
        skipProcessing: true,
        reason: 'state type is obsolete'
      };
    }

    // Handle unknown types
    if (!this.isKnownLegacyType(type)) {
      return {
        type: 'unknown',
        data,
        requiresManualReview: true
      };
    }

    // Direct 1:1 mappings
    if (type === 'issues' || type === 'decisions' || type === 'sessions') {
      return { type, data };
    }

    // Consolidation mappings (Many:1)
    if (type === 'features') {
      return {
        type: 'tasks',
        data: {
          ...data,
          originalType: 'features',
          taskCategory: 'feature'
        }
      };
    }

    if (type === 'plans') {
      return {
        type: 'tasks',
        data: {
          ...data,
          originalType: 'plans',
          taskCategory: 'plan'
        }
      };
    }

    if (type === 'test_results') {
      return {
        type: 'docs',
        data: {
          ...data,
          originalType: 'test_results',
          docCategory: 'test-report'
        }
      };
    }

    if (type === 'dailies') {
      return {
        type: 'sessions',
        data: {
          ...data,
          originalType: 'dailies',
          sessionCategory: 'daily-summary'
        }
      };
    }

    // Classification mappings (1:Many)
    if (type === 'knowledge') {
      const isPattern = this.classifyKnowledge(data);
      if (isPattern) {
        return {
          type: 'patterns',
          data: {
            ...data,
            patternType: 'best-practice'
          }
        };
      } else {
        return {
          type: 'docs',
          data: {
            ...data,
            originalType: 'knowledge',
            docCategory: 'technical-documentation'
          }
        };
      }
    }

    if (type === 'handovers') {
      const isWorkflow = this.classifyHandover(data);
      if (isWorkflow) {
        return {
          type: 'workflows',
          data: {
            ...data,
            workflowType: 'process'
          }
        };
      } else {
        return {
          type: 'sessions',
          data: {
            ...data,
            sessionCategory: 'handover'
          }
        };
      }
    }

    // Default pass-through
    return { type, data };
  }

  newToLegacy(item: Record<string, unknown>, options: ConversionOptions = {}): Record<string, unknown> {
    // Validate input
    if (!item || typeof item !== 'object') {
      throw new Error('Invalid item: must be an object');
    }

    // If legacy mode is off, pass through unchanged
    if (!options.legacyMode) {
      return item;
    }

    const { type, data } = item;

    // Validate type field
    if (!type || typeof type !== 'string') {
      throw new Error('Invalid item: type must be a string');
    }
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid item: data must be an object');
    }

    // Reverse mapping: tasks → features/plans
    if (type === 'tasks') {
      if (data.originalType === 'features' || data.taskCategory === 'feature') {
        const cleanData = { ...data };
        delete cleanData.taskCategory;
        delete cleanData.originalType;
        return {
          type: 'features',
          data: cleanData
        };
      }
      if (data.originalType === 'plans' || data.taskCategory === 'plan') {
        const cleanData = { ...data };
        delete cleanData.taskCategory;
        delete cleanData.originalType;
        return {
          type: 'plans',
          data: cleanData
        };
      }
    }

    // Reverse mapping: patterns → knowledge
    if (type === 'patterns') {
      const cleanData = { ...data };
      delete cleanData.patternType;
      return {
        type: 'knowledge',
        data: {
          ...cleanData,
          tags: [...(cleanData.tags || []), 'pattern']
        }
      };
    }

    // Reverse mapping: docs → knowledge/test_results
    if (type === 'docs') {
      if (data.originalType === 'test_results' || data.docCategory === 'test-report') {
        const cleanData = { ...data };
        delete cleanData.docCategory;
        delete cleanData.originalType;
        return {
          type: 'test_results',
          data: cleanData
        };
      }
      if (data.originalType === 'knowledge') {
        const cleanData = { ...data };
        delete cleanData.docCategory;
        delete cleanData.originalType;
        return {
          type: 'knowledge',
          data: cleanData
        };
      }
    }

    // Default pass-through
    return item;
  }

  batchLegacyToNew(requests: Request[]): ConvertedRequest[] {
    // Validate input
    if (!Array.isArray(requests)) {
      throw new Error('Invalid input: requests must be an array');
    }

    return requests.map((request, index) => {
      try {
        return this.legacyToNew(request);
      } catch (error) {
        throw new Error(`Conversion failed for request at index ${index}: ${error.message}`);
      }
    });
  }

  private isKnownLegacyType(type: string): boolean {
    const knownTypes = [
      'issues', 'plans', 'features', 'knowledge', 'test_results',
      'handovers', 'dailies', 'state', 'decisions', 'sessions'
    ];
    return knownTypes.includes(type);
  }

  private classifyKnowledge(data: Record<string, unknown>): boolean {
    // Check tags
    const tagClassification = this.classifyByTags(
      data.tags as string[] | undefined,
      PATTERN_INDICATORS.tags,
      DOCUMENTATION_INDICATORS.tags
    );
    if (tagClassification !== null) {
      return tagClassification;
    }

    // Analyze content
    const text = `${data.title || ''} ${data.content || ''}`.toLowerCase();
    return this.classifyByText(
      text,
      PATTERN_INDICATORS.text,
      DOCUMENTATION_INDICATORS.text
    );
  }

  private classifyByTags(
    tags: string[] | undefined,
    positiveIndicators: readonly string[],
    negativeIndicators: readonly string[]
  ): boolean | null {
    if (!tags || !Array.isArray(tags)) {
      return null;
    }

    const hasPositive = tags.some((tag: string) =>
      positiveIndicators.some(indicator =>
        tag.toLowerCase().includes(indicator)
      )
    );
    if (hasPositive) {
      return true;
    }

    const hasNegative = tags.some((tag: string) =>
      negativeIndicators.some(indicator =>
        tag.toLowerCase().includes(indicator)
      )
    );
    if (hasNegative) {
      return false;
    }

    return null;
  }

  private classifyByText(
    text: string,
    positiveIndicators: readonly string[],
    negativeIndicators: readonly string[]
  ): boolean {
    // Check positive indicators
    if (positiveIndicators.some(indicator => text.includes(indicator))) {
      return true;
    }

    // Check negative indicators
    if (negativeIndicators.some(indicator => text.includes(indicator))) {
      return false;
    }

    // Default to false
    return false;
  }

  private classifyHandover(data: Record<string, unknown>): boolean {
    // Check tags
    const tagClassification = this.classifyByTags(
      data.tags as string[] | undefined,
      WORKFLOW_INDICATORS.tags,
      SESSION_INDICATORS.tags
    );
    if (tagClassification !== null) {
      return tagClassification;
    }

    // Analyze content
    const content = (data.content || '').toLowerCase();
    const hasWorkflowPatterns = WORKFLOW_INDICATORS.text.some(
      indicator => content.includes(indicator)
    );

    return hasWorkflowPatterns;
  }
}