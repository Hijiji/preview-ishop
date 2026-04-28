import { Injectable, BadRequestException } from '@nestjs/common';
import { Transactional } from '@mikro-orm/core';
import { InquiryRepository } from '../../mikro-orm/entities/inquiry/inquiry-repository';
import { CreateInquiryDto } from './dto/create-inquiry.dto';
import { InquiryEntity } from 'src/mikro-orm/entities/inquiry/inquiry-entity';
import { EncryptionService } from 'src/common/services/encryption.service';
import { ValidationUtils } from 'src/common/utils/validation.util';
import { EntityManager } from '@mikro-orm/sqlite';

@Injectable()
export class PublicApiService {
  constructor(
    private readonly inquiryRepository: InquiryRepository,
    private readonly encryptionService: EncryptionService,
    private readonly em: EntityManager,
  ) {}

  /**
   * 사용자 문의 등록
   * @param createInquiryDto
   * @returns
   */
  @Transactional()
  async createInquiry(createInquiryDto: CreateInquiryDto) {
    //전화번호에서 하이픈 제거 및 유효성 검사
    const plainPhone = ValidationUtils.normalizeNumber(
      createInquiryDto.phoneNumber,
    );
    ValidationUtils.validatePhoneNumber(plainPhone);

    const inquiryEntity = new InquiryEntity();
    inquiryEntity.industry = createInquiryDto.industry;

    //암호화된 전화번호 저장
    inquiryEntity.encryptedPhoneNumber =
      this.encryptionService.encrypt(plainPhone);
    //검색용 Blind Index 생성
    inquiryEntity.phoneFullHash =
      this.encryptionService.generateBlindIndex(plainPhone);

    //사업자번호가 있는 경우 하이픈제거, 유효성검사, 암호화
    if (createInquiryDto.businessNumber) {
      const plainBusiness = ValidationUtils.normalizeNumber(
        createInquiryDto.businessNumber,
      );
      ValidationUtils.validateBusinessNumber(plainBusiness);
      inquiryEntity.encryptedBusinessNumber =
        this.encryptionService.encrypt(plainBusiness);
    }

    return await this.inquiryRepository.create(inquiryEntity);
  }
}
