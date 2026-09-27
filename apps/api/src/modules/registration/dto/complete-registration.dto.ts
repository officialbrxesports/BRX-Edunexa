import {
  IsUUID,
} from 'class-validator';

export class CompleteRegistrationDto {
  @IsUUID()
  sessionId!: string;
}