import { Test, TestingModule } from '@nestjs/testing';
import { EntityManager } from '@mikro-orm/core';
import { BatchService } from './batch.service';
import { StoreRepository } from '../mikro-orm/entities/store/store-repository';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { EncryptionService } from '../common/services/encryption.service';
import { SlackService } from '../common/services/slack.service';
import { WinstonLogger } from '../common/winston-logger';
import { of } from 'rxjs';

describe('BatchService', () => {
  let service: BatchService;
  let storeRepository: StoreRepository;
  let httpService: HttpService;
  let configService: ConfigService;
  let encryptionService: EncryptionService;
  let slackService: SlackService;
  let logger: WinstonLogger;

  const createAxiosResponse = (data: any) => of({ data } as any);

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BatchService,
        {
          provide: StoreRepository,
          useValue: {
            findBatchTargets: jest.fn(),
            updateBusinessStatus: jest.fn(),
          },
        },
        {
          provide: HttpService,
          useValue: {
            post: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
        {
          provide: EncryptionService,
          useValue: {
            decrypt: jest.fn(),
          },
        },
        {
          provide: SlackService,
          useValue: {
            sendClosedStoreNotification: jest.fn(),
          },
        },
        {
          provide: WinstonLogger,
          useValue: {
            log: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
            debug: jest.fn(),
          },
        },
        {
          provide: EntityManager,
          useValue: Object.assign(Object.create(EntityManager.prototype), {
            transactional: jest.fn((cb: any) => cb()),
          }),
        },
      ],
    }).compile();

    service = module.get<BatchService>(BatchService);
    storeRepository = module.get<StoreRepository>(StoreRepository);
    httpService = module.get<HttpService>(HttpService);
    configService = module.get<ConfigService>(ConfigService);
    encryptionService = module.get<EncryptionService>(EncryptionService);
    slackService = module.get<SlackService>(SlackService);
    logger = module.get<WinstonLogger>(WinstonLogger);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('handleBusinessStatusUpdate', () => {
    beforeEach(() => {
      jest.useFakeTimers().setSystemTime(new Date('2023-01-01T01:00:00'));
      jest.spyOn(configService, 'get').mockReturnValue('mockApiKey');
      jest
        .spyOn(encryptionService as any, 'decrypt')
        .mockResolvedValue('1234567890');
    });

    it('should not run batch if already running', async () => {
      // Given
      (service as any).isRunning = true;

      // When
      await (service as any).handleBusinessStatusUpdate();

      // Then
      expect(storeRepository.findBatchTargets).not.toHaveBeenCalled();
    });

    it('should run batch only between midnight and 3 AM', async () => {
      // Given
      jest.useFakeTimers().setSystemTime(new Date('2023-01-01T01:00:00'));

      jest
        .spyOn(storeRepository, 'findBatchTargets')
        .mockResolvedValue([] as any);
      jest
        .spyOn(httpService as any, 'post')
        .mockReturnValue(
          createAxiosResponse({ request_cnt: 0, valid_cnt: 0, data: [] }),
        );

      // When
      await (service as any).handleBusinessStatusUpdate();

      // Then
      expect(storeRepository.findBatchTargets).toHaveBeenCalled();
    });

    it('should stop batch after 3 AM', async () => {
      // Given
      jest.useFakeTimers().setSystemTime(new Date('2023-01-01T03:01:00'));

      jest
        .spyOn(storeRepository, 'findBatchTargets')
        .mockResolvedValue([] as any);

      // When
      await (service as any).handleBusinessStatusUpdate();

      // Then
      expect(storeRepository.findBatchTargets).not.toHaveBeenCalled();
      jest.useRealTimers();
    });

    it('should call business status API correctly', async () => {
      // Given
      const mockTargets = [
        { id: 1, businessNumber: 'encrypted:1234567890' },
        { id: 2, businessNumber: 'encrypted:0987654321' },
      ];

      jest
        .spyOn(storeRepository, 'findBatchTargets')
        .mockResolvedValueOnce(mockTargets as any)
        .mockResolvedValueOnce([] as any);
      jest
        .spyOn(encryptionService as any, 'decrypt')
        .mockResolvedValueOnce('1234567890')
        .mockResolvedValueOnce('0987654321');

      jest.spyOn(httpService as any, 'post').mockReturnValue(
        createAxiosResponse({
          request_cnt: 2,
          valid_cnt: 2,
          data: [
            { b_no: '1234567890', b_stt: '01', tax_type: '01' },
            { b_no: '0987654321', b_stt: '02', tax_type: '02' },
          ],
        }),
      );

      // When
      await (service as any).handleBusinessStatusUpdate();

      // Then
      expect(httpService.post).toHaveBeenCalledWith(
        'https://api.odcloud.kr/api/nts-businessman/v1/status?serviceKey=mockApiKey',
        { b_no: ['1234567890', '0987654321'] },
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            Accept: 'application/json',
          }),
        }),
      );
    });

    it('should update business status and send slack notification for closed stores', async () => {
      // Given
      const mockTargets = [{ id: 1, businessNumber: 'encrypted:1234567890' }];

      jest
        .spyOn(storeRepository, 'findBatchTargets')
        .mockResolvedValueOnce(mockTargets as any)
        .mockResolvedValueOnce([] as any);
      jest.spyOn(httpService as any, 'post').mockReturnValue(
        createAxiosResponse({
          request_cnt: 1,
          valid_cnt: 1,
          data: [{ b_no: '1234567890', b_stt: '03', tax_type: '01' }], // 폐업 상태
        }),
      );

      // When
      await (service as any).handleBusinessStatusUpdate();

      // Then
      expect(storeRepository.updateBusinessStatus).toHaveBeenCalledWith(
        1,
        '03',
        '01',
        expect.any(Date),
      );
      expect(slackService.sendClosedStoreNotification).toHaveBeenCalledWith(
        1,
        '1234567890',
      );
    });

    it('should not send slack notification for non-closed stores', async () => {
      // Given
      const mockTargets = [{ id: 1, businessNumber: 'encrypted:1234567890' }];

      jest
        .spyOn(storeRepository, 'findBatchTargets')
        .mockResolvedValueOnce(mockTargets as any)
        .mockResolvedValueOnce([] as any);
      jest.spyOn(httpService as any, 'post').mockReturnValue(
        createAxiosResponse({
          request_cnt: 1,
          valid_cnt: 1,
          data: [{ b_no: '1234567890', b_stt: '01', tax_type: '01' }], // 계속사업자
        }),
      );

      // When
      await (service as any).handleBusinessStatusUpdate();

      // Then
      expect(storeRepository.updateBusinessStatus).toHaveBeenCalled();
      expect(slackService.sendClosedStoreNotification).not.toHaveBeenCalled();
    });
  });
});
