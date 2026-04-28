import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { MikroORM, SqliteDriver } from '@mikro-orm/sqlite';
import { PublicApiService } from './public-api.service';
import { InquiryRepository } from '../../mikro-orm/entities/inquiry/inquiry-repository';
import { EncryptionService } from 'src/common/services/encryption.service';
import { InquiryEntity } from '../../mikro-orm/entities/inquiry/inquiry-entity';
import { IndustryType } from 'src/enums/industry-type.enum';

describe('PublicApiService', () => {
  let service: PublicApiService;
  let inquiryRepository: InquiryRepository;
  let encryptionService: EncryptionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        MikroOrmModule.forRoot({
          dbName: ':memory:',
          driver: SqliteDriver,
          allowGlobalContext: true,
          entities: [InquiryEntity],
        }),
      ],
      providers: [
        PublicApiService,
        {
          provide: InquiryRepository,
          useValue: {
            create: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: EncryptionService,
          useValue: {
            encrypt: jest.fn((value: string) => `encrypted:${value}`),
            generateBlindIndex: jest.fn((value: string) => `blind:${value}`),
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

    service = module.get<PublicApiService>(PublicApiService);
    inquiryRepository = module.get<InquiryRepository>(InquiryRepository);
    encryptionService = module.get<EncryptionService>(EncryptionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createInquiry', () => {
    it('should encrypt phone number and business number before saving', async () => {
      const dto = {
        industry: IndustryType.SERVICE,
        phoneNumber: '010-1234-5678',
        businessNumber: '123-45-67890',
      };

      await service.createInquiry(dto as any);

      expect(encryptionService.encrypt).toHaveBeenCalledWith('01012345678');
      expect(encryptionService.encrypt).toHaveBeenCalledWith('1234567890');
      expect(inquiryRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          industry: dto.industry,
          encryptedPhoneNumber: 'encrypted:01012345678',
          encryptedBusinessNumber: 'encrypted:1234567890',
          phoneFullHash: 'blind:01012345678',
          businessFullHash: 'blind:1234567890',
        }),
      );
    });

    it('should throw BadRequestException for invalid phone number', async () => {
      const dto = {
        industry: IndustryType.SERVICE,
        phoneNumber: '012-3456-7890',
      };

      await expect(service.createInquiry(dto as any)).rejects.toBeInstanceOf(
        BadRequestException,
      );

      expect(inquiryRepository.create).not.toHaveBeenCalled();
    });

    it('should handle inquiry without business number', async () => {
      const dto = {
        industry: IndustryType.SERVICE,
        phoneNumber: '010-1234-5678',
      };

      await service.createInquiry(dto as any);

      expect(encryptionService.encrypt).toHaveBeenCalledWith('01012345678');
      expect(encryptionService.encrypt).not.toHaveBeenCalledWith('1234567890');
      expect(inquiryRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          industry: dto.industry,
          encryptedPhoneNumber: 'encrypted:01012345678',
          phoneFullHash: 'blind:01012345678',
          encryptedBusinessNumber: undefined,
          businessFullHash: undefined,
        }),
      );
    });

    it('should throw BadRequestException for invalid business number', async () => {
      const dto = {
        industry: IndustryType.SERVICE,
        phoneNumber: '010-1234-5678',
        businessNumber: '123-456-789',
      };

      await expect(service.createInquiry(dto as any)).rejects.toBeInstanceOf(
        BadRequestException,
      );

      expect(inquiryRepository.create).not.toHaveBeenCalled();
    });
  });
});
