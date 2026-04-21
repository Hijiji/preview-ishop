import { Module } from '@nestjs/common';
import { InquiryRepositoryModule } from '../../mikro-orm/entities/inquiry/inquiry-repository.module';
import { PublicApiController } from './public-api.controller';
import { PublicApiService } from './public-api.service';

@Module({
  imports: [InquiryRepositoryModule],
  controllers: [PublicApiController],
  providers: [PublicApiService],
})
export class PublicApiModule {}
