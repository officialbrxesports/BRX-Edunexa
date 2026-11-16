import {
BadRequestException,
Injectable,
NotFoundException,
} from "@nestjs/common";

import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class InstitutionsApprovalService {
constructor(private readonly prisma: PrismaService) {}

async listPending() {
return this.prisma.$queryRaw`       SELECT
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
        "createdAt"
      FROM "institutions"
      WHERE "status"::text = 'PENDING'
      ORDER BY "createdAt" ASC
    `;
}

async listAll() {
const rows = await this.prisma.institutions.findMany({
orderBy: { createdAt: "desc" },
select: {
id: true,
name: true,
code: true,
type: true,
status: true,
state: true,
country: true,
email: true,
phone: true,
createdAt: true,
_count: { select: { users: true } },
users: {
where: { role: "HEAD" },
take: 1,
select: { firstName: true, lastName: true, email: true },
},
},
});

return rows.map((row) => ({
id: row.id,
name: row.name,
code: row.code,
type: row.type,
status: row.status,
state: row.state,
country: row.country,
email: row.email,
phone: row.phone,
createdAt: row.createdAt,
userCount: row._count.users,
head: row.users[0]
? {
name: [row.users[0].firstName, row.users[0].lastName]
.filter(Boolean)
.join(" "),
email: row.users[0].email,
}
: null,
}));
}

async approve(institutionId: string) {
return this.prisma.$transaction(async (tx) => {
const institutions = await tx.$queryRaw<
{ id: string; status: string }[]
>`         SELECT
          "id",
          "status"::text AS "status"
        FROM "institutions"
        WHERE "id" = ${institutionId}
        FOR UPDATE
      `;

  const institution = institutions[0];

  if (!institution) {
    throw new NotFoundException("Institution not found.");
  }

  if (institution.status !== "PENDING") {
    throw new BadRequestException(
      "Only pending institutions can be approved.",
    );
  }

  const updatedInstitutions = await tx.$queryRaw<
    { id: string; status: string }[]
  >`
    UPDATE "institutions"
    SET
      "status" = 'ACTIVE'::"InstitutionStatus",
      "updatedAt" = NOW()
    WHERE "id" = ${institutionId}
    RETURNING
      "id",
      "status"::text AS "status"
  `;

  const activatedUsers = await tx.$executeRaw`
    UPDATE "users"
    SET
      "status" = 'ACTIVE',
      "updatedAt" = NOW()
    WHERE "institutionId" = ${institutionId}
      AND "role"::text = 'HEAD'
      AND "status"::text = 'INVITED'
  `;

  return {
    success: true,
    message:
      "Institution approved successfully. Its invited HEAD account has been activated.",
    institution: updatedInstitutions[0],
    activatedUsers,
  };
});

}

async reject(institutionId: string) {
return this.prisma.$transaction(async (tx) => {
const institutions = await tx.$queryRaw<
{ id: string; status: string }[]
>`         SELECT
          "id",
          "status"::text AS "status"
        FROM "institutions"
        WHERE "id" = ${institutionId}
        FOR UPDATE
      `;

  const institution = institutions[0];

  if (!institution) {
    throw new NotFoundException("Institution not found.");
  }

  if (institution.status !== "PENDING") {
    throw new BadRequestException(
      "Only pending institutions can be rejected.",
    );
  }

  const updatedInstitutions = await tx.$queryRaw<
    { id: string; status: string }[]
  >`
    UPDATE "institutions"
    SET
      "status" = 'SUSPENDED'::"InstitutionStatus",
      "updatedAt" = NOW()
    WHERE "id" = ${institutionId}
    RETURNING
      "id",
      "status"::text AS "status"
  `;

  return {
    success: true,
    message:
      "Institution rejected. Its status has been set to SUSPENDED.",
    institution: updatedInstitutions[0],
  };
});

}
}
