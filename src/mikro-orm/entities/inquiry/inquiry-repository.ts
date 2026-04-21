import { EntityRepository } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable } from '@nestjs/common';
import { InquiryEntity } from './inquiry-entity';

@Injectable()
export class InquiryRepository {
  constructor(
    @InjectRepository(InquiryEntity)
    private readonly inquiryRepository: EntityRepository<InquiryEntity>,
  ) {}

  /**
   * 문의 생성
   * @param inquiry
   */
  async create(inquiry: InquiryEntity) {
    this.inquiryRepository.create(inquiry);
    await this.inquiryRepository.getEntityManager().flush();
  }

  /**
   * Blind Index 기반 전화번호 검색
   * @param phoneFullHash
   * @param limit
   * @param offset
   */
  async findByBlindIndex(
    phoneFullHash: string,
    limit: number,
    offset: number,
  ): Promise<InquiryEntity[]> {
    return await this.inquiryRepository.find(
      {
        phoneFullHash,
      },
      {
        orderBy: { createdAt: 'DESC' },
        limit,
        offset,
      },
    );
  }

  /**
   * Blind Index 기반 총 개수 조회
   */
  async countByBlindIndex(phoneFullHash: string): Promise<number> {
    return await this.inquiryRepository.count({
      phoneFullHash,
    });
  }
}
