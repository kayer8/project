import { IsOptional, IsString, MinLength } from 'class-validator';

export class SubmitRegistrationRequestDto {
  @IsString()
  @MinLength(1)
  buildingId!: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  houseId?: string;
}
