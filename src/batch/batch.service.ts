import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { StoreRepository } from '../mikro-orm/entities/store/store-repository';
import { EncryptionService } from '../common/encryption.service';
import { SlackService } from '../common/slack.service';
import { firstValueFrom } from 'rxjs';

interface BusinessStatusResponse {
  request_cnt: number;
  valid_cnt: number;
  data: Array<{
    b_no: string; // 사업자등록번호
    b_stt: string; // 사업자 상태 (01: 계속사업자, 02: 휴업자, 03: 폐업자)
    tax_type: string; // 과세유형
    // 기타 필드들...
  }>;
}

@Injectable()
export class BatchService {
  private readonly logger = new Logger(BatchService.name);
  private isRunning = false;
  private readonly BATCH_SIZE = 100; // API 최대 100건
  private readonly API_URL =
    'https://api.odcloud.kr/api/nts-businessman/v1/status';

  constructor(
    private readonly storeRepository: StoreRepository,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly encryptionService: EncryptionService,
    private readonly slackService: SlackService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleBusinessStatusUpdate() {
    if (this.isRunning) {
      this.logger.warn(
        '배치가 이미 실행 중입니다. 중복 실행을 방지하기 위해 이번 실행은 건너뜁니다.',
      );
      return;
    }

    this.isRunning = true;
    this.logger.log('사업자 상태 업데이트 배치 시작');

    try {
      await this.processBatch();
    } catch (error) {
      this.logger.error('배치 처리 실패', error);
    } finally {
      this.isRunning = false;
      this.logger.log('사업자 상태 업데이트 배치 완료');
    }
  }

  private async processBatch() {
    const startTime = new Date();
    const endTime = new Date(startTime);
    endTime.setHours(3, 0, 0, 0); // 03:00까지

    // 어제까지 확인한 데이터만 처리 하도록 기준 날짜 설정
    const lastCheckedBefore = new Date();
    lastCheckedBefore.setHours(0, 0, 0, 0);

    let processedCount = 0;

    while (true) {
      // 현재 시간이 03:00를 넘었는지 체크
      if (new Date() >= endTime) {
        this.logger.log('03:00가 되어 배치 처리를 종료합니다.');
        break;
      }

      // 배치 대상 조회
      const targets = await this.storeRepository.findBatchTargets(
        this.BATCH_SIZE,
        lastCheckedBefore,
      );

      if (targets.length === 0) {
        this.logger.log(
          '배치 처리 대상이 없습니다. 잠시 대기 후 다시 확인합니다.',
        );
        break;
      }

      this.logger.log(`배치 처리 대상 ${targets.length}건 조회`); // 조회된 대상 수 로그

      // 사업자번호 복호화 및 API 호출 준비
      const decryptedData = await Promise.all(
        targets.map(async (target) => {
          try {
            const businessNumber = await this.encryptionService.decrypt(
              target.businessNumber!,
            );
            return {
              id: target.id!,
              businessNumber,
            };
          } catch (error) {
            this.logger.error(
              `사업자번호 복호화 실패 - Inquiry ID: ${target.id}`,
              error,
            );
            return null;
          }
        }),
      );

      const validData = decryptedData.filter((item) => item !== null);

      if (validData.length === 0) {
        this.logger.warn('유효한 사업자번호가 없습니다.');
        continue;
      }

      // API 호출
      try {
        const apiResponse = await this.callBusinessStatusAPI(
          validData.map((item) => item!.businessNumber),
        );

        // 응답 처리
        await this.processApiResponse(apiResponse, validData);

        processedCount += validData.length;
        this.logger.log(`현재까지 처리된 건수: ${processedCount}`);
      } catch (error) {
        this.logger.error('API 호출 실패', error);
        // API 실패 시 잠시 대기 후 재시도 로직 추가 가능
        await this.sleep(5000);
      }
    }
  }

  /**
   * 공공데이터포털 사업자 상태 API 호출
   * @param businessNumbers
   * @returns
   */
  private async callBusinessStatusAPI(
    businessNumbers: string[],
  ): Promise<BusinessStatusResponse> {
    const apiKey = this.configService.get<string>('BUSINESS_STATUS_API_KEY');
    if (!apiKey) {
      throw new Error('비지니스 상태 API 키가 설정되어 있지 않습니다.');
    }

    const payload = {
      b_no: businessNumbers,
    };

    const response = await firstValueFrom(
      this.httpService.post(this.API_URL, payload, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      }),
    );

    return response.data;
  }

  /**
   * 응답 데이터 처리 - DB 업데이트 및 폐업 감지 시 슬랙 알림
   * @param response
   * @param requestData
   */
  private async processApiResponse(
    response: BusinessStatusResponse,
    requestData: Array<{ id: number; businessNumber: string }>,
  ) {
    const now = new Date();

    for (const item of response.data) {
      const requestItem = requestData.find(
        (req) => req.businessNumber === item.b_no,
      );
      if (!requestItem) {
        this.logger.warn(
          `API 응답에 요청한 사업자번호가 없습니다 - Business Number: ${item.b_no}`,
        );
        continue;
      }

      // 상태 업데이트
      await this.storeRepository.updateBusinessStatus(
        requestItem.id, // Inquiry ID
        item.b_stt, // 사업자 상태
        item.tax_type, // 과세유형
        now, // 마지막 확인 일시
      );

      // 폐업 상태인 경우 슬랙 알림
      if (item.b_stt === '03') {
        await this.slackService.notifyBusinessClosure(
          requestItem.id,
          item.b_no,
        );
      }

      this.logger.debug(
        `업데이트 완료 - Inquiry ID: ${requestItem.id}, Business Number: ${item.b_no}, Status: ${item.b_stt}`,
      );
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
