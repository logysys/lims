import { DocumentBuilder } from '@nestjs/swagger';

export const swaggerConfig = new DocumentBuilder()
  .setTitle('TruSource LIMS API')
  .setDescription(
    [
      '## Complete Laboratory Information Management System API',
      '',
      '### Features',
      '- Multi-tenant organization management',
      '- Complete sample lifecycle (intake → COA release)',
      '- ISO 17025 & 21 CFR Part 11 compliance',
      '- Electronic signatures with step-up auth',
      '- Immutable hash-chained audit trail',
      '- Public verification with QR codes',
      '- Verified badges for consumer trust',
      '- Billing and subscription management',
      '- REST API with scoped API keys',
      '',
      '### Authentication',
      '- **JWT Bearer**: Standard user authentication',
      "- **API Key**: For machine-to-machine (header: 'X-API-Key')",
      '',
      '### Rate Limits',
      '- Anonymous: 30 req/min',
      '- Authenticated: 100 req/min',
      '- API Key: Configurable per key',
    ].join('\n'),
  )
  .setVersion('1.0.0')
  .setContact('TruSource Support', 'https://trusource.com', 'support@trusource.com')
  .setLicense('Proprietary', 'https://trusource.com/license')
  .addServer('http://localhost:3000', 'Development')
  .addServer('https://api.trusource.com', 'Production')
  .addBearerAuth(
    { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    'bearer',
  )
  .addApiKey({ type: 'apiKey', name: 'X-API-Key', in: 'header' }, 'api-key')
  .addTag('Health', 'Health check endpoints')
  .addTag('Authentication', 'User authentication and MFA')
  .addTag('Users', 'User management')
  .addTag('Organizations', 'Organization/tenant management')
  .addTag('Products', 'Product catalog')
  .addTag('Samples', 'Sample intake and lifecycle')
  .addTag('Testing', 'Test execution and results')
  .addTag('Quality', 'QA reviews and e-signatures')
  .addTag('COA', 'Certificate of Analysis generation')
  .addTag('Public Verification', 'Public verification endpoints (no auth)')
  .addTag('Consumer Portal', 'Consumer-facing endpoints (no auth)')
  .addTag('Inventory', 'Reagents, consumables, storage')
  .addTag('Instruments', 'Equipment management')
  .addTag('Workflow', 'State machine and transitions')
  .addTag('Audit', 'Immutable audit trail')
  .addTag('Reports', 'Analytics and exports')
  .addTag('Bulk Submission', 'CSV/Excel bulk imports')
  .addTag('Notifications', 'In-app notifications')
  .addTag('Messages', 'Secure messaging')
  .addTag('Verified Badges', 'Consumer verified badges')
  .addTag('Billing', 'Invoices and payments')
  .addTag('API Keys', 'API key management')
  .build();