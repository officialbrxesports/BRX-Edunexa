export class CreateAttendanceDto {
  studentId!: string;
  classId!: string;
  sectionId!: string;
  date!: string;
  status!: 'PRESENT' | 'ABSENT' | 'LATE';
}