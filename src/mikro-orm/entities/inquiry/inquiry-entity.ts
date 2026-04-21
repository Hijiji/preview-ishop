import { Entity, Enum, PrimaryKey } from '@mikro-orm/core';
import { IndustryType } from 'src/enums/industry-type.enum';
import { Column, CreateDateColumn } from 'typeorm';

@Entity({ tableName: 'inquiry' })
export class InquiryEntity {
  @PrimaryKey({ name: 'id' })
  id?: number;

  @Column({
    type: 'varchar',
    length: 30, // Enum 값 중 가장 긴 것보다 넉넉하게 설정
    comment: '업종',
    nullable: false,
  })
  industry: IndustryType;

  @Column({
    name: 'phoneNumber',
    length: 20,
    comment: '전화번호',
    nullable: false,
  })
  phoneNumber: string;

  @Column({
    name: 'businessNumber',
    length: 20,
    comment: '사업자번호',
    nullable: true,
  })
  businessNumber?: string;

  @CreateDateColumn({ name: 'createdAt', comment: '생성일', nullable: false })
  createdAt: Date;
}
