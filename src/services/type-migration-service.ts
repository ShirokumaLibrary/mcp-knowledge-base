// Type migration service for consolidating and splitting item types

import type {
  Item,
  MigrationSummary
} from '../types/migration-types';
import {
  ALL_KNOWN_TYPES,
  PATTERN_INDICATORS,
  WORKFLOW_INDICATORS
} from '../types/migration-types';

export class TypeMigrationService {
  constructor() {
    // Minimal constructor for GREEN phase
  }

  migrateItem(item: Item): Item | null {
    // Validate input structure
    if (!item || typeof item !== 'object') {
      throw new Error('Invalid item: must be an object');
    }

    // Validate required fields
    if (!item.id || typeof item.id !== 'number') {
      throw new Error('Invalid item: id must be a number');
    }
    if (!item.title || typeof item.title !== 'string') {
      throw new Error('Invalid item: title must be a string');
    }
    if (!item.type || typeof item.type !== 'string') {
      throw new Error('Invalid item: type must be a string');
    }

    // Handle obsolete state type
    if (item.type === 'state') {
      return null;
    }

    // Handle unknown types - pass through
    if (!this.isKnownType(item.type)) {
      return { ...item, requiresManualReview: true };
    }

    // Direct 1:1 mapping (issues stays as issues)
    if (item.type === 'issues') {
      return { ...item };
    }

    // Handle consolidation mappings
    const consolidatedItem = this.handleConsolidation(item);
    if (consolidatedItem) {
      return consolidatedItem;
    }

    // Handle splitting mappings
    const splitItem = this.handleSplitting(item);
    if (splitItem) {
      return splitItem;
    }

    // Default pass-through for unhandled types
    return { ...item };
  }

  private handleConsolidation(item: Item): Item | null {
    // Consolidate plans/features → tasks
    if (item.type === 'plans' || item.type === 'features') {
      return {
        ...item,
        type: 'tasks',
        originalType: item.type
      };
    }

    // Consolidate test_results → docs
    if (item.type === 'test_results') {
      return {
        ...item,
        type: 'docs',
        originalType: item.type
      };
    }

    // Consolidate dailies → sessions
    if (item.type === 'dailies') {
      return {
        ...item,
        type: 'sessions',
        originalType: item.type
      };
    }

    return null;
  }

  private handleSplitting(item: Item): Item | null {
    // Split knowledge → patterns or docs
    if (item.type === 'knowledge') {
      const isPattern = this.isPatternContent(item);
      return {
        ...item,
        type: isPattern ? 'patterns' : 'docs'
      };
    }

    // Split handovers → sessions or workflows
    if (item.type === 'handovers') {
      const isWorkflow = this.isWorkflowContent(item);
      return {
        ...item,
        type: isWorkflow ? 'workflows' : 'sessions'
      };
    }

    return null;
  }

  updateReferences(item: Item): Item {
    if (!item.related || !Array.isArray(item.related)) {
      return item;
    }

    const updatedReferences = item.related.map(ref => {
      // Parse reference format: "type-id"
      const match = ref.match(/^(\w+)-(\d+)$/);
      if (!match) {
        return ref;
      }

      const [, type, id] = match;

      // Map old types to new types
      let newType = type;
      if (type === 'plans' || type === 'features') {
        newType = 'tasks';
      } else if (type === 'test_results') {
        newType = 'docs';
      }
      // For knowledge, we'd need more context to determine patterns vs docs
      // For now, keep unchanged or use a default

      return newType === type ? ref : `${newType}-${id}`;
    });

    return {
      ...item,
      related: updatedReferences
    };
  }

  migrateBatch(items: Item[]): Item[] {
    // Validate input
    if (!Array.isArray(items)) {
      throw new Error('Invalid input: items must be an array');
    }

    const results: Item[] = [];
    for (let i = 0; i < items.length; i++) {
      try {
        const migrated = this.migrateItem(items[i]);
        if (migrated) {
          // Update references after migration
          results.push(this.updateReferences(migrated));
        }
      } catch (error) {
        throw new Error(`Migration failed for item at index ${i}: ${error.message}`);
      }
    }
    return results;
  }

  getMigrationSummary(items: Item[]): MigrationSummary {
    const summary: MigrationSummary = {
      total: items.length,
      migrated: {},
      errors: []
    };

    items.forEach(item => {
      const migrated = this.migrateItem(item);
      if (migrated === null) {
        summary.migrated['removed'] = (summary.migrated['removed'] || 0) + 1;
      } else if (migrated.type === 'tasks' && item.type !== 'tasks') {
        summary.migrated['tasks'] = (summary.migrated['tasks'] || 0) + 1;
      } else {
        summary.migrated[migrated.type] = (summary.migrated[migrated.type] || 0) + 1;
      }
    });

    return summary;
  }

  private isKnownType(type: string): boolean {
    return (ALL_KNOWN_TYPES as readonly string[]).includes(type);
  }

  private isPatternContent(item: Item): boolean {
    // Check tags first
    if (item.tags?.some(tag =>
      PATTERN_INDICATORS.tags.some(indicator =>
        tag.toLowerCase().includes(indicator)
      )
    )) {
      return true;
    }

    // Check title/content for pattern indicators
    const text = `${item.title} ${item.content || ''}`.toLowerCase();
    return PATTERN_INDICATORS.text.some(indicator =>
      text.includes(indicator)
    );
  }

  private isWorkflowContent(item: Item): boolean {
    // Check tags for workflow indicators
    if (item.tags?.some(tag =>
      WORKFLOW_INDICATORS.tags.some(indicator =>
        tag.toLowerCase().includes(indicator)
      )
    )) {
      return true;
    }

    // Check content for workflow patterns
    const content = (item.content || '').toLowerCase();
    return WORKFLOW_INDICATORS.text.some(indicator =>
      content.includes(indicator)
    );
  }
}