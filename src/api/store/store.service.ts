import { Injectable } from '@nestjs/common';
import { StoreEntity } from 'src/mikro-orm/entities/store/store-entity';
import { StoreRepository } from 'src/mikro-orm/entities/store/store-repository';

@Injectable()
export class StoreService {
  constructor(private readonly storeRepository: StoreRepository) {}
  async createStore() {
    const mockData = Array.from({ length: 10 }).map(
      (_, i) =>
        ({
          storeName: `가맹점_${i + 1}`,
          businessNumber: `123456789${i}`,
          representativePhone: `0101234567${i}`,
          representativeName: `대표자${i + 1}`,
          representativeEmail: `test${i}@example.com`,
          storeAddress: `서울시 강남구 테헤란로 ${i}길`,
        }) as StoreEntity,
    );

    for (const data of mockData) {
      await this.storeRepository.create(data);
    }
  }
}
