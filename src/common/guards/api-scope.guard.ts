import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SetMetadata } from '@nestjs/common';

export const API_SCOPES_KEY = 'apiScopes';
export const RequireScopes = (...scopes: string[]) => SetMetadata(API_SCOPES_KEY, scopes);

@Injectable()
export class ApiScopeGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredScopes = this.reflector.getAllAndOverride<string[]>(API_SCOPES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredScopes || requiredScopes.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const userScopes: string[] = request.apiScopes || request.user?.scopes || [];

    const hasScope = requiredScopes.every((scope) => userScopes.includes(scope));
    if (!hasScope) {
      throw new ForbiddenException(
        `Missing required scope(s): ${requiredScopes.join(', ')}`,
      );
    }

    return true;
  }
}