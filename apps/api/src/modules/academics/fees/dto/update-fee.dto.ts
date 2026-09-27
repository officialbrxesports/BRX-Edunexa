import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  Min,
} from 'class-validator';

import { FeeStatus } from '../../../../generated/prisma/enums';

export class UpdateFeeDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  totalAmount?: number;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsEnum(FeeStatus)
  status?: FeeStatus;
}