import {
  Injectable,
  Logger,
} from '@nestjs/common';

import { PrismaService } from '../../../database/prisma.service';

import { generateBrxUid } from '../../../common/utils/brx-uid.util';

@Injectable()
export class BrxUidBackfillService {
  private readonly logger =
    new Logger(BrxUidBackfillService.name);

  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async run(): Promise<number> {
    const users =
      await this.prisma.user.findMany({
        where: {
          brxUid: '',
        },
        select: {
          id: true,
        },
      });

    let updated = 0;

    for (const user of users) {
      let assigned = false;

      for (
        let attempt = 0;
        attempt < 10;
        attempt += 1
      ) {
        const brxUid =
          generateBrxUid();

        try {
          await this.prisma.user.update({
            where: {
              id: user.id,
            },
            data: {
              brxUid,
            },
          });

          assigned = true;
          updated += 1;
          break;
        } catch {
          // UID collision — generate another one.
        }
      }

      if (!assigned) {
        this.logger.error(
          `Unable to assign UID to user ${user.id}`,
        );
      }
    }

    return updated;
  }
}