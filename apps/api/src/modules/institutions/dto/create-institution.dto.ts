import { InstitutionType } from '../../../generated/prisma/enums';

export class CreateInstitutionDto {
  name!: string;
  code!: string;
  type!: InstitutionType;

  country!: string;
  state!: string;
  city?: string;
  address?: string;

  email?: string;
  phone?: string;
  website?: string;
}