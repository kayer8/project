import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class AdminHouseListQueryDto extends PaginationDto {
  @ApiPropertyOptional({ description: '搜索房屋名称、楼栋、房号' })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional({ description: '社区 ID' })
  @IsOptional()
  @IsString()
  communityId?: string;

  @ApiPropertyOptional({ description: '楼栋 ID' })
  @IsOptional()
  @IsString()
  buildingId?: string;

  @ApiPropertyOptional({ description: '房屋状态' })
  @IsOptional()
  @IsString()
  houseStatus?: string;
}

export class CreateAdminHouseDto {
  @ApiProperty({ description: '社区 ID' })
  @IsString()
  communityId!: string;

  @ApiProperty({ description: '楼栋 ID' })
  @IsString()
  buildingId!: string;

  @ApiPropertyOptional({ description: '单元号' })
  @IsOptional()
  @IsString()
  unitNo?: string;

  @ApiPropertyOptional({ description: '楼层号' })
  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  floorNo?: number;

  @ApiProperty({ description: '房号' })
  @IsString()
  roomNo!: string;

  @ApiProperty({ description: '展示名称' })
  @IsString()
  displayName!: string;

  @ApiPropertyOptional({ description: '房屋状态', default: 'SELF_OCCUPIED' })
  @IsOptional()
  @IsString()
  houseStatus?: string;

  @ApiPropertyOptional({ description: '建筑面积' })
  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  grossArea?: number;
}

export class UpdateAdminHouseDto extends PartialType(CreateAdminHouseDto) {}
