import { Module } from '@nestjs/common';
import { BatchService } from './batch.service';
import { InquiryRepositoryModule } from '../mikro-orm/entities/inquiry/inquiry-repository.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [ScheduleModule.forRoot(), InquiryRepositoryModule],
  providers: [BatchService],
})
export class BatchModule {}
