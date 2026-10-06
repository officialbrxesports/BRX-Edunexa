import {
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';

import { PrismaService } from '../../../database/prisma.service';

import { generateBrxUid } from '../../../common/utils/brx-uid.util';

@Injectable()
export class BrxUidService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async generateUniqueUid(): Promise<string> {
    for (let attempt = 0; attempt < 10; attempt += 1) {
      const brxUid = generateBrxUid();

      const existing =
        await this.prisma.user.findUnique({
          where: {
            brxUid,
          },
          select: {
            id: true,
          },
        });

      if (!existing) {
        return brxUid;
      }
    }

    throw new InternalServerErrorException(
      'Unable to generate a unique BRX UID',
    );
  }
}