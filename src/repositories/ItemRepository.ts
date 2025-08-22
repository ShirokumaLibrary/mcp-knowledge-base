import { Repository } from 'typeorm';
import { Item } from '../entities/Item.js';
import { AppDataSource } from '../data-source.js';

export class ItemRepository {
  private repository: Repository<Item>;

  constructor() {
    this.repository = AppDataSource.getRepository(Item);
  }

  async create(data: Partial<Item>): Promise<Item> {
    const item = this.repository.create(data);
    return await this.repository.save(item);
  }

  async findById(id: number): Promise<Item | null> {
    return await this.repository.findOne({ where: { id } });
  }

  async findAll(options?: {
    type?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<Item[]> {
    const query = this.repository.createQueryBuilder('item');

    if (options?.type) {
      query.andWhere('item.type = :type', { type: options.type });
    }

    if (options?.status) {
      query.andWhere('item.status = :status', { status: options.status });
    }

    if (options?.limit) {
      query.limit(options.limit);
    }

    if (options?.offset) {
      query.offset(options.offset);
    }

    query.orderBy('item.createdAt', 'DESC');

    return await query.getMany();
  }

  async update(id: number, data: Partial<Item>): Promise<Item | null> {
    await this.repository.update(id, data);
    return await this.findById(id);
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.repository.delete(id);
    return result.affected !== 0;
  }

  async search(query: string): Promise<Item[]> {
    return await this.repository
      .createQueryBuilder('item')
      .where('item.title LIKE :query', { query: `%${query}%` })
      .orWhere('item.description LIKE :query', { query: `%${query}%` })
      .orWhere('item.content LIKE :query', { query: `%${query}%` })
      .orderBy('item.updatedAt', 'DESC')
      .getMany();
  }

  async count(options?: { type?: string; status?: string }): Promise<number> {
    const query = this.repository.createQueryBuilder('item');

    if (options?.type) {
      query.andWhere('item.type = :type', { type: options.type });
    }

    if (options?.status) {
      query.andWhere('item.status = :status', { status: options.status });
    }

    return await query.getCount();
  }
}