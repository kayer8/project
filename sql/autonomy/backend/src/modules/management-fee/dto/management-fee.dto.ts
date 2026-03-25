import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsNumber, IsOptional, IsString, Matches, Min } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class ManagementFeePeriodQueryDto {
  @ApiPropertyOptional({ description: '账期键，格式 YYYY-MM-DD_YYYY-MM-DD' })
  @IsOptional()
  @IsString()
  periodKey?: string;

  @ApiPropertyOptional({ description: '统计月份，格式 YYYY-MM' })
  @IsOptional()
  @IsString()
  periodMonth?: string;

  @ApiPropertyOptional({ description: '楼栋 ID' })
  @IsOptional()
  @IsString()
  buildingId?: string;

  @ApiPropertyOptional({ description: '搜索楼栋、房屋名称或房号' })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional({ description: '缴费状态', enum: ['PAID', 'PARTIAL', 'PENDING', 'OVERDUE'] })
  @IsOptional()
  @IsString()
  @IsIn(['PAID', 'PARTIAL', 'PENDING', 'OVERDUE'])
  paymentStatus?: 'PAID' | 'PARTIAL' | 'PENDING' | 'OVERDUE';
}

export class AdminManagementFeeHouseQueryDto extends PaginationDto {
  @ApiPropertyOptional({ description: '账期键，格式 YYYY-MM-DD_YYYY-MM-DD' })
  @IsOptional()
  @IsString()
  periodKey?: string;

  @ApiPropertyOptional({ description: '统计月份，格式 YYYY-MM' })
  @IsOptional()
  @IsString()
  periodMonth?: string;

  @ApiPropertyOptional({ description: '搜索楼栋、房屋名称或房号' })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional({ description: '楼栋 ID' })
  @IsOptional()
  @IsString()
  buildingId?: string;

  @ApiPropertyOptional({ description: '缴纳状态' })
  @IsOptional()
  @IsString()
  paymentStatus?: string;
}

export class UpdateManagementFeeStatusDto {
  @ApiProperty({ description: '缴纳状态', enum: ['PAID', 'PARTIAL', 'PENDING', 'OVERDUE'] })
  @IsString()
  @IsIn(['PAID', 'PARTIAL', 'PENDING', 'OVERDUE'])
  paymentStatus!: 'PAID' | 'PARTIAL' | 'PENDING' | 'OVERDUE';
}

export class CreateManagementFeePeriodDto {
  @ApiProperty({ description: '管理开始日期，格式 YYYY-MM-DD' })
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'chargeStartDate 必须为 YYYY-MM-DD 格式' })
  chargeStartDate!: string;

  @ApiProperty({ description: '管理结束日期，格式 YYYY-MM-DD' })
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'chargeEndDate 必须为 YYYY-MM-DD 格式' })
  chargeEndDate!: string;

  @ApiProperty({ description: '截止日期，格式 YYYY-MM-DD' })
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'dueDate 必须为 YYYY-MM-DD 格式' })
  dueDate!: string;

  @ApiProperty({ description: '每平方米收费单价' })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  unitPrice!: number;

  @ApiPropertyOptional({ description: '固定费用', default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  baseAmount?: number;

  @ApiPropertyOptional({ description: '缺失面积时的默认面积', default: 88 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  defaultArea?: number;

  @ApiPropertyOptional({ description: '备注' })
  @IsOptional()
  @IsString()
  note?: string;
}
