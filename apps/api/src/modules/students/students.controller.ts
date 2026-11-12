
import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';

import {
  AuthenticatedRequest,
  SessionAuthGuard,
} from '../../common/guards/session-auth.guard';

import {
  CreateAdmissionInput,
  ReviewAdmissionInput,
  StudentsService,
} from './students.service';

@Controller('students')
@UseGuards(SessionAuthGuard)
export class StudentsController {
  constructor(
    private readonly studentsService: StudentsService,
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

  @Get('classes')
  getClasses(@Req() request: AuthenticatedRequest) {
    return this.studentsService.getClasses(
      this.getInstitutionId(request),
      request.user!.role,
    );
  }

  @Post('admissions')
  createAdmission(
    @Req() request: AuthenticatedRequest,
    @Body() body: CreateAdmissionInput,
  ) {
    return this.studentsService.createAdmission(
      this.getInstitutionId(request),
      request.user!.role,
      body,
    );
  }

  @Get('admissions')
  getAdmissions(
    @Req() request: AuthenticatedRequest,
    @Query('status') status?: string,
  ) {
    return this.studentsService.getAdmissions(
      this.getInstitutionId(request),
      request.user!.role,
      status,
    );
  }

  @Get('admissions/:id')
  getAdmission(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.studentsService.getAdmission(
      this.getInstitutionId(request),
      request.user!.role,
      id,
    );
  }

  @Patch('admissions/:id/review')
  reviewAdmission(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: ReviewAdmissionInput,
  ) {
    return this.studentsService.reviewAdmission(
      this.getInstitutionId(request),
      request.user!.id,
      request.user!.role,
      id,
      body,
    );
  }

  @Post('admissions/:id/approve')
  approveAdmission(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: { sectionId?: string },
  ) {
    return this.studentsService.approveAdmission(
      this.getInstitutionId(request),
      request.user!.id,
      request.user!.role,
      id,
      body,
    );
  }

  @Post('admissions/:id/reject')
  rejectAdmission(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: { reason: string },
  ) {
    return this.studentsService.rejectAdmission(
      this.getInstitutionId(request),
      request.user!.id,
      request.user!.role,
      id,
      body,
    );
  }

  // Create receipt
  @Post('admissions/:id/receipt')
  createAdmissionReceipt(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: { amount?: number; note?: string },
  ) {
    return this.studentsService.createAdmissionReceipt(
      this.getInstitutionId(request),
      request.user!.role,
      id,
      body,
    );
  }

  // View receipt
  @Get('admissions/:id/receipt')
  getAdmissionReceipt(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.studentsService.getAdmissionReceipt(
      this.getInstitutionId(request),
      request.user!.role,
      id,
    );
  }

  // Update payment
  @Patch('admissions/:id/payment')
  updateAdmissionPayment(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body()
    body: {
      amount?: number;
      paymentMethod?: 'CASH' | 'UPI' | 'CARD' | 'BANK_TRANSFER' | 'OTHER';
      transactionId?: string;
      paymentStatus: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
      paymentDate?: string;
      note?: string;
    },
  ) {
    return this.studentsService.updateAdmissionPayment(
      this.getInstitutionId(request),
      request.user!.role,
      id,
      body,
    );
  }
}
