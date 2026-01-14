import { ApiProperty } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  openId!: string;

  @ApiProperty({ required: false })
  unionId?: string | null;

  @ApiProperty({ required: false })
  nickname?: string | null;

  @ApiProperty({ required: false })
  avatarUrl?: string | null;

  @ApiProperty({ required: false })
  phone?: string | null;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}
