import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('keywords')
export class Keyword {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'text', unique: true })
  word!: string;
}