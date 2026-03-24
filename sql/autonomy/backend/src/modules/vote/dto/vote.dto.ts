import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import {
  VOTE_RESULTS,
  VOTE_SCOPE_TYPES,
  VOTE_STATUSES,
  VOTE_TYPES,
} from '../vote.constants';

export class AdminVoteListQueryDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Search title, sponsor, scope, or description' })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional({ description: 'Vote type' })
  @IsOptional()
  @IsString()
  @IsIn(VOTE_TYPES)
  type?: string;

  @ApiPropertyOptional({ description: 'Vote status' })
  @IsOptional()
  @IsString()
  @IsIn(VOTE_STATUSES)
  status?: string;

  @ApiPropertyOptional({ description: 'Vote result' })
  @IsOptional()
  @IsString()
  @IsIn(VOTE_RESULTS)
  result?: string;
}

export class VoteScopeSummaryQueryDto {
  @ApiProperty({ description: 'Vote type' })
  @IsString()
  @IsNotEmpty()
  @IsIn(VOTE_TYPES)
  type!: string;

  @ApiPropertyOptional({ description: 'Scope type', default: 'ALL' })
  @IsOptional()
  @IsString()
  @IsIn(VOTE_SCOPE_TYPES)
  scopeType?: string;

  @ApiPropertyOptional({ description: 'Single building id' })
  @IsOptional()
  @IsString()
  scopeBuildingId?: string;

  @ApiPropertyOptional({ description: 'Building ids joined by comma' })
  @IsOptional()
  @IsString()
  scopeBuildingIds?: string;
}

export class VoteOptionInputDto {
  @ApiProperty({ description: 'Option text' })
  @IsString()
  @IsNotEmpty()
  optionText!: string;
}

export class CreateAdminVoteDto {
  @ApiProperty({ description: 'Vote title' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({ description: 'Vote type' })
  @IsString()
  @IsNotEmpty()
  @IsIn(VOTE_TYPES)
  type!: string;

  @ApiProperty({ description: 'Sponsor' })
  @IsString()
  @IsNotEmpty()
  sponsor!: string;

  @ApiPropertyOptional({ description: 'Scope type', default: 'ALL' })
  @IsOptional()
  @IsString()
  @IsIn(VOTE_SCOPE_TYPES)
  scopeType?: string;

  @ApiPropertyOptional({ description: 'Single building id' })
  @IsOptional()
  @IsString()
  scopeBuildingId?: string;

  @ApiPropertyOptional({ description: 'Building id list' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  scopeBuildingIds?: string[];

  @ApiProperty({ description: 'Vote options', type: [VoteOptionInputDto] })
  @Type(() => VoteOptionInputDto)
  @ValidateNested({ each: true })
  @ArrayMinSize(2)
  options!: VoteOptionInputDto[];

  @ApiPropertyOptional({ description: 'Description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Deadline date' })
  @IsOptional()
  @IsDateString()
  deadline?: string;

  @ApiPropertyOptional({ description: 'Participant count', default: 0 })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(0)
  participantCount?: number;

  @ApiPropertyOptional({ description: 'Pass rate', default: 0 })
  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  passRate?: number;

  @ApiPropertyOptional({ description: 'Result', default: 'PENDING' })
  @IsOptional()
  @IsString()
  @IsIn(VOTE_RESULTS)
  result?: string;
}

export class UpdateAdminVoteDto extends PartialType(CreateAdminVoteDto) {}

export class UserVoteListQueryDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Vote type' })
  @IsOptional()
  @IsString()
  @IsIn(VOTE_TYPES)
  type?: string;

  @ApiPropertyOptional({ description: 'Vote status' })
  @IsOptional()
  @IsString()
  @IsIn(VOTE_STATUSES)
  status?: string;
}

export class CreateUserVoteDto {
  @ApiProperty({ description: 'Vote title' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({ description: 'Vote type' })
  @IsString()
  @IsNotEmpty()
  @IsIn(VOTE_TYPES)
  type!: string;

  @ApiProperty({ description: 'Vote options', type: [VoteOptionInputDto] })
  @Type(() => VoteOptionInputDto)
  @ValidateNested({ each: true })
  @ArrayMinSize(2)
  options!: VoteOptionInputDto[];

  @ApiPropertyOptional({ description: 'Description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Deadline date' })
  @IsOptional()
  @IsDateString()
  deadline?: string;
}

export class SubmitUserVoteDto {
  @ApiProperty({ description: 'Selected vote option id' })
  @IsString()
  @IsNotEmpty()
  optionId!: string;
}
