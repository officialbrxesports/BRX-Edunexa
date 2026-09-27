import {
  Body,
  Controller,
  Get,
  Post,
} from '@nestjs/common';

import { RegistrationService } from '../services/registration.service';

import { CreateRegistrationDto } from '../dto/create-registration.dto';

import { CompleteRegistrationDto } from '../dto/complete-registration.dto';

@Controller('registration')
export class RegistrationController {
  constructor(
    private readonly registrationService: RegistrationService,
  ) {}

  // ============================================
  // Health
  // ============================================

  @Get('health')
  health() {
    return {
      success: true,
      module: 'registration',
      status: 'ready',
    };
  }

  // ============================================
  // Create registration session
  // ============================================

  @Post('session')
  async createSession(
    @Body() dto: CreateRegistrationDto,
  ) {
    return this.registrationService.createRegistrationSession(
      dto,
    );
  }

  // ============================================
  // Complete registration
  // ============================================

  @Post('complete')
  async completeRegistration(
    @Body() dto: CompleteRegistrationDto,
  ) {
    return this.registrationService.completeRegistration(
      dto.sessionId,
    );
  }
}