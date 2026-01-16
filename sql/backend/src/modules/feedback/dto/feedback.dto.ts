import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateFeedbackDto {
  @IsString()
  @IsIn(['bug', 'suggestion', 'other'])
  type!: string;

  @IsString()
  @IsNotEmpty()
  content!: string;

  @IsOptional()
  @IsString()
  contact?: string;
}
