// Common type definitions for type migration system

// Base item interface for migration
export interface Item {
  id: number;
  type: string;
  title: string;
  description?: string;
  content?: string;
  status?: string;
  priority?: string;
  tags?: string[];
  related?: string[];
  date?: string;
  timestamp?: string;
  originalType?: string;
  requiresManualReview?: boolean;
  [key: string]: unknown;
}

// Request types for compatibility layer
export interface Request {
  type: string;
  data: Record<string, unknown>;
}

export interface ConvertedRequest extends Request {
  skipProcessing?: boolean;
  reason?: string;
  requiresManualReview?: boolean;
}

// Router request types
export interface RouterRequest {
  method: string;
  params: Record<string, unknown>;
  context?: {
    clientVersion?: string;
    legacyMode?: boolean;
  };
}

// Configuration and options
export interface ConversionOptions {
  legacyMode?: boolean;
}

export interface FeatureFlags {
  enableNewTypes?: boolean;
  enableKnowledgeClassification?: boolean;
  enableReferenceUpdates?: boolean;
}

// Summary and metrics
export interface MigrationSummary {
  total: number;
  migrated: Record<string, number>;
  errors: string[];
}

export interface Metrics {
  legacyTypeCount: number;
  newTypeCount: number;
  migrationErrors: number;
}

// Logger interface
export interface Logger {
  warn: (message: string) => void;
}

// Type system constants
export const LEGACY_TYPES = [
  'features',
  'plans',
  'test_results',
  'dailies',
  'handovers',
  'knowledge',
  'state'
] as const;

export const NEW_TYPES = [
  'tasks',
  'patterns',
  'workflows'
] as const;

export const STABLE_TYPES = [
  'issues',
  'decisions',
  'sessions',
  'docs'
] as const;

export const ALL_KNOWN_TYPES = [
  ...LEGACY_TYPES,
  ...NEW_TYPES,
  ...STABLE_TYPES
] as const;

export const OBSOLETE_TYPES = ['state'] as const;

// Type guards
export type LegacyType = typeof LEGACY_TYPES[number];
export type NewType = typeof NEW_TYPES[number];
export type StableType = typeof STABLE_TYPES[number];
export type ObsoleteType = typeof OBSOLETE_TYPES[number];
export type KnownType = typeof ALL_KNOWN_TYPES[number];

// Classification constants
export const PATTERN_INDICATORS = {
  tags: ['pattern', 'reusable', 'best-practice'],
  text: ['pattern', 'can be applied', 'best practice']
} as const;

export const DOCUMENTATION_INDICATORS = {
  tags: ['documentation', 'api', 'schema'],
  text: ['our api', 'our database', 'configuration']
} as const;

export const WORKFLOW_INDICATORS = {
  tags: ['workflow', 'process', 'ci-cd', 'deployment'],
  text: ['step 1', 'step 2', 'workflow', 'process']
} as const;

export const SESSION_INDICATORS = {
  tags: ['session', 'development', 'handover'],
  text: []
} as const;