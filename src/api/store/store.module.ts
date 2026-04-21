import { Module } from '@nestjs/common';
import { StoreService } from './store.service';
import { StoreController } from './store.controller';
import { StoreRepositoryModule } from 'src/mikro-orm/entities/store/store-repository.module';
@Module({
  imports: [StoreRepositoryModule],
  controllers: [StoreController],
  providers: [StoreService],
})
export class StoreModule {}
