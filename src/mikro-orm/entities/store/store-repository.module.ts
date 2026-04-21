import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { StoreEntity } from './store-entity';
import { StoreRepository } from './store-repository';

@Module({
  imports: [MikroOrmModule.forFeature([StoreEntity])],
  providers: [StoreRepository],
  exports: [StoreRepository],
})
export class StoreRepositoryModule {}
