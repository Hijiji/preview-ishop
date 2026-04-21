import { Injectable } from '@nestjs/common';
import { WinstonLogger } from './winston-logger';

@Injectable()
export class SlackService {
  private readonly logger = new WinstonLogger(SlackService.name);

  // 폐업 상태 감지 시 슬랙 알림 전송 (인터페이스만 구현)
  async notifyBusinessClosure(
    inquiryId: number,
    businessNumber: string,
  ): Promise<void> {
    // TODO: 실제 슬랙 API 연동 구현
    this.logger.info(
      `Business closure notification sent for Inquiry ID ${inquiryId} - Business ${businessNumber}`,
      'SlackService',
    );
  }
}
