import { Injectable } from '@nestjs/common';
import { InquiryRepository } from '../../mikro-orm/entities/inquiry/inquiry-repository';
import { CreateInquiryDto } from './dto/create-inquiry.dto';
import { InquiryEntity } from 'src/mikro-orm/entities/inquiry/inquiry-entity';
import { EncryptionService } from 'src/common/encryption.service';

@Injectable()
export class PublicApiService {
  constructor(
    private readonly inquiryRepository: InquiryRepository,
    private readonly encryptionService: EncryptionService,
  ) {}

  removeHyphens(usersNum: String): string {
    return usersNum.replace(/-/g, '');
  }

  /**
   * 사용자 문의 등록
   * - 개인정보 암호화
   * - 유효한 전화번호를 판별하여 아닐경우 400 에러 반환
   * @param createInquiryDto
   * @returns
   */
  async createInquiry(createInquiryDto: CreateInquiryDto) {
    const inquiryEntity = new InquiryEntity();
    inquiryEntity.industry = createInquiryDto.industry;
    inquiryEntity.phoneNumber = this.encryptionService.encrypt(
      createInquiryDto.phoneNumber,
    );
    if (createInquiryDto.businessNumber) {
      inquiryEntity.businessNumber = this.encryptionService.encrypt(
        createInquiryDto.businessNumber,
      );
    }

    return await this.inquiryRepository.create(inquiryEntity);
  }
}
