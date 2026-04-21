import { Entity, PrimaryKey, Property } from '@mikro-orm/core';

@Entity({ tableName: 'store' })
export class StoreEntity {
  @PrimaryKey({ name: 'id' })
  id?: number;

  @Property({
    fieldName: 'storeName',
    type: 'varchar',
    length: 100,
    comment: '사업장 이름',
    nullable: false,
  })
  storeName: string;

  @Property({
    fieldName: 'businessNumber',
    type: 'varchar',
    length: 100,
    comment: '암호화된 사업자번호',
    nullable: false,
  })
  businessNumber: string;

  @Property({
    fieldName: 'representativePhone',
    type: 'varchar',
    length: 100,
    comment: '암호화된 대표자 전화번호',
    nullable: true,
  })
  representativePhone?: string;

  @Property({
    fieldName: 'representativeName',
    type: 'varchar',
    length: 50,
    comment: '대표자 이름',
    nullable: true,
  })
  representativeName?: string;

  @Property({
    fieldName: 'representativeEmail',
    type: 'varchar',
    length: 100,
    comment: '대표자 이메일',
    nullable: true,
  })
  representativeEmail?: string;

  @Property({
    fieldName: 'storeAddress',
    type: 'varchar',
    length: 200,
    comment: '사업장 주소',
    nullable: true,
  })
  storeAddress?: string;

  @Property({
    fieldName: 'lastCheckedAt',
    type: 'datetime',
    comment: '마지막 휴폐업 상태 확인 일시',
    nullable: true,
  })
  lastCheckedAt?: Date;

  @Property({
    fieldName: 'businessStatus',
    type: 'varchar',
    length: 10,
    comment: '사업자 상태 (API 응답 b_stt)',
    nullable: true,
  })
  businessStatus?: string;

  @Property({
    fieldName: 'taxType',
    type: 'varchar',
    length: 20,
    comment: '과세유형 (API 응답 tax_type)',
    nullable: true,
  })
  taxType?: string;

  @Property({
    fieldName: 'created_at',
    onCreate: () => new Date(),
    comment: '생성일',
  })
  createdAt: Date = new Date();

  @Property({
    fieldName: 'updated_at',
    onUpdate: () => new Date(), // 수정 시 자동 갱신
    comment: '수정일',
  })
  updatedAt: Date = new Date();
}
