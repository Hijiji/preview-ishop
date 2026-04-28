import { Module } from '@nestjs/common';
import { BatchService } from './batch.service';
import { StoreRepositoryModule } from '../mikro-orm/entities/store/store-repository.module';
import { ScheduleModule } from '@nestjs/schedule';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { EncryptionService } from '../common/services/encryption.service';
import { SlackService } from '../common/services/slack.service';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    StoreRepositoryModule,
    HttpModule,
    ConfigModule,
  ],
  providers: [BatchService, EncryptionService, SlackService],
})
export class BatchModule {}
