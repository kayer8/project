import { IsDateString, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class CompleteTaskDto {
  @IsString()
  @IsNotEmpty()
  daily_task_id!: string;

  @IsDateString()
  completed_at!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  duration_sec?: number;
}

export class SkipTaskDto {
  @IsString()
  @IsNotEmpty()
  daily_task_id!: string;

  @IsOptional()
  @IsString()
  reason?: string;
}
