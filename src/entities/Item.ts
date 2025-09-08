import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Status } from './Status.js';

@Entity('items')
export class Item {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'text' })
  type!: string;

  @Column({ type: 'text' })
  title!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({ type: 'text' })
  content!: string;

  @Column({ type: 'text', nullable: true, name: 'ai_summary' })
  aiSummary?: string;

  @Column({ type: 'integer', name: 'status_id' })
  statusId!: number;

  @ManyToOne(() => Status)
  @JoinColumn({ name: 'status_id' })
  status!: Status;

  @Column({ type: 'text', default: 'MEDIUM' })
  priority!: string;

  @Column({ type: 'text', nullable: true })
  category?: string;

  @Column({ type: 'datetime', nullable: true, name: 'start_date' })
  startDate?: Date;

  @Column({ type: 'datetime', nullable: true, name: 'end_date' })
  endDate?: Date;

  @Column({ type: 'text', nullable: true })
  version?: string;

  @Column({ type: 'text', nullable: true, name: 'search_index' })
  searchIndex?: string;

  @Column({ type: 'text', nullable: true })
  entities?: string;

  @Column({ type: 'blob', nullable: true })
  embedding?: Buffer;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}