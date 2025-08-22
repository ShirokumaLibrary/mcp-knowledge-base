import { Entity, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Item } from './Item.js';
import { Tag } from './Tag.js';

@Entity('item_tags')
export class ItemTag {
  @PrimaryColumn({ name: 'item_id' })
  itemId!: number;

  @PrimaryColumn({ name: 'tag_id' })
  tagId!: number;

  @ManyToOne(() => Item)
  @JoinColumn({ name: 'item_id' })
  item!: Item;

  @ManyToOne(() => Tag)
  @JoinColumn({ name: 'tag_id' })
  tag!: Tag;
}