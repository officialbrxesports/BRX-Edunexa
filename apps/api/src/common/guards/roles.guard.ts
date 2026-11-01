import {
CanActivate,
ExecutionContext,
ForbiddenException,
Injectable,
UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";

@Injectable()
export class RolesGuard implements CanActivate {
constructor(private readonly reflector: Reflector) {}

canActivate(context: ExecutionContext): boolean {
const request = context.switchToHttp().getRequest();
const user = request.user;

if (!user) {
  throw new UnauthorizedException("Authentication required");
}

const allowedRoles =
  this.reflector.getAllAndOverride<string[]>("brx:roles", [
    context.getHandler(),
    context.getClass(),
  ]) ?? [];

if (
  allowedRoles.length > 0 &&
  !allowedRoles.includes(user.role)
) {
  throw new ForbiddenException("Insufficient role");
}

return true;

}
}
