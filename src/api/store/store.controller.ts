import { Controller, Get, Post } from '@nestjs/common';
import { ApiOperation, ApiTags, ApiQuery } from '@nestjs/swagger';
import { StoreService } from './store.service';

@ApiTags('Store API')
@Controller('store')
export class StoreController {
  constructor(private readonly storeService: StoreService) {}
  @ApiOperation({ summary: '임의가맹점 10곳 생성 API' })
  @Post('test-stores')
  createStore() {
    return this.storeService.createStore();
  }
}
