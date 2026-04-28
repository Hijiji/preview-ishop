import { Injectable } from '@nestjs/common';
import { WinstonLogger } from '../winston-logger';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class SlackService {
  private readonly logger = new WinstonLogger(SlackService.name);
  private readonly webhookUrl: string;
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    const webhookUrl = this.configService.get<string>('SLACK_WEBHOOK_URL');
    if (!webhookUrl) {
      throw new Error('환경변수 SLACK_WEBHOOK_URL이 정의되지 않았습니다.');
    }
    this.webhookUrl = webhookUrl;
  }
  // 폐업 상태 감지 시 슬랙 알림 전송
  async notifyBusinessClosure(
    inquiryId: number,
    businessNumber: string,
  ): Promise<void> {
    this.logger.info(
      `Business closure notification sent for Inquiry ID ${inquiryId} - Business ${businessNumber}`,
      'SlackService',
    );
  }

  async sendClosedStoreNotification(inquiryId: number, businessNumber: string) {
    if (!this.webhookUrl) {
      this.logger.warn('슬랙 웹훅 URL이 설정되지 않았습니다.');
      return;
    }

    const message = {
      attachments: [
        {
          color: '#FF0000', // 강조
          title: `🚨 가맹점 폐업 감지 알림`,
          fields: [
            { title: '사업자번호', value: businessNumber, short: true },
            { title: '상태', value: '폐업(CLOSED)', short: true },
            { title: '관련 문의 ID', value: inquiryId.toString(), short: true },
          ],
          ts: Math.floor(Date.now() / 1000),
        },
      ],
    };

    try {
      await firstValueFrom(this.httpService.post(this.webhookUrl, message));
    } catch (error) {
      this.logger.error(`슬랙 알림 전송 실패: ${error.message}`);
    }
  }
}
