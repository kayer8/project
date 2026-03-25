import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class AdminHouseListQueryDto extends PaginationDto {
  @ApiPropertyOptional({ description: '搜索房屋名称、楼栋、房号' })
  @IsOptional()
  @IsString()
  keyword?: string;

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

export class CreateAdminHouseArchiveDto {
  @ApiProperty({ description: '预绑定手机号' })
  @IsString()
  mobile!: string;

  @ApiPropertyOptional({ description: '业主姓名' })
  @IsOptional()
  @IsString()
  realName?: string;

  @ApiPropertyOptional({ description: '关系类型', default: 'MAIN_OWNER' })
  @IsOptional()
  @IsString()
  relationType?: string;

  @ApiPropertyOptional({ description: '关系标签' })
  @IsOptional()
  @IsString()
  relationLabel?: string;

  @ApiPropertyOptional({ description: '备注' })
  @IsOptional()
  @IsString()
  remark?: string;
}

export class UpdateAdminHouseArchiveDto extends PartialType(CreateAdminHouseArchiveDto) {}
