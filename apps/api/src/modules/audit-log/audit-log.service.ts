import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity';
import { AuditAction } from '@corplan/shared-types';

@Injectable()
export class AuditLogService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditRepository: Repository<AuditLog>,
  ) {}

  async findAll(): Promise<AuditLog[]> {
    return this.auditRepository.find({
      order: { createdAt: 'DESC' },
      take: 200, // Limit to recent 200 logs
    });
  }

  async log(
    userId: string,
    userName: string,
    entityType: string,
    entityId: string,
    action: AuditAction,
    details: string,
    ipAddress?: string,
  ): Promise<AuditLog> {
    const log = new AuditLog();
    log.userId = userId;
    log.userName = userName;
    log.entityType = entityType;
    log.entityId = entityId;
    log.action = action;
    log.details = details;
    log.ipAddress = ipAddress;

    return this.auditRepository.save(log);
  }
}
