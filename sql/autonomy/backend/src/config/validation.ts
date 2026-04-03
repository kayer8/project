import { plainToInstance } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  Min,
  validateSync,
} from 'class-validator';

class EnvironmentVariables {
  @IsOptional()
  @IsString()
  NODE_ENV?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  PORT?: number;
}

export function validateEnv(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: true,
  });

  if (errors.length > 0) {
    throw new Error(errors.map((error) => error.toString()).join('\n'));
  }

  return validatedConfig;
}
