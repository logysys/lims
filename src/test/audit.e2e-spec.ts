import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../app.module';

describe('Audit (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;
  let analystToken: string;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();

    const adminLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'admin@trusource.com', password: 'Password123!' });
    adminToken = adminLogin.body.accessToken;

    const analystLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'analyst@trusource.com', password: 'Password123!' });
    analystToken = analystLogin.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  it('admin can access audit trail', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/audit')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
  });

  it('analyst cannot access audit trail', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/audit')
      .set('Authorization', `Bearer ${analystToken}`)
      .expect(403);
  });

  it('verifies hash chain integrity', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/audit/verify-chain')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body).toHaveProperty('valid');
    expect(res.body.valid).toBe(true);
  });
});