# ¯ JobPing

> AI-powered job matching for early-career roles across Europe. 5 perfect matches, weekly.

[![TypeScript](https://img.shields.io/badge/TypeScript-100%25-blue)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![Production](https://img.shields.io/badge/Status-Live-green)](https://getjobping.com)

## What It Does

Weekly AI-matched job recommendations for internships, graduate schemes, and junior roles across European cities. No spam, just 5 high-quality matches delivered every week straight to your inbox.

**Live**: [getjobping.com](https://getjobping.com)

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS, Framer Motion
- **Backend**: Next.js API Routes (Serverless)
- **Database**: Supabase (PostgreSQL with RLS)
- **Auth**: Custom email verification system
- **Payments**: Stripe subscriptions
- **Email**: Resend with custom templates
- **AI**: OpenAI GPT-3.5/GPT-4 for job matching
- **Job Sources**: Adzuna, Reed, JobSpy (LinkedIn, Indeed, Glassdoor)
- **Hosting**: Vercel Edge Network
- **Monitoring**: Sentry + structured logging
- **Testing**: Jest (unit/integration), Playwright (E2E)

## Quick Start

### Prerequisites

- Node.js 20+
- Supabase account
- Resend API key
- OpenAI API key
- Stripe account (for payments)

### Installation

```bash
# Clone repository
git clone https://github.com/yourusername/jobping.git
cd jobping

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Add your API keys to .env

# Start development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## Environment Variables

See `.env.example` for required variables:

```bash
# Database
DATABASE_URL=postgresql://...
SUPABASE_SERVICE_ROLE_KEY=...

# Email
RESEND_API_KEY=re_...

# AI
OPENAI_API_KEY=sk-...

# Payments
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...

# System
SYSTEM_API_KEY=... # Generate: openssl rand -hex 32
NEXT_PUBLIC_URL=https://getjobping.com
```

## Key Features

### ¤– AI-Powered Matching
- GPT-3.5 for fast matching (90% of requests)
- GPT-4 for complex profiles (10% threshold)
- 48-hour shared cache for cost optimization
- Per-user duplicate prevention

###  Smart Email Delivery
- Purple-branded emails matching website design
- Hot match highlighting (90%+ scores)
- Feedback system for AI learning
- Engagement tracking

###  Security
- Row-level security on all tables
- Rate limiting per endpoint
- Input validation with Zod
- CSRF protection
- API key authentication

###  Job Scraping
- Multi-source aggregation (Adzuna, Reed, JobSpy)
- Automatic deduplication
- Quality filtering
- Daily automated runs via GitHub Actions

### ³ Subscriptions
- Free tier: 5 jobs/week
- Premium tier: 15 jobs/week (Mon/Wed/Fri)
- Stripe integration
- Promo code system

## Project Structure

```
jobping/
 app/                      # Next.js app directory
‚    api/                 # API routes
‚   ‚    subscribe/       # User signup
‚   ‚    match-users/     # AI matching
‚   ‚    webhook-tally/   # Form integration
‚   ‚    webhooks/stripe/ # Payment webhooks
‚    components/          # React components
‚    (marketing)/         # Marketing pages
 components/              # Shared UI components
‚    sections/           # Landing page sections
 lib/                     # Core utilities
‚    auth.ts            # Authentication
‚    monitoring.ts      # Logging & metrics
‚    errors.ts          # Error handling
 Utils/                   # Business logic
‚    email/             # Email templates & sending
‚    matching/          # AI matching engine
‚    supabase.ts        # Database client
 scripts/                 # Automation scripts
‚    jobspy-save.cjs    # JobSpy scraper
‚    adzuna-categories-scraper.cjs
 .github/workflows/       # CI/CD automation
     scrape-jobs.yml    # Automated scraping
```

## Development

### Available Scripts

```bash
# Development
npm run dev              # Start dev server (localhost:3000)
npm run build            # Production build
npm run start            # Start production server

# Testing
npm test                 # Run unit tests
npm run test:coverage    # Generate coverage report
npm run test:e2e         # Run Playwright E2E tests

# Quality
npm run lint             # ESLint
npm run type-check       # TypeScript validation

# Database
npm run cleanup:jobs     # Clean low-quality jobs
```

### Testing

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# E2E tests
npm run test:e2e

# Coverage report
npm run test:coverage
open coverage/lcov-report/index.html
```

## Architecture Highlights

### Job Matching Flow

```
1. User signs up via Tally form
   †
2. Webhook triggers instant matching
   †
3. AI analyzes job pool (pre-filtered by location/experience)
   †
4. Top 5 matches saved to database
   †
5. Welcome email sent with matched jobs
   †
6. Weekly emails continue (Thursday for free, Mon/Wed/Fri for premium)
```

### AI Matching Strategy

- **Pre-filtering**: Location, experience level, visa status (reduces pool by 90%)
- **AI scoring**: GPT analyzes top 50 pre-filtered jobs
- **Diversity**: Ensures jobs from multiple sources and cities
- **Caching**: 48-hour cache for identical user profiles (85-90% cost savings)
- **Duplicate prevention**: Per-user match tracking

### Cost Optimizations

-  Shared cache across API instances (singleton pattern)
-  Smart GPT-4 routing (only 10% of requests)
-  No description snippets in prompts (31% token reduction)
-  City clustering in cache keys
-  **Result**: $0.50/user/month † $0.05/user/month (90% reduction)

## Monitoring

### Health Check

```bash
curl https://getjobping.com/api/health
```

### Logs

```bash
# Vercel logs
vercel logs --follow

# Local logs
npm run dev # Structured JSON logging
```

### Metrics

- User signups
- Jobs scraped
- Matches created
- Emails sent
- AI cache hit rate
- API response times

## Deployment

Automatic deployment via Vercel:

- **Production**: Push to `main` † https://getjobping.com
- **Preview**: Pull requests get preview URLs

Manual deployment:

```bash
vercel --prod
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests (`npm test`)
5. Commit (`git commit -m 'Add amazing feature'`)
6. Push (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## License

MIT License - see [LICENSE](./LICENSE)

## Support

- **Website**: [getjobping.com](https://getjobping.com)
- **Email**: support@getjobping.com
- **Status**: All systems operational

## Acknowledgments

Built with ¤ using:
- [Next.js](https://nextjs.org/)
- [Supabase](https://supabase.com/)
- [OpenAI](https://openai.com/)
- [Vercel](https://vercel.com/)
- [Resend](https://resend.com/)
- [Stripe](https://stripe.com/)

---

**Made by [Rhys Rowlands](https://github.com/rhysr01)** ˜•
