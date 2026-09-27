import { IsUUID } from 'class-validator';

export class AssignStudentDto {
  @IsUUID()
  studentId!: string;
}