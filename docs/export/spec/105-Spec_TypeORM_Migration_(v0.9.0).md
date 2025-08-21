---
id: 105
type: spec
title: "Spec: TypeORM Migration (v0.9.0)"
description: "Complete specification for migrating from Prisma to TypeORM to solve global CLI distribution issues"
status: Specification
priority: HIGH
aiSummary: "Complete specification for migrating SHIROKUMA Knowledge Base from Prisma to TypeORM to resolve global CLI distribution issues, including detailed requirements, architecture design, entities, repositories, and implementation tasks."
tags: ["architecture","migration","typeorm","v0.9.0","spec","orm"]
keywords: {"migration":1,"typeorm":1,"database":0.9,"prisma":0.9,"entity":0.8}
concepts: {"database_migration":0.95,"orm_framework":0.9,"software_architecture":0.85,"system_design":0.8,"api_compatibility":0.75}
related: [98,107,108,109]
created: 2025-08-21T14:12:49.007Z
updated: 2025-08-21T14:28:44.867Z
---

# Spec: TypeORM Migration (v0.9.0)

## Metadata
- **Created**: 2025-08-21
- **Status**: Specification
- **Priority**: HIGH
- **Related Issue**: #98
- **Estimated Time**: 56 hours (7 work days)
- **Version**: 1.0

## Executive Summary

Migration from Prisma to TypeORM for v0.9.0 to solve global CLI distribution issues and improve configuration flexibility. This specification covers the complete migration strategy including requirements, design, and detailed task breakdown.

---

## Phase 1: Requirements

### 1.1 Introduction

SHIROKUMA Knowledge Base v0.9.0 migrates from Prisma to TypeORM to solve fundamental issues with global CLI tool distribution. TypeORM's design philosophy aligns better with CLI tools, eliminating post-install scripts and schema file dependencies.

### 1.2 Functional Requirements (EARS Format)

#### Core Migration Requirements
- **WHEN** system is installed globally via npm **THEN** system **SHALL** resolve database paths dynamically without schema file dependencies
- **IF** user runs CLI command from any directory **THEN** system **SHALL** correctly locate and initialize database
- **WHILE** migration is in progress **THEN** system **SHALL** maintain backward compatibility with v0.8.x data
- **WHEN** TypeORM entities are defined **THEN** system **SHALL** support all existing Prisma model relationships
- **UNLESS** explicitly configured otherwise **THEN** system **SHALL** use SQLite as default database

#### Data Migration Requirements
- **WHEN** user upgrades from v0.8.x to v0.9.0 **THEN** system **SHALL** automatically migrate existing data
- **IF** migration fails **THEN** system **SHALL** provide rollback mechanism to preserve data integrity
- **WHILE** migrating data **THEN** system **SHALL** preserve all relationships and constraints
- **WHERE** data types differ between ORMs **THEN** system **SHALL** apply appropriate type conversions

#### API Compatibility Requirements
- **WHEN** MCP tools are called **THEN** system **SHALL** maintain identical API signatures
- **IF** internal implementation changes **THEN** system **SHALL NOT** break existing CLI commands
- **WHILE** using TypeORM repositories **THEN** system **SHALL** maintain same query performance or better

### 1.3 Non-Functional Requirements

#### Performance
- Query response time: ≤ current Prisma implementation
- Migration execution time: < 30 seconds for typical database (1000 items)
- Memory footprint: ≤ 20% increase acceptable

#### Reliability
- Zero data loss during migration
- Automatic backup before migration
- Transaction-based migration with rollback capability

#### Maintainability
- Clear separation between ORM layer and business logic
- Comprehensive migration documentation
- TypeORM entity definitions must be self-documenting

#### Security
- SQL injection prevention through TypeORM query builder
- Parameterized queries for all user inputs
- Secure handling of database credentials

### 1.4 Acceptance Criteria

- [ ] Global npm install works without post-install scripts
- [ ] All existing MCP APIs function identically
- [ ] Database migration completes without data loss
- [ ] Performance benchmarks meet or exceed v0.8.x
- [ ] All existing tests pass with TypeORM implementation
- [ ] Documentation updated for TypeORM usage

---

## Phase 2: Design

### 2.1 Architecture Overview

```
┌─────────────────────────────────────────┐
│           CLI Layer                      │
│   (Commander.js - No Changes)           │
└─────────────┬───────────────────────────┘
              │
┌─────────────▼───────────────────────────┐
│         MCP Server Layer                │
│    (Minimal Changes - API stable)       │
└─────────────┬───────────────────────────┘
              │
┌─────────────▼───────────────────────────┐
│        Service Layer                    │
│  (Update: Repository Injection)         │
└─────────────┬───────────────────────────┘
              │
┌─────────────▼───────────────────────────┐
│     TypeORM Repository Layer            │
│        (NEW - Replaces Prisma)          │
└─────────────┬───────────────────────────┘
              │
┌─────────────▼───────────────────────────┐
│      TypeORM Entity Layer               │
│    (NEW - Replaces Prisma Schema)       │
└─────────────┬───────────────────────────┘
              │
┌─────────────▼───────────────────────────┐
│         SQLite Database                 │
│      (No Changes - Same Schema)         │
└─────────────────────────────────────────┘
```

