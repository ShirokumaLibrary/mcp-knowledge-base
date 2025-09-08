import { Repository } from 'typeorm';
import { Status } from '../entities/Status.js';
import { AppDataSource } from '../data-source.js';

export class StatusRepository {
  private repository: Repository<Status>;
  
  constructor() {
    this.repository = AppDataSource.getRepository(Status);
  }
  
  /**
   * Find status by name (case-insensitive)
   */
  async findByName(name: string): Promise<Status | null> {
    return await this.repository
      .createQueryBuilder('status')
      .where('LOWER(status.name) = LOWER(:name)', { name })
      .getOne();
  }
  
  /**
   * Find statuses by is_closable flag
   */
  async findByClosable(isClosable: boolean): Promise<Status[]> {
    return await this.repository.find({
      where: { isClosable }
    });
  }
  
  /**
   * Get all statuses
   */
  async findAll(): Promise<Status[]> {
    return await this.repository.find({
      order: { sortOrder: 'ASC' }
    });
  }
  
  /**
   * Fix is_closable flags for existing data
   */
  async fixClosableFlags(): Promise<void> {
    const closableNames = ['Completed', 'Closed', 'Canceled', 'Rejected'];
    const openNames = ['Open', 'Ready', 'In Progress', 'Review', 
                      'Specification', 'Waiting', 'Testing', 'Pending'];
    
    // Update closable statuses
    await this.repository
      .createQueryBuilder()
      .update(Status)
      .set({ isClosable: true })
      .where('name IN (:...names)', { names: closableNames })
      .execute();
    
    // Update open statuses
    await this.repository
      .createQueryBuilder()
      .update(Status)
      .set({ isClosable: false })
      .where('name IN (:...names)', { names: openNames })
      .execute();
  }
}