import { Entity, PrimaryKey, Index } from '@mikro-orm/core';
import { IndustryType } from 'src/enums/industry-type.enum';
import { Column, CreateDateColumn } from 'typeorm';

@Entity({ tableName: 'inquiry' })
export class InquiryEntity {
  @PrimaryKey({ name: 'id' })
  id?: number;

  @Column({
    type: 'varchar',
    length: 30,
    comment: '업종',
    nullable: false,
  })
  industry: IndustryType;

  @Column({
    name: 'encryptedPhoneNumber',
    type: 'varchar',
    length: 100,
    comment: '암호화된 전화번호',
    nullable: false,
  })
  encryptedPhoneNumber: string;

  // Blind Index: 전체 번호 HMAC 해시 (정확한 일치 검색용)
  @Index()
  @Column({
    name: 'phoneFullHash',
    type: 'varchar',
    length: 64, // SHA256 hex
    comment: '전화번호 전체 Blind Index (HMAC-SHA256)',
    nullable: false,
  })
  phoneFullHash: string;

  @CreateDateColumn({ name: 'createdAt', comment: '생성일', nullable: false })
  createdAt: Date;

  // 암호화된 사업자번호
  @Column({
    name: 'encryptedBusinessNumber',
    type: 'varchar',
    length: 100,
    comment: '암호화된 사업자번호',
    nullable: true,
  })
  encryptedBusinessNumber?: string;
}
