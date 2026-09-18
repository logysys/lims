import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiKeysService } from '@modules/api-keys/api-keys.service';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers['x-api-key'];

    if (!apiKey) {
      throw new UnauthorizedException('API key required');
    }

    const key = await this.apiKeysService.validateKey(apiKey);
    if (!key) {
      throw new UnauthorizedException('Invalid or expired API key');
    }

    // IP whitelist check
    if (key.ipWhitelist && key.ipWhitelist.length > 0) {
      const clientIp = request.ip;
      if (!key.ipWhitelist.includes(clientIp)) {
        throw new UnauthorizedException('IP address not whitelisted');
      }
    }

    request.apiKey = key;
    request.organizationId = key.organizationId;
    request.apiScopes = key.scopes;

    return true;
  }
}