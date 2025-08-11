import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendMatchedJobsEmail({
    to,
    jobs,
    userName,
    subscriptionTier = 'free',
    isSignupEmail = false,
  }: {
    to: string,
    jobs: any[],
    userName?: string,
    subscriptionTier?: 'free' | 'premium',
    isSignupEmail?: boolean,
  }) {
    const isPremium = subscriptionTier === 'premium';
    const jobLimit = isPremium ? 15 : 5;
    const emailTypeText = isSignupEmail ? 'Welcome! Here are your first' : 'Your fresh';
    
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
        <title>JobPingAI - Your Job Matches</title>
      </head>
      <body style="
        margin: 0;
        padding: 0;
        background: linear-gradient(135deg, #FFFFFF 0%, #F8F9FA 100%);
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        text-rendering: optimizeLegibility;
        font-feature-settings: 'tnum' on, 'lnum' on, 'kern' on;
        line-height: 1.6;
      ">
        <div style="
          max-width: 600px;
          margin: 0 auto;
          background: #FFFFFF;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 16px 32px rgba(0, 0, 0, 0.08), 0 4px 8px rgba(0, 0, 0, 0.04);
          margin-top: 40px;
          margin-bottom: 40px;
        ">
          <!-- Header with Subtle Gradient -->
          <div style="
            background: linear-gradient(135deg, #FAFAFA 0%, #F5F5F5 100%);
            padding: 32px 40px 24px 40px;
            border-bottom: 1px solid #EEEEEE;
          ">
            <!-- JobPingAI Logo -->
            <div style="
              text-align: center;
              margin-bottom: 16px;
            ">
              <div style="
                display: inline-block;
                font-size: 24px;
                font-weight: 900;
                letter-spacing: -0.02em;
                color: #000000;
                background: linear-gradient(135deg, #000000 0%, #333333 100%);
                -webkit-background-clip: text;
                background-clip: text;
                -webkit-text-fill-color: transparent;
              ">
                JOBPINGAI
              </div>
            </div>
          </div>
          
          <!-- Main Content -->
          <div style="
            padding: 40px;
            color: #000000;
          ">
            ${isPremium ? `
            <!-- Premium Badge -->
            <div style="
              background: linear-gradient(135deg, #000000 0%, #1A1A1A 100%);
              color: #FFFFFF;
              padding: 12px 20px;
              border-radius: 12px;
              margin-bottom: 32px;
              text-align: center;
              font-size: 13px;
              font-weight: 700;
              letter-spacing: 1px;
              text-transform: uppercase;
              box-shadow: 0 4px 8px rgba(0, 0, 0, 0.12);
            ">
              ⭐ Premium Member
            </div>
            ` : ''}
            
            <!-- Greeting -->
            <h1 style="
              font-size: 36px;
              font-weight: 800;
              margin: 0 0 16px 0;
              letter-spacing: -0.02em;
              color: #000000;
              line-height: 1.1;
            ">
              Hi${userName ? ' ' + userName : ''},
            </h1>
            
            <!-- Intro Message -->
            <p style="
              font-size: 18px;
              line-height: 1.6;
              margin: 0 0 32px 0;
              color: #333333;
              font-weight: 400;
            ">
              ${isSignupEmail ? 'Welcome to <strong style="color: #000000;">JobPingAI</strong>! 🎉' : 'Your fresh job matches are here!'}<br>
              ${emailTypeText} <strong style="color: #000000;">${jobs.length} ${isPremium ? 'premium ' : ''}AI-matched jobs</strong>:
            </p>
            
            <!-- Job Cards -->
            <div style="margin-bottom: 40px;">
              ${jobs.map((job, index) => `
                <!-- Job Card ${index + 1} -->
                <div style="
                  background: #FFFFFF;
                  border: 1px solid #EEEEEE;
                  border-radius: 12px;
                  margin-bottom: 16px;
                  padding: 24px;
                  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
                  transition: all 0.2s ease;
                  ${index === 0 ? 'border: 2px solid #000000; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.08);' : ''}
                ">
                  <div style="display: flex; align-items: flex-start; gap: 16px;">
                    <!-- Job Icon -->
                    <div style="
                      width: 40px;
                      height: 40px;
                      background: linear-gradient(135deg, #000000 0%, #1A1A1A 100%);
                      border-radius: 8px;
                      display: flex;
                      align-items: center;
                      justify-content: center;
                      flex-shrink: 0;
                    ">
                      <div style="
                        width: 20px;
                        height: 20px;
                        background: #FFFFFF;
                        border-radius: 2px;
                        position: relative;
                      ">
                        <div style="
                          position: absolute;
                          top: 6px;
                          left: 4px;
                          width: 12px;
                          height: 8px;
                          border: 2px solid #000000;
                          border-top: none;
                        "></div>
                      </div>
                    </div>
                    
                    <!-- Job Content -->
                    <div style="flex: 1; min-width: 0;">
                      <!-- Job Title & Company -->
                      <div style="margin-bottom: 12px;">
                        <h3 style="
                          margin: 0 0 4px 0;
                          font-size: 18px;
                          font-weight: 700;
                          color: #000000;
                          line-height: 1.3;
                        ">
                          <a href="${job.job_url}" target="_blank" style="
                            color: #000000;
                            text-decoration: none;
                          ">${job.title}</a>
                        </h3>
                        <p style="
                          margin: 0;
                          font-size: 14px;
                          font-weight: 500;
                          color: #666666;
                        ">${job.company}</p>
                      </div>
                      
                      <!-- Location & Details -->
                      <div style="
                        display: flex;
                        align-items: center;
                        gap: 12px;
                        margin-bottom: 12px;
                        flex-wrap: wrap;
                      ">
                        ${job.location ? `
                        <span style="
                          font-size: 13px;
                          color: #666666;
                          display: flex;
                          align-items: center;
                          gap: 4px;
                        ">
                          📍 ${job.location}
                        </span>
                        ` : ''}
                        ${isPremium && (job.match_score || index === 0) ? `
                        <span style="
                          background: linear-gradient(135deg, #000000 0%, #333333 100%);
                          color: #FFFFFF;
                          padding: 2px 8px;
                          border-radius: 6px;
                          font-size: 11px;
                          font-weight: 600;
                          letter-spacing: 0.5px;
                          text-transform: uppercase;
                        ">
                          ${job.match_score || 'Top Match'}
                        </span>
                        ` : ''}
                      </div>
                      
                      ${isPremium ? `
                      <!-- Premium Match Insights -->
                      <div style="
                        background: linear-gradient(135deg, #FAFAFA 0%, #F5F5F5 100%);
                        border-left: 3px solid #000000;
                        padding: 12px 16px;
                        border-radius: 8px;
                        margin-top: 12px;
                      ">
                        <div style="
                          font-size: 13px;
                          font-weight: 600;
                          color: #000000;
                          margin-bottom: 4px;
                        ">
                          Why it's perfect for you:
                        </div>
                        <div style="
                          font-size: 13px;
                          color: #333333;
                          line-height: 1.4;
                        ">
                          ${job.match_reason || 'Strong alignment with your skills, experience level, and career goals.'}
                        </div>
                      </div>
                      ` : job.match_reason ? `
                      <!-- Basic Match Reason -->
                      <div style="
                        font-size: 13px;
                        color: #666666;
                        font-style: italic;
                        margin-top: 8px;
                        line-height: 1.4;
                      ">
                        ${job.match_reason}
                      </div>
                      ` : ''}
                      
                      <!-- Apply Button -->
                      <div style="margin-top: 16px;">
                        <a href="${job.job_url}" target="_blank" style="
                          display: inline-block;
                          background: linear-gradient(135deg, #000000 0%, #1A1A1A 100%);
                          color: #FFFFFF;
                          padding: 10px 20px;
                          border-radius: 8px;
                          text-decoration: none;
                          font-size: 14px;
                          font-weight: 600;
                          transition: all 0.2s ease;
                        ">
                          View Job →
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              `).join('')}
            </div>
            
            ${!isPremium ? `
            <!-- Upgrade Prompt -->
            <div style="
              background: linear-gradient(135deg, #FAFAFA 0%, #F5F5F5 100%);
              border: 2px solid #EEEEEE;
              border-radius: 16px;
              padding: 32px;
              margin-bottom: 32px;
              text-align: center;
              box-shadow: 0 4px 8px rgba(0, 0, 0, 0.04);
            ">
              <h3 style="
                margin: 0 0 16px 0;
                color: #000000;
                font-size: 20px;
                font-weight: 700;
                letter-spacing: -0.01em;
              ">
                Want more opportunities? 🚀
              </h3>
              <p style="
                margin: 0 0 24px 0;
                color: #666666;
                font-size: 16px;
                line-height: 1.5;
              ">
                Premium members get <strong style="color: #000000;">15 jobs every 48 hours</strong><br>
                + detailed match insights + priority support
              </p>
              <a href="${process.env.NEXT_PUBLIC_BASE_URL}/pricing" style="
                display: inline-block;
                background: linear-gradient(135deg, #000000 0%, #1A1A1A 100%);
                color: #FFFFFF;
                padding: 14px 32px;
                border-radius: 12px;
                text-decoration: none;
                font-weight: 700;
                font-size: 16px;
                letter-spacing: -0.01em;
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.12);
                transition: all 0.2s ease;
              ">
                Upgrade to Premium
              </a>
            </div>
            ` : ''}
            
            <!-- Schedule Info -->
            <div style="
              text-align: center;
              margin-bottom: 32px;
              padding: 20px;
              background: linear-gradient(135deg, #FAFAFA 0%, #F5F5F5 100%);
              border-radius: 12px;
            ">
              <p style="
                margin: 0 0 8px 0;
                font-size: 16px;
                color: #000000;
                font-weight: 600;
              ">
                You'll get <strong>${jobLimit} ${isPremium ? 'premium ' : ''}jobs every 48 hours</strong>
              </p>
              <p style="
                margin: 0;
                font-size: 14px;
                color: #666666;
              ">
                ${isPremium ? 'Manage your subscription anytime in your account.' : 'Reply with "unsubscribe" to stop these emails.'}
              </p>
            </div>
            
            ${isSignupEmail ? `
            <!-- Welcome Next Steps -->
            <div style="
              background: linear-gradient(135deg, #E8F5E8 0%, #F0F8F0 100%);
              border-radius: 12px;
              padding: 24px;
              margin-bottom: 32px;
              text-align: center;
              border: 1px solid #D4F4D4;
            ">
              <p style="
                margin: 0;
                color: #2D5A2D;
                font-size: 16px;
                font-weight: 600;
              ">
                <strong>Next steps:</strong> Check your email every 48 hours for fresh opportunities!
              </p>
            </div>
            ` : ''}
            
          </div>
          
          <!-- Footer -->
          <div style="
            background: linear-gradient(135deg, #F5F5F5 0%, #EEEEEE 100%);
            padding: 24px 40px;
            text-align: center;
            border-top: 1px solid #EEEEEE;
          ">
            <div style="
              font-size: 20px;
              font-weight: 900;
              letter-spacing: 2px;
              color: #000000;
              margin-bottom: 8px;
            ">
              JOBPINGAI
            </div>
            <p style="
              margin: 0;
              font-size: 12px;
              color: #666666;
              letter-spacing: 0.5px;
            ">
              AI-powered job matching for ambitious professionals
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    try {
      // Dynamic subject line based on subscription and email type
      const getSubjectLine = () => {
        if (isSignupEmail) {
          return isPremium 
            ? `🎯 Welcome to JobPingAI Premium - ${jobs.length} Curated Opportunities`
            : `🎯 Welcome to JobPingAI - Your First ${jobs.length} Job Matches`;
        } else {
          return isPremium
            ? `⭐ Premium Job Matches - ${jobs.length} Exclusive Opportunities`
            : `🎯 Fresh Job Matches - ${jobs.length} New Opportunities`;
        }
      };

      const { data, error } = await resend.emails.send({
        from: 'JobPingAI <noreply@jobpingai.com>', // Update with your verified domain
        to: [to],
        subject: getSubjectLine(),
        html: html,
      });

      if (error) {
        console.error('Failed to send email:', error);
        throw error;
      }

      console.log('Email sent successfully:', data);
      return data;
    } catch (error) {
      console.error('Email sending failed:', error);
      throw error;
    }
  }

// Helper function to send welcome email for new users
export async function sendWelcomeEmail({
  to,
  userName,
  matchCount,
}: {
  to: string;
  userName?: string;
  matchCount: number;
}) {
  const html = `
    <div style="
      font-family: Helvetica, Arial, sans-serif;
      background: #fff;
      color: #181818;
      max-width: 480px;
      margin: 0 auto;
      padding: 36px 32px 28px 32px;
      border-radius: 18px;
      border: 1px solid #eee;
      box-shadow: 0 4px 16px rgba(0,0,0,0.05);
    ">
      <h2 style="
        font-size: 2rem;
        font-weight: 700;
        margin-bottom: 0.6em;
        letter-spacing: -0.5px;
        color: #000;
      ">
        Welcome to JobPingAI${userName ? ', ' + userName : ''}! 🎉
      </h2>
      <p style="font-size: 1.07rem; margin-bottom: 1.7em;">
        Your AI career assistant is now active and has found <b>${matchCount} perfect job matches</b> for you.
      </p>
      <p style="font-size: 1rem; margin-bottom: 2.2em; color:#191919;">
        Check your inbox for your first batch of AI-matched opportunities. You'll receive new matches every 48 hours.
      </p>
      <div style="
        border-top:1px solid #eee;
        margin-top:20px;
        padding-top:16px;
        text-align:center;
        font-size:13px;
        color:#111;
        font-weight: bold;
        letter-spacing: 1.7px;
      ">
        JOBPINGAI
      </div>
    </div>
  `;

  try {
    const { data, error } = await resend.emails.send({
      from: 'JobPingAI <noreply@jobpingai.com>', // Update with your verified domain
      to: [to],
      subject: '🎯 Welcome to JobPingAI - Your AI Career Assistant is Ready!',
      html: html,
    });

    if (error) {
      console.error('Failed to send welcome email:', error);
      throw error;
    }

    console.log('Welcome email sent successfully:', data);
    return data;
  } catch (error) {
    console.error('Welcome email sending failed:', error);
    throw error;
  }
}
  