import { BadRequestException } from '@nestjs/common';

export class ValidationUtils {
  /**
   * 모든 특수문자 및 공백 제거 (하이픈, 괄호, 공백 등)
   */
  static normalizeNumber(value: string): string {
    if (!value) return '';
    return value.replace(/[\s()-]/g, '');
  }

  /**
   * 전화번호 유효성 검사 (휴대폰, 지역번호, 공통번호 포함)
   */
  static validatePhoneNumber(phoneNumber: string): void {
    const normalized = this.normalizeNumber(phoneNumber);
    const phonePattern = /^(01[016789]|02|0[3-9][0-9]|070|080|050)\d{7,8}$/;

    if (!phonePattern.test(normalized)) {
      throw new BadRequestException('올바른 전화번호 형식이 아닙니다.');
    }
  }

  /**
   * 사업자등록번호 유효성 검사 (숫자 10자리)
   */
  static validateBusinessNumber(businessNumber: string): void {
    const normalized = this.normalizeNumber(businessNumber);
    const businessNumberPattern = /^\d{10}$/;

    if (!businessNumberPattern.test(normalized)) {
      throw new BadRequestException('올바른 사업자번호 형식이 아닙니다.');
    }
  }
}
