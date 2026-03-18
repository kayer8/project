import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNumber } from 'class-validator';

export class LocationReportDto {
  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  session_id: number;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  lat: number;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  lng: number;

  @ApiProperty({ description: 'Accuracy in meters' })
  @Type(() => Number)
  @IsInt()
  accuracy: number;
}
