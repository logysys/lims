import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { AuditService } from '@modules/audit/audit.service';
import { AuditAction } from '@common/enums';

const AUDIT_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const method = request.method;

    if (!AUDIT_METHODS.includes(method)) {
      return next.handle();
    }

    return next.handle().pipe(
      tap(async (responseData) => {
        try {
          const action = this.mapMethodToAction(method);
          const resourceType = this.extractResourceType(request.url);
          const resourceId = request.params?.id || responseData?.id || 'unknown';

          await this.auditService.log({
            userId: request.user?.sub,
            userEmail: request.user?.email,
            action,
            resourceType,
            resourceId,
            newValues: method === 'POST' || method === 'PATCH' || method === 'PUT' ? request.body : undefined,
            ipAddress: request.ip,
            userAgent: request.headers['user-agent'],
          });
        } catch (err) {
          // Don't fail the request if audit logging fails
          console.error('Audit logging failed:', err);
        }
      }),
    );
  }

  private mapMethodToAction(method: string): AuditAction {
    switch (method) {
      case 'POST':
        return AuditAction.CREATE;
      case 'PUT':
      case 'PATCH':
        return AuditAction.UPDATE;
      case 'DELETE':
        return AuditAction.DELETE;
      default:
        return AuditAction.CREATE;
    }
  }

  private extractResourceType(url: string): string {
    const parts = url.split('/').filter(Boolean);
    // Remove api prefix
    const resourceIndex = parts.findIndex((p) => p === 'v1') + 1;
    return parts[resourceIndex] || 'unknown';
  }
}