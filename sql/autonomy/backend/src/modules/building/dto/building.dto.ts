import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class AdminBuildingListQueryDto extends PaginationDto {
  @ApiPropertyOptional({ description: '搜索楼栋名称或编码' })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional({ description: '楼栋状态' })
  @IsOptional()
  @IsString()
  status?: string;
}

export class CreateAdminBuildingDto {
  @ApiProperty({ description: '楼栋编码' })
  @IsString()
  buildingCode!: string;

  @ApiProperty({ description: '楼栋名称' })
  @IsString()
  buildingName!: string;

  @ApiPropertyOptional({ description: '排序号' })
  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  sortNo?: number;

  @ApiPropertyOptional({ description: '楼栋状态', default: 'ACTIVE' })
  @IsOptional()
  @IsString()
  status?: string;
}

export class UpdateAdminBuildingDto extends PartialType(CreateAdminBuildingDto) {}
