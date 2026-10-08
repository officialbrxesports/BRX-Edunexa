import {
  IsString,
  IsUUID,
  Matches,
  MinLength,
} from 'class-validator';

export class CreateRegistrationPasswordDto {
  @IsUUID()
  sessionId!: string;

  @IsString()
  @MinLength(8)
  @Matches(/[A-Z]/, {
    message:
      'Password must contain at least one uppercase letter',
  })
  @Matches(/[a-z]/, {
    message:
      'Password must contain at least one lowercase letter',
  })
  @Matches(/[0-9]/, {
    message:
      'Password must contain at least one number',
  })
  password!: string;

  @IsString()
  @MinLength(8)
  confirmPassword!: string;
}