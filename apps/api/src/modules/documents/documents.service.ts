import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../prisma/prisma.service';

import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';

@Injectable()
export class DocumentsService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async create(userId: string, dto: CreateDocumentDto) {
    return this.prisma.editor_documents.create({
      data: {
        id: randomUUID(),
        userId,
        title: dto.title.trim(),
        content: dto.content,
      },
    });
  }

  async findAll(userId: string) {
    return this.prisma.editor_documents.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        title: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findOne(userId: string, id: string) {
    const document =
      await this.prisma.editor_documents.findFirst({
        where: {
          id,
          userId,
        },
      });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    return document;
  }

  async update(
    userId: string,
    id: string,
    dto: UpdateDocumentDto,
  ) {
    await this.findOne(userId, id);

    return this.prisma.editor_documents.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && {
          title: dto.title.trim(),
        }),
        ...(dto.content !== undefined && {
          content: dto.content,
        }),
      },
    });
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id);

    await this.prisma.editor_documents.delete({
      where: { id },
    });

    return {
      success: true,
      message: 'Document deleted',
    };
  }
}