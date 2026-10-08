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
  // ============================================================
  // Institution
  // ============================================================

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

  // ============================================================
  // Institution Location
  // ============================================================

  @IsString()
  @MinLength(2)
  country!: string;

  @IsString()
  @MinLength(2)
  state!: string;

  @IsOptional()
  @IsString()
  district?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  pinCode?: string;

  @IsOptional()
  @IsString()
  postOffice?: string;

  @IsOptional()
  @IsString()
  policeStation?: string;

  @IsOptional()
  @IsString()
  area?: string;

  @IsOptional()
  @IsString()
  street?: string;

  @IsOptional()
  @IsString()
  building?: string;

  @IsOptional()
  @IsString()
  landmark?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsUrl()
  website?: string;

  // ============================================================
  // Primary Authority / HEAD
  // ============================================================

  @IsString()
  @MinLength(2)
  designation!: string;

  @IsString()
  @MinLength(2)
  firstName!: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsEmail()
  ownerEmail!: string;

  @IsString()
  @MinLength(10)
  ownerPhone!: string;

  // ============================================================
  // Optional Institution Details
  // ============================================================

  @IsOptional()
  @IsInt()
  @Min(2000)
  @Max(2100)
  establishedYear?: number;

  @IsOptional()
  @IsString()
  registrationNumber?: string;

  @IsOptional()
  @IsString()
  gstin?: string;
}