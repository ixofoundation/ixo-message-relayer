import { Body, Controller, HttpException, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { LoginService } from './login.service';
import { LoginFetchDto, LoginCreateDto } from './login.dto';

@Controller('login')
@ApiTags('Login')
export class LoginController {
  constructor(private readonly loginService: LoginService) {}

  @Post('/create') // for mobile
  createLoginRequest(@Body() dto: LoginCreateDto) {
    try {
      return this.loginService.createLogin(dto);
    } catch (error) {
      throw new HttpException(error.message, 400);
    }
  }

  @Post('/fetch') // for client
  fetchLoginRequest(@Body() dto: LoginFetchDto) {
    try {
      return this.loginService.fetchLogin(dto);
    } catch (error) {
      throw new HttpException(error.message, 400);
    }
  }
}
