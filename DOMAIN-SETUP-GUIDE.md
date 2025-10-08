# 🌐 Domain Setup Guide - getjobping.com

## 🎯 Current Issue
Emails not sending because domain isn't properly configured.

## ✅ STEP 1: Configure Domain in Vercel

### Add Custom Domain
1. Go to your Vercel Dashboard
2. Select your project
3. Go to **Settings → Domains**
4. Click **"Add"**
5. Enter: `getjobping.com`
6. Click **"Add"**

### Configure DNS Records
Vercel will give you DNS records to add. In your domain provider, add:

**For getjobping.com:**
```
Type: A
Name: @ (or root)
Value: 76.76.21.21
```

**For www.getjobping.com:**
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

### Set as Production Domain
1. In Vercel → Settings → Domains
2. Find `getjobping.com` in the list
3. Click the **⋮** menu
4. Select **"Set as Production Domain"**
5. Confirm

## ✅ STEP 2: Verify Domain in Resend

### Add Domain to Resend
1. Go to: https://resend.com/domains
2. Click **"Add Domain"**
3. Enter: `getjobping.com`
4. Click **"Add Domain"**

### Add DNS Records
Resend will provide DNS records. Add these to your domain provider:

**SPF Record:**
```
Type: TXT
Name: @
Value: v=spf1 include:_spf.resend.com ~all
```

**DKIM Records (Resend will provide 3 records):**
```
Type: CNAME
Name: resend._domainkey
Value: [Provided by Resend]

Type: CNAME  
Name: resend2._domainkey
Value: [Provided by Resend]

Type: CNAME
Name: resend3._domainkey
Value: [Provided by Resend]
```

**DMARC Record:**
```
Type: TXT
Name: _dmarc
Value: v=DMARC1; p=none
```

### Wait for Verification
- DNS propagation: 5-30 minutes
- Resend will show "Verified" status when ready
- **Emails will NOT send until this shows "Verified"**

## ✅ STEP 3: Set Environment Variables in Vercel

Go to: Vercel Dashboard → Your Project → Settings → Environment Variables

### Required Variables (Add if missing):

```
RESEND_API_KEY=re_xxxxxxxxxxxxx
```
- Environment: Production, Preview, Development
- Get from: https://resend.com/api-keys

```
EMAIL_DOMAIN=getjobping.com
```
- Environment: Production, Preview, Development
- This tells the app which domain to use for emails

```
NEXT_PUBLIC_DOMAIN=getjobping.com
```
- Environment: Production, Preview, Development
- Used for links in emails

```
NEXT_PUBLIC_URL=https://getjobping.com
```
- Environment: Production, Preview, Development
- Full base URL for the app

## ✅ STEP 4: Trigger Redeployment

After adding env vars:

**Option 1: Auto-deploy**
- Make any small change (add a comment)
- Commit and push
- Vercel auto-deploys

**Option 2: Manual redeploy**
- Go to Vercel Dashboard → Deployments
- Click **⋮** on latest deployment
- Click **"Redeploy"**

## ✅ STEP 5: Test Email Delivery

### Test Endpoint
Visit: `https://getjobping.com/api/test-email-send`

This will:
- ✅ Attempt to send test email
- ✅ Show success or error message
- ✅ Display email ID if successful

### Check Resend Dashboard
Go to: https://resend.com/emails

You should see:
- Email attempts
- Delivery status (delivered/failed)
- Error messages (if any)

### Test Real Signup
1. Go to your Tally form
2. Submit with your email
3. Check inbox (and spam folder!)
4. Should receive welcome email with job matches

## 🔍 Troubleshooting

### Emails Still Not Sending?

**Check 1: Domain Verification Status**
- Go to https://resend.com/domains
- Status should be "Verified" with green checkmark
- If pending, DNS records may not be added correctly

**Check 2: Vercel Logs**
- Go to Vercel Dashboard → Deployments → Function Logs
- Look for email-related errors
- Check if `RESEND_API_KEY` is available

**Check 3: Resend Logs**
- Go to https://resend.com/emails
- Should show email attempts
- If no attempts, webhook might not be firing
- If attempts with errors, domain verification issue

**Check 4: Test with Resend's Test Domain**
Temporarily use `onboarding@resend.dev` in the code to verify everything else works.

## 📊 Verification Checklist

Before expecting emails to work:

- [ ] `getjobping.com` added to Vercel Domains
- [ ] DNS A record pointing to Vercel
- [ ] `getjobping.com` set as Production Domain in Vercel
- [ ] `getjobping.com` added to Resend
- [ ] SPF record added to DNS
- [ ] DKIM records (3) added to DNS  
- [ ] Domain shows "Verified" in Resend
- [ ] `RESEND_API_KEY` in Vercel env vars
- [ ] `EMAIL_DOMAIN=getjobping.com` in Vercel env vars
- [ ] `NEXT_PUBLIC_URL=https://getjobping.com` in Vercel env vars
- [ ] Redeployed after adding env vars

## 🎯 Most Likely Issue

**Domain not verified in Resend** - This is the #1 cause of email failures.

Check https://resend.com/domains - if `getjobping.com` isn't there with "Verified" status, that's your issue!

