import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MinLength,
} from 'class-validator';

import { InstitutionType } from '../../../generated/prisma/enums';

export class GoogleOnboardingDto {
  // ================================
  // Google identity
  // ================================

  @IsString()
  @IsNotEmpty()
  credential!: string;

  // ================================
  // Institution
  // ================================

  @IsEnum(InstitutionType)
  institutionType!: InstitutionType;

  @IsString()
  @MinLength(2)
  institutionName!: string;

  @IsString()
  @MinLength(10)
  institutionPhone!: string;

  @IsEmail()
  institutionEmail!: string;

  @IsString()
  @MinLength(2)
  country!: string;

  @IsString()
  @MinLength(2)
  state!: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsUrl()
  website?: string;

  // ================================
  // HEAD
  // ================================

  @IsString()
  @MinLength(2)
  firstName!: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsString()
  @MinLength(10)
  ownerPhone!: string;
}