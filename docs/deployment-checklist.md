# Production Deployment Checklist

## Pre-deployment

### Security
- [ ] Change all default secrets in `.env` (JWT_SECRET, JWT_REFRESH_SECRET)
- [ ] Use strong database password (min 32 chars)
- [ ] Enable HTTPS/TLS (Let's Encrypt recommended)
- [ ] Configure firewall (only 80, 443, 22 exposed)
- [ ] Set `NODE_ENV=production`
- [ ] Enable rate limiting (already via ThrottlerModule)
- [ ] Review CORS origins (restrict to known domains)
- [ ] Configure helmet CSP headers
- [ ] Rotate API keys
- [ ] Enable database SSL connection
- [ ] Set up fail2ban for SSH
- [ ] Enable audit logging for all admin actions

### Database
- [ ] PostgreSQL 14+ installed
- [ ] Database created with correct encoding (UTF8)
- [ ] Dedicated DB user with limited privileges
- [ ] Migrations run: `npm run migration:run`
- [ ] Seed data loaded: `npm run seed` (or custom seeds)
- [ ] Backup strategy configured (pg_dump + cron)
- [ ] Connection pooling configured (max 20 connections)
- [ ] Slow query logging enabled

### Infrastructure
- [ ] Redis installed and running (for BullMQ)
- [ ] PM2 or systemd configured for process management
- [ ] Nginx reverse proxy configured
- [ ] Log rotation configured (logrotate)
- [ ] Monitoring (Prometheus/Grafana or DataDog)
- [ ] Error tracking (Sentry)
- [ ] Health check endpoint monitored (`/api/v1/health`)

### Environment
- [ ] `.env` file secured (chmod 600, owned by app user)
- [ ] SMTP credentials verified
- [ ] Stripe keys (production, not test)
- [ ] Frontend URLs configured (all 5 portals)
- [ ] Public verification URL accessible

### Application
- [ ] Build succeeds: `npm run build`
- [ ] E2E tests pass: `npm run test:e2e`
- [ ] No TypeScript errors: `npx tsc --noEmit`
- [ ] ESLint passes: `npm run lint`
- [ ] Node version matches (>= 18, recommend 20 LTS)

### Frontend
- [ ] API URL points to production
- [ ] WebSocket URL configured
- [ ] Static assets optimized
- [ ] Next.js build successful
- [ ] PWA manifest (optional)
- [ ] Analytics configured (optional)

## Deployment Steps

```bash
# 1. Clone repository
git clone <repo-url> /opt/trusource
cd /opt/trusource

# 2. Install dependencies
npm ci --only=production

# 3. Configure environment
cp .env.example .env
nano .env  # Edit with production values

# 4. Run migrations
npm run migration:run

# 5. Seed (only first time)
npm run seed

# 6. Build
npm run build

# 7. Start with PM2
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup

# 8. Configure Nginx
sudo cp nginx.conf /etc/nginx/sites-available/trusource
sudo ln -s /etc/nginx/sites-available/trusource /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# 9. Get SSL certificate
sudo certbot --nginx -d api.trusource.com