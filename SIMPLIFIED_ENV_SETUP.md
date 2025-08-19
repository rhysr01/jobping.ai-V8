# 🚀 Simplified JobPing Environment Setup

## **Required Environment Variables**

Here are the **minimum** environment variables you need to get JobPing running:

### **Database & Core Services**
```bash
# Supabase Database
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# OpenAI for Job Matching
OPENAI_API_KEY=your-openai-api-key

# Email Service
RESEND_API_KEY=your-resend-api-key

# Internal API Security
SCRAPE_API_KEY=your-own-generated-secure-key
```

### **Optional Services**
```bash
# Stripe (only if you want payments)
STRIPE_SECRET_KEY=your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=your-stripe-webhook-secret

# Redis (for better performance)
REDIS_URL=redis://localhost:6379

# Notifications (completely optional)
SLACK_WEBHOOK_URL=your-slack-webhook-url
DISCORD_WEBHOOK_URL=your-discord-webhook-url

# Proxy (for enhanced scraping)
BRIGHTDATA_PROXY_URL=your-proxy-url
ENABLE_PROXY=true
```

## **How to Get These Keys**

### **1. SCRAPE_API_KEY** - You Create This!
Generate a secure random string:
```bash
# Option 1: Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Option 2: Make your own
# Use something like: scrape_jobping_2024_x9k2m8n4p7q1w5e8r3t6y
```

### **2. Supabase Keys**
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Go to Settings → API
4. Copy the "URL" and "service_role" key

### **3. OpenAI API Key**
1. Go to [platform.openai.com](https://platform.openai.com)
2. Create an account
3. Go to API Keys
4. Create a new key

### **4. Resend API Key**
1. Go to [resend.com](https://resend.com)
2. Sign up
3. Go to API Keys
4. Create a new key

## **Setting Up in Vercel**

1. **Go to Vercel Dashboard** → Your Project → Settings → Environment Variables
2. **Add each variable** one by one
3. **Set Environment**: Choose "Production" (and Preview/Development if needed)
4. **Redeploy**: Your app will automatically redeploy

## **What Runs Without Optional Variables**

✅ **Works Fine Without:**
- Slack/Discord webhooks (notifications just go to console logs)
- Redis (uses in-memory cache instead)
- Stripe (payment features disabled)
- Proxy services (direct scraping)

❌ **Won't Work Without:**
- Supabase keys (database required)
- OpenAI key (job matching required)
- Resend key (email features required)
- SCRAPE_API_KEY (API security required)

## **Quick Start**

1. **Copy the required variables** to your Vercel environment
2. **Generate your SCRAPE_API_KEY** 
3. **Deploy** - everything else is optional!

Your JobPing system will work with just the 5 required environment variables. All the optional features can be added later as needed.
