import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('concepts')
export class Concept {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'text', unique: true })
  name!: string;
}