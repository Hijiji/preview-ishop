import { Injectable } from '@nestjs/common';
import { WinstonLogger } from '../../common/winston-logger';
import { InquiryRepository } from '../../mikro-orm/entities/inquiry/inquiry-repository';
import { EncryptionService } from 'src/common/services/encryption.service';
import { InquiryEntity } from '../../mikro-orm/entities/inquiry/inquiry-entity';
import { ValidationUtils } from 'src/common/utils/validation.util';

@Injectable()
export class InternalApiService {
  private readonly logger = new WinstonLogger(InternalApiService.name);

  constructor(
    private readonly inquiryRepository: InquiryRepository,
    private readonly encryptionService: EncryptionService,
  ) {}

  /**
   * Blind Index기반 전화번호 검색
   * @param phoneNumber
   * @param page
   * @param limit
   */
  async getInquiries(
    phoneNumber: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<{
    data: any[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const offset = (page - 1) * limit;

    const plainPhone = ValidationUtils.normalizeNumber(phoneNumber);
    ValidationUtils.validatePhoneNumber(plainPhone);
    //Blind Index 생
    const fullHash = this.encryptionService.generateBlindIndex(plainPhone);

    // Repository를 통해 Blind Index 검색
    const inquiries = await this.inquiryRepository.findByBlindIndex(
      fullHash,
      limit,
      offset,
    );

    //총 개수 조회
    const total = await this.inquiryRepository.countByBlindIndex(fullHash);

    //복호화
    const decryptedData = await this.decryptInquiriesWithRetry(inquiries);

    return {
      data: decryptedData,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * 복호화
   */
  private async decryptInquiriesWithRetry(
    inquiries: InquiryEntity[],
  ): Promise<any[]> {
    return inquiries.map((inquiry) => {
      const decrypted = {
        id: inquiry.id,
        industry: inquiry.industry,
        createdAt: inquiry.createdAt,
      };

      try {
        if (inquiry.encryptedPhoneNumber) {
          decrypted['phoneNumber'] = this.encryptionService.decrypt(
            inquiry.encryptedPhoneNumber,
          );
        }
        if (inquiry.encryptedBusinessNumber) {
          decrypted['businessNumber'] = this.encryptionService.decrypt(
            inquiry.encryptedBusinessNumber,
          );
        }
      } catch (error) {
        this.logger.error(
          `Decryption failed for inquiry ID: ${inquiry.id}`,
          error.stack,
        );
        // 복호화 실패 시 원본 암호화 데이터를 유지
        if (inquiry.encryptedPhoneNumber) {
          decrypted['encryptedPhoneNumber'] = inquiry.encryptedPhoneNumber;
        }
        if (inquiry.encryptedBusinessNumber) {
          decrypted['encryptedBusinessNumber'] =
            inquiry.encryptedBusinessNumber;
        }
      }

      return decrypted;
    });
  }
}
