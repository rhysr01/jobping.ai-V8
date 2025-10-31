# Sentry Setup Guide for Vercel

This guide walks you through setting up Sentry error tracking for your JobPing application on Vercel.

## Prerequisites

- ✅ Sentry project created (Platform: Next.js)
- ✅ Sentry DSN copied
- ✅ Vercel project access

## Step 1: Set Environment Variables in Vercel

Go to your Vercel project → **Settings** → **Environment Variables** and add the following:

### Runtime Variables (Preview + Production)

These are required for Sentry to work:

```bash
SENTRY_DSN=https://f55f891a4b912e9308edd59b1f7464c0@o4510279772995584.ingest.de.sentry.io/4510279774044240
```

**Optional** (for client-side error tracking):
```bash
NEXT_PUBLIC_SENTRY_DSN=https://f55f891a4b912e9308edd59b1f7464c0@o4510279772995584.ingest.de.sentry.io/4510279774044240
```

### Build-time Variables (Optional but Recommended)

These enable source maps upload for better error debugging:

```bash
SENTRY_AUTH_TOKEN=your-sentry-auth-token-with-project-releases-permission
SENTRY_ORG=your-sentry-org-slug
SENTRY_PROJECT=your-project-slug
```

**How to get your Sentry Auth Token:**
1. Go to Sentry → Settings → Account → Auth Tokens
2. Create a new token with `project:releases` scope
3. Copy the token value

**How to find your org/project slugs:**
- Look at your Sentry DSN URL: `https://[key]@o[org-id].ingest.de.sentry.io/[project-id]`
- Or check Sentry → Settings → Projects → Your Project → Client Keys (DSN)

## Step 2: Redeploy Your Application

After setting environment variables:

1. **Automatic**: Push a new commit to trigger redeploy
2. **Manual**: Go to Vercel → Deployments → Click "Redeploy" on latest deployment

## Step 3: Verify Sentry is Working

### Option A: Test via API Endpoint (Recommended)

A test endpoint is available at `/api/test-sentry`:

```bash
# Test from command line
curl https://your-domain.com/api/test-sentry

# Or visit in browser
https://your-domain.com/api/test-sentry
```

This will:
- ✅ Send a test message to Sentry
- ✅ Verify server-side Sentry is configured
- ✅ Return a success message

### Option B: Manual Test Error

Temporarily add this to any API route:

```typescript
import * as Sentry from '@sentry/nextjs';

// Test error
throw new Error('sentry-setup-test');
```

Or capture a test message:

```typescript
import * as Sentry from '@sentry/nextjs';
Sentry.captureMessage('sentry-hello', 'info');
```

### Option C: Check Logs

After deployment, check your Vercel logs. You should see:
- ✅ "Sentry monitoring initialized" (not "Sentry DSN not configured")

## Step 4: Verify in Sentry Dashboard

1. Go to your Sentry project dashboard
2. Check **Issues** → You should see your test event
3. Check **Releases** → You should see a release tagged with your Vercel commit SHA
4. Verify environment tags (production/preview)

## Configuration Details

### How It Works

- **Server-side** (`sentry.server.config.ts`):
  - Reads `SENTRY_DSN`
  - Auto-initializes when DSN is present
  - Uses `VERCEL_GIT_COMMIT_SHA` for release tracking
  - Filters out noise (build errors, expected errors)

- **Client-side** (`sentry.client.config.ts`):
  - Reads `NEXT_PUBLIC_SENTRY_DSN` (falls back to `SENTRY_DSN`)
  - Auto-initializes when DSN is present
  - Uses `NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA` for release tracking
  - Filters out browser extension errors and network noise

- **Monitoring** (`lib/monitoring.ts`):
  - Auto-initializes Sentry on module import
  - Provides structured logging that integrates with Sentry
  - Logs "Sentry DSN not configured" warning if missing (stops after setup)

### Current Configuration

- ✅ **Sampling**: 10% in production (0.1 traces/profiles), 100% in development
- ✅ **Error Filtering**: Filters out build errors, expected business errors, dev noise
- ✅ **Release Tracking**: Uses Vercel commit SHA automatically
- ✅ **Environment Tagging**: Uses `NODE_ENV` (production/preview/development)

## Troubleshooting

### "Sentry DSN not configured" warning persists

- ✅ Check environment variables are set correctly in Vercel
- ✅ Ensure variables are set for **Production** and **Preview** environments
- ✅ Redeploy after setting variables
- ✅ Check Vercel logs for environment variable loading

### Events not appearing in Sentry

- ✅ Verify DSN is correct (copy from Sentry dashboard)
- ✅ Check Sentry project is active
- ✅ Verify rate limits aren't exceeded
- ✅ Check Sentry dashboard filters (date range, environment)

### Source maps not working

- ✅ Ensure `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT` are set
- ✅ Verify auth token has `project:releases` permission
- ✅ Check build logs for source map upload messages
- ✅ Verify org/project slugs match your Sentry project

### Client-side errors not tracked

- ✅ Set `NEXT_PUBLIC_SENTRY_DSN` (required for client-side)
- ✅ Verify it's set for **Production** and **Preview** environments
- ✅ Check browser console for Sentry initialization errors

## Next Steps

1. ✅ Set up Sentry alerts for critical errors
2. ✅ Configure release tracking and performance monitoring
3. ✅ Set up Sentry integrations (Slack, email notifications)
4. ✅ Review and tune error filters as needed

## Support

- Sentry Docs: https://docs.sentry.io/platforms/javascript/guides/nextjs/
- Vercel Environment Variables: https://vercel.com/docs/concepts/projects/environment-variables

