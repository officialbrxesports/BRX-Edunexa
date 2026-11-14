import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  currentPassword!: string;

  @IsString()
  @MinLength(8, { message: 'New password must be at least 8 characters.' })
  @MaxLength(128)
  @Matches(/[A-Za-z]/, { message: 'New password must contain a letter.' })
  @Matches(/\d/, { message: 'New password must contain a number.' })
  newPassword!: string;
}
