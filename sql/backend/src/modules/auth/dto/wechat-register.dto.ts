import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class WechatRegisterDto {
  @IsString()
  @IsNotEmpty()
  code!: string;

  @IsString()
  @IsOptional()
  nickname?: string;

  @IsString()
  @IsOptional()
  avatarUrl?: string;
}
