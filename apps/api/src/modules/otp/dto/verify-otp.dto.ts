import {
  IsEnum,
  IsString,
  IsUUID,
  Length,
} from 'class-validator';

import {
  RegistrationVerificationType,
} from '../../../generated/prisma/enums';

export class VerifyOtpDto {
  @IsUUID()
  sessionId!: string;

  @IsEnum(RegistrationVerificationType)
  type!: RegistrationVerificationType;

  @IsString()
  @Length(6, 6)
  otp!: string;
}