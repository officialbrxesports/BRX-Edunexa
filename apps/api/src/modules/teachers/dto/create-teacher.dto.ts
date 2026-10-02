import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Trim, TrimLower } from '../../../common/dto/trim.decorator';

export class CreateTeacherDto {
  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  firstName!: string;

  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(80)
  lastName?: string;

  @TrimLower()
  @IsEmail()
  @MaxLength(120)
  email!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(100)
  password!: string;

  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(20)
  phone?: string;
}
