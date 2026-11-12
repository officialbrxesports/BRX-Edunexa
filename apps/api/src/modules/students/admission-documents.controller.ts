import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  StreamableFile,
  UnauthorizedException,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';

import { FileInterceptor } from '@nestjs/platform-express';

import {
  AuthenticatedRequest,
  SessionAuthGuard,
} from '../../common/guards/session-auth.guard';

import { AdmissionDocumentsService } from './admission-documents.service';

@Controller('students/admissions')
@UseGuards(SessionAuthGuard)
export class AdmissionDocumentsController {
  constructor(
    private readonly documentsService: AdmissionDocumentsService,
  ) {}

  private getInstitutionId(request: AuthenticatedRequest) {
    const institutionId = request.user?.institutionId;

    if (!institutionId) {
      throw new UnauthorizedException(
        'Your account is not linked to an institution.',
      );
    }

    return institutionId;
  }

  @Post(':id/documents')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 5 * 1024 * 1024,
        files: 1,
      },
      fileFilter: (_request, file, callback) => {
        const allowed = [
          'image/jpeg',
          'image/png',
          'application/pdf',
        ];

        if (!allowed.includes(file.mimetype)) {
          return callback(
            new BadRequestException(
              'Only JPG, PNG and PDF files are allowed.',
            ),
            false,
          );
        }

        callback(null, true);
      },
    }),
  )
  upload(
    @Req() request: AuthenticatedRequest,
    @Param('id') applicationId: string,
    @Body('type') type: string,
    @UploadedFile() file: any,
  ) {
    return this.documentsService.upload(
      this.getInstitutionId(request),
      request.user!.role,
      applicationId,
      type,
      file,
    );
  }

  @Get(':id/documents')
  getDocuments(
    @Req() request: AuthenticatedRequest,
    @Param('id') applicationId: string,
  ) {
    return this.documentsService.getDocuments(
      this.getInstitutionId(request),
      request.user!.role,
      applicationId,
    );
  }

  @Patch(':id/documents/:documentId/verify')
  verify(
    @Req() request: AuthenticatedRequest,
    @Param('id') applicationId: string,
    @Param('documentId') documentId: string,
    @Body() body: { verified: boolean; remarks?: string },
  ) {
    return this.documentsService.verify(
      this.getInstitutionId(request),
      request.user!.id,
      request.user!.role,
      applicationId,
      documentId,
      body?.verified,
      body?.remarks,
    );
  }

  @Get(':id/documents/:documentId/file')
  async download(
    @Req() request: AuthenticatedRequest,
    @Param('id') applicationId: string,
    @Param('documentId') documentId: string,
  ) {
    const result = await this.documentsService.getPrivateFile(
      this.getInstitutionId(request),
      request.user!.role,
      applicationId,
      documentId,
    );

    return new StreamableFile(result.stream, {
      type: result.mimeType,
      disposition: 'attachment; filename="admission-document"',
    });
  }
}