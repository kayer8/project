import { IsString, Matches, MinLength } from 'class-validator';

export class WechatManualBindDto {
  @IsString()
  @MinLength(1)
  code!: string;

  @IsString()
  @Matches(/^1\d{10}$/, {
    message: 'Mobile number must be an 11-digit mainland China mobile number',
  })
  mobile!: string;
}
