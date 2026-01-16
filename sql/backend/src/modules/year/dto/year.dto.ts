import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class YearQueryDto {
  @IsInt()
  year!: number;
}

export class DirectionDetailQueryDto extends YearQueryDto {
  @IsString()
  @IsNotEmpty()
  direction_id!: string;
}

export class MonthRecordsQueryDto extends YearQueryDto {
  @IsInt()
  @Min(1)
  month!: number;
}

export class RecordDetailQueryDto {
  @IsString()
  @IsIn(['daily_task', 'night_session'])
  type!: string;

  @IsString()
  @IsNotEmpty()
  id!: string;
}

export class CreatePlanDto {
  @IsInt()
  year!: number;

  @IsString()
  @IsNotEmpty()
  theme_id!: string;
}

export class DirectionItemDto {
  @IsString()
  @IsNotEmpty()
  direction_id!: string;

  @IsBoolean()
  is_enabled!: boolean;

  @IsInt()
  sort_order!: number;
}

export class UpdateDirectionsDto {
  @IsString()
  @IsNotEmpty()
  plan_id!: string;

  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => DirectionItemDto)
  directions!: DirectionItemDto[];
}

export class ReviewGenerateDto {
  @IsInt()
  year!: number;
}

export class ReviewPosterDto {
  @IsString()
  @IsNotEmpty()
  review_id!: string;

  @IsString()
  @IsNotEmpty()
  template!: string;
}
