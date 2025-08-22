import { Repository } from 'typeorm';
import { SystemState } from '../entities/SystemState.js';
import { AppDataSource } from '../data-source.js';

export class SystemStateRepository {
  private repository: Repository<SystemState>;

  constructor() {
    this.repository = AppDataSource.getRepository(SystemState);
  }

  async getCurrent(): Promise<SystemState | null> {
    return await this.repository.findOne({
      where: {},  // Find any record
      order: { id: 'DESC' }
    });
  }

  async create(data: Partial<SystemState>): Promise<SystemState> {
    const state = this.repository.create(data);
    return await this.repository.save(state);
  }

  async update(id: number, data: Partial<SystemState>): Promise<SystemState | null> {
    await this.repository.update(id, data);
    return await this.repository.findOne({ where: { id } });
  }
}