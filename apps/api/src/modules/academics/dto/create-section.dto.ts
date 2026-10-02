import {
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateSectionDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(100)
  name!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(50)
  code!: string;
}
