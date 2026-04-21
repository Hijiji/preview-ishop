import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags, ApiQuery } from '@nestjs/swagger';
import { InternalApiService } from './internal-api.service';

@ApiTags('Internal API')
@Controller('internal')
export class InternalApiController {
  constructor(private readonly internalApiService: InternalApiService) {}

  @ApiOperation({ summary: '구매 상담 조회 API' })
  @ApiQuery({
    name: 'phoneNumber',
    description: '검색할 전화번호',
    example: '010-1234-5678',
    required: true,
  })
  @ApiQuery({
    name: 'page',
    description: '페이지 번호 (1부터 시작)',
    example: 1,
    required: false,
  })
  @ApiQuery({
    name: 'limit',
    description: '페이지당 항목 수',
    example: 20,
    required: false,
  })
  @Get('/inquiries')
  async getInquiries(
    @Query('phoneNumber') phoneNumber: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return this.internalApiService.getInquiries(phoneNumber, page, limit);
  }
}
