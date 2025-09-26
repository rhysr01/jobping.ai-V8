/**
 * EMAIL ENGAGEMENT TRACKING UTILITIES
 * Adds tracking pixels and click tracking to email templates
 */

import crypto from 'crypto';

export interface TrackingData {
  email: string;
  type: 'open' | 'click';
  url?: string;
}

/**
 * Generate a tracking pixel URL for email opens
 */
export function generateTrackingPixel(email: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.getjobping.com';
  const encodedEmail = encodeURIComponent(email);
  return `${baseUrl}/api/track-engagement?email=${encodedEmail}&type=email_opened`;
}

/**
 * Generate a click tracking URL for links
 */
export function generateClickTrackingUrl(originalUrl: string, email: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.getjobping.com';
  const encodedEmail = encodeURIComponent(email);
  const encodedUrl = encodeURIComponent(originalUrl);
  return `${baseUrl}/api/track-engagement?email=${encodedEmail}&type=email_clicked&url=${encodedUrl}`;
}

/**
 * Add tracking pixel to email HTML
 */
export function addTrackingPixel(html: string, email: string): string {
  const trackingPixel = generateTrackingPixel(email);
  
  // Add tracking pixel as a 1x1 transparent image at the end of the email
  const trackingImg = `<img src="${trackingPixel}" width="1" height="1" style="display:none;" alt="" />`;
  
  // Insert before closing body tag
  return html.replace('</body>', `${trackingImg}</body>`);
}

/**
 * Add click tracking to all links in email HTML
 */
export function addClickTracking(html: string, email: string): string {
  // Find all href attributes and replace with tracking URLs
  return html.replace(
    /href="([^"]+)"/g,
    (match, url) => {
      // Skip tracking URLs and mailto links
      if (url.includes('/api/track-engagement') || url.startsWith('mailto:')) {
        return match;
      }
      
      const trackingUrl = generateClickTrackingUrl(url, email);
      return `href="${trackingUrl}"`;
    }
  );
}

/**
 * Add both open and click tracking to email HTML
 */
export function addEngagementTracking(html: string, email: string): string {
  let trackedHtml = html;
  
  // Add click tracking to all links
  trackedHtml = addClickTracking(trackedHtml, email);
  
  // Add tracking pixel for opens
  trackedHtml = addTrackingPixel(trackedHtml, email);
  
  return trackedHtml;
}

/**
 * Generate a unique tracking ID for this email send
 */
export function generateTrackingId(email: string): string {
  const timestamp = Date.now();
  const random = crypto.randomBytes(8).toString('hex');
  return `${email}_${timestamp}_${random}`;
}

/**
 * Extract original URL from tracking URL
 */
export function extractOriginalUrl(trackingUrl: string): string | null {
  try {
    const url = new URL(trackingUrl);
    const originalUrl = url.searchParams.get('url');
    return originalUrl ? decodeURIComponent(originalUrl) : null;
  } catch {
    return null;
  }
}

/**
 * Validate tracking data
 */
export function validateTrackingData(data: TrackingData): boolean {
  if (!data.email || !data.type) {
    return false;
  }
  
  if (data.type === 'click' && !data.url) {
    return false;
  }
  
  return true;
}
