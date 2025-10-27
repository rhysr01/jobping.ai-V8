/**
 * Alerting System
 * Sends alerts for critical system issues
 */

import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

export interface Alert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  component: string;
  message: string;
  timestamp: string;
  resolved: boolean;
  metadata?: any;
}

export interface AlertConfig {
  email: {
    enabled: boolean;
    recipients: string[];
  };
  slack: {
    enabled: boolean;
    webhook_url?: string;
  };
  database: {
    enabled: boolean;
  };
}

export class AlertingSystem {
  private supabase: any;
  private resend: Resend;
  private config: AlertConfig;
  private alertCache: Map<string, number> = new Map();
  private cooldownPeriod = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    this.resend = new Resend(process.env.RESEND_API_KEY);

    this.config = {
      email: {
        enabled: !!process.env.RESEND_API_KEY,
        recipients: process.env.ALERT_EMAIL_RECIPIENTS?.split(',') || []
      },
      slack: {
        enabled: !!process.env.SLACK_WEBHOOK_URL,
        webhook_url: process.env.SLACK_WEBHOOK_URL
      },
      database: {
        enabled: true
      }
    };
  }

  async sendAlert(
    type: 'critical' | 'warning' | 'info',
    component: string,
    message: string,
    metadata?: any
  ): Promise<void> {
    const alertId = `${component}_${type}_${Date.now()}`;
    const timestamp = new Date().toISOString();

    // Check cooldown to prevent spam
    const lastAlert = this.alertCache.get(alertId);
    if (lastAlert && Date.now() - lastAlert < this.cooldownPeriod) {
      console.log(` Alert ${alertId} in cooldown, skipping`);
      return;
    }

    const alert: Alert = {
      id: alertId,
      type,
      component,
      message,
      timestamp,
      resolved: false,
      metadata
    };

    console.log(` ${type.toUpperCase()} ALERT: ${component} - ${message}`);

    // Store alert in database
    if (this.config.database.enabled) {
      await this.storeAlert(alert);
    }

    // Send notifications
    const notifications = [];

    if (this.config.email.enabled && this.config.email.recipients.length > 0) {
      notifications.push(this.sendEmailAlert(alert));
    }

    if (this.config.slack.enabled && this.config.slack.webhook_url) {
      notifications.push(this.sendSlackAlert(alert));
    }

    // Wait for all notifications to complete
    await Promise.allSettled(notifications);

    // Update cache
    this.alertCache.set(alertId, Date.now());
  }

  private async storeAlert(alert: Alert): Promise<void> {
    try {
      await this.supabase
        .from('system_alerts')
        .insert({
          id: alert.id,
          type: alert.type,
          component: alert.component,
          message: alert.message,
          timestamp: alert.timestamp,
          resolved: alert.resolved,
          metadata: alert.metadata
        });
    } catch (error) {
      console.error('Failed to store alert:', error);
    }
  }

  private async sendEmailAlert(alert: Alert): Promise<void> {
    try {
      const subject = ` JobPing ${alert.type.toUpperCase()}: ${alert.component}`;
      const html = this.generateEmailAlertHtml(alert);

      for (const recipient of this.config.email.recipients) {
        await this.resend.emails.send({
          from: 'alerts@getjobping.com',
          to: recipient,
          subject,
          html
        });
      }

      console.log(` Email alert sent to ${this.config.email.recipients.length} recipients`);
    } catch (error) {
      console.error('Failed to send email alert:', error);
    }
  }

  private async sendSlackAlert(alert: Alert): Promise<void> {
    try {
      const color = alert.type === 'critical' ? 'danger' : alert.type === 'warning' ? 'warning' : 'good';
      const emoji = alert.type === 'critical' ? '' : alert.type === 'warning' ? '' : '';

      const payload = {
        text: `${emoji} JobPing ${alert.type.toUpperCase()} Alert`,
        attachments: [{
          color,
          fields: [
            {
              title: 'Component',
              value: alert.component,
              short: true
            },
            {
              title: 'Message',
              value: alert.message,
              short: false
            },
            {
              title: 'Timestamp',
              value: alert.timestamp,
              short: true
            }
          ]
        }]
      };

      if (alert.metadata) {
        payload.attachments[0].fields.push({
          title: 'Details',
          value: JSON.stringify(alert.metadata, null, 2),
          short: false
        });
      }

      const response = await fetch(this.config.slack.webhook_url!, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Slack webhook failed: ${response.status}`);
      }

      console.log('± Slack alert sent');
    } catch (error) {
      console.error('Failed to send Slack alert:', error);
    }
  }

  private generateEmailAlertHtml(alert: Alert): string {
    const color = alert.type === 'critical' ? '#dc2626' : alert.type === 'warning' ? '#f59e0b' : '#3b82f6';
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; }
          .header { background: ${color}; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }
          .alert-type { font-size: 24px; font-weight: bold; margin: 0; }
          .component { font-size: 18px; margin: 10px 0 0 0; }
          .message { font-size: 16px; margin: 20px 0; }
          .metadata { background: white; padding: 15px; border-radius: 4px; margin-top: 20px; }
          .timestamp { color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 class="alert-type">${alert.type.toUpperCase()} ALERT</h1>
            <p class="component">${alert.component}</p>
          </div>
          <div class="content">
            <p class="message">${alert.message}</p>
            <p class="timestamp">${alert.timestamp}</p>
            ${alert.metadata ? `
              <div class="metadata">
                <h3>Additional Details:</h3>
                <pre>${JSON.stringify(alert.metadata, null, 2)}</pre>
              </div>
            ` : ''}
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Convenience methods for common alerts
  async alertDatabaseIssue(component: string, error: string): Promise<void> {
    await this.sendAlert('critical', 'database', `Database issue in ${component}: ${error}`, { component, error });
  }

  async alertApiFailure(endpoint: string, error: string, statusCode?: number): Promise<void> {
    await this.sendAlert('critical', 'api', `API failure: ${endpoint} - ${error}`, { endpoint, error, statusCode });
  }

  async alertEmailFailure(userEmail: string, error: string): Promise<void> {
    await this.sendAlert('warning', 'email', `Email send failed for ${userEmail}: ${error}`, { userEmail, error });
  }

  async alertQueueBacklog(pendingJobs: number): Promise<void> {
    await this.sendAlert('warning', 'queue', `Queue backlog: ${pendingJobs} pending jobs`, { pendingJobs });
  }

  async alertHighErrorRate(component: string, errorCount: number, timeWindow: string): Promise<void> {
    await this.sendAlert('warning', component, `High error rate: ${errorCount} errors in ${timeWindow}`, { errorCount, timeWindow });
  }

  async alertResourceUsage(component: string, usage: string, threshold: string): Promise<void> {
    await this.sendAlert('warning', component, `High resource usage: ${usage} (threshold: ${threshold})`, { usage, threshold });
  }

  async resolveAlert(alertId: string): Promise<void> {
    try {
      await this.supabase
        .from('system_alerts')
        .update({ resolved: true, resolved_at: new Date().toISOString() })
        .eq('id', alertId);

      console.log(` Alert ${alertId} marked as resolved`);
    } catch (error) {
      console.error('Failed to resolve alert:', error);
    }
  }

  async getActiveAlerts(): Promise<Alert[]> {
    try {
      const { data, error } = await this.supabase
        .from('system_alerts')
        .select('*')
        .eq('resolved', false)
        .order('timestamp', { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Failed to get active alerts:', error);
      return [];
    }
  }
}

// Singleton instance
export const alertingSystem = new AlertingSystem();
