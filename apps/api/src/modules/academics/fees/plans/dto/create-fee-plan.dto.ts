import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

import {
  FeeFrequency,
  LateFeeType,
} from '../../../../../generated/prisma/enums';

export class CreateFeePlanDto {
  @IsUUID()
  classId!: string;

  @IsOptional()
  @IsUUID()
  sectionId?: string;

  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  @Min(0)
  amount!: number;

  @IsEnum(FeeFrequency)
  frequency!: FeeFrequency;

  @IsOptional()
  @IsNumber()
  @Min(1)
  customDays?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  dueDay?: number;

  @IsEnum(LateFeeType)
  lateFeeType!: LateFeeType;

  @IsOptional()
  @IsNumber()
  @Min(0)
  lateFeeAmount?: number;

  @IsOptional()
  @IsBoolean()
  discountAllowed?: boolean;

  @IsDateString()
  startDate!: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}