import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsBoolean, IsDateString, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class AdminMemberListQueryDto extends PaginationDto {
  @ApiPropertyOptional({ description: '搜索姓名、昵称、手机号、房屋' })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional({ description: '成员关系状态' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: '成员关系类型' })
  @IsOptional()
  @IsString()
  relationType?: string;

  @ApiPropertyOptional({ description: '房屋 ID' })
  @IsOptional()
  @IsString()
  houseId?: string;

  @ApiPropertyOptional({ description: '社区 ID' })
  @IsOptional()
  @IsString()
  communityId?: string;
}

export class CreateAdminMemberDto {
  @ApiProperty({ description: '用户 ID' })
  @IsString()
  userId!: string;

  @ApiProperty({ description: '房屋 ID' })
  @IsString()
  houseId!: string;

  @ApiProperty({ description: '住户组 ID' })
  @IsString()
  householdGroupId!: string;

  @ApiProperty({ description: '成员关系类型' })
  @IsString()
  relationType!: string;

  @ApiPropertyOptional({ description: '关系标签' })
  @IsOptional()
  @IsString()
  relationLabel?: string;

  @ApiPropertyOptional({ description: '是否主角色', default: false })
  @Type(() => Boolean)
  @IsOptional()
  @IsBoolean()
  isPrimaryRole?: boolean;

  @ApiPropertyOptional({ description: '是否可查看账单', default: false })
  @Type(() => Boolean)
  @IsOptional()
  @IsBoolean()
  canViewBill?: boolean;

  @ApiPropertyOptional({ description: '是否可缴费', default: false })
  @Type(() => Boolean)
  @IsOptional()
  @IsBoolean()
  canPayBill?: boolean;

  @ApiPropertyOptional({ description: '是否可代办', default: false })
  @Type(() => Boolean)
  @IsOptional()
  @IsBoolean()
  canActAsAgent?: boolean;

  @ApiPropertyOptional({ description: '是否可参与意见征集', default: false })
  @Type(() => Boolean)
  @IsOptional()
  @IsBoolean()
  canJoinConsultation?: boolean;

  @ApiPropertyOptional({ description: '是否可成为投票代表', default: false })
  @Type(() => Boolean)
  @IsOptional()
  @IsBoolean()
  canBeVoteDelegate?: boolean;

  @ApiPropertyOptional({ description: '状态', default: 'ACTIVE' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: '生效时间' })
  @IsOptional()
  @IsDateString()
  effectiveAt?: string;

  @ApiPropertyOptional({ description: '失效时间' })
  @IsOptional()
  @IsDateString()
  expiredAt?: string;
}

export class UpdateAdminMemberDto extends PartialType(CreateAdminMemberDto) {}
