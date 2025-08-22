import { Entity, PrimaryColumn } from 'typeorm';

@Entity('item_tags')
export class ItemTag {
  @PrimaryColumn({ name: 'item_id' })
  itemId!: number;

  @PrimaryColumn({ name: 'tag_id' })
  tagId!: number;
}