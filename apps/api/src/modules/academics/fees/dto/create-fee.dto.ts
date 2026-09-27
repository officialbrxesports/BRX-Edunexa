import {
  IsDateString,
  IsNumber,
  IsUUID,
  Min,
} from 'class-validator';

export class CreateFeeDto {
  @IsUUID()
  studentId: string;

  @IsUUID()
  classId: string;

  @IsUUID()
  sectionId: string;

  @IsNumber()
  @Min(0)
  totalAmount: number;

  @IsDateString()
  dueDate: string;
}