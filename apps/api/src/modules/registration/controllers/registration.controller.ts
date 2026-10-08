import {
  Body,
  Controller,
  Get,
  Post,
} from '@nestjs/common';

import { RegistrationService } from '../services/registration.service';

import { CreateRegistrationDto } from '../dto/create-registration.dto';

import { CreateRegistrationPasswordDto } from '../dto/create-registration-password.dto';

import { CompleteRegistrationDto } from '../dto/complete-registration.dto';

import { GoogleOnboardingDto } from '../dto/google-onboarding.dto';

@Controller('registration')
export class RegistrationController {
  constructor(
    private readonly registrationService: RegistrationService,
  ) {}

  // ============================================================
  // HEALTH
  // ============================================================

  @Get('health')
  health() {
    return {
      success: true,
      module: 'registration',
      status: 'ready',
    };
  }

  // ============================================================
  // CREATE NORMAL REGISTRATION SESSION
  // ============================================================

  @Post('session')
  async createSession(
    @Body() dto: CreateRegistrationDto,
  ) {
    return this.registrationService.createRegistrationSession(
      dto,
    );
  }

  // ============================================================
  // CREATE REGISTRATION PASSWORD
  // ============================================================

  @Post('password')
  async createPassword(
    @Body() dto: CreateRegistrationPasswordDto,
  ) {
    return this.registrationService.createRegistrationPassword(
      dto,
    );
  }

  // ============================================================
  // COMPLETE REGISTRATION
  // ============================================================

  @Post('complete')
  async completeRegistration(
    @Body() dto: CompleteRegistrationDto,
  ) {
    return this.registrationService.completeRegistration(
      dto.sessionId,
    );
  }

  // ============================================================
  // GOOGLE ONBOARDING
  // ============================================================

  @Post('google')
  async googleOnboarding(
    @Body() dto: GoogleOnboardingDto,
  ) {
    return this.registrationService.completeGoogleOnboarding(
      dto,
    );
  }
}