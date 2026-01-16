import { IsDateString, IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateNoteDto {
  @IsString()
  @IsIn(['daily_task', 'night_session'])
  related_type!: string;

  @IsString()
  @IsNotEmpty()
  related_id!: string;

  @IsDateString()
  date!: string;

  @IsOptional()
  @IsString()
  mood?: string;

  @IsString()
  @IsNotEmpty()
  content!: string;
}

export class UpdateNoteDto {
  @IsString()
  @IsNotEmpty()
  content!: string;

  @IsOptional()
  @IsString()
  mood?: string;
}
