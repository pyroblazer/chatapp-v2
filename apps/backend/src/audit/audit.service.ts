import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './audit-log.entity';
import { IAuditService } from './audit.interface';

@Injectable()
export class AuditService implements IAuditService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditRepo: Repository<AuditLog>,
  ) {}

  async logAction(
    userId: string,
    action: string,
    entity: string,
    entityId?: string,
    metadata?: Record<string, any>,
    ipAddress?: string,
  ): Promise<AuditLog> {
    const log = this.auditRepo.create({
      userId,
      action,
      entity,
      entityId,
      metadata,
      ipAddress,
    });
    return this.auditRepo.save(log);
  }

  async getLogs(filters: {
    userId?: string;
    action?: string;
    entity?: string;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
  }): Promise<[AuditLog[], number]> {
    const {
      userId,
      action,
      entity,
      startDate,
      endDate,
      page = 1,
      limit = 20,
    } = filters;

    const query = this.auditRepo
      .createQueryBuilder('audit_log')
      .leftJoinAndSelect('audit_log.user', 'user');

    if (userId) {
      query.andWhere('audit_log.userId = :userId', { userId });
    }
    if (action) {
      query.andWhere('audit_log.action = :action', { action });
    }
    if (entity) {
      query.andWhere('audit_log.entity = :entity', { entity });
    }
    if (startDate) {
      query.andWhere('audit_log.createdAt >= :startDate', { startDate });
    }
    if (endDate) {
      query.andWhere('audit_log.createdAt <= :endDate', { endDate });
    }

    query
      .orderBy('audit_log.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    return query.getManyAndCount();
  }
}
