import { Test, TestingModule } from '@nestjs/testing';
import { PublicApiController } from './public-api.controller';
import { PublicApiService } from './public-api.service';
import { CreateInquiryDto } from './dto/create-inquiry.dto';
import { IndustryType } from 'src/enums/industry-type.enum';

describe('PublicApiController', () => {
  let controller: PublicApiController;
  let publicApiService: PublicApiService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PublicApiController],
      providers: [
        {
          provide: PublicApiService,
          useValue: {
            createInquiry: jest.fn().mockResolvedValue({ success: true }),
          },
        },
      ],
    }).compile();

    controller = module.get<PublicApiController>(PublicApiController);
    publicApiService = module.get<PublicApiService>(PublicApiService);
  });

  it('should call PublicApiService.createInquiry and return the result', async () => {
    const dto: CreateInquiryDto = {
      industry: IndustryType.SERVICE,
      phoneNumber: '010-1234-5678',
      businessNumber: '123-45-67890',
    } as any;

    const result = await controller.createInquiry(dto);

    expect(publicApiService.createInquiry).toHaveBeenCalledWith(dto);
    expect(result).toEqual({ success: true });
  });
});
