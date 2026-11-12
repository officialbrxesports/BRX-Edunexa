
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { randomUUID } from 'node:crypto';

import {
  existsSync,
  createReadStream,
} from 'node:fs';

import {
  mkdir,
  writeFile,
  unlink,
} from 'node:fs/promises';

import {
  basename,
  join,
  resolve,
  sep,
} from 'node:path';

import { PrismaService } from '../../prisma/prisma.service';

type AdmissionDocumentType =
  | 'STUDENT_PHOTO'
  | 'BIRTH_CERTIFICATE'
  | 'IDENTITY_DOCUMENT'
  | 'TRANSFER_CERTIFICATE'
  | 'MARKSHEET'
  | 'OTHER';

const ALLOWED_TYPES: AdmissionDocumentType[] = [
  'STUDENT_PHOTO',
  'BIRTH_CERTIFICATE',
  'IDENTITY_DOCUMENT',
  'TRANSFER_CERTIFICATE',
  'MARKSHEET',
  'OTHER',
];

const MIME_EXTENSIONS: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'application/pdf': '.pdf',
};

const MAX_FILE_SIZE = 5 * 1024 * 1024;

@Injectable()
export class AdmissionDocumentsService {
  private readonly uploadDirectory = resolve(
    process.env.ADMISSION_UPLOAD_DIR ||
      join(process.cwd(), 'private-uploads', 'admissions'),
  );

  constructor(private readonly prisma: PrismaService) {}

  private checkRole(role: string) {
    if (role !== 'HEAD' && role !== 'STAFF') {
      throw new ForbiddenException(
        'Only Head or Staff can manage admission documents.',
      );
    }
  }

  private async checkApplication(
    institutionId: string,
    applicationId: string,
  ) {
    const application =
      await this.prisma.admissionApplication.findFirst({
        where: {
          id: applicationId,
          institutionId,
        },
        select: {
          id: true,
        },
      });

    if (!application) {
      throw new NotFoundException(
        'Admission application not found.',
      );
    }

    return application;
  }

  private validateFile(file: any): string {
    if (!file?.buffer || !Buffer.isBuffer(file.buffer)) {
      throw new BadRequestException(
        'Please select a file.',
      );
    }

    if (file.buffer.length === 0) {
      throw new BadRequestException(
        'The selected file is empty.',
      );
    }

    if (file.buffer.length > MAX_FILE_SIZE) {
      throw new BadRequestException(
        'Maximum file size is 5 MB.',
      );
    }

    const mime = file.mimetype;
    const buffer: Buffer = file.buffer;

    if (!MIME_EXTENSIONS[mime]) {
      throw new BadRequestException(
        'Only JPG, PNG or PDF files are allowed.',
      );
    }

    let validSignature = false;

    if (mime === 'application/pdf') {
      validSignature =
        buffer.subarray(0, 5).toString('ascii') === '%PDF-';
    } else if (mime === 'image/jpeg') {
      validSignature =
        buffer[0] === 0xff &&
        buffer[1] === 0xd8 &&
        buffer[2] === 0xff;
    } else if (mime === 'image/png') {
      validSignature = buffer
        .subarray(0, 8)
        .equals(
          Buffer.from([
            0x89,
            0x50,
            0x4e,
            0x47,
            0x0d,
            0x0a,
            0x1a,
            0x0a,
          ]),
        );
    }

    if (!validSignature) {
      throw new BadRequestException(
        'The file content does not match its file type.',
      );
    }

    return MIME_EXTENSIONS[mime];
  }

  private getSafeFilePath(storageKey: string): string {
    // Only server-generated UUID filenames are accepted.
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|pdf)$/i.test(storageKey)) {
      throw new NotFoundException(
        'Document file not found.',
      );
    }

    const filePath = resolve(
      this.uploadDirectory,
      storageKey,
    );

    // Ensure the resolved path remains inside the upload directory.
    if (!filePath.startsWith(this.uploadDirectory + sep)) {
      throw new NotFoundException(
        'Document file not found.',
      );
    }

    return filePath;
  }

  async upload(
    institutionId: string,
    role: string,
    applicationId: string,
    type: string,
    file: any,
  ) {
    this.checkRole(role);

    if (!ALLOWED_TYPES.includes(type as AdmissionDocumentType)) {
      throw new BadRequestException(
        'Invalid admission document type.',
      );
    }

    await this.checkApplication(
      institutionId,
      applicationId,
    );

    const extension = this.validateFile(file);

    await mkdir(this.uploadDirectory, {
      recursive: true,
    });

    const storageKey = `${randomUUID()}${extension}`;

    const filePath = this.getSafeFilePath(storageKey);

    const originalName = basename(
      String(file.originalname || 'document'),
    )
      .replace(/[^\w.\- ()]/g, '_')
      .slice(0, 180);

    await writeFile(filePath, file.buffer, {
      flag: 'wx',
    });

    try {
      const document =
        await this.prisma.admissionDocument.create({
          data: {
            id: randomUUID(),
            applicationId,
            type: type as AdmissionDocumentType,
            originalName: originalName || 'document',
            storageKey,
            mimeType: file.mimetype,
            sizeBytes: file.buffer.length,
          },
        });

      return {
        message: 'Document uploaded successfully.',
        document,
      };
    } catch (error) {
      await unlink(filePath).catch(() => undefined);
      throw error;
    }
  }

  async getDocuments(
    institutionId: string,
    role: string,
    applicationId: string,
  ) {
    this.checkRole(role);

    await this.checkApplication(
      institutionId,
      applicationId,
    );

    return this.prisma.admissionDocument.findMany({
      where: {
        applicationId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        type: true,
        originalName: true,
        mimeType: true,
        sizeBytes: true,
        verified: true,
        verifiedAt: true,
        remarks: true,
        createdAt: true,
      },
    });
  }

  async verify(
    institutionId: string,
    reviewerId: string,
    role: string,
    applicationId: string,
    documentId: string,
    verified: boolean,
    remarks?: string,
  ) {
    this.checkRole(role);

    await this.checkApplication(
      institutionId,
      applicationId,
    );

    if (typeof verified !== 'boolean') {
      throw new BadRequestException(
        'verified must be true or false.',
      );
    }

    const document =
      await this.prisma.admissionDocument.findFirst({
        where: {
          id: documentId,
          applicationId,
          application: {
            is: {
              institutionId,
            },
          },
        },
        select: {
          id: true,
        },
      });

    if (!document) {
      throw new NotFoundException(
        'Document not found.',
      );
    }

    return this.prisma.admissionDocument.update({
      where: {
        id: documentId,
      },
      data: {
        verified,
        verifiedAt: verified ? new Date() : null,
        verifiedById: verified ? reviewerId : null,
        remarks: remarks?.trim() || null,
      },
    });
  }

  async getPrivateFile(
    institutionId: string,
    role: string,
    applicationId: string,
    documentId: string,
  ) {
    this.checkRole(role);

    await this.checkApplication(
      institutionId,
      applicationId,
    );

    const document =
      await this.prisma.admissionDocument.findFirst({
        where: {
          id: documentId,
          applicationId,
          application: {
            is: {
              institutionId,
            },
          },
        },
      });

    if (!document) {
      throw new NotFoundException(
        'Document not found.',
      );
    }

    const filePath = this.getSafeFilePath(
      document.storageKey,
    );

    if (!existsSync(filePath)) {
      throw new NotFoundException(
        'Document file is missing.',
      );
    }

    return {
      stream: createReadStream(filePath),
      mimeType: document.mimeType,
      originalName: document.originalName,
    };
  }
}
