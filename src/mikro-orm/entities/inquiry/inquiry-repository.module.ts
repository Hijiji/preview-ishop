import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Global, Module } from '@nestjs/common';
import { InquiryEntity } from './inquiry-entity';
import { InquiryRepository } from './inquiry-repository';

@Global()
@Module({
  imports: [MikroOrmModule.forFeature([InquiryEntity])],
  providers: [InquiryRepository],
  exports: [InquiryRepository],
})
export class InquiryRepositoryModule {}
