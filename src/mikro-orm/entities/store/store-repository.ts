import { EntityRepository } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable } from '@nestjs/common';
import { StoreEntity } from './store-entity';

@Injectable()
export class StoreRepository {
  constructor(
    @InjectRepository(StoreEntity)
    private readonly storeRepository: EntityRepository<StoreEntity>,
  ) {}

  /**
   * 가맹점 생성
   * @param store
   */
  async create(store: StoreEntity) {
    this.storeRepository.create(store);
    await this.storeRepository.getEntityManager().flush();
  }

  /**
   * 배치 처리 대상 조회 (last_checked_at이 null이거나 오래된 데이터)
   * @param batchSize
   * @param lastCheckedBefore - 이 날짜 이전에 확인한 데이터
   */
  async findBatchTargets(
    batchSize: number,
    lastCheckedBefore: Date,
  ): Promise<StoreEntity[]> {
    return await this.storeRepository.find(
      {
        $or: [
          { lastCheckedAt: null },
          { lastCheckedAt: { $lt: lastCheckedBefore } },
        ],
      },
      {
        orderBy: { createdAt: 'ASC' },
        limit: batchSize,
      },
    );
  }

  /**
   * 사업자 상태 업데이트
   * @param id
   * @param businessStatus
   * @param taxType
   * @param lastCheckedAt
   */
  async updateBusinessStatus(
    id: number,
    businessStatus: string,
    taxType: string,
    lastCheckedAt: Date,
  ): Promise<void> {
    await this.storeRepository.nativeUpdate(
      { id },
      {
        businessStatus,
        taxType,
        lastCheckedAt,
      },
    );
  }
}
