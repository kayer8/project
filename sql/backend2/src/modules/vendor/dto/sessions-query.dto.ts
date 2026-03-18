import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class SessionsQueryDto {
  @ApiPropertyOptional({
    description: 'Date range in format YYYY-MM-DD,YYYY-MM-DD',
  })
  @IsString()
  @IsOptional()
  date_range?: string;
}
