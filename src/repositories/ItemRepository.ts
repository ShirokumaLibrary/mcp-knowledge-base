import { Repository } from 'typeorm';
import { Item } from '../entities/Item.js';
import { AppDataSource } from '../data-source.js';
import { SearchQueryParser, ParsedQuery } from '../services/SearchQueryParser.js';
import { StatusRepository } from './StatusRepository.js';

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

  /**
   * Enhanced search with structured query support
   */
  async searchAdvanced(parsedQuery: ParsedQuery): Promise<Item[]> {
    const queryBuilder = this.repository.createQueryBuilder('item')
      .leftJoinAndSelect('item.status', 'status');
    
    // Apply status filter
    if (parsedQuery.filters.status?.length) {
      const statusRepo = new StatusRepository();
      const statusIds: number[] = [];
      
      for (const statusName of parsedQuery.filters.status) {
        const status = await statusRepo.findByName(statusName);
        if (status) statusIds.push(status.id);
      }
      
      if (statusIds.length > 0) {
        queryBuilder.andWhere('item.statusId IN (:...statusIds)', { statusIds });
      }
    }
    
    // Apply type filter
    if (parsedQuery.filters.type?.length) {
      queryBuilder.andWhere('item.type IN (:...types)', { types: parsedQuery.filters.type });
    }
    
    // Apply is:open/closed filter
    if (parsedQuery.filters.is) {
      const isClosable = parsedQuery.filters.is === 'closed';
      queryBuilder.andWhere('status.isClosable = :isClosable', { isClosable });
    }
    
    // Apply keyword search
    if (parsedQuery.keywords.length > 0) {
      const keywordConditions = parsedQuery.keywords.map((_, index) => 
        `(item.title LIKE :kw${index} OR item.description LIKE :kw${index} OR item.content LIKE :kw${index})`
      ).join(' AND ');
      
      const keywordParams: any = {};
      parsedQuery.keywords.forEach((kw, index) => {
        keywordParams[`kw${index}`] = `%${kw}%`;
      });
      
      if (keywordConditions) {
        queryBuilder.andWhere(`(${keywordConditions})`, keywordParams);
      }
    }
    
    return queryBuilder.orderBy('item.updatedAt', 'DESC').getMany();
  }
  
  /**
   * Legacy search for backward compatibility
   */
  private async searchLegacy(query: string): Promise<Item[]> {
    return await this.repository
      .createQueryBuilder('item')
      .where('item.title LIKE :query', { query: `%${query}%` })
      .orWhere('item.description LIKE :query', { query: `%${query}%` })
      .orWhere('item.content LIKE :query', { query: `%${query}%` })
      .orderBy('item.updatedAt', 'DESC')
      .getMany();
  }

  /**
   * Main search method with structured query support
   */
  async search(query: string): Promise<Item[]> {
    const parser = new SearchQueryParser();
    const parsed = parser.parse(query);
    
    // If no filters and no keywords, use legacy search
    if (Object.keys(parsed.filters).length === 0 && parsed.keywords.length === 0) {
      return this.searchLegacy(query);
    }
    
    // If only keywords (no filters), use legacy search for better compatibility
    if (Object.keys(parsed.filters).length === 0 && parsed.keywords.length > 0) {
      return this.searchLegacy(query);
    }
    
    return this.searchAdvanced(parsed);
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