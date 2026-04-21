import { Entity, Enum, PrimaryKey } from '@mikro-orm/core';
import { IndustryType } from 'src/enums/industry-type.enum';

@Entity({ tableName: 'inquiry' })
export class InquiryEntity {
  @PrimaryKey({ name: 'id' })
  id?: number;

  @Enum({ items: () => IndustryType, comment: '업종' })
  industry: IndustryType;

  /**
   * TODO : 구현 필요
   */
}
