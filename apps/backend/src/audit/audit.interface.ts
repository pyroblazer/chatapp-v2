import { AuditLog } from './audit-log.entity';

export interface IAuditService {
  logAction(
    userId: string,
    action: string,
    entity: string,
    entityId?: string,
    metadata?: Record<string, any>,
    ipAddress?: string,
  ): Promise<AuditLog>;
  getLogs(filters: {
    userId?: string;
    action?: string;
    entity?: string;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
  }): Promise<[AuditLog[], number]>;
}
