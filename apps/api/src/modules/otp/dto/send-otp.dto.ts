import {
  IsEnum,
  IsUUID,
} from 'class-validator';

import {
  RegistrationVerificationType,
} from '../../../generated/prisma/enums';

export class SendOtpDto {
  @IsUUID()
  sessionId!: string;

  @IsEnum(RegistrationVerificationType)
  type!: RegistrationVerificationType;
}