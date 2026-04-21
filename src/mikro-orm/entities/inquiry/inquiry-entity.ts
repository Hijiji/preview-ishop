import { Entity, PrimaryKey, Index, Property } from '@mikro-orm/core'; // Property 추가
import { IndustryType } from 'src/enums/industry-type.enum';
// import { Column, CreateDateColumn } from 'typeorm'; // TypeORM 제거

@Entity({ tableName: 'inquiry' })
@Index({ properties: ['phoneFullHash'] })
export class InquiryEntity {
  @PrimaryKey({ name: 'id' })
  id?: number;

  @Property({
    type: 'varchar',
    length: 30,
    comment: '업종',
    nullable: false,
  })
  industry: IndustryType;

  @Property({
    fieldName: 'encryptedPhoneNumber',
    type: 'varchar',
    length: 100,
    comment: '암호화된 전화번호',
    nullable: false,
  })
  encryptedPhoneNumber: string;

  // Blind Index
  @Property({
    fieldName: 'phoneFullHash',
    type: 'varchar',
    length: 64,
    comment: '전화번호 전체 Blind Index (HMAC-SHA256)',
    nullable: false,
  })
  phoneFullHash: string;

  @Property({
    fieldName: 'createdAt',
    onCreate: () => new Date(),
    comment: '생성일',
  })
  createdAt: Date = new Date();

  @Property({
    fieldName: 'encryptedBusinessNumber',
    type: 'varchar',
    length: 100,
    comment: '암호화된 사업자번호',
    nullable: true,
  })
  encryptedBusinessNumber?: string;
}
