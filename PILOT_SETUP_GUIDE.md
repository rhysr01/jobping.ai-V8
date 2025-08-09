# 🚀 PILOT SETUP GUIDE

## **CRITICAL: Environment Variables Setup**

Your JobPingAI system is **85% ready** for the 20-user pilot! The main issue is missing environment variables. Here's how to fix it:

---

## 🔧 **STEP 1: Environment Variables Setup**

### **Required Environment Variables**

Create or update your `.env.local` file with these variables:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key

# Email Service (Resend)
RESEND_API_KEY=your_resend_api_key

# Redis (Optional - for rate limiting)
REDIS_URL=your_redis_url

# Application URL
NEXT_PUBLIC_URL=http://localhost:3000
```

### **How to Get These Values**

#### **1. Supabase Setup**
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to Settings > API
4. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **Service Role Key** → `SUPABASE_SERVICE_ROLE_KEY`

#### **2. OpenAI Setup**
1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Create a new API key
3. Copy the key → `OPENAI_API_KEY`

#### **3. Resend Setup (Email Service)**
1. Go to [Resend Dashboard](https://resend.com)
2. Create an account and verify your domain
3. Go to API Keys
4. Create a new API key → `RESEND_API_KEY`

#### **4. Redis Setup (Optional)**
1. Use [Upstash Redis](https://upstash.com) (free tier available)
2. Create a new database
3. Copy the connection string → `REDIS_URL`

---

## 🗄️ **STEP 2: Database Migration**

### **Execute Email Verification Migration**

Run this SQL in your Supabase dashboard:

```sql
-- Migration: Add email verification fields to users table
-- Run this migration to add email verification support

-- Add email verification columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS verification_token TEXT;

-- Create index for verification token lookups
CREATE INDEX IF NOT EXISTS idx_users_verification_token ON users(verification_token) WHERE verification_token IS NOT NULL;

-- Create index for email verification status
CREATE INDEX IF NOT EXISTS idx_users_email_verified ON users(email_verified) WHERE email_verified = FALSE;

-- Add comment to document the new fields
COMMENT ON COLUMN users.email_verified IS 'Whether the user has verified their email address';
COMMENT ON COLUMN users.verification_token IS 'Temporary token for email verification (24-hour expiry)';
```

---

## 🧪 **STEP 3: Testing the System**

### **1. Test Environment Variables**
```bash
# Check if environment variables are loaded
node test-env.js
```

### **2. Test Email Verification**
```bash
# Run comprehensive pilot tests
npm run test:pilot

# Test just verification flow
npm run test:verification

# Test system health
npm run test:health
```

### **3. Manual Testing**
1. **Register a test user** via your Tally form
2. **Check email** for verification link
3. **Click verification link** to activate account
4. **Verify AI matching** works for activated user
5. **Test email delivery** and formatting

---

## 📊 **STEP 4: Pilot Launch Checklist**

### **Pre-Launch (24 hours before)**
- [ ] **Environment variables configured**
- [ ] **Database migration executed**
- [ ] **Email verification tested**
- [ ] **AI matching working**
- [ ] **Rate limits configured**
- [ ] **Monitoring active**
- [ ] **Support team ready**

### **Launch Day**
- [ ] **System health check**
- [ ] **User onboarding materials ready**
- [ ] **Support channels open**
- [ ] **Monitoring dashboard active**
- [ ] **Team notifications configured**

### **Post-Launch (First 24 hours)**
- [ ] **Monitor user registrations**
- [ ] **Track email verification rates**
- [ ] **Monitor AI matching performance**
- [ ] **Collect user feedback**
- [ ] **Address any issues immediately**

---

## 🎯 **STEP 5: Success Metrics**

### **Technical Success**
- System uptime >99%
- Response time <2s
- Error rate <1%
- Email delivery >95%

### **User Success**
- Registration completion >80%
- Email verification >70%
- User satisfaction >4/5
- Feature adoption >60%

---

## 🚨 **TROUBLESHOOTING**

### **Common Issues**

#### **1. Environment Variables Not Loading**
```bash
# Check if .env.local exists
ls -la .env.local

# Test environment variables
node test-env.js
```

#### **2. Supabase Connection Issues**
```bash
# Test Supabase connection
curl -X GET "https://your-project.supabase.co/rest/v1/" \
  -H "apikey: your_service_role_key" \
  -H "Authorization: Bearer your_service_role_key"
```

#### **3. Email Verification Not Working**
- Check Resend API key is valid
- Verify domain is configured in Resend
- Check email templates are correct

#### **4. AI Matching Failing**
- Verify OpenAI API key is valid
- Check API quota and limits
- Review error logs

---

## 📞 **SUPPORT**

### **Technical Issues**
- **Primary**: System Administrator
- **Secondary**: DevOps Team
- **Escalation**: CTO

### **User Support**
- **Primary**: Customer Success
- **Secondary**: Product Team
- **Escalation**: Head of Product

---

## 🎉 **READY TO LAUNCH!**

Once you've completed these steps:

1. **Environment variables are configured**
2. **Database migration is executed**
3. **Email verification is tested**
4. **AI matching is working**

**You're ready to launch your 20-user pilot! 🚀**

---

## 📝 **NEXT STEPS**

1. **Set up environment variables** (Step 1)
2. **Run database migration** (Step 2)
3. **Test the system** (Step 3)
4. **Launch pilot** (Step 4)
5. **Monitor and iterate** (Step 5)

**Good luck with your pilot! 🎯**
