import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class ManagementFeePeriodQueryDto {
  @ApiPropertyOptional({ description: '统计月份，格式 YYYY-MM' })
  @IsOptional()
  @IsString()
  periodMonth?: string;
}

export class AdminManagementFeeHouseQueryDto extends PaginationDto {
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
