import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';
import { NotificationType } from '@corplan/shared-types';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
  ) {}

  async findAllForUser(userId: string): Promise<Notification[]> {
    return this.notificationRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async markAsRead(id: string, userId: string): Promise<Notification> {
    const notif = await this.notificationRepository.findOne({ where: { id, userId } });
    if (!notif) {
      throw new NotFoundException(`Notifikasi dengan ID ${id} tidak ditemukan`);
    }
    notif.isRead = true;
    return this.notificationRepository.save(notif);
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationRepository.update({ userId, isRead: false }, { isRead: true });
  }

  async create(
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    link?: string,
  ): Promise<Notification> {
    const notif = new Notification();
    notif.userId = userId;
    notif.type = type;
    notif.title = title;
    notif.message = message;
    notif.link = link;
    notif.isRead = false;

    return this.notificationRepository.save(notif);
  }
}
