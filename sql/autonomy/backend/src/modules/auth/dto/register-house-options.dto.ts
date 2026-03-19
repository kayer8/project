import { IsOptional, IsString, MinLength } from 'class-validator';

export class RegisterHouseOptionsQueryDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  buildingId?: string;
}
