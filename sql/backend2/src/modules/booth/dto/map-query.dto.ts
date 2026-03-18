import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsNumber, IsOptional } from 'class-validator';
import { BoothCategory } from '@prisma/client';

export class BoothMapQueryDto {
  @ApiPropertyOptional({ description: 'Current latitude' })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  lat?: number;

  @ApiPropertyOptional({ description: 'Current longitude' })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  lng?: number;

  @ApiPropertyOptional({ enum: BoothCategory })
  @IsEnum(BoothCategory)
  @IsOptional()
  category?: BoothCategory;

  @ApiPropertyOptional({ description: 'Only show operating booths', default: false })
  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  only_operating?: boolean = false;
}
