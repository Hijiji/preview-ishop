import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { InternalApiService } from './internal-api.service';

@ApiTags('Internal API')
@Controller('internal')
export class InternalApiController {
  constructor(private readonly internalApiService: InternalApiService) {}

  @ApiOperation({ summary: '구매 상담 조회 API' })
  @Get('/inquiries')
  getInquiries() {
    return this.internalApiService.getInquiries({});
  }

  @ApiOperation({ summary: '전화번호로 구매 상담 조회 API' })
  @Get('/inquiries/search')
  getInquiriesByPhoneNumber(@Query('phoneNumber') phoneNumber: string) {
    return this.internalApiService.getInquiriesByPhoneNumber(phoneNumber);
  }
}
