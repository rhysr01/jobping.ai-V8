import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/Utils/supabase';

// Simple feedback data interface
interface SimpleFeedbackData {
  userEmail: string;
  jobHash: string;
  feedbackType: string;
  verdict: 'positive' | 'negative' | 'neutral';
  relevanceScore?: number;
  matchQualityScore?: number;
  explanation?: string;
  userPreferencesSnapshot?: Record<string, unknown>;
  jobContext?: Record<string, unknown>;
  matchContext?: Record<string, unknown>;
  timestamp: Date;
}


export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');
  const jobHash = searchParams.get('job');
  const email = searchParams.get('email');
  const score = searchParams.get('score');

  if (!action || !jobHash || !email) {
    return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
  }

  try {
    // Get job and user context for AI learning
    const supabase = getSupabaseClient();
    
    // Fetch job details
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('*')
      .eq('job_hash', jobHash)
      .single();

    if (jobError || !job) {
      console.warn(`Job not found for feedback: ${jobHash}`);
    }

    // Fetch user preferences
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (userError || !user) {
      console.warn(`User not found for feedback: ${email}`);
    }

    // Handle different feedback actions
    switch (action) {
      case 'positive':
      case 'negative':
      case 'neutral':
        await handleSimpleFeedback(action, jobHash, email, score, job, user);
        return generateThankYouPage(action, jobHash, email);
        
      case 'score':
        if (!score) {
          return NextResponse.json({ error: 'Score required for scoring action' }, { status: 400 });
        }
        await handleScoredFeedback(score, jobHash, email, job, user);
        return generateThankYouPage('scored', jobHash, email, score);
        
      case 'explain':
        return generateExplanationForm(jobHash, email, job);
        
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    console.error('Error handling email feedback:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { jobHash, email, explanation, feedbackType, verdict, score } = body;

    if (!jobHash || !email || !verdict) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get context for AI learning
    const supabase = getSupabaseClient();
    
    const { data: job } = await supabase
      .from('jobs')
      .select('*')
      .eq('job_hash', jobHash)
      .single();

    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    // Create feedback data
    const feedbackData: SimpleFeedbackData = {
      userEmail: email,
      jobHash,
      feedbackType: feedbackType || 'job_relevance',
      verdict,
      relevanceScore: score ? parseInt(score) as 1|2|3|4|5 : undefined,
      matchQualityScore: score ? parseInt(score) as 1|2|3|4|5 : undefined,
      explanation,
      userPreferencesSnapshot: user || {},
      jobContext: job || {},
      matchContext: {
        feedback_source: 'email_form',
        timestamp: new Date().toISOString()
      },
      timestamp: new Date()
    };

    // Record feedback directly to database
    await recordFeedbackToDatabase(feedbackData);

    return NextResponse.json({ 
      success: true, 
      message: 'Thank you for your feedback!' 
    });

  } catch (error) {
    console.error('Error recording feedback:', error);
    return NextResponse.json({ error: 'Failed to record feedback' }, { status: 500 });
  }
}

// Helper functions
async function handleSimpleFeedback(
  action: string, 
  jobHash: string, 
  email: string, 
  score: string | null,
  job: any,
  user: any
) {
  const verdict = action === 'positive' ? 'positive' : action === 'negative' ? 'negative' : 'neutral';
  const relevanceScore = score ? parseInt(score) as 1|2|3|4|5 : undefined;

  const feedbackData: SimpleFeedbackData = {
    userEmail: email,
    jobHash,
    feedbackType: 'job_relevance',
    verdict,
    relevanceScore,
    userPreferencesSnapshot: user || {},
    jobContext: job || {},
    matchContext: {
      feedback_source: 'email_button',
      action,
      timestamp: new Date().toISOString()
    },
    timestamp: new Date()
  };

  await recordFeedbackToDatabase(feedbackData);
}

async function handleScoredFeedback(
  score: string, 
  jobHash: string, 
  email: string,
  job: any,
  user: any
) {
  const scoreNum = parseInt(score) as 1|2|3|4|5;
  const verdict = scoreNum >= 4 ? 'positive' : scoreNum <= 2 ? 'negative' : 'neutral';

  const feedbackData: SimpleFeedbackData = {
    userEmail: email,
    jobHash,
    feedbackType: 'job_relevance',
    verdict,
    relevanceScore: scoreNum,
    matchQualityScore: scoreNum,
    userPreferencesSnapshot: user || {},
    jobContext: job || {},
    matchContext: {
      feedback_source: 'email_score',
      score: scoreNum,
      timestamp: new Date().toISOString()
    },
    timestamp: new Date()
  };

  await recordFeedbackToDatabase(feedbackData);
}

// Simple database recording function
async function recordFeedbackToDatabase(feedbackData: SimpleFeedbackData) {
  try {
    const supabase = getSupabaseClient();
    
    // Insert feedback into database
    const { error } = await supabase
      .from('user_feedback')
      .insert({
        user_email: feedbackData.userEmail,
        job_hash: feedbackData.jobHash,
        feedback_type: feedbackData.feedbackType,
        verdict: feedbackData.verdict,
        relevance_score: feedbackData.relevanceScore,
        match_quality_score: feedbackData.matchQualityScore,
        explanation: feedbackData.explanation,
        user_preferences_snapshot: feedbackData.userPreferencesSnapshot,
        job_context: feedbackData.jobContext,
        match_context: feedbackData.matchContext,
        created_at: feedbackData.timestamp.toISOString()
      });

    if (error) {
      console.error('Failed to record feedback:', error);
      // Don't throw - we want feedback to work even if DB fails
    } else {
      console.log(`✅ Feedback recorded: ${feedbackData.verdict} for job ${feedbackData.jobHash}`);
    }
  } catch (error) {
    console.error('Error recording feedback to database:', error);
    // Don't throw - we want feedback to work even if DB fails
  }
}

function generateThankYouPage(action: string, jobHash: string, email: string, score?: string) {
  const title = action === 'positive' ? 'Thanks for the feedback!' : 
                action === 'negative' ? 'Thanks for letting us know!' :
                action === 'scored' ? `Thanks for rating this ${score}/5!` :
                'Thanks for your feedback!';

  const message = action === 'positive' ? '🧠 Our AI is learning! We\'ll send you more jobs like this.' :
                  action === 'negative' ? '🧠 Our AI is learning! We\'ll avoid similar jobs in the future.' :
                  action === 'scored' ? '🧠 Our AI is getting smarter! Your rating improves future matches.' :
                  '🧠 Our AI is learning from your feedback!';

  return new NextResponse(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Feedback Received</title>
      <style>
        * { box-sizing: border-box; }
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; 
          margin: 0; 
          padding: 20px; 
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #1D1D1F;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
        .container {
          background: #FFFFFF;
          padding: 56px 48px;
          border-radius: 24px;
          text-align: center;
          max-width: 520px;
          width: 100%;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        }
        h1 { 
          color: #1D1D1F; 
          margin-bottom: 16px; 
          font-size: 32px;
          font-weight: 700;
          letter-spacing: -0.5px;
        }
        p { 
          color: #6E6E73; 
          line-height: 1.6; 
          margin-bottom: 40px; 
          font-size: 17px;
          font-weight: 400;
        }
        .success-icon {
          font-size: 64px;
          margin-bottom: 24px;
          animation: bounceIn 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }
        @keyframes bounceIn {
          0% { transform: scale(0); opacity: 0; }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); opacity: 1; }
        }
        .buttons {
          display: flex;
          gap: 12px;
          justify-content: center;
          margin-bottom: 28px;
          flex-wrap: wrap;
        }
        .btn {
          padding: 14px 28px;
          border: none;
          border-radius: 12px;
          cursor: pointer;
          font-size: 15px;
          font-weight: 600;
          text-decoration: none;
          display: inline-block;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .close-btn {
          background: #F5F5F7;
          color: #1D1D1F;
          border: 1px solid #E5E5E7;
        }
        .close-btn:hover { 
          background: #E5E5E7; 
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        .view-jobs-btn {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: #FFFFFF;
          box-shadow: 0 4px 16px rgba(102,126,234,0.4);
        }
        .view-jobs-btn:hover { 
          transform: translateY(-2px);
          box-shadow: 0 6px 24px rgba(102,126,234,0.5);
        }
        .auto-close-notice {
          font-size: 13px;
          color: #86868B;
          margin-top: 24px;
          font-weight: 500;
        }
        @media (max-width: 600px) {
          body { padding: 12px; }
          .container { padding: 40px 28px; border-radius: 20px; }
          h1 { font-size: 26px; }
          p { font-size: 16px; }
          .success-icon { font-size: 56px; }
          .buttons { flex-direction: column; }
          .btn { width: 100%; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="success-icon">✅</div>
        <h1>${title}</h1>
        <p>${message}</p>
        <div class="buttons">
          <button class="btn close-btn" onclick="window.close()">Close</button>
        </div>
        <div class="auto-close-notice">This window will close automatically in 3 seconds</div>
      </div>
      
      <script>
        // Auto-close after 3 seconds
        setTimeout(() => {
          window.close();
        }, 3000);
      </script>
    </body>
    </html>
  `, {
    headers: { 'Content-Type': 'text/html' }
  });
}

function generateExplanationForm(jobHash: string, email: string, job: any) {
  const jobTitle = job?.title || 'this job';
  
  return new NextResponse(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Tell us more</title>
      <style>
        body { 
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif; 
          margin: 0; 
          padding: 0; 
          background: #000000;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #FFFFFF;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
        .container {
          background: #111111;
          padding: 48px 40px;
          border-radius: 20px;
          border: 1px solid #1A1A1A;
          max-width: 480px;
          width: 100%;
          box-shadow: 0 16px 48px rgba(0,0,0,0.2);
          backdrop-filter: blur(8px);
        }
        h1 { 
          color: #FFFFFF; 
          margin-bottom: 40px; 
          text-align: center; 
          font-size: 28px;
          font-weight: 600;
          letter-spacing: -0.02em;
        }
        .form-group { margin-bottom: 32px; }
        label { 
          display: block; 
          margin-bottom: 12px; 
          color: #E5E5E5; 
          font-weight: 500; 
          font-size: 14px;
        }
        select, textarea { 
          width: 100%; 
          padding: 16px 20px; 
          border: 1px solid #262626; 
          border-radius: 12px; 
          font-size: 14px; 
          font-family: inherit;
          background: #1A1A1A;
          color: #FFFFFF;
          transition: all 0.2s ease;
        }
        select:focus, textarea:focus { 
          outline: none; 
          border-color: #00D4AA; 
          box-shadow: 0 0 0 3px rgba(0,212,170,0.1);
        }
        textarea { 
          min-height: 80px; 
          resize: vertical; 
        }
        .buttons {
          display: flex;
          gap: 12px;
          justify-content: center;
          margin-top: 32px;
        }
        .btn {
          padding: 12px 24px;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .btn-primary { 
          background: linear-gradient(135deg, #FFFFFF 0%, #CCCCCC 100%);
          color: #000000;
          box-shadow: 0 0 20px rgba(255,255,255,0.1);
        }
        .btn-primary:hover { 
          transform: translateY(-2px);
          box-shadow: 0 0 30px rgba(255,255,255,0.15);
        }
        .btn-secondary { 
          background: #1F1F1F; 
          color: #FFFFFF; 
          border: 1px solid #262626;
        }
        .btn-secondary:hover { 
          background: #262626;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Tell us more about ${jobTitle}</h1>
        <form id="feedbackForm">
          <div class="form-group">
            <label for="verdict">How relevant was this job?</label>
            <select id="verdict" name="verdict" required>
              <option value="">Select...</option>
              <option value="positive">👍 Good match</option>
              <option value="neutral">🤔 OK match</option>
              <option value="negative">👎 Not for me</option>
            </select>
          </div>
          
          <div class="form-group">
            <label for="explanation">Why? (optional but helpful)</label>
            <textarea 
              id="explanation" 
              name="explanation" 
              placeholder="e.g., 'Great location but wrong experience level' or 'Perfect skills match!'"
            ></textarea>
          </div>
          
          <div class="buttons">
            <button type="button" class="btn btn-secondary" onclick="window.close()">Cancel</button>
            <button type="submit" class="btn btn-primary">Submit Feedback</button>
          </div>
        </form>
      </div>
      
      <script>
        document.getElementById('feedbackForm').addEventListener('submit', async (e) => {
          e.preventDefault();
          
          const formData = new FormData(e.target);
          const data = {
            jobHash: '${jobHash}',
            email: '${email}',
            verdict: formData.get('verdict'),
            explanation: formData.get('explanation'),
            feedbackType: 'job_relevance'
          };
          
          try {
            const response = await fetch('/api/feedback/email', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(data)
            });
            
            if (response.ok) {
              alert('Thank you for your feedback!');
              window.close();
            } else {
              alert('Error submitting feedback. Please try again.');
            }
          } catch (error) {
            alert('Error submitting feedback. Please try again.');
          }
        });
      </script>
    </body>
    </html>
  `, {
    headers: { 'Content-Type': 'text/html' }
  });
}
