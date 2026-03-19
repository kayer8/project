import { IsString, MinLength } from 'class-validator';

export class WechatPhoneSyncDto {
  @IsString()
  @MinLength(1)
  code!: string;

  @IsString()
  @MinLength(1)
  phoneCode!: string;
}
