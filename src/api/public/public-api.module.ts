import { Module } from '@nestjs/common';
import { InquiryRepositoryModule } from '../../mikro-orm/entities/inquiry/inquiry-repository.module';
import { EncryptionService } from 'src/common/encryption.service';
import { PublicApiController } from './public-api.controller';
import { PublicApiService } from './public-api.service';

@Module({
  imports: [InquiryRepositoryModule],
  controllers: [PublicApiController],
  providers: [PublicApiService, EncryptionService],
})
export class PublicApiModule {}
