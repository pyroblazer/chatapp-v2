import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsEnum } from 'class-validator';

export enum ReportStatus {
  PENDING = 'pending',
  REVIEWED = 'reviewed',
  RESOLVED = 'resolved',
  DISMISSED = 'dismissed',
}

export class UpdateReportStatusDto {
  @ApiProperty({
    description: 'New report status',
    enum: ReportStatus,
    example: ReportStatus.RESOLVED,
  })
  @IsNotEmpty()
  @IsEnum(ReportStatus)
  status: ReportStatus;
}
