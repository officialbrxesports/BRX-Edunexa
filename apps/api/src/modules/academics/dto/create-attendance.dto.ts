import {
  IsDateString,
  IsIn,
  IsUUID,
} from 'class-validator';

export class CreateAttendanceDto {
  @IsUUID()
  studentId!: string;

  @IsUUID()
  classId!: string;

  @IsUUID()
  sectionId!: string;

  @IsDateString()
  date!: string;

  @IsIn(['PRESENT', 'ABSENT', 'LATE'])
  status!: 'PRESENT' | 'ABSENT' | 'LATE';
}
