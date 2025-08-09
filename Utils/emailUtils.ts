import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendMatchedJobsEmail({
    to,
    jobs,
    userName,
  }: {
    to: string,
    jobs: any[],
    userName?: string,
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
          Hi${userName ? ' ' + userName : ''},
        </h2>
        <p style="font-size: 1.07rem; margin-bottom: 1.7em;">
          Thanks for joining <b>JobPingAI</b>.<br>
          Here are your <b>5 AI-matched jobs</b> based on your form:
        </p>
        <ol style="padding-left: 20px; margin-bottom: 2.5em;">
          ${jobs.map(job => `
            <li style="margin-bottom: 1.45em;">
              <a href="${job.job_url}" target="_blank" style="
                color: #000;
                font-weight: 600;
                text-decoration: underline;
                font-size: 1.08rem;
              ">
                ${job.title}
              </a>
              <span style="color: #444; font-weight: 500;"> at ${job.company}</span>
              <span style="color: #222; font-size: 0.98rem;"> (${job.location})</span>
              <div style="font-style: italic; color: #6c6c6c; font-size: 0.98rem; margin-top: 4px;">
                ${job.match_reason || ''}
              </div>
            </li>
          `).join('')}
        </ol>
        <p style="font-size: 1rem; margin-bottom: 2.2em; color:#191919;">
          You'll get <b>5 new jobs every 48 hours</b>.<br>
          <span style="color:#888;">If you want to stop these emails, just reply with "unsubscribe."</span>
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
        subject: `🎯 Your AI-Matched Jobs - ${jobs.length} Opportunities Found`,
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
  