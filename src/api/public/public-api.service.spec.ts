import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { PublicApiService } from './public-api.service';
import { InquiryRepository } from '../../mikro-orm/entities/inquiry/inquiry-repository';
import { EncryptionService } from 'src/common/encryption.service';
import { IndustryType } from 'src/enums/industry-type.enum';

describe('PublicApiService', () => {
  let service: PublicApiService;
  let inquiryRepository: InquiryRepository;
  let encryptionService: EncryptionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
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
            generatePartialBlindIndex: jest.fn(
              (value: string, digits: number) =>
                `partial:${value.slice(-digits)}`,
            ),
          },
        },
      ],
    }).compile();

    service = module.get<PublicApiService>(PublicApiService);
    inquiryRepository = module.get<InquiryRepository>(InquiryRepository);
    encryptionService = module.get<EncryptionService>(EncryptionService);
  });

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
        phoneLastFourHash: 'partial:5678',
        phonePrefix: '010',
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
});
