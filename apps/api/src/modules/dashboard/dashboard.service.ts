
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getInstitutionSummary(
    institutionId: string,
    user: { role: string; institutionId?: string | null },
  ) {
    if (
      user.role !== "PLATFORM_ADMIN" &&
      user.institutionId !== institutionId
    ) {
      throw new ForbiddenException("Institution access denied");
    }

    const rows = await this.prisma.$queryRaw<
      {
        id: string;
        name: string;
        type: string;
        status: string;
        createdAt: Date;
      }[]
    >`
      SELECT
        id,
        name,
        type::text AS type,
        status::text AS status,
        "createdAt"
      FROM institutions
      WHERE id = ${institutionId}
      LIMIT 1
    `;

    const institution = rows[0];

    if (!institution) {
      throw new NotFoundException("Institution not found");
    }

    return {
      institution,
      summary: {
        users: null,
        students: null,
        teachers: null,
        attendance: null,
        note: "Metrics will be available after their modules are connected.",
      },
    };
  }
}
