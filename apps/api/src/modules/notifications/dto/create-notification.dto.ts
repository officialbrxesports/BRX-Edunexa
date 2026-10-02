import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { NotificationType } from '../../../generated/prisma/enums';

export class CreateNotificationDto {
  @IsUUID()
  recipientId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  title: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  message: string;

  @IsOptional()
  @IsEnum(NotificationType)
  type?: NotificationType;
}
