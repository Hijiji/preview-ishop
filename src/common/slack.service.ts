import { Injectable } from '@nestjs/common';

@Injectable()
export class SlackService {
  // 폐업 상태 감지 시 슬랙 알림 전송 (인터페이스만 구현)
  async notifyBusinessClosure(
    inquiryId: number,
    businessNumber: string,
  ): Promise<void> {
    // TODO: 실제 슬랙 API 연동 구현
    console.log(
      `[SLACK NOTIFICATION] Inquiry ID ${inquiryId} - Business ${businessNumber} has closed`,
    );
  }
}
