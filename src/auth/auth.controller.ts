import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Ip,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthGuardRefreshToken } from '../auth.guard';
import { AuthService } from './auth.service';
import { UserQueryRepository } from '../user/user.query.repository';
import { UserService } from '../user/user.service';
import { UserAuthViewModel } from './types';
import { AuthUserDto } from './dto/auth.dto';
import { AuthQueryRepository } from './auth.query.repository';
import { AuthAccessTokenModel } from './types/AuthUserModel';

@Controller('api/auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
    private readonly userQueryRepository: UserQueryRepository,
    private readonly authQueryRepository: AuthQueryRepository,
  ) {}
  // Получение списка пользователей
  @Get('me')
  @UseGuards(AuthGuardRefreshToken)
  @HttpCode(HttpStatus.OK)
  async me(
    @Req() request: Request & { userId: string },
  ): Promise<UserAuthViewModel> {
    // Получаем конкретного аутентифицированного пользователя по его идентификатору
    const foundAuthUser = await this.authQueryRepository.findAuthUserById(
      request.userId,
    );
    // Если аутентифицированный пользователь не найден возвращаем ошибку
    if (!foundAuthUser) {
      throw new UnauthorizedException();
    }
    // Возвращаем аутентифицированного пользователя в формате ответа пользователю
    return foundAuthUser;
  }
  // Получение списка пользователей
  @Post('/login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Req() request: Request,
    @Ip() ip: string,
    @Body() authUserDto: AuthUserDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthAccessTokenModel> {
    const deviceTitle = request.headers['user-agent'] || '';
    const authUserTokens = await this.authService.checkCredentials(
      ip,
      deviceTitle,
      authUserDto,
    );
    // Если аутентифицированный пользователь не найден возвращаем ошибку 401
    if (!authUserTokens) {
      throw new UnauthorizedException();
    }
    // Пишем новый refresh токен в cookie
    response.cookie('refreshToken', authUserTokens.refreshToken, {
      httpOnly: true,
      secure: true,
    });
     // Возвращаем сформированный access токен
    return { accessToken: authUserTokens.accessToken };
  }
}
