import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from './decorators';
import { verifyAccessToken } from './utils';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    let token = '';
    const authHeader = request.headers['authorization'];

    if (authHeader) {
      const [type, credentials] = authHeader.split(' ');
      if (type === 'Bearer') {
        token = credentials;
      }
    }

    // Fallback: extract token from cookies parsed by cookie-parser
    if (!token && request.cookies) {
      token = request.cookies['token'];
    }

    if (!token) {
      throw new UnauthorizedException('Missing authorization token (Header or Cookie)');
    }

    try {
      // Validate access token using custom JWT helper
      const payload = verifyAccessToken(token);

      // Attach token payload to the request object (contains id, email, role)
      request.user = payload;
      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
