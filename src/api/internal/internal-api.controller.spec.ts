import { Test, TestingModule } from '@nestjs/testing';
import { InternalApiController } from './internal-api.controller';
import { InternalApiService } from './internal-api.service';

describe('InternalApiController', () => {
  let controller: InternalApiController;
  let internalApiService: InternalApiService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InternalApiController],
      providers: [
        {
          provide: InternalApiService,
          useValue: {
            getInquiries: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<InternalApiController>(InternalApiController);
    internalApiService = module.get<InternalApiService>(InternalApiService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getInquiries', () => {
    it('should call InternalApiService.getInquiries with correct parameters', async () => {
      // Given
      const phoneNumber = '010-1234-5678';
      const page = 1;
      const limit = 20;
      const mockResult = {
        data: [
          {
            id: 1,
            industry: 'SERVICE',
            phoneNumber: '01012345678',
            businessNumber: '1234567890',
            createdAt: new Date(),
          },
        ],
        total: 1,
        page: 1,
        totalPages: 1,
      };

      jest
        .spyOn(internalApiService, 'getInquiries')
        .mockResolvedValue(mockResult);

      // When
      const result = await controller.getInquiries(phoneNumber, page, limit);

      // Then
      expect(internalApiService.getInquiries).toHaveBeenCalledWith(
        phoneNumber,
        page,
        limit,
      );
      expect(result).toEqual(mockResult);
    });

    it('should call InternalApiService.getInquiries with default pagination parameters', async () => {
      // Given
      const phoneNumber = '010-1234-5678';
      const mockResult = {
        data: [],
        total: 0,
        page: 1,
        totalPages: 0,
      };

      jest
        .spyOn(internalApiService, 'getInquiries')
        .mockResolvedValue(mockResult);

      // When
      await controller.getInquiries(phoneNumber);

      // Then
      expect(internalApiService.getInquiries).toHaveBeenCalledWith(
        phoneNumber,
        1,
        20,
      );
    });

    it('should return decrypted data with proper pagination structure', async () => {
      // Given
      const phoneNumber = '010-1234-5678';
      const page = 2;
      const limit = 10;
      const mockResult = {
        data: [
          {
            id: 1,
            industry: 'SERVICE',
            phoneNumber: '01012345678', // 복호화된 데이터
            businessNumber: '1234567890', // 복호화된 데이터
            createdAt: new Date('2024-01-01'),
          },
          {
            id: 2,
            industry: 'MANUFACTURING',
            phoneNumber: '01098765432', // 복호화된 데이터
            createdAt: new Date('2024-01-02'),
          },
        ],
        total: 25,
        page: 2,
        totalPages: 3,
      };

      jest
        .spyOn(internalApiService, 'getInquiries')
        .mockResolvedValue(mockResult);

      // When
      const result = await controller.getInquiries(phoneNumber, page, limit);

      // Then
      expect(result).toEqual(mockResult);
      expect(result.data).toHaveLength(2);
      expect(result.data[0]).toHaveProperty('phoneNumber', '01012345678');
      expect(result.data[0]).toHaveProperty('businessNumber', '1234567890');
      expect(result.data[1]).toHaveProperty('phoneNumber', '01098765432');
      expect(result.total).toBe(25);
      expect(result.page).toBe(2);
      expect(result.totalPages).toBe(3);
    });

    it('should handle empty results correctly', async () => {
      // Given
      const phoneNumber = '010-9999-9999'; // 존재하지 않는 번호
      const mockResult = {
        data: [],
        total: 0,
        page: 1,
        totalPages: 0,
      };

      jest
        .spyOn(internalApiService, 'getInquiries')
        .mockResolvedValue(mockResult);

      // When
      const result = await controller.getInquiries(phoneNumber);

      // Then
      expect(result.data).toHaveLength(0);
      expect(result.total).toBe(0);
      expect(result.page).toBe(1);
      expect(result.totalPages).toBe(0);
    });

    it('should handle large page numbers correctly', async () => {
      // Given
      const phoneNumber = '010-1234-5678';
      const page = 100;
      const limit = 5;
      const mockResult = {
        data: [],
        total: 50,
        page: 100,
        totalPages: 10,
      };

      jest
        .spyOn(internalApiService, 'getInquiries')
        .mockResolvedValue(mockResult);

      // When
      const result = await controller.getInquiries(phoneNumber, page, limit);

      // Then
      expect(internalApiService.getInquiries).toHaveBeenCalledWith(
        phoneNumber,
        page,
        limit,
      );
      expect(result.page).toBe(100);
      expect(result.totalPages).toBe(10);
      expect(result.data).toHaveLength(0); // 해당 페이지에 데이터가 없음
    });
  });
});