### 2.2 Entity Design

#### Item Entity

```typescript
@Entity('items')
export class Item {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 50 })
  @Index()
  type: string;

  @Column({ length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'text', nullable: true })
  content: string;

  @Column({ type: 'text', nullable: true })
  aiSummary: string;

  @ManyToOne(() => Status, { eager: true })
  @JoinColumn({ name: 'status_id' })
  status: Status;

  @Column({ 
    type: 'text',
    enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'MINIMAL'],
    default: 'MEDIUM'
  })
  priority: string;

  @ManyToMany(() => Tag, tag => tag.items)
  @JoinTable({
    name: 'item_tags',
    joinColumn: { name: 'item_id' },
    inverseJoinColumn: { name: 'tag_id' }
  })
  tags: Tag[];

  @OneToMany(() => ItemKeyword, keyword => keyword.item, { cascade: true })
  keywords: ItemKeyword[];

  @OneToMany(() => ItemConcept, concept => concept.item, { cascade: true })
  concepts: ItemConcept[];

  @ManyToMany(() => Item)
  @JoinTable({
    name: 'item_relations',
    joinColumn: { name: 'source_id' },
    inverseJoinColumn: { name: 'target_id' }
  })
  related: Item[];

  @Column({ type: 'blob', nullable: true })
  embedding: Buffer;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

### 2.3 Repository Pattern Implementation

#### Base Repository
```typescript
export abstract class BaseRepository<T> {
  constructor(
    protected dataSource: DataSource,
    protected entity: EntityTarget<T>
  ) {}

  async findById(id: number): Promise<T | null> {
    return this.dataSource.getRepository(this.entity).findOne({ 
      where: { id } as any 
    });
  }

  async save(entity: T): Promise<T> {
    return this.dataSource.getRepository(this.entity).save(entity);
  }
}
```

#### Item Repository
```typescript
export class ItemRepository extends BaseRepository<Item> {
  constructor(dataSource: DataSource) {
    super(dataSource, Item);
  }

  async findWithRelations(id: number): Promise<Item | null> {
    return this.dataSource.getRepository(Item)
      .createQueryBuilder('item')
      .leftJoinAndSelect('item.status', 'status')
      .leftJoinAndSelect('item.tags', 'tags')
      .leftJoinAndSelect('item.keywords', 'keywords')
      .leftJoinAndSelect('item.concepts', 'concepts')
      .leftJoinAndSelect('item.related', 'related')
      .where('item.id = :id', { id })
      .getOne();
  }

  async search(query: string, options?: SearchOptions): Promise<Item[]> {
    const qb = this.dataSource.getRepository(Item)
      .createQueryBuilder('item');
    
    if (query) {
      qb.where('item.searchIndex LIKE :query', { query: `%${query}%` });
    }
    
    return qb.getMany();
  }
}
```

### 2.4 Migration Strategy

#### Phase-based Migration

1. **Parallel Installation**: Install TypeORM alongside Prisma
2. **Entity Creation**: Define all TypeORM entities matching Prisma schema
3. **Repository Implementation**: Create repositories with same interface
4. **Service Adapter**: Create adapter layer for gradual migration
5. **Testing**: Run parallel tests with both ORMs
6. **Switchover**: Replace Prisma calls with TypeORM
7. **Cleanup**: Remove Prisma dependencies

#### Data Migration Script

```typescript
export class DataMigrator {
  async migrate(): Promise<void> {
    // 1. Backup existing database
    await this.backupDatabase();
    
    // 2. Initialize TypeORM connection
    const dataSource = await this.initTypeORM();
    
    // 3. Migrate in transaction
    await dataSource.transaction(async manager => {
      await this.migrateStatuses(manager);
      await this.migrateItems(manager);
      await this.migrateTags(manager);
      await this.migrateRelations(manager);
    });
  }
}
```

### 2.5 Configuration Management

```typescript
export class TypeORMConfig {
  static getDataSourceOptions(): DataSourceOptions {
    const dbPath = this.resolveDbPath();
    
    return {
      type: 'sqlite',
      database: dbPath,
      entities: [Item, Status, Tag, Keyword, Concept, SystemState],
      synchronize: false, // Use migrations
      migrations: ['dist/migrations/*.js'],
      logging: process.env.DEBUG === 'true'
    };
  }

