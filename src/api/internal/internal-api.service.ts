import { Injectable } from '@nestjs/common';
import { InquiryRepository } from '../../mikro-orm/entities/inquiry/inquiry-repository';

@Injectable()
export class InternalApiService {
  constructor(private readonly inquiryRepository: InquiryRepository) {}

  async getInquiries({}: {}) {
    return this.inquiryRepository.findAll();
    /**
     * TODO : 구현 필요
     */
  }
}
