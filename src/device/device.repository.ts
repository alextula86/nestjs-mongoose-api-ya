import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Device, DeviceDocument, DeviceModelType } from './schemas';
import { MakeDeviceModel } from './types';

@Injectable()
export class DeviceRepository {
  constructor(@InjectModel(Device.name) private DeviceModel: DeviceModelType) {}
  // Сохранение устройства в базе
  async save(user: DeviceDocument): Promise<DeviceDocument> {
    return await user.save();
  }
  // Поиск документа конкретного устройства по его идентификатору
  async findDeviceById(deviceId: string): Promise<DeviceDocument | null> {
    const foundUser = await this.DeviceModel.findOne({ deviceId });

    if (!foundUser) {
      return null;
    }

    return foundUser;
  }
  // Создаем документ пользователя
  async createDevice({
    deviceId,
    ip,
    title,
    userId,
    lastActiveDate,
  }: MakeDeviceModel): Promise<DeviceDocument> {
    const madeUser = this.DeviceModel.make(
      { deviceId, ip, title, userId, lastActiveDate },
      this.DeviceModel,
    );

    return madeUser;
  }
  // Удаление устройства
  async deleteDeviceById(deviceId: string, userId: string): Promise<boolean> {
    const { deletedCount } = await this.DeviceModel.deleteOne({
      $and: [{ deviceId }, { userId }],
    });

    return deletedCount === 1;
  }
  // Удаление всех устройств, кроме текущего устройства
  async deleteAllDevices(
    currentDeviceId: string,
    userId: string,
  ): Promise<boolean> {
    const { deletedCount } = await this.DeviceModel.deleteMany({
      $and: [{ userId }, { id: { $ne: currentDeviceId } }],
    });

    return deletedCount > 0;
  }
  // Удаление коллекции
  async deleteAll(): Promise<boolean> {
    const { deletedCount } = await this.DeviceModel.deleteMany({});

    return deletedCount === 1;
  }
}
