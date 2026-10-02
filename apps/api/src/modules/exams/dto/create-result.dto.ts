import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { ResultStatus } from '../../../generated/prisma/enums';

export class CreateResultDto {
  @IsUUID()
  examId!: string;

  @IsUUID()
  studentId!: string;

  @IsNumber()
  @Min(0)
  marks!: number;

  @IsNumber()
  @Min(0.01)
  maxMarks!: number;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  grade?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  remarks?: string;

  @IsOptional()
  @IsEnum(ResultStatus)
  status?: ResultStatus;
}