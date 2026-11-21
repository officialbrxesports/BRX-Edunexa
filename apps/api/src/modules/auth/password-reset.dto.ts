import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class ForgotPasswordDto {
  @IsString()
  @MinLength(1)
  @MaxLength(254)
  identifier!: string;
}

export class ResetPasswordDto {
  @IsString()
  @MinLength(1)
  @MaxLength(254)
  identifier!: string;

  @IsString()
  @Matches(/^\d{6}$/, { message: 'The code is 6 digits.' })
  code!: string;

  @IsString()
  @MinLength(8, { message: 'New password must be at least 8 characters.' })
  @MaxLength(128)
  @Matches(/[A-Za-z]/, { message: 'New password must contain a letter.' })
  @Matches(/\d/, { message: 'New password must contain a number.' })
  newPassword!: string;
}
