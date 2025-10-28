// PRODUCTION-READY EMAIL TEMPLATES (Brand-aligned + VML fallbacks)
// Safe for major clients: Gmail, Outlook, Apple Mail

import { EmailJobCard } from './types';

const COLORS = {
  bg: '#0a0a0a',
  panel: '#000000',
  white: '#ffffff',
  gray300: '#d4d4d8',
  gray400: '#a1a1aa',
  gray500: '#71717a',
  purple: '#8B5CF6',
  indigo: '#6366F1',
  emerald: '#10b981'
};

// Reusable VML button for Outlook
function vmlButton(href: string, label: string, gradientFrom: string, gradientTo: string) {
  return `
  <!--[if mso]>
  <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${href}" style="height:48px;v-text-anchor:middle;width:280px;" arcsize="12%" fillcolor="${gradientFrom}" strokecolor="${gradientFrom}">
    <w:anchorlock/>
    <center style="color:#ffffff;font-family:Arial, sans-serif;font-size:16px;font-weight:700;">${label}</center>
  </v:roundrect>
  <![endif]-->
  <!--[if !mso]><!-- -->
  <a href="${href}" target="_blank" rel="noopener noreferrer" style="display:inline-block;background: linear-gradient(90deg, ${gradientFrom}, ${gradientTo});color:#ffffff;padding:14px 28px;border-radius:10px;text-decoration:none;font-weight:700;font-size:16px;box-shadow:0 4px 20px rgba(99,102,241,0.3);">
    ${label}
  </a>
  <!--<![endif]-->
  `;
}

