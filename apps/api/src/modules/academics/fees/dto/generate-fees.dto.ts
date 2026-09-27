import {
  IsDateString,
  IsOptional,
  IsUUID,
} from 'class-validator';

export class GenerateFeesDto {
  @IsUUID()
  feePlanId!: string;

  @IsDateString()
  dueDate!: string;

  @IsOptional()
  @IsUUID()
  sectionId?: string;

  @IsOptional()
  @IsUUID('4', { each: true })
  studentIds?: string[];
}