  private static resolveDbPath(): string {
    // Priority order:
    // 1. Environment variable
    // 2. Config file
    // 3. Default location
    return process.env.DATABASE_URL ||
           this.readConfigFile()?.databasePath ||
           path.join(os.homedir(), '.shirokuma/data/shirokuma.db');
  }
}
```

---

## Phase 3: Tasks

### 3.1 Preparation Phase [4h]

- [ ] **Task 1.1**: Environment Setup [2h]
  - Create v0.9.0 branch
  - Install TypeORM and SQLite driver dependencies
  - Setup TypeORM configuration structure
  - Add TypeORM to build process

- [ ] **Task 1.2**: Parallel Testing Environment [2h]
  - Configure dual ORM test setup
  - Create test database copies
  - Setup environment variables for ORM selection
  - Implement ORM switch mechanism

### 3.2 Entity Definition Phase [8h]

- [ ] **Task 2.1**: Core Entities [3h]
  - Implement Item entity with all fields
  - Implement Status entity
  - Implement SystemState entity
  - Add proper decorators and validations

- [ ] **Task 2.2**: Relationship Entities [3h]
  - Implement Tag entity and many-to-many relations
  - Implement Keyword entity with weighted relations
  - Implement Concept entity with confidence scores
  - Implement ItemRelation self-referencing

- [ ] **Task 2.3**: Entity Validation [2h]
  - Add TypeORM validation decorators
  - Implement custom validators for type field
  - Add database constraints
  - Test entity creation and relations

### 3.3 Repository Implementation Phase [9h]

- [ ] **Task 3.1**: Base Repository Pattern [2h]
  - Create abstract BaseRepository class
  - Implement common CRUD operations
  - Add transaction support
  - Setup connection management

- [ ] **Task 3.2**: Item Repository [4h]
  - Implement ItemRepository with all queries
  - Add search functionality with query builder
  - Implement relation loading strategies
  - Add pagination and filtering

- [ ] **Task 3.3**: Supporting Repositories [3h]
  - Implement StatusRepository
  - Implement TagRepository
  - Implement SystemStateRepository
  - Add specialized query methods

### 3.4 Service Layer Migration Phase [9h]

- [ ] **Task 4.1**: Repository Injection [3h]
  - Update service constructors for repositories
  - Create repository factory
  - Implement dependency injection
  - Update service initialization

- [ ] **Task 4.2**: Query Migration [4h]
  - Replace Prisma queries with TypeORM
  - Update complex queries to use QueryBuilder
  - Migrate transaction logic
  - Handle query result mapping

- [ ] **Task 4.3**: AI Service Integration [2h]
  - Update embedding storage for TypeORM
  - Migrate keyword/concept associations
  - Test AI enrichment pipeline
  - Verify search functionality

### 3.5 Migration Tools Phase [5h]

- [ ] **Task 5.1**: Data Migration Script [3h]
  - Implement database backup mechanism
  - Create data migration script
  - Add progress reporting
  - Implement rollback capability

- [ ] **Task 5.2**: Schema Migration [2h]
  - Convert Prisma migrations to TypeORM
  - Create initial TypeORM migration
  - Implement seed data script
  - Test migration on various databases

### 3.6 CLI Integration Phase [4h]

- [ ] **Task 6.1**: CLI Command Updates [2h]
  - Update migrate command for TypeORM
  - Remove Prisma generate requirements
  - Update init command
  - Test global installation

- [ ] **Task 6.2**: Configuration Management [2h]
  - Implement dynamic path resolution
  - Update environment variable handling
  - Create configuration migration tool
  - Document configuration changes

### 3.7 Testing Phase [8h]

- [ ] **Task 7.1**: Unit Test Migration [3h]
  - Update mocks for TypeORM
  - Migrate repository tests
  - Update service tests
  - Fix test database setup

- [ ] **Task 7.2**: Integration Testing [3h]
  - Test complete data migration
  - Verify API compatibility
  - Performance benchmarking
  - Load testing with large datasets

- [ ] **Task 7.3**: E2E Testing [2h]
  - Test global npm installation
  - Verify all CLI commands
  - Test MCP tool compatibility
  - Cross-platform testing

### 3.8 Documentation Phase [3h]

- [ ] **Task 8.1**: Technical Documentation [2h]
  - Update architecture documentation
  - Document entity relationships
  - Create migration guide
  - Update API documentation

- [ ] **Task 8.2**: User Documentation [1h]
  - Update README for v0.9.0
  - Create upgrade guide
  - Document breaking changes
  - Add troubleshooting section

### 3.9 Release Phase [2h]

- [ ] **Task 9.1**: Pre-release Checklist [1h]
  - Code review completion
  - All tests passing
  - Documentation reviewed
  - Performance validated

- [ ] **Task 9.2**: Release Preparation [1h]
  - Update version numbers
  - Create release notes
  - Tag v0.9.0-beta
  - Prepare rollback plan

### 3.10 Post-release Phase [2h]

- [ ] **Task 10.1**: Monitoring [1h]
  - Monitor issue reports
  - Track performance metrics
  - Gather user feedback
  - Document lessons learned

- [ ] **Task 10.2**: Cleanup [1h]
  - Remove Prisma dependencies
  - Archive v0.8.x branch
  - Update CI/CD pipelines
  - Close migration issue

---

## Summary

### Timeline
- **Total Tasks**: 26
- **Total Estimated Time**: 56 hours (7 work days)
- **Critical Path**: Entity Definition → Repository Implementation → Service Migration

### Risk Areas
1. **Data Migration**: Ensure complete backup and rollback capability
2. **Performance Validation**: Benchmark all critical queries
3. **Global Installation**: Test on multiple platforms and environments

### Success Metrics
- Zero data loss during migration
- Performance equal or better than v0.8.x
- All tests passing
- Successful global npm installation without errors

---

*This specification is a living document and will be updated as the migration progresses.*