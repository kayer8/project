import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class AdminOwnerReviewListQueryDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Keyword search for name, mobile, house, or building' })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional({ description: 'Building ID' })
  @IsOptional()
  @IsString()
  buildingId?: string;

  @ApiPropertyOptional({ description: 'Review status filter' })
  @IsOptional()
  @IsString()
  status?: string;
}

export class ReviewOwnerRequestDto {
  @ApiProperty({ enum: ['REVIEWED', 'REJECTED'] })
  @IsString()
  @IsIn(['REVIEWED', 'REJECTED'])
  status!: 'REVIEWED' | 'REJECTED';

  @ApiPropertyOptional({ description: 'Review note' })
  @IsOptional()
  @IsString()
  reviewNote?: string;
}
