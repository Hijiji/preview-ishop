import {
  IsString,
  IsNotEmpty,
  Matches,
  IsOptional,
  IsEmpty,
  IsEnum,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IndustryType } from 'src/enums/industry-type.enum';

export class CreateInquiryDto {
  @ApiProperty({ description: '업종' })
  @IsEnum(IndustryType, {
    message: `업종은 ${Object.values(IndustryType).join(', ')} 중 하나여야 합니다.`,
  })
  @IsNotEmpty()
  industry: IndustryType;

  @ApiProperty({ description: '전화번호', example: '010-1234-5678' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{3}-\d{4}-\d{4}$/, {
    message: '올바른 전화번호 형식이 아닙니다.',
  })
  phoneNumber: string;

  @ApiProperty({ description: '사업자번호', example: '123-45-67890' })
  @IsString()
  @IsOptional()
  @Matches(/^\d{3}-\d{2}-\d{5}$/, {
    message: '올바른 사업자번호 형식이 아닙니다.',
  })
  businessNumber: string;
}
