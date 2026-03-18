import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class AdminUserListQueryDto extends PaginationDto {
  @ApiPropertyOptional({ description: '搜索姓名、昵称、手机号、OpenID' })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional({ description: '账号状态' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: '社区 ID' })
  @IsOptional()
  @IsString()
  communityId?: string;
}

export class CreateAdminUserDto {
  @ApiProperty({ description: '微信 OpenID' })
  @IsString()
  wechatOpenid!: string;

  @ApiPropertyOptional({ description: '微信 UnionID' })
  @IsOptional()
  @IsString()
  wechatUnionid?: string;

  @ApiPropertyOptional({ description: '昵称' })
  @IsOptional()
  @IsString()
  nickname?: string;

  @ApiPropertyOptional({ description: '真实姓名' })
  @IsOptional()
  @IsString()
  realName?: string;

  @ApiPropertyOptional({ description: '手机号' })
  @IsOptional()
  @IsString()
  mobile?: string;

  @ApiPropertyOptional({ description: '头像 URL' })
  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @ApiPropertyOptional({ description: '账号状态', default: 'ACTIVE' })
  @IsOptional()
  @IsString()
  status?: string;
}

export class UpdateAdminUserDto extends PartialType(CreateAdminUserDto) {}
