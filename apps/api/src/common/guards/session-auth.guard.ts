import {
CanActivate,
ExecutionContext,
Injectable,
UnauthorizedException,
} from "@nestjs/common";
import type { Request } from "express";
import { AuthService } from "../../modules/auth/auth.service";

const COOKIE_NAME = "brx_session";

function getSessionToken(request: Request): string | undefined {
const cookieHeader = request.headers.cookie;

if (!cookieHeader) {
return undefined;
}

const entry = cookieHeader
.split(";")
.map((part) => part.trim())
.find((part) => part.startsWith(`${COOKIE_NAME}=`));

if (!entry) {
return undefined;
}

try {
return (
decodeURIComponent(entry.slice(COOKIE_NAME.length + 1)) || undefined
);
} catch {
return undefined;
}
}

@Injectable()
export class SessionAuthGuard implements CanActivate {
constructor(private readonly authService: AuthService) {}

async canActivate(context: ExecutionContext): Promise<boolean> {
const request = context.switchToHttp().getRequest<
Request & { user?: Record<string, unknown> }
>();

const token = getSessionToken(request);

if (!token) {
  throw new UnauthorizedException("Authentication required");
}

const user = await this.authService.getCurrentUser(token);

request.user = user;

return true;

}
}
