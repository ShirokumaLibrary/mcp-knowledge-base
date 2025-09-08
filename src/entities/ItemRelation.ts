import { Entity, PrimaryColumn } from 'typeorm';

@Entity('item_relations')
export class ItemRelation {
  @PrimaryColumn({ name: 'source_id' })
  sourceId!: number;

  @PrimaryColumn({ name: 'target_id' })
  targetId!: number;
}