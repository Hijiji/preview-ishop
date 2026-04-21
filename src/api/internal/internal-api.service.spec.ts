import { Test, TestingModule } from '@nestjs/testing';
import { InternalApiService } from './internal-api.service';
import { InquiryRepository } from '../../mikro-orm/entities/inquiry/inquiry-repository';
import { EncryptionService } from 'src/common/encryption.service';
import { InquiryEntity } from '../../mikro-orm/entities/inquiry/inquiry-entity';
import { IndustryType } from 'src/enums/industry-type.enum';

describe('InternalApiService', () => {
  let service: InternalApiService;
  let inquiryRepository: InquiryRepository;
  let encryptionService: EncryptionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InternalApiService,
        {
          provide: InquiryRepository,
          useValue: {
            findByBlindIndex: jest.fn(),
            countByBlindIndex: jest.fn(),
          },
        },
        {
          provide: EncryptionService,
          useValue: {
            generateBlindIndex: jest.fn(),
            decrypt: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<InternalApiService>(InternalApiService);
    inquiryRepository = module.get<InquiryRepository>(InquiryRepository);
    encryptionService = module.get<EncryptionService>(EncryptionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getInquiries', () => {
    const mockInquiry: InquiryEntity = {
      id: 1,
      industry: IndustryType.SERVICE,
      encryptedPhoneNumber: 'encrypted:01012345678',
      encryptedBusinessNumber: 'encrypted:1234567890',
      phoneFullHash: 'hash1',
      createdAt: new Date(),
    };

    beforeEach(() => {
      // 기본 모킹 설정
      jest.spyOn(encryptionService, 'generateBlindIndex').mockReturnValue('mockBlindIndex');
      jest.spyOn(encryptionService, 'decrypt').mockImplementation((encrypted) => {
        const decryptMap: { [key: string]: string } = {
          'encrypted:01012345678': '01012345678',
          'encrypted:1234567890': '1234567890',
          'encrypted:01087654321': '01087654321',
          'encrypted:01011112222': '01011112222',
          'encrypted:9876543210': '9876543210',
        };
        return decryptMap[encrypted] || encrypted;
      });
    });

    it('should normalize phone number and validate it', async () => {
      // Given
      const phoneNumber = '010-1234-5678';
      const page = 1;
      const limit = 20;

      jest.spyOn(inquiryRepository, 'findByBlindIndex').mockResolvedValue([]);
      jest.spyOn(inquiryRepository, 'countByBlindIndex').mockResolvedValue(0);

      // When
      await service.getInquiries(phoneNumber, page, limit);

      // Then
      expect(encryptionService.generateBlindIndex).toHaveBeenCalledWith('01012345678');
    });

    it('should generate correct Blind Index for search', async () => {
      // Given
      const phoneNumber = '010 1234 5678'; // 공백 포함
      const expectedNormalized = '01012345678';

      jest.spyOn(inquiryRepository, 'findByBlindIndex').mockResolvedValue([]);
      jest.spyOn(inquiryRepository, 'countByBlindIndex').mockResolvedValue(0);

      // When
      await service.getInquiries(phoneNumber);

      // Then
      expect(encryptionService.generateBlindIndex).toHaveBeenCalledWith(expectedNormalized);
    });

    it('should call repository with correct Blind Index and pagination', async () => {
      // Given
      const phoneNumber = '01012345678';
      const page = 2;
      const limit = 10;
      const expectedOffset = 10; // (page - 1) * limit = (2 - 1) * 10 = 10

      jest.spyOn(inquiryRepository, 'findByBlindIndex').mockResolvedValue([]);
      jest.spyOn(inquiryRepository, 'countByBlindIndex').mockResolvedValue(0);

      // When
      await service.getInquiries(phoneNumber, page, limit);

      // Then
      expect(inquiryRepository.findByBlindIndex).toHaveBeenCalledWith(
        'mockBlindIndex',
        limit,
        expectedOffset,
      );
      expect(inquiryRepository.countByBlindIndex).toHaveBeenCalledWith('mockBlindIndex');
    });

    it('should decrypt inquiry data correctly', async () => {
      // Given
      const phoneNumber = '01012345678';
      const mockInquiries = [mockInquiry];

      jest.spyOn(inquiryRepository, 'findByBlindIndex').mockResolvedValue(mockInquiries);
      jest.spyOn(inquiryRepository, 'countByBlindIndex').mockResolvedValue(1);

      // When
      const result = await service.getInquiries(phoneNumber);

      // Then
      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toHaveProperty('phoneNumber', '01012345678');
      expect(result.data[0]).toHaveProperty('businessNumber', '1234567890');
      expect(encryptionService.decrypt).toHaveBeenCalledWith('encrypted:01012345678');
      expect(encryptionService.decrypt).toHaveBeenCalledWith('encrypted:1234567890');
    });

    it('should handle inquiries without business number', async () => {
      // Given
      const phoneNumber = '01012345678';
      const inquiryWithoutBusiness = {
        ...mockInquiry,
        encryptedBusinessNumber: undefined,
      };

      jest.spyOn(inquiryRepository, 'findByBlindIndex').mockResolvedValue([inquiryWithoutBusiness]);
      jest.spyOn(inquiryRepository, 'countByBlindIndex').mockResolvedValue(1);

      // When
      const result = await service.getInquiries(phoneNumber);

      // Then
      expect(result.data[0]).toHaveProperty('phoneNumber', '01012345678');
      expect(result.data[0]).not.toHaveProperty('businessNumber');
      expect(encryptionService.decrypt).toHaveBeenCalledTimes(1); // 전화번호만 복호화
    });

    it('should return correct pagination information', async () => {
      // Given
      const phoneNumber = '01012345678';
      const page = 1;
      const limit = 20;
      const total = 45; // 3페이지 분량

      jest.spyOn(inquiryRepository, 'findByBlindIndex').mockResolvedValue([mockInquiry]);
      jest.spyOn(inquiryRepository, 'countByBlindIndex').mockResolvedValue(total);

      // When
      const result = await service.getInquiries(phoneNumber, page, limit);

      // Then
      expect(result.total).toBe(total);
      expect(result.page).toBe(page);
      expect(result.totalPages).toBe(3); // Math.ceil(45 / 20) = 3
    });

    it('should handle decryption errors gracefully', async () => {
      // Given
      const phoneNumber = '01012345678';
      const inquiryWithBadData = {
        ...mockInquiry,
        encryptedPhoneNumber: 'corrupted-data',
      };

      jest.spyOn(encryptionService, 'decrypt').mockImplementation(() => {
        throw new Error('Decryption failed');
      });
      jest.spyOn(inquiryRepository, 'findByBlindIndex').mockResolvedValue([inquiryWithBadData]);
      jest.spyOn(inquiryRepository, 'countByBlindIndex').mockResolvedValue(1);

      // When
      const result = await service.getInquiries(phoneNumber);

      // Then
      expect(result.data).toHaveLength(1);
      expect(result.data[0]).not.toHaveProperty('phoneNumber'); // 복호화 실패로 속성 없음
      expect(result.data[0]).toHaveProperty('encryptedPhoneNumber', 'corrupted-data'); // 원본 데이터 유지
    });

    it('should return empty result when no inquiries found', async () => {
      // Given
      const phoneNumber = '01099999999'; // 존재하지 않는 번호

      jest.spyOn(inquiryRepository, 'findByBlindIndex').mockResolvedValue([]);
      jest.spyOn(inquiryRepository, 'countByBlindIndex').mockResolvedValue(0);

      // When
      const result = await service.getInquiries(phoneNumber);

      // Then
      expect(result.data).toHaveLength(0);
      expect(result.total).toBe(0);
      expect(result.page).toBe(1);
      expect(result.totalPages).toBe(0);
    });

    it('should handle multiple inquiries with different data', async () => {
      // Given
      const phoneNumber = '01012345678';
      const mockInquiries = [
        mockInquiry,
        {
          ...mockInquiry,
          id: 2,
          encryptedPhoneNumber: 'encrypted:01087654321',
          encryptedBusinessNumber: undefined,
        },
        {
          ...mockInquiry,
          id: 3,
          encryptedPhoneNumber: 'encrypted:01011112222',
          encryptedBusinessNumber: 'encrypted:9876543210',
        },
      ];

      jest.spyOn(inquiryRepository, 'findByBlindIndex').mockResolvedValue(mockInquiries);
      jest.spyOn(inquiryRepository, 'countByBlindIndex').mockResolvedValue(3);

      // When
      const result = await service.getInquiries(phoneNumber);

      // Then
      expect(result.data).toHaveLength(3);
      expect(result.data[0]).toHaveProperty('phoneNumber', '01012345678');
      expect(result.data[0]).toHaveProperty('businessNumber', '1234567890');
      expect(result.data[1]).toHaveProperty('phoneNumber', '01087654321');
      expect(result.data[1]).not.toHaveProperty('businessNumber');
      expect(result.data[2]).toHaveProperty('phoneNumber', '01011112222');
      expect(result.data[2]).toHaveProperty('businessNumber', '9876543210');
    });
  });
});