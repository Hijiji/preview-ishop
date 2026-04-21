import { Body, Controller, Post, BadRequestException } from '@nestjs/common';
import { ApiOperation, ApiTags, ApiResponse } from '@nestjs/swagger';
import { PublicApiService } from './public-api.service';
import { CreateInquiryDto } from './dto/create-inquiry.dto';

@ApiTags('Public API')
@Controller('public')
export class PublicApiController {
  constructor(private readonly publicApiService: PublicApiService) {}

  @ApiOperation({ summary: '구매 상담 등록 API' })
  @ApiResponse({
    status: 201,
    description: '구매 상담 등록 성공',
  })
  @ApiResponse({
    status: 400,
    description: '유효하지 않은 입력 (전화번호 형식 오류 등)',
  })
  @Post('/inquiry')
  async createInquiry(@Body() createInquiryDto: CreateInquiryDto) {
    return await this.publicApiService.createInquiry(createInquiryDto);
  }
}
