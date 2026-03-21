import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';

const AUDIT_RESOURCE_TYPES = [
  'DISCLOSURE_CONTENT',
  'MANAGEMENT_FEE_PERIOD',
  'MANAGEMENT_FEE_RECORD',
  'BUILDING',
  'HOUSE',
  'MEMBER',
  'USER',
  'VOTE',
] as const;
const AUDIT_ACTIONS = ['CREATE', 'UPDATE', 'PUBLISH', 'DELETE', 'STATUS_UPDATE'] as const;

export class AdminAuditLogListQueryDto extends PaginationDto {
  @ApiPropertyOptional({ description: '搜索资源名称、资源 ID 或操作人' })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional({ description: '资源类型' })
  @IsOptional()
  @IsString()
  @IsIn(AUDIT_RESOURCE_TYPES)
  resourceType?: string;

  @ApiPropertyOptional({ description: '操作类型' })
  @IsOptional()
  @IsString()
  @IsIn(AUDIT_ACTIONS)
  action?: string;
}
