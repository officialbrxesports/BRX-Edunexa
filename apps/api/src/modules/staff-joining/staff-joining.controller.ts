import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  StreamableFile,
  UnauthorizedException,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';

import { FileInterceptor } from '@nestjs/platform-express';

import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import {
  type AuthenticatedRequest,
  SessionAuthGuard,
} from '../../common/guards/session-auth.guard';
import type { ChildLinkInput } from '../users/parents.service';
import {
  StaffJoiningService,
  type StaffApplicationInput,
} from './staff-joining.service';

const uploadOptions = {
  limits: { fileSize: 2 * 1024 * 1024, files: 1 },
  fileFilter: (
    _request: unknown,
    file: { mimetype: string },
    callback: (error: Error | null, accept: boolean) => void,
  ) => {
    const allowed = ['image/jpeg', 'image/png', 'application/pdf'];

    if (!allowed.includes(file.mimetype)) {
      return callback(
        new BadRequestException('Only JPG, PNG and PDF files are allowed.'),
        false,
      );
    }

    callback(null, true);
  },
};

/* Head-only: hiring records hold personal documents. */
@Controller('staff-joining')
@UseGuards(SessionAuthGuard, RolesGuard)
@Roles('HEAD')
export class StaffJoiningController {
  constructor(private readonly joining: StaffJoiningService) {}

  private institutionId(request: AuthenticatedRequest) {
    const id = request.user?.institutionId;

    if (!id) {
      throw new UnauthorizedException(
        'Your account is not linked to an institution.',
      );
    }

    return id;
  }

  @Get('meta')
  meta() {
    return { profiles: this.joining.profiles() };
  }

  @Get('students')
  students(@Req() request: AuthenticatedRequest) {
    return this.joining.studentOptions(this.institutionId(request));
  }

  @Get()
  list(
    @Req() request: AuthenticatedRequest,
    @Query('status') status?: string,
    @Query('role') role?: string,
    @Query('search') search?: string,
  ) {
    return this.joining.list(this.institutionId(request), {
      status,
      role,
      search,
    });
  }

  @Post()
  create(@Req() request: AuthenticatedRequest, @Body() body: StaffApplicationInput) {
    return this.joining.create(this.institutionId(request), body);
  }

  @Get(':id')
  get(@Req() request: AuthenticatedRequest, @Param('id') id: string) {
    return this.joining.get(this.institutionId(request), id);
  }

  @Post(':id/review')
  review(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body()
    body: { action?: string; note?: string; children?: ChildLinkInput[] },
  ) {
    return this.joining.review(
      this.institutionId(request),
      request.user!.id,
      id,
      body,
    );
  }

  @Post(':id/documents')
  @UseInterceptors(FileInterceptor('file', uploadOptions))
  upload(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: { type?: string },
    @UploadedFile() file: any,
  ) {
    return this.joining.uploadDocument(
      this.institutionId(request),
      id,
      String(body?.type || ''),
      file,
    );
  }

  @Patch(':id/documents/:documentId/verify')
  verify(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Param('documentId') documentId: string,
    @Body() body: { verified?: boolean; remarks?: string },
  ) {
    return this.joining.verifyDocument(
      this.institutionId(request),
      id,
      documentId,
      body?.verified === true,
      body?.remarks,
    );
  }

  @Get(':id/documents/:documentId/file')
  async download(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Param('documentId') documentId: string,
  ) {
    const result = await this.joining.getFile(
      this.institutionId(request),
      id,
      documentId,
    );

    return new StreamableFile(result.stream, {
      type: result.mimeType,
      disposition: 'attachment; filename="joining-document"',
    });
  }
}
