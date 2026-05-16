import { Controller, Get } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';

@ApiExcludeController()
@Controller('')
export class BaseController {
  @Get()
  getHello(): string {
    return 'Hello World!';
  }
}
