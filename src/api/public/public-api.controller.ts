import { Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PublicApiService } from './public-api.service';

@ApiTags('Public API')
@Controller('public')
export class PublicApiController {
  constructor(private readonly publicApiService: PublicApiService) {}

  @ApiOperation({ summary: '구매 상담 등록 API' })
  @Post('/inquiry')
  createInquiry() {
    return this.publicApiService.createInquiry({});
  }
}
