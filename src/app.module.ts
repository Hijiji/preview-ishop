import { MikroOrmModule } from '@mikro-orm/nestjs';
import { MikroORM, SqliteDriver } from '@mikro-orm/sqlite';
import { Module, OnModuleInit } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { InternalApiModule } from './api/internal/internal-api.module';
import { PublicApiModule } from './api/public/public-api.module';
import { DB_NAME } from './mikro-orm/const';
import { InquiryEntity } from './mikro-orm/entities/inquiry/inquiry-entity';
import { BatchModule } from './batch/batch.module';
import { StoreEntity } from './mikro-orm/entities/store/store-entity';
import { StoreModule } from './api/store/store.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    MikroOrmModule.forRoot({
      dbName: DB_NAME,
      driver: SqliteDriver,
      allowGlobalContext: true,
      entities: [InquiryEntity, StoreEntity],
    }),
    InternalApiModule,
    PublicApiModule,
    BatchModule,
    StoreModule,
  ],
})
export class AppModule implements OnModuleInit {
  constructor(private readonly orm: MikroORM) {}

  async onModuleInit() {
    // 서버가 뜰 때 DB 스키마를 자동으로 업데이트/생성합니다.
    const generator = this.orm.getSchemaGenerator();
    await generator.updateSchema();
    console.log('✅ SQLite Database Schema Sync Completed!');
  }
}
