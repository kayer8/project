import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { BoothCategory } from '@prisma/client';

export class BoothListQueryDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  keyword?: string;

  @ApiPropertyOptional({ enum: BoothCategory })
  @IsEnum(BoothCategory)
  @IsOptional()
  category?: BoothCategory;

  @ApiPropertyOptional({ description: 'Distance filter in km' })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  distance?: number;

  @ApiPropertyOptional({ description: 'User latitude for distance calc' })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  lat?: number;

  @ApiPropertyOptional({ description: 'User longitude for distance calc' })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  lng?: number;
}
