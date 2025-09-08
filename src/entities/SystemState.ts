import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('system_states')
export class SystemState {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'text' })
  version!: string;

  @Column({ type: 'text' })
  content!: string;

  @Column({ type: 'text', nullable: true })
  summary?: string;

  @Column({ type: 'text', nullable: true })
  metrics?: string;

  @Column({ type: 'text', nullable: true })
  context?: string;

  @Column({ type: 'text', nullable: true })
  checkpoint?: string;

  @Column({ type: 'text', default: '[]', name: 'relatedItems' })
  relatedItems!: string;

  @Column({ type: 'text', default: '[]' })
  tags!: string;

  @Column({ type: 'text', nullable: true })
  metadata?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @Column({ type: 'boolean', default: false, name: 'is_active' })
  isActive!: boolean;
}