import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Item } from './Item.js';
import { Keyword } from './Keyword.js';

@Entity('item_keywords')
export class ItemKeyword {
  @PrimaryColumn({ name: 'item_id' })
  itemId!: number;

  @PrimaryColumn({ name: 'keyword_id' })
  keywordId!: number;

  @Column({ type: 'real', default: 1.0 })
  weight!: number;

  @ManyToOne(() => Item)
  @JoinColumn({ name: 'item_id' })
  item!: Item;

  @ManyToOne(() => Keyword)
  @JoinColumn({ name: 'keyword_id' })
  keyword!: Keyword;
}