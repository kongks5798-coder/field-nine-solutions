# K-UNIVERSAL Production Deployment Checklist

## Pre-Deployment Checklist

### 1. Environment Variables

- [ ] **Supabase**
  - `NEXT_PUBLIC_SUPABASE_URL` - Production Supabase URL
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Production anon key
  - `SUPABASE_SERVICE_ROLE_KEY` - Service role key (server only)

- [ ] **Toss Payments** (Live Keys)
  - `NEXT_PUBLIC_TOSS_CLIENT_KEY` - Production client key (starts with `live_ck_`)
  - `TOSS_SECRET_KEY` - Production secret key (starts with `live_sk_`)

- [ ] **Google APIs**
  - `GOOGLE_APPLICATION_CREDENTIALS` or individual keys
  - `GOOGLE_SALES_SPREADSHEET_ID` - Production spreadsheet

- [ ] **Authentication**
  - `NEXTAUTH_SECRET` - Strong random secret (32+ chars)
  - `NEXTAUTH_URL` - Production URL (https://your-domain.com)
  - `PANOPTICON_PASSWORD` - Strong CEO dashboard password

- [ ] **OpenAI**
  - `OPENAI_API_KEY` - Production API key

### 2. Database (Supabase)

- [ ] Run RLS migration: `supabase/migrations/021_rls_production_policies.sql`
- [ ] Verify RLS policies are enabled on all tables
- [ ] Create required indexes
- [ ] Set up database backups
- [ ] Configure connection pooling if needed

### 3. Security Verification

- [ ] `AUTH_BYPASS` is removed (middleware.ts)
- [ ] No hardcoded API keys in code
- [ ] `.env` and sensitive files in `.gitignore`
- [ ] Rate limiting enabled on all APIs
- [ ] Input validation on all endpoints
- [ ] HTTPS enforced (Strict-Transport-Security header)
- [ ] CSP headers configured

### 4. Toss Payments Setup

- [ ] Business registration completed
- [ ] Live API keys obtained
- [ ] Webhook URL configured in Toss dashboard
- [ ] Payment success/fail pages tested
- [ ] Refund process tested

### 5. Monitoring & Logging

- [ ] Sentry error tracking configured
- [ ] Analytics (GA/Vercel) enabled
- [ ] Slack/Discord webhooks for alerts
- [ ] API audit logging enabled

### 6. Testing

- [ ] All unit tests passing (`npm run test`)
- [ ] E2E tests passing (`npm run test:e2e`)
- [ ] Payment flow tested end-to-end
- [ ] Mobile responsiveness verified
- [ ] Cross-browser testing completed

## Deployment Steps

### 1. Vercel Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy to production
vercel --prod
```

### 2. Environment Variables in Vercel

1. Go to Vercel Dashboard > Project > Settings > Environment Variables
2. Add all variables from `.env.example`
3. Ensure `Production` environment is selected
4. Redeploy after adding variables

### 3. Database Migration

```bash
# Login to Supabase CLI
supabase login

# Link to project
supabase link --project-ref YOUR_PROJECT_REF

# Run migrations
supabase db push
```

### 4. DNS Configuration

- [ ] Configure custom domain in Vercel
- [ ] Set up SSL certificate (automatic with Vercel)
- [ ] Update `NEXTAUTH_URL` to production domain

## Post-Deployment Verification

### Functional Tests

- [ ] Homepage loads correctly
- [ ] User registration/login works
- [ ] KYC flow completes
- [ ] Wallet topup succeeds
- [ ] Panopticon dashboard accessible
- [ ] Sales data syncing

### Security Tests

- [ ] HTTPS redirect working
- [ ] Security headers present (use securityheaders.com)
- [ ] No sensitive data in client-side code
- [ ] Rate limiting working

### Performance Tests

- [ ] Lighthouse score > 90
- [ ] First Contentful Paint < 1.5s
- [ ] Time to Interactive < 3s

## Rollback Procedure

If issues arise after deployment:

```bash
# List deployments
vercel ls

# Rollback to previous deployment
vercel rollback [deployment-url]
```

## Emergency Contacts

- **Developer**: [Your contact]
- **Toss Support**: 1599-3633
- **Supabase Support**: support@supabase.io
- **Vercel Support**: support@vercel.com

## Maintenance Mode

To enable maintenance mode:

1. Create `/app/maintenance/page.tsx`
2. Update middleware to redirect all traffic
3. Deploy with `vercel --prod`

---

Last Updated: 2024-01-16
Version: 1.0.0
