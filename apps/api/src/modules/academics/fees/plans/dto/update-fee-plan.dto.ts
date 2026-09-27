import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

import {
  FeeFrequency,
  LateFeeType,
} from '../../../../../generated/prisma/enums';

export class UpdateFeePlanDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  @Min(0.01)
  amount?: number;

  @IsOptional()
  @IsEnum(FeeFrequency)
  frequency?: FeeFrequency;

  @IsOptional()
  @IsInt()
  @Min(1)
  customDays?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(31)
  dueDay?: number;

  @IsOptional()
  @IsEnum(LateFeeType)
  lateFeeType?: LateFeeType;

  @IsOptional()
  @IsNumber()
  @Min(0)
  lateFeeAmount?: number;

  @IsOptional()
  @IsBoolean()
  discountAllowed?: boolean;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}