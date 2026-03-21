import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsDateString, IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import {
  DISCLOSURE_CONTENT_CATEGORIES,
  DISCLOSURE_CONTENT_STATUSES,
} from '../disclosure.constants';

export class AdminDisclosureContentListQueryDto extends PaginationDto {
  @ApiPropertyOptional({ description: '搜索标题、摘要或分类' })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional({ description: '内容分类' })
  @IsOptional()
  @IsString()
  @IsIn(DISCLOSURE_CONTENT_CATEGORIES)
  category?: string;

  @ApiPropertyOptional({ description: '内容状态' })
  @IsOptional()
  @IsString()
  @IsIn(DISCLOSURE_CONTENT_STATUSES)
  status?: string;
}

export class CreateAdminDisclosureContentDto {
  @ApiProperty({ description: '标题' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({ description: '分类' })
  @IsString()
  @IsNotEmpty()
  @IsIn(DISCLOSURE_CONTENT_CATEGORIES)
  category!: string;

  @ApiProperty({ description: '发布单位' })
  @IsString()
  @IsNotEmpty()
  publisher!: string;

  @ApiPropertyOptional({ description: '摘要' })
  @IsOptional()
  @IsString()
  summary?: string;

  @ApiProperty({ description: '正文内容' })
  @IsString()
  @IsNotEmpty()
  content!: string;

  @ApiPropertyOptional({ description: '发布开始时间' })
  @IsOptional()
  @IsDateString()
  publishStartAt?: string;

  @ApiPropertyOptional({ description: '发布结束时间' })
  @IsOptional()
  @IsDateString()
  publishEndAt?: string;
}

export class UpdateAdminDisclosureContentDto extends PartialType(CreateAdminDisclosureContentDto) {}
