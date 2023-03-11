import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpException,
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
import { UserAuthViewModel } from './types';
import {
  AuthUserDto,
  RegistrationConfirmationDto,
  RegistrationUserDto,
} from './dto';
import { AuthQueryRepository } from './auth.query.repository';
import { AuthAccessTokenModel } from './types/AuthUserModel';

@Controller('api/auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
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
  // Аутентификация пользователя
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
    const { accessToken, refreshToken } = authUserTokens;
    // Пишем новый refresh токен в cookie
    response.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true,
    });
    // Возвращаем сформированный access токен
    return { accessToken };
  }
  // logout пользователя
  @Post('/logout')
  @UseGuards(AuthGuardRefreshToken)
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(
    @Req() request: Request & { userId: string; deviceId: string },
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    const { statusCode } = await this.authService.logout(
      request.userId,
      request.deviceId,
    );
    // Если при logout возникли ошибки возращаем статус ошибки 401
    if (statusCode !== HttpStatus.NO_CONTENT) {
      throw new UnauthorizedException();
    }
    // Удаляем refresh токен из cookie
    response.clearCookie('refreshToken');
  }
  // Получить refresh токен
  @Post('refresh-token')
  @UseGuards(AuthGuardRefreshToken)
  @HttpCode(HttpStatus.OK)
  async refreshToken(
    @Req() request: Request & { userId: string; deviceId: string },
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthAccessTokenModel> {
    const authUserTokens = await this.authService.refreshToken(
      request.userId,
      request.deviceId,
    );
    // Если при logout возникли ошибки возращаем статус ошибки 401
    if (!authUserTokens) {
      throw new UnauthorizedException();
    }
    const { accessToken, refreshToken } = authUserTokens;
    // Пишем новый refresh токен в cookie
    response.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true,
    });

    return { accessToken };
  }
  // Регистрация пользователя
  @Post('registration')
  @HttpCode(HttpStatus.NO_CONTENT)
  async registration(
    @Body() registrationUserDto: RegistrationUserDto,
  ): Promise<void> {
    // Регестрируем пользователя
    const { statusCode, statusMessage } = await this.authService.registerUser(
      registrationUserDto,
    );
    // Если при регистрации пользователя возникли ошибки возращаем статус ошибки
    if (statusCode !== HttpStatus.NO_CONTENT) {
      throw new HttpException(statusMessage, statusCode);
    }
  }
  // Подтверждение email по коду
  @Post('/registration-confirmation')
  @HttpCode(HttpStatus.NO_CONTENT)
  async registrationConfirmation(
    @Body() registrationConfirmationDto: RegistrationConfirmationDto,
  ): Promise<void> {
    // Проверяем код подтверждения email
    const { statusCode, statusMessage } =
      await this.authService.registrationConfirmation(
        registrationConfirmationDto,
      );
    // Если при проверке кода подтверждения email
    if (statusCode !== HttpStatus.NO_CONTENT) {
      throw new HttpException(statusMessage, statusCode);
    }
  }
}
