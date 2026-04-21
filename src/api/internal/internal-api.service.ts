import { Injectable } from '@nestjs/common';
import { InquiryRepository } from '../../mikro-orm/entities/inquiry/inquiry-repository';
import { EncryptionService } from 'src/common/encryption.service';
import { InquiryEntity } from '../../mikro-orm/entities/inquiry/inquiry-entity';

@Injectable()
export class InternalApiService {
  constructor(
    private readonly inquiryRepository: InquiryRepository,
    private readonly encryptionService: EncryptionService,
  ) {}

  /**
   * 모든 구매 상담 조회 및 복호화
   */
  async getInquiries({}: {}) {
    const inquiries = await this.inquiryRepository.findAll();
    return this.decryptInquiries(inquiries);
  }

  /**
   * 전화번호로 구매 상담 조회
   * @param phoneNumber 조회할 전화번호 (하이픈 제거된 형식)
   */
  async getInquiriesByPhoneNumber(phoneNumber: string) {
    const inquiries = await this.inquiryRepository.findAll();
    const decryptedInquiries = this.decryptInquiries(inquiries);

    // 전화번호로 필터링
    return decryptedInquiries.filter(
      (inquiry) => inquiry.phoneNumber === phoneNumber,
    );
  }

  /**
   * 조회한 문의 데이터를 복호화합니다
   * @param inquiries 암호화된 문의 데이터 배열
   */
  private decryptInquiries(inquiries: InquiryEntity[]): InquiryEntity[] {
    return inquiries.map((inquiry) => {
      try {
        // 전화번호 복호화
        inquiry.phoneNumber = this.encryptionService.decrypt(
          inquiry.phoneNumber,
        );

        // 사업자번호 복호화
        if (inquiry.businessNumber) {
          inquiry.businessNumber = this.encryptionService.decrypt(
            inquiry.businessNumber,
          );
        }
      } catch (error) {
        // 복호화 실패 시 로그 출력 (필요시 예외 처리)
        console.error('Decryption failed for inquiry:', error);
      }
      return inquiry;
    });
  }
}
