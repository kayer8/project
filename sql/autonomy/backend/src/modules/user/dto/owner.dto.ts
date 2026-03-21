import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class AdminOwnerListQueryDto extends PaginationDto {
  @ApiPropertyOptional({ description: '搜索姓名、昵称、手机号、房号' })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional({ description: '楼栋 ID' })
  @IsOptional()
  @IsString()
  buildingId?: string;

  @ApiPropertyOptional({ description: '认证状态' })
  @IsOptional()
  @IsString()
  authStatus?: string;

  @ApiPropertyOptional({ description: '投票资格' })
  @IsOptional()
  @IsString()
  voteQualification?: string;
}
