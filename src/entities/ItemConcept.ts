import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('item_concepts')
export class ItemConcept {
  @PrimaryColumn({ name: 'item_id' })
  itemId!: number;

  @PrimaryColumn({ name: 'concept_id' })
  conceptId!: number;

  @Column({ type: 'real', default: 1.0 })
  confidence!: number;
}