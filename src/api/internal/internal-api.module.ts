import { Module } from '@nestjs/common';
import { InquiryRepositoryModule } from '../../mikro-orm/entities/inquiry/inquiry-repository.module';
import { InternalApiController } from './internal-api.controller';
import { InternalApiService } from './internal-api.service';

@Module({
  imports: [InquiryRepositoryModule],
  controllers: [InternalApiController],
  providers: [InternalApiService],
})
export class InternalApiModule {}
