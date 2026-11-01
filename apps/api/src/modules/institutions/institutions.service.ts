import {
BadRequestException,
Injectable,
InternalServerErrorException,
} from "@nestjs/common";

import { randomUUID } from "node:crypto";
import * as argon2 from "argon2";

import { PrismaService } from "../../prisma/prisma.service";
import { RegisterInstitutionDto } from "./register-institution.dto";

@Injectable()
export class InstitutionsService {
constructor(private readonly prisma: PrismaService) {}

async register(dto: RegisterInstitutionDto) {
const email = dto.email.trim().toLowerCase();
const institutionName = dto.institutionName.trim();
const fullName = dto.fullName.trim();
const phone = dto.phone.trim();
const address = dto.address.trim();

if (
  !institutionName ||
  !fullName ||
  !email ||
  !dto.password ||
  !phone ||
  !address
) {
  throw new BadRequestException(
    "Please complete all required fields.",
  );
}

if (
  !dto.details ||
  typeof dto.details !== "object" ||
  Array.isArray(dto.details)
) {
  throw new BadRequestException(
    "Registration details must be a valid JSON object.",
  );
}

const nameParts = fullName.split(/\s+/);
const firstName = nameParts.shift() || fullName;
const lastName = nameParts.join(" ") || null;

const passwordHash = await argon2.hash(dto.password);

const institutionId = randomUUID();
const userId = randomUUID();
const now = new Date();

const baseCode =
  institutionName
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9]+/g, "")
    .toUpperCase()
    .slice(0, 8) || "BRX";

const institutionCode =
  `${baseCode}-${randomUUID().slice(0, 6).toUpperCase()}`;

const brxUid =
  `BRX-${randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase()}`;

const details: Record<string, unknown> = {
  ...dto.details,
};

try {
  const existing = await this.prisma.$queryRawUnsafe<
    Array<{ id: string }>
  >(
    'SELECT "id" FROM "users" WHERE LOWER("email") = $1 LIMIT 1',
    email,
  );

  if (existing.length > 0) {
    throw new BadRequestException(
      "This email is already registered. Please use another email.",
    );
  }

  await this.prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe(
      `INSERT INTO "institutions"
        (
          "id",
          "name",
          "code",
          "type",
          "status",
          "country",
          "state",
          "address",
          "email",
          "phone",
          "createdAt",
          "updatedAt",
          "details"
        )
       VALUES (
          $1,
          $2,
          $3,
          $4::"InstitutionType",
          'PENDING',
          'India',
          'Not provided',
          $5,
          $6,
          $7,
          $8,
          $8,
          $9::jsonb
       )`,
      institutionId,
      institutionName,
      institutionCode,
      dto.category,
      address,
      email,
      phone,
      now,
      JSON.stringify(details),
    );

    await tx.$executeRawUnsafe(
      `INSERT INTO "users"
        (
          "id",
          "email",
          "passwordHash",
          "firstName",
          "lastName",
          "phone",
          "role",
          "status",
          "institutionId",
          "createdAt",
          "updatedAt",
          "brxUid"
        )
       VALUES (
          $1,
          $2,
          $3,
          $4,
          $5,
          $6,
          'HEAD',
          'INVITED',
          $7,
          $8,
          $8,
          $9
       )`,
      userId,
      email,
      passwordHash,
      firstName,
      lastName,
      phone,
      institutionId,
      now,
      brxUid,
    );
  });

  return {
    success: true,
    message:
      "Registration submitted successfully. Your institution is pending approval.",
    institutionId,
    status: "PENDING",
  };
} catch (error: unknown) {
  if (error instanceof BadRequestException) {
    throw error;
  }

  console.error("[BRX registration error]", error);

  const errorMessage =
    error instanceof Error ? error.message : String(error);

  const errorCode =
    typeof error === "object" &&
    error !== null &&
    "code" in error
      ? String(error.code)
      : "";

  if (
    errorCode === "23505" ||
    errorMessage.includes("23505") ||
    errorMessage.toLowerCase().includes("unique constraint")
  ) {
    throw new BadRequestException(
      "This email or institution code is already registered.",
    );
  }

  throw new InternalServerErrorException(
    "Registration failed. Please try again.",
  );
}

}
}
