import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsService } from './permissions.service';

@Controller('permissions')
@UseGuards(JwtAuthGuard)
export class PermissionsController {
  constructor(
    private readonly permissionsService: PermissionsService,
  ) {}

  @Get('features')
  getFeatures(@Query('role') role?: string) {
    if (role) {
      return this.permissionsService.getFeaturesForRole(role);
    }

    return this.permissionsService.getAllFeatures();
  }

  @Get('check')
  checkFeature(
    @Query('role') role: string,
    @Query('feature') feature: string,
  ) {
    return {
      role,
      feature,
      allowed: this.permissionsService.hasFeature(role, feature),
    };
  }
}
