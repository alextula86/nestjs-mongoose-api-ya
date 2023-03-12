import { Injectable } from '@nestjs/common';
import { SessionRepository } from './session.repository';
import { CreateSessionDto } from './dto';
import { SessionDocument } from './schemas';

@Injectable()
export class SessionService {
  constructor(private readonly sessionRepository: SessionRepository) {}
  // Поиск сессии по ip адресу, урлу и названию устройства
  async findSession(
    ip: string,
    url: string,
    deviceTitle: string,
  ): Promise<SessionDocument | null> {
    const foundSession = await this.sessionRepository.findSession(
      ip,
      url,
      deviceTitle,
    );

    return foundSession;
  }
  // Добавление сессии
  async createSession(
    createSessionDto: CreateSessionDto,
  ): Promise<SessionDocument> {
    const { ip, deviceTitle, url } = createSessionDto;
    // Создаем документ сессии
    const madeSession = await this.sessionRepository.createSession({
      ip,
      deviceTitle,
      url,
    });
    // Сохраняем сессию в базе
    const createdSession = await this.sessionRepository.save(madeSession);
    // Возвращаем идентификатор созданного устройства и статус CREATED
    return createdSession;
  }
  // Обновление попытки обратится к сессии
  async increaseAttempt(sessionId: string): Promise<SessionDocument | null> {
    // Проверяем добавлена ли сессия с переданным идентификаторм
    const session = await this.sessionRepository.findSessionById(sessionId);
    console.log('session', session);
    // Если сессии с переданным идентификатором нет в базе, возвращаем ошибку 400
    if (!session) {
      return null;
    }
    // Увеличиваем поле attempt на единицу
    session.increaseAttempt();
    const updatedSession = await this.sessionRepository.save(session);
    console.log('updatedSession', updatedSession);
    return updatedSession;
  }
  // Сбрасывание попытки обратиться к сессии в исходное состояние
  async resetAttempt(sessionId: string): Promise<SessionDocument | null> {
    // Проверяем добавлена ли сессия с переданным идентификаторм
    const session = await this.sessionRepository.findSessionById(sessionId);
    // Если сессии с переданным идентификатором нет в базе, возвращаем ошибку 400
    if (!session) {
      return null;
    }
    // Сбрасываем поле attempt в исходное состояние
    session.resetAttempt();
    const updatedSession = await this.sessionRepository.save(session);
    return updatedSession;
  }
}
