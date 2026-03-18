import { IsOptional, IsString, MinLength } from 'class-validator';

export class WechatRegisterDto {
  @IsString()
  @MinLength(1)
  code!: string;

  @IsString()
  @MinLength(1)
  nickname!: string;

  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @IsOptional()
  @IsString()
  mobile?: string;
}
