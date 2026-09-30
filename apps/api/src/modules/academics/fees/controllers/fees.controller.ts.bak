import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import type { Request } from 'express';
import { GenerateFeesDto } from '../dto/generate-fees.dto';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../common/auth/guards/roles.guard';
import { Roles } from '../../../../common/auth/decorators/roles.decorator';

import { CreateFeeDto } from '../dto/create-fee.dto';
import { CreateFeePaymentDto } from '../dto/create-fee-payment.dto';
import { UpdateFeeDto } from '../dto/update-fee.dto';

import { FeesService } from '../services/fees.service';

interface AuthenticatedRequest
  extends Request {
  user: {
    userId: string;
    email: string;
    role: string;
    institutionId: string | null;
  };
}

@Controller('academics/fees')
@UseGuards(
  JwtAuthGuard,
  RolesGuard,
)
export class FeesController {
  constructor(
    private readonly feesService: FeesService,
  ) {}

  @Roles('HEAD', 'STAFF')
  @Post()
  async createFee(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateFeeDto,
  ) {
    return this.feesService.createFee(
      req.user.institutionId,
      dto,
    );
  }

    @Roles('HEAD', 'STAFF')
  @Post('generate')
  async generateFees(
    @Req() req: AuthenticatedRequest,
    @Body() dto: GenerateFeesDto,
  ) {
    return this.feesService.generateFees(
      req.user.institutionId,
      dto,
    );
  }

  @Roles(
    'HEAD',
    'TEACHER',
    'STAFF',
    'STUDENT',
  )
  @Get()
  async getAllFees(
    @Req() req: AuthenticatedRequest,
  ) {
    return this.feesService.getAllFees(
      req.user.institutionId,
    );
  }

  @Roles(
    'HEAD',
    'TEACHER',
    'STAFF',
    'STUDENT',
  )
  @Get('summary')
  async getFeeSummary(
    @Req() req: AuthenticatedRequest,
  ) {
    return this.feesService.getFeeSummary(
      req.user.institutionId,
    );
  }

  @Roles(
    'HEAD',
    'TEACHER',
    'STAFF',
    'STUDENT',
  )
  @Get('student/:studentId')
  async getStudentFees(
    @Req() req: AuthenticatedRequest,
    @Param('studentId') studentId: string,
  ) {
    return this.feesService.getStudentFees(
      req.user.institutionId,
      studentId,
    );
  }

  @Roles(
    'HEAD',
    'TEACHER',
    'STAFF',
    'STUDENT',
  )
  @Get(':feeId')
  async getFeeById(
    @Req() req: AuthenticatedRequest,
    @Param('feeId') feeId: string,
  ) {
    return this.feesService.getFeeById(
      req.user.institutionId,
      feeId,
    );
  }

  @Roles('HEAD', 'STAFF')
  @Patch(':feeId')
  async updateFee(
    @Req() req: AuthenticatedRequest,
    @Param('feeId') feeId: string,
    @Body() dto: UpdateFeeDto,
  ) {
    return this.feesService.updateFee(
      req.user.institutionId,
      feeId,
      dto,
    );
  }

  @Roles('HEAD', 'STAFF')
  @Post(':feeId/payments')
  async addPayment(
    @Req() req: AuthenticatedRequest,
    @Param('feeId') feeId: string,
    @Body() dto: CreateFeePaymentDto,
  ) {
    return this.feesService.addPayment(
      req.user.institutionId,
      feeId,
      dto,
    );
  }

  @Roles(
    'HEAD',
    'TEACHER',
    'STAFF',
    'STUDENT',
  )
  @Get(':feeId/payments')
  @Roles(
  'HEAD',
  'TEACHER',
  'STAFF',
  'STUDENT',
)
@Get(':feeId/payments/:paymentId/receipt')
async getPaymentReceipt(
  @Req() req: AuthenticatedRequest,
  @Param('feeId') feeId: string,
  @Param('paymentId') paymentId: string,
) {
  return this.feesService.getPaymentReceipt(
    req.user.institutionId,
    feeId,
    paymentId,
  );
}

  async getPaymentHistory(
    @Req() req: AuthenticatedRequest,
    @Param('feeId') feeId: string,
  ) {
    return this.feesService.getPaymentHistory(
      req.user.institutionId,
      feeId,
    );
  }
}