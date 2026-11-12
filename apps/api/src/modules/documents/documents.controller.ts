import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';

import { SessionAuthGuard } from '../../common/guards/session-auth.guard';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { DocumentsService } from './documents.service';

type AuthRequest = Request & {
  user: {
    id: string;
  };
};

@Controller('documents')
@UseGuards(SessionAuthGuard)
export class DocumentsController {
  constructor(
    private readonly documentsService: DocumentsService,
  ) {}

  @Post()
  create(
    @Req() request: AuthRequest,
    @Body() dto: CreateDocumentDto,
  ) {
    return this.documentsService.create(
      request.user.id,
      dto,
    );
  }

  @Get()
  findAll(@Req() request: AuthRequest) {
    return this.documentsService.findAll(
      request.user.id,
    );
  }

  @Get(':id')
  findOne(
    @Req() request: AuthRequest,
    @Param('id') id: string,
  ) {
    return this.documentsService.findOne(
      request.user.id,
      id,
    );
  }

  @Patch(':id')
  update(
    @Req() request: AuthRequest,
    @Param('id') id: string,
    @Body() dto: UpdateDocumentDto,
  ) {
    return this.documentsService.update(
      request.user.id,
      id,
      dto,
    );
  }

  @Delete(':id')
  remove(
    @Req() request: AuthRequest,
    @Param('id') id: string,
  ) {
    return this.documentsService.remove(
      request.user.id,
      id,
    );
  }
}