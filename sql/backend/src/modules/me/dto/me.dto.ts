import { IsBoolean, IsNotEmpty, IsOptional, IsString, IsNumber } from 'class-validator';

export class UpdateSettingsDto {
  @IsOptional()
  @IsString()
  theme?: string;

  @IsOptional()
  @IsNumber()
  font_scale?: number;

  @IsOptional()
  @IsBoolean()
  motion_enabled?: boolean;

  @IsOptional()
  @IsBoolean()
  notify_daily_enabled?: boolean;

  @IsOptional()
  @IsString()
  notify_daily_time?: string;

  @IsOptional()
  @IsBoolean()
  notify_night_enabled?: boolean;

  @IsOptional()
  @IsString()
  notify_night_time?: string;

  @IsOptional()
  @IsString()
  notify_mode?: string;

  @IsOptional()
  @IsString()
  dnd_start?: string;

  @IsOptional()
  @IsString()
  dnd_end?: string;
}

export class ClearDataDto {
  @IsBoolean()
  @IsNotEmpty()
  confirm!: boolean;
}
