import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateBookDto {
  @ApiProperty({ description: 'Book title' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title!: string;

  @ApiProperty({ description: 'Author name' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  author!: string;

  @ApiPropertyOptional({ description: 'Book description' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({ description: 'ISBN' })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  isbn?: string;

  @ApiPropertyOptional({ description: 'Publish date (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  publishedAt?: string;
}
