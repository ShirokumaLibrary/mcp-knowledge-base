import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Item } from './Item.js';
import { Concept } from './Concept.js';

@Entity('item_concepts')
export class ItemConcept {
  @PrimaryColumn({ name: 'item_id' })
  itemId!: number;

  @PrimaryColumn({ name: 'concept_id' })
  conceptId!: number;

  @Column({ type: 'real', default: 1.0 })
  confidence!: number;

  @ManyToOne(() => Item)
  @JoinColumn({ name: 'item_id' })
  item!: Item;

  @ManyToOne(() => Concept)
  @JoinColumn({ name: 'concept_id' })
  concept!: Concept;
}