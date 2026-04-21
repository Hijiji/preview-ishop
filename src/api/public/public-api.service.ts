import { Injectable, BadRequestException } from '@nestjs/common';
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

  normalizeNumber(value: string): string {
    return value.replace(/[\s()-]/g, '');
  }

  private validatePhoneNumber(phoneNumber: string): void {
    const mobilePattern = /^01[016789]\d{7,8}$/;
    const areaPattern = /^(02\d{7,8}|0[3-9]\d{7,8})$/;

    if (!mobilePattern.test(phoneNumber) && !areaPattern.test(phoneNumber)) {
      throw new BadRequestException('올바른 전화번호 형식이 아닙니다.');
    }
  }

  private validateBusinessNumber(businessNumber: string): void {
    if (!/^[0-9]{10}$/.test(businessNumber)) {
      throw new BadRequestException('올바른 사업자번호 형식이 아닙니다.');
    }
  }

  /**
   * 사용자 문의 등록
   * - 개인정보 암호화
   * - 유효한 전화번호를 판별하여 아닐경우 400 에러 반환
   * @param createInquiryDto
   * @returns
   */
  async createInquiry(createInquiryDto: CreateInquiryDto) {
    const plainPhone = this.normalizeNumber(createInquiryDto.phoneNumber);
    this.validatePhoneNumber(plainPhone);

    const inquiryEntity = new InquiryEntity();
    inquiryEntity.industry = createInquiryDto.industry;
    inquiryEntity.phoneNumber = this.encryptionService.encrypt(plainPhone);

    if (createInquiryDto.businessNumber) {
      const plainBusiness = this.normalizeNumber(
        createInquiryDto.businessNumber,
      );
      this.validateBusinessNumber(plainBusiness);
      inquiryEntity.businessNumber =
        this.encryptionService.encrypt(plainBusiness);
    }

    return await this.inquiryRepository.create(inquiryEntity);
  }
}
