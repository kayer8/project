import { ApiProperty } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  openid!: string;

  @ApiProperty({ required: false })
  unionid?: string | null;

  @ApiProperty({ required: false })
  nickname?: string | null;

  @ApiProperty({ required: false })
  avatar_url?: string | null;

  @ApiProperty({ required: false })
  timezone?: string | null;

  @ApiProperty()
  created_at!: Date;

  @ApiProperty()
  updated_at!: Date;
}
