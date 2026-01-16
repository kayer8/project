import { IsArray, IsDateString, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class NightStartDto {
  @IsDateString()
  date!: string;

  @IsString()
  @IsNotEmpty()
  program_id!: string;
}

export class NightAnswerDto {
  @IsString()
  @IsNotEmpty()
  qid!: string;

  @IsString()
  @IsNotEmpty()
  answer!: string;
}

export class NightFinishDto {
  @IsString()
  @IsNotEmpty()
  night_session_id!: string;

  @IsArray()
  @IsOptional()
  @Type(() => NightAnswerDto)
  answers?: NightAnswerDto[];

  @IsDateString()
  finished_at!: string;
}
