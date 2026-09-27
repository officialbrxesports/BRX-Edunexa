import {
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  Min,
  MinLength,
} from 'class-validator';

import { InstitutionType } from '../../../generated/prisma/enums';

export class CreateRegistrationDto {
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
  phone!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(2)
  country!: string;

  @IsString()
  @MinLength(2)
  state!: string;

  @IsString()
  @IsOptional()
  city?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsUrl()
  @IsOptional()
  website?: string;

  // ================================
  // Owner / HEAD
  // ================================

  @IsString()
  @MinLength(2)
  firstName!: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsString()
  @MinLength(10)
  ownerPhone!: string;

  @IsEmail()
  ownerEmail!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  // ================================
  // Optional setup
  // ================================

  @IsInt()
  @Min(2000)
  @Max(2100)
  @IsOptional()
  establishedYear?: number;

  @IsString()
  @IsOptional()
  registrationNumber?: string;

  @IsString()
  @IsOptional()
  gstin?: string;
}