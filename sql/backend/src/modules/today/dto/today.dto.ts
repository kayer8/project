import { IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator';

export class TodayQueryDto {
  @IsOptional()
  @IsString()
  date?: string;
}

export class RefreshTodayDto {
  @IsString()
  @IsNotEmpty()
  date!: string;

  @IsOptional()
  @IsString()
  mood?: string;

  @IsInt()
  @Min(1)
  @Max(3)
  replace_position!: number;

  @IsOptional()
  @IsString()
  reason?: string;
}
