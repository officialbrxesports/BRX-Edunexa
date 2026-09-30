import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionsService } from '../permissions.service';
import { FEATURE_KEY } from '../decorators/feature.decorator';

@Injectable()
export class FeatureGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly permissionsService: PermissionsService,
  ) {}

  async canActivate(
    context: ExecutionContext,
  ): Promise<boolean> {
    const feature = this.reflector.getAllAndOverride<string>(
      FEATURE_KEY,
      [
        context.getHandler(),
        context.getClass(),
      ],
    );

    if (!feature) {
      return true;
    }

    const request = context.switchToHttp().getRequest();

    const user = request.user;

    if (!user?.role || !user?.institutionId) {
      throw new ForbiddenException(
        'Institution authentication required',
      );
    }

    const allowed =
      await this.permissionsService.hasFeatureForInstitution(
        user.institutionId,
        user.role,
        feature,
      );

    if (!allowed) {
      throw new ForbiddenException(
        `Feature '${feature}' is not available for this account`,
      );
    }

    return true;
  }
}
