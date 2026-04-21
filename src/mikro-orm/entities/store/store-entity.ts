import { Entity, PrimaryKey, Index } from '@mikro-orm/core';
import { Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity({ tableName: 'store' })
export class StoreEntity {
  @PrimaryKey({ name: 'id' })
  id?: number;

  @Column({
    name: 'store_name',
    type: 'varchar',
    length: 100,
    comment: '사업장 이름',
    nullable: false,
  })
  storeName: string;

  // 암호화된 사업자번호
  @Column({
    name: 'businessNumber',
    type: 'varchar',
    length: 100,
    comment: '암호화된 사업자번호',
    nullable: false,
  })
  businessNumber: string;

  // 암호화된 대표자 전화번호
  @Column({
    name: 'representativePhone',
    type: 'varchar',
    length: 100,
    comment: '암호화된 대표자 전화번호',
    nullable: true,
  })
  representativePhone?: string;

  @Column({
    name: 'representativeName',
    type: 'varchar',
    length: 50,
    comment: '대표자 이름',
    nullable: true,
  })
  representativeName?: string;

  @Column({
    name: 'representativeEmail',
    type: 'varchar',
    length: 100,
    comment: '대표자 이메일',
    nullable: true,
  })
  representativeEmail?: string;

  @Column({
    name: 'storeAddress',
    type: 'varchar',
    length: 200,
    comment: '사업장 주소',
    nullable: true,
  })
  storeAddress?: string;

  // 배치 처리용 필드들
  @Column({
    name: 'lastCheckedAt',
    type: 'datetime',
    comment: '마지막 휴폐업 상태 확인 일시',
    nullable: true,
  })
  lastCheckedAt?: Date;

  @Column({
    name: 'businessStatus',
    type: 'varchar',
    length: 10,
    comment: '사업자 상태 (API 응답 b_stt)',
    nullable: true,
  })
  businessStatus?: string;

  @Column({
    name: 'taxType',
    type: 'varchar',
    length: 20,
    comment: '과세유형 (API 응답 tax_type)',
    nullable: true,
  })
  taxType?: string;

  @CreateDateColumn({ name: 'created_at', comment: '생성일', nullable: false })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', comment: '수정일', nullable: false })
  updatedAt: Date;
}
