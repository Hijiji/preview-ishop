import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InquiryRepository } from '../mikro-orm/entities/inquiry/inquiry-repository';

@Injectable()
export class BatchService {
  constructor(private readonly inquiryRepository: InquiryRepository) {}

  @Cron('* * * * * *')
  async run() {
    console.log('run');
    /**
     * TODO : 구현 필요
     */
  }
}
