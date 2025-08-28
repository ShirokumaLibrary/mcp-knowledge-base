import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class InitialMigration1736500000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create statuses table first (referenced by items)
    await queryRunner.createTable(
      new Table({
        name: 'statuses',
        columns: [
          {
            name: 'id',
            type: 'integer',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'name',
            type: 'text',
            isUnique: true,
          },
          {
            name: 'is_closable',
            type: 'boolean',
            default: false,
          },
          {
            name: 'sort_order',
            type: 'integer',
            default: 0,
          },
          {
            name: 'created_at',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true
    );
    // Create items table
    await queryRunner.createTable(
      new Table({
        name: 'items',
        columns: [
          {
            name: 'id',
            type: 'integer',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'type',
            type: 'varchar',
            length: '50',
          },
          {
            name: 'title',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'description',
            type: 'text',
          },
          {
            name: 'content',
            type: 'text',
          },
          {
            name: 'ai_summary',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'status_id',
            type: 'integer',
          },
          {
            name: 'priority',
            type: 'text',
            default: "'MEDIUM'",
          },
          {
            name: 'category',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'start_date',
            type: 'datetime',
            isNullable: true,
          },
          {
            name: 'end_date',
            type: 'datetime',
            isNullable: true,
          },
          {
            name: 'version',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'search_index',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'entities',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'embedding',
            type: 'blob',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true
    );

    // Create tags table
    await queryRunner.createTable(
      new Table({
        name: 'tags',
        columns: [
          {
            name: 'id',
            type: 'integer',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'name',
            type: 'text',
            isUnique: true,
          },
        ],
      }),
      true
    );

    // Create item_tags table
    await queryRunner.createTable(
      new Table({
        name: 'item_tags',
        columns: [
          {
            name: 'item_id',
            type: 'integer',
            isPrimary: true,
          },
          {
            name: 'tag_id',
            type: 'integer',
            isPrimary: true,
          },
        ],
      }),
      true
    );

    // Create item_relations table
    await queryRunner.createTable(
      new Table({
        name: 'item_relations',
        columns: [
          {
            name: 'source_id',
            type: 'integer',
            isPrimary: true,
          },
          {
            name: 'target_id',
            type: 'integer',
            isPrimary: true,
          },
        ],
      }),
      true
    );

    // Create keywords table
    await queryRunner.createTable(
      new Table({
        name: 'keywords',
        columns: [
          {
            name: 'id',
            type: 'integer',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'word',
            type: 'text',
            isUnique: true,
          },
        ],
      }),
      true
    );

    // Create item_keywords table
    await queryRunner.createTable(
      new Table({
        name: 'item_keywords',
        columns: [
          {
            name: 'item_id',
            type: 'integer',
            isPrimary: true,
          },
          {
            name: 'keyword_id',
            type: 'integer',
            isPrimary: true,
          },
          {
            name: 'weight',
            type: 'real',
            default: 1.0,
          },
        ],
      }),
      true
    );

    // Create concepts table
    await queryRunner.createTable(
      new Table({
        name: 'concepts',
        columns: [
          {
            name: 'id',
            type: 'integer',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'name',
            type: 'text',
            isUnique: true,
          },
        ],
      }),
      true
    );

    // Create item_concepts table
    await queryRunner.createTable(
      new Table({
        name: 'item_concepts',
        columns: [
          {
            name: 'item_id',
            type: 'integer',
            isPrimary: true,
          },
          {
            name: 'concept_id',
            type: 'integer',
            isPrimary: true,
          },
          {
            name: 'confidence',
            type: 'real',
            default: 1.0,
          },
        ],
      }),
      true
    );

    // Create system_states table
    await queryRunner.createTable(
      new Table({
        name: 'system_states',
        columns: [
          {
            name: 'id',
            type: 'integer',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'version',
            type: 'text',
          },
          {
            name: 'content',
            type: 'text',
          },
          {
            name: 'summary',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'metrics',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'context',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'checkpoint',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'relatedItems',
            type: 'text',
            default: "'[]'",
          },
          {
            name: 'tags',
            type: 'text',
            default: "'[]'",
          },
          {
            name: 'metadata',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: false,
          },
          {
            name: 'created_at',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true
    );

    // Fix is_closable flags after table creation
    await queryRunner.query(`
      UPDATE statuses 
      SET is_closable = 1 
      WHERE name IN ('Completed', 'Closed', 'Canceled', 'Rejected')
    `);
    
    console.log('✅ Fixed is_closable flags for terminal statuses');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('system_states');
    await queryRunner.dropTable('item_concepts');
    await queryRunner.dropTable('concepts');
    await queryRunner.dropTable('item_keywords');
    await queryRunner.dropTable('keywords');
    await queryRunner.dropTable('item_relations');
    await queryRunner.dropTable('item_tags');
    await queryRunner.dropTable('tags');
    await queryRunner.dropTable('items');
    await queryRunner.dropTable('statuses');
  }
}