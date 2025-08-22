import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('item_keywords')
export class ItemKeyword {
  @PrimaryColumn({ name: 'item_id' })
  itemId!: number;

  @PrimaryColumn({ name: 'keyword_id' })
  keywordId!: number;

  @Column({ type: 'real', default: 1.0 })
  weight!: number;
}