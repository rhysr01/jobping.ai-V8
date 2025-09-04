// 🎯 CLEAN EMAIL TEMPLATE SYSTEM - NO BS, JUST FUNCTIONALITY

export interface EmailJobCard {
  job: any;
  matchResult: any;
  isConfident: boolean;
  isPromising: boolean;
}

export function createJobMatchingEmail(
  jobCards: EmailJobCard[],
  userName?: string,
  subscriptionTier: 'free' | 'premium' = 'free',
  isSignupEmail: boolean = false
): string {
  const isPremium = subscriptionTier === 'premium';
  const emailTypeText = isSignupEmail ? 'Welcome! Here are your first' : 'Your fresh';
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>🎯 Your AI-Curated Job Matches</title>
  <style>
    /* Mobile-first CSS */
    body { 
      margin: 0; 
      padding: 0; 
      background: #F0F0F0; 
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; 
      line-height: 1.6; 
    }
    .email-container { 
      max-width: 600px; 
      margin: 0 auto; 
      background: #FFFFFF; 
    }
    .header { 
      background: linear-gradient(135deg, #0B0B0F 0%, #1F1F23 100%); 
      padding: 40px 20px; 
      text-align: center; 
    }
    .jobping-logo { 
      font-size: 32px; 
      font-weight: 900; 
      color: #FFFFFF; 
      margin-bottom: 8px; 
    }
    .tagline { 
      color: #D1D5DB; 
      font-size: 16px; 
      font-weight: 500; 
    }
    
    .job-card { 
      background: #F8F9FA; 
      border-radius: 16px; 
      padding: 24px; 
      margin: 20px 0; 
      border-left: 4px solid #10B981; 
    }
    .job-title { 
      font-size: 20px; 
      font-weight: 700; 
      color: #1A1A1A; 
      margin-bottom: 8px; 
    }
    .job-company { 
      color: #6B7280; 
      font-weight: 600; 
      margin-bottom: 4px; 
    }
    .job-location { 
      color: #9CA3AF; 
      font-size: 14px; 
      margin-bottom: 12px; 
    }
    .match-score { 
      background: #10B981; 
      color: white; 
      padding: 4px 12px; 
      border-radius: 20px; 
      font-size: 12px; 
      font-weight: 600; 
    }
    
    .cta-button { 
      background: #10B981; 
      color: white; 
      padding: 16px 32px; 
      border-radius: 12px; 
      text-decoration: none; 
      font-weight: 600; 
      display: inline-block; 
      margin: 20px 0; 
    }
    
    .premium-badge { 
      background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%); 
      color: #1A1A1A; 
      padding: 8px 16px; 
      border-radius: 20px; 
      margin-bottom: 24px; 
      text-align: center; 
      font-size: 12px; 
      font-weight: 700; 
      letter-spacing: 0.5px; 
      text-transform: uppercase; 
      display: inline-block; 
      width: 100%; 
      box-sizing: border-box; 
    }
    
    @media (max-width: 600px) {
      .email-container { margin: 0; border-radius: 0; }
      .header { padding: 30px 15px; }
      .job-card { margin: 15px; padding: 20px; }
      .job-title { font-size: 18px; }
    }
  </style>
</head>
<body>
  <div class="email-container">
    <!-- Header with strong branding -->
    <div class="header">
      <div class="jobping-logo">🎯 JobPing</div>
      <div class="tagline">AI-Powered Job Matching for EU Tech</div>
    </div>
    
    <!-- Main content -->
    <div style="padding: 40px 32px; text-align: center;">
      ${isPremium ? '<div class="premium-badge">⭐ Premium Member</div>' : ''}
      
      <!-- Personalized greeting -->
      <h1 style="font-size: 28px; color: #1A1A1A; margin-bottom: 16px;">
        Hi ${userName || 'there'} 👋
      </h1>
      
      <p style="font-size: 18px; color: #4A4A4A; margin-bottom: 32px;">
        ${emailTypeText} ${jobCards.length} AI-curated job matches:
      </p>
      
      <!-- Job Cards -->
      ${jobCards.map((card, index) => `
        <div class="job-card">
          <div class="job-title">${card.job.title || 'Job Title'}</div>
          <div class="job-company">${card.job.company || 'Company'}</div>
          <div class="job-location">${card.job.location || 'Location'}</div>
          <div style="margin-top: 16px;">
            <span class="match-score">${card.matchResult?.match_score || 85}% Match</span>
          </div>
        </div>
      `).join('')}
      
      <!-- Strong CTA -->
      <a href="https://jobping.ai/dashboard" class="cta-button">
        View All Matches →
      </a>
      
      <!-- Footer -->
      <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #E5E7EB; color: #6B7280; font-size: 14px;">
        <p>You're receiving this because you signed up for JobPing.</p>
        <p><a href="https://jobping.ai/legal/unsubscribe" style="color: #10B981;">Unsubscribe</a> | <a href="https://jobping.ai/dashboard/preferences" style="color: #10B981;">Email Preferences</a></p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

export function createWelcomeEmail(
  userName?: string,
  matchCount: number = 5
): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>🎯 Welcome to JobPing</title>
  <style>
    body { 
      margin: 0; 
      padding: 0; 
      background: #F0F0F0; 
      font-family: 'Inter', sans-serif; 
      line-height: 1.6; 
    }
    .email-container { 
      max-width: 600px; 
      margin: 0 auto; 
      background: #FFFFFF; 
    }
    .header { 
      background: linear-gradient(135deg, #0B0B0F 0%, #1F1F23 100%); 
      padding: 40px 20px; 
      text-align: center; 
    }
    .jobping-logo { 
      font-size: 32px; 
      font-weight: 900; 
      color: #FFFFFF; 
      margin-bottom: 8px; 
    }
    .tagline { 
      color: #D1D5DB; 
      font-size: 16px; 
      font-weight: 500; 
    }
    
    .cta-button { 
      background: #10B981; 
      color: white; 
      padding: 16px 32px; 
      border-radius: 12px; 
      text-decoration: none; 
      font-weight: 600; 
      display: inline-block; 
      margin: 20px 0; 
    }
    
    @media (max-width: 600px) {
      .email-container { margin: 0; border-radius: 0; }
      .header { padding: 30px 15px; }
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <div class="jobping-logo">🎯 JobPing</div>
      <div class="tagline">AI-Powered Job Matching for EU Tech</div>
    </div>
    
    <div style="padding: 40px 32px; text-align: center;">
      <h1 style="font-size: 28px; color: #1A1A1A; margin-bottom: 16px;">
        Welcome${userName ? ', ' + userName : ''}! 🎉
      </h1>
      
      <p style="font-size: 18px; color: #4A4A4A; margin-bottom: 32px;">
        Your AI career assistant is now active and has found <strong style="color: #1A1A1A;">${matchCount} perfect job matches</strong> for you.
      </p>
      
      <p style="font-size: 16px; color: #666666; margin-bottom: 40px;">
        Check your inbox for your first batch of AI-matched opportunities. You'll receive new matches every 48 hours.
      </p>
      
      <a href="https://jobping.ai/dashboard" class="cta-button">
        View Your Matches →
      </a>
      
      <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #E5E7EB; color: #6B7280; font-size: 14px;">
        <p>You're receiving this because you signed up for JobPing.</p>
        <p><a href="https://jobping.ai/legal/unsubscribe" style="color: #10B981;">Unsubscribe</a></p>
      </div>
    </div>
  </div>
</body>
</html>`;
}
