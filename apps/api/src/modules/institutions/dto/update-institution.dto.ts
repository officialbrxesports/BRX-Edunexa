import {
  InstitutionStatus,
  InstitutionType,
} from '../../../generated/prisma/enums';

export class UpdateInstitutionDto {
  name?: string;
  code?: string;
  type?: InstitutionType;
  status?: InstitutionStatus;

  country?: string;
  state?: string;
  city?: string;
  address?: string;

  email?: string;
  phone?: string;
  website?: string;
}