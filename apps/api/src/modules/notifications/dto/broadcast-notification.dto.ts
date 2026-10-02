import { IsArray, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { NotificationType, UserRole } from '../../../generated/prisma/enums';

export class BroadcastNotificationDto {
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  recipientIds?: string[];

  @IsOptional()
  @IsEnum(UserRole)
  recipientRole?: UserRole;

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
