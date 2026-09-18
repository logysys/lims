import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../app.module';

describe('Samples (e2e)', () => {
  let app: INestApplication;
  let token: string;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    const loginRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'analyst@trusource.com', password: 'Password123!' });

    token = loginRes.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/v1/samples', () => {
    it('should list samples', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/samples')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('total');
    });
  });

  describe('GET /api/v1/samples/my-queue', () => {
    it('should return analyst queue', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/samples/my-queue')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('GET /api/v1/samples/dashboard-stats', () => {
    it('should return dashboard stats', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/samples/dashboard-stats')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body).toHaveProperty('total');
      expect(res.body).toHaveProperty('pending');
      expect(res.body).toHaveProperty('inTesting');
    });
  });
});