// Shared wrapper (tables for maximum compatibility)
function wrapEmail(title: string, body: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="x-ua-compatible" content="ie=edge" />
  <title>${title}</title>
  <style>
    /* Client resets */
    html, body { margin:0; padding:0; }
    img { border:0; height:auto; line-height:100%; outline:none; text-decoration:none; }
    table { border-collapse:collapse !important; }
    body, table, td, a { -ms-text-size-adjust:100%; -webkit-text-size-adjust:100%; }

    /* Layout */
    .container { width:100%; background:${COLORS.bg}; }
    .shell { width:100%; max-width:600px; margin:0 auto; background:${COLORS.panel}; }
    .header { background: linear-gradient(135deg, ${COLORS.indigo} 0%, #7C3AED 50%, ${COLORS.purple} 100%); padding:40px 32px; text-align:center; }
    .logo { font-family: Arial, sans-serif; font-weight:800; font-size:32px; color:${COLORS.white}; letter-spacing:-0.5px; text-shadow:0 2px 10px rgba(0,0,0,0.3); }
    .tag { color:${COLORS.white}; opacity:0.95; font-size:12px; font-weight:600; letter-spacing:1.2px; text-transform:uppercase; }
    .content { padding:36px 28px; }
    .title { font-family: Arial, sans-serif; color:${COLORS.white}; font-size:28px; font-weight:800; letter-spacing:-0.4px; margin:0 0 8px 0; }
    .text { font-family: Arial, sans-serif; color:${COLORS.gray400}; font-size:15px; line-height:1.6; margin:0 0 14px 0; }
    .pill { display:inline-block; background:${COLORS.panel}; color:${COLORS.white}; border:1px solid rgba(99,102,241,0.25); padding:10px 16px; border-radius:999px; font-weight:700; box-shadow:0 0 24px rgba(139,92,246,0.25); }

    /* Card */
    .card { background:#111111; border:1px solid rgba(99,102,241,0.2); border-radius:14px; padding:22px; margin:18px 0; box-shadow:0 4px 20px rgba(99,102,241,0.15); }
    .card.hot { border:2px solid rgba(139,92,246,0.6); background:linear-gradient(135deg, rgba(99,102,241,0.08), rgba(139,92,246,0.05)); box-shadow:0 8px 32px rgba(99,102,241,0.25); }
    .badge { display:inline-block; background:linear-gradient(135deg, ${COLORS.purple}, ${COLORS.indigo}); color:#fff; padding:6px 12px; border-radius:8px; font-weight:700; font-size:12px; margin-bottom:10px; }
    .job { color:${COLORS.white}; font-weight:700; font-size:18px; margin:0 0 6px 0; font-family: Arial, sans-serif; }
    .company { color:${COLORS.gray400}; font-weight:600; font-size:14px; margin:0 0 4px 0; font-family: Arial, sans-serif; }
    .loc { color:${COLORS.gray500}; font-size:13px; margin:0 0 10px 0; font-family: Arial, sans-serif; }
    .desc { color:#aaaaaa; font-size:14px; line-height:1.6; margin:10px 0; font-family: Arial, sans-serif; }
    .score { display:inline-block; background:linear-gradient(135deg, ${COLORS.indigo}, ${COLORS.purple}); color:#fff; padding:8px 14px; border-radius:16px; font-weight:800; font-size:12px; }

    .footer { border-top:1px solid rgba(99,102,241,0.15); padding:28px 20px; text-align:center; }
    .footer-logo { color:${COLORS.purple}; font-weight:700; font-size:16px; font-family: Arial, sans-serif; }
    .footer-text { color:${COLORS.gray500}; font-size:12px; margin:8px 0; font-family: Arial, sans-serif; }
    .footer-link { color:#667eea; text-decoration:none; font-weight:700; }

    @media (max-width:600px) { .content { padding:28px 20px; } .title { font-size:24px; } }
  </style>
</head>
<body style="margin:0; background:${COLORS.bg};">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" class="container">
    <tr>
      <td>
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" class="shell">
          <tr>
            <td class="header">
              <div class="logo">JobPing</div>
              <div class="tag">AI Powered Job Matching for Europe</div>
            </td>
          </tr>
          ${body}
          <tr>
            <td class="footer">
              <div class="footer-logo">JobPing</div>
              <div class="footer-text"><a class="footer-link" href="https://getjobping.com/legal/unsubscribe">Unsubscribe</a></div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

export function createWelcomeEmail(userName?: string, matchCount: number = 5): string {
  const name = userName ? `, ${userName}` : '';
  const body = `
  <tr>
    <td class="content" align="center">
      <div class="pill">${matchCount} hand‑picked roles waiting</div>
      <h1 class="title">Welcome${name}</h1>
      <p class="text">We’ll send you roles you can actually get — not a job board dump.</p>
      <p class="text">Look out for your first set within 48 hours. Then we keep them coming weekly.</p>
      ${vmlButton('https://getjobping.com', 'Show me my matches', COLORS.indigo, COLORS.purple)}
      <p class="text" style="color:${COLORS.gray500}; font-size:12px; margin-top:12px;">Changed your mind? Update preferences anytime from any email.</p>
    </td>
  </tr>`;
  return wrapEmail('Welcome to JobPing', body);
}

export function createJobMatchesEmail(
  jobCards: EmailJobCard[],
  userName?: string,
  subscriptionTier: 'free' | 'premium' = 'free',
  isSignupEmail: boolean = false,
): string {
  const title = isSignupEmail ? 'Your first matches just landed' : 'Fresh roles for you';
  const header = `
  <tr>
    <td class="content" align="left">
      ${subscriptionTier === 'premium' ? '<div class="badge">Premium member</div>' : ''}
      <h1 class="title">${title}</h1>
      <p class="text">${userName ? `${userName}, ` : ''}these are shortlisted for speed. 60‑second skim. One‑click apply.</p>
    </td>
  </tr>`;

  const items = jobCards.map((c) => {
    const score = c.matchResult?.match_score ?? 85;
    const hot = score >= 90;
    const desc = c.job.description ? c.job.description.slice(0, 200) + (c.job.description.length > 200 ? '…' : '') : '';
    const apply = c.job.job_url ? vmlButton(c.job.job_url, 'Apply now', COLORS.indigo, COLORS.purple) : '';
    return `
    <tr><td class="content">
      <div class="card${hot ? ' hot' : ''}">
        ${hot ? '<div class="badge">Hot match ' + score + '%</div>' : '<span class="score">' + score + '% Match</span>'}
        <div class="job">${c.job.title || 'Job Title'}</div>
        <div class="company">${c.job.company || 'Company'}</div>
        <div class="loc">${c.job.location || 'Location'}</div>
        ${desc ? '<div class="desc">' + desc + '</div>' : ''}
        ${apply}
      </div>
    </td></tr>`;
  }).join('');

  // Feedback block (overall email rating) using first job's user_email if present
  const userEmail = (jobCards[0] as any)?.job?.user_email || '';
  const feedback = `
  <tr>
    <td class="content" align="center">
      <p class="text" style="margin-bottom:10px;">How useful were these matches?</p>
      <table role="presentation" cellpadding="0" cellspacing="6">
        <tr>
          <td>${vmlButton(`https://getjobping.com/api/feedback/email?action=positive&score=5&email=${encodeURIComponent(userEmail)}`, 'Loved it', COLORS.purple, COLORS.indigo)}</td>
          <td>${vmlButton(`https://getjobping.com/api/feedback/email?action=positive&score=4&email=${encodeURIComponent(userEmail)}`, 'Good', COLORS.purple, COLORS.indigo)}</td>
        </tr>
        <tr>
          <td>${vmlButton(`https://getjobping.com/api/feedback/email?action=neutral&score=3&email=${encodeURIComponent(userEmail)}`, 'It’s fine', COLORS.indigo, COLORS.purple)}</td>
          <td>${vmlButton(`https://getjobping.com/api/feedback/email?action=negative&score=2&email=${encodeURIComponent(userEmail)}`, 'Not great', COLORS.indigo, COLORS.purple)}</td>
        </tr>
        <tr>
          <td colspan="2" align="center">${vmlButton(`https://getjobping.com/api/feedback/email?action=negative&score=1&email=${encodeURIComponent(userEmail)}`, 'Not relevant', COLORS.indigo, COLORS.purple)}</td>
        </tr>
      </table>
    </td>
  </tr>`;

  return wrapEmail('Your Job Matches', header + items + feedback);
}
