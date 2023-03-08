import { Injectable } from '@nestjs/common';
import { UserRepository } from '../user/user.repository';
import { DeviceRepository } from '../device/device.repository';
import { UserDocument } from '../user/schemas';
import { validateOrRejectModel } from '../validate';
import { AuthUserDto } from './dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly deviceRepository: DeviceRepository,
  ) {}
  // Поиск документа конкретного пользователя по его идентификатору
  async findUserById(userId: string): Promise<UserDocument | null> {
    // Ищем пользователя по идентификатору, если пользователь не найден, то Middleware вернет статус 401
    const foundUser = await this.userRepository.findUserById(userId);
    // Если пользователь по идентификатору не найден, возвращаем статус 401
    if (!foundUser) {
      return null;
    }

    return foundUser;
  }

  async checkCredentials(
    ip: string,
    deviceTitle: string,
    authUserDto: AuthUserDto,
  ): Promise<{ accessToken: string; refreshToken: string } | null> {
    // Валидируем DTO
    await validateOrRejectModel(authUserDto, AuthUserDto);
    // Получаем loginOrEmail, password из DTO
    const { loginOrEmail, password } = authUserDto;
    // Ищем пользователя по логину или емайлу
    const user = await this.userRepository.findByLoginOrEmail(loginOrEmail);
    // Если пользователь не найден, то вернем null для возрвата 401 ошибки
    if (!user) {
      return null;
    }
    // Проверка учетных данных по паролю
    const isCheckCredentialsUser = await user.isCheckCredentials(password);
    // Если пароль не верен, то вернем null для возрвата 401 ошибки
    if (!isCheckCredentialsUser) {
      return null;
    }
    // Формируем accessToken, refreshToken и дату истекания срока refreshToken
    const refreshTokenData = await user.generateRefreshTokenData(user.id);
    // Если возникла ошибка в формировании токенов, то вернем null для возрвата 401 ошибки
    if (!refreshTokenData) {
      return null;
    }

    const { accessToken, refreshToken, expRefreshToken, deviceId } =
      refreshTokenData;
    // Создаем документ устройства
    const madeDevice = await this.deviceRepository.createDevice({
      deviceId,
      ip: ip,
      title: deviceTitle,
      lastActiveDate: new Date(expRefreshToken).toISOString(),
      userId: user.id,
    });
    // Сохраняем устройство в базе
    await this.deviceRepository.save(madeDevice);
    // Обновляем refreshToken пользователя
    user.updateRefreshToken(refreshToken);
    // Сохраняем пользователя в базе
    await this.userRepository.save(user);
    // Возвращаем accessToken
    return { accessToken, refreshToken };
  }
}
