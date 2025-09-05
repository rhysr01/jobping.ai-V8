/**
 * Critical Alerting System for JobPing
 * 
 * ABSOLUTELY NECESSARY for 150 users - Can't operate blind
 * - Slack alerts for API failures
 * - Email alerts for database issues  
 * - Cost alerts for OpenAI budget
 */

interface AlertConfig {
  slackWebhook?: string;
  emailRecipients?: string[];
  openaiBudgetLimit?: number;
}

class CriticalAlerts {
  private config: AlertConfig;
  private errorCounts = new Map<string, number>();
  private lastAlertTime = new Map<string, number>();
  private readonly ALERT_COOLDOWN = 5 * 60 * 1000; // 5 minutes
  private readonly ERROR_THRESHOLD = 5; // Alert after 5 errors

  constructor() {
    this.config = {
      slackWebhook: process.env.SLACK_WEBHOOK_URL,
      emailRecipients: process.env.ALERT_EMAIL_RECIPIENTS?.split(','),
      openaiBudgetLimit: parseFloat(process.env.OPENAI_BUDGET_LIMIT || '100')
    };
  }

  /**
   * Alert for API failures - CRITICAL
   */
  async alertApiFailure(endpoint: string, error: string, statusCode?: number) {
    const key = `api_${endpoint}`;
    this.incrementErrorCount(key);

    if (this.shouldAlert(key)) {
      const message = `🚨 **JobPing API Failure**\n` +
        `**Endpoint:** ${endpoint}\n` +
        `**Status:** ${statusCode || 'Unknown'}\n` +
        `**Error:** ${error}\n` +
        `**Time:** ${new Date().toISOString()}\n` +
        `**Error Count:** ${this.errorCounts.get(key)}`;

      await this.sendSlackAlert(message);
      this.updateLastAlertTime(key);
    }
  }

  /**
   * Alert for database issues - CRITICAL
   */
  async alertDatabaseIssue(operation: string, error: string) {
    const key = `db_${operation}`;
    this.incrementErrorCount(key);

    if (this.shouldAlert(key)) {
      const message = `🚨 **JobPing Database Issue**\n` +
        `**Operation:** ${operation}\n` +
        `**Error:** ${error}\n` +
        `**Time:** ${new Date().toISOString()}\n` +
        `**Error Count:** ${this.errorCounts.get(key)}`;

      await this.sendSlackAlert(message);
      await this.sendEmailAlert('Database Issue', message);
      this.updateLastAlertTime(key);
    }
  }

  /**
   * Alert for OpenAI budget exceeded - CRITICAL
   */
  async alertOpenAIBudget(currentCost: number, limit: number) {
    const key = 'openai_budget';
    
    if (currentCost >= limit && this.shouldAlert(key)) {
      const message = `🚨 **JobPing OpenAI Budget Alert**\n` +
        `**Current Cost:** $${currentCost.toFixed(2)}\n` +
        `**Budget Limit:** $${limit.toFixed(2)}\n` +
        `**Time:** ${new Date().toISOString()}\n` +
        `**Status:** ${currentCost >= limit ? 'EXCEEDED' : 'WARNING'}`;

      await this.sendSlackAlert(message);
      await this.sendEmailAlert('OpenAI Budget Alert', message);
      this.updateLastAlertTime(key);
    }
  }

  /**
   * Track OpenAI usage and costs - CRITICAL for budget management
   */
  async trackOpenAIUsage(model: string, tokens: number, cost: number) {
    const key = `openai_usage_${model}`;
    this.incrementErrorCount(key); // Reusing counter for usage tracking
    
    // Alert if cost per request is unusually high
    if (cost > 0.50) { // Alert if single request costs more than $0.50
      const message = `⚠️ **JobPing High OpenAI Cost**\n` +
        `**Model:** ${model}\n` +
        `**Tokens:** ${tokens}\n` +
        `**Cost:** $${cost.toFixed(4)}\n` +
        `**Time:** ${new Date().toISOString()}`;
      
      await this.sendSlackAlert(message);
    }
    
    // Check daily budget (simplified - you might want to implement proper daily tracking)
    const dailyUsage = this.errorCounts.get('openai_daily_usage') || 0;
    const newDailyUsage = dailyUsage + cost;
    this.errorCounts.set('openai_daily_usage', newDailyUsage);
    
    if (newDailyUsage >= (this.config.openaiBudgetLimit || 100)) {
      await this.alertOpenAIBudget(newDailyUsage, this.config.openaiBudgetLimit || 100);
    }
  }

  /**
   * Alert for high error rate - CRITICAL
   */
  async alertHighErrorRate(errorRate: number, threshold: number = 10) {
    if (errorRate > threshold) {
      const message = `🚨 **JobPing High Error Rate**\n` +
        `**Current Error Rate:** ${errorRate.toFixed(1)}%\n` +
        `**Threshold:** ${threshold}%\n` +
        `**Time:** ${new Date().toISOString()}\n` +
        `**Status:** CRITICAL`;

      await this.sendSlackAlert(message);
    }
  }

  /**
   * Alert for slow response times - CRITICAL
   */
  async alertSlowResponse(endpoint: string, responseTime: number, threshold: number = 5000) {
    if (responseTime > threshold) {
      const message = `⚠️ **JobPing Slow Response**\n` +
        `**Endpoint:** ${endpoint}\n` +
        `**Response Time:** ${responseTime}ms\n` +
        `**Threshold:** ${threshold}ms\n` +
        `**Time:** ${new Date().toISOString()}`;

      await this.sendSlackAlert(message);
    }
  }

  private async sendSlackAlert(message: string) {
    if (!this.config.slackWebhook) {
      console.warn('Slack webhook not configured, skipping alert');
      return;
    }

    try {
      const response = await fetch(this.config.slackWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text: message,
          username: 'JobPing Alerts',
          icon_emoji: ':warning:',
          channel: '#alerts' // Optional: specify channel
        })
      });

      if (!response.ok) {
        console.error('Failed to send Slack alert:', response.statusText);
      } else {
        console.log('✅ Slack alert sent successfully');
      }
    } catch (error) {
      console.error('Error sending Slack alert:', error);
    }
  }

  private async sendEmailAlert(subject: string, message: string) {
    if (!this.config.emailRecipients?.length) {
      console.warn('Email recipients not configured, skipping email alert');
      return;
    }

    // For now, just log - you can integrate with SendGrid, AWS SES, etc.
    console.log(`📧 EMAIL ALERT: ${subject}\n${message}`);
    console.log(`Recipients: ${this.config.emailRecipients.join(', ')}`);
  }

  private incrementErrorCount(key: string) {
    const current = this.errorCounts.get(key) || 0;
    this.errorCounts.set(key, current + 1);
  }

  private shouldAlert(key: string): boolean {
    const errorCount = this.errorCounts.get(key) || 0;
    const lastAlert = this.lastAlertTime.get(key) || 0;
    const now = Date.now();

    return errorCount >= this.ERROR_THRESHOLD && 
           (now - lastAlert) > this.ALERT_COOLDOWN;
  }

  private updateLastAlertTime(key: string) {
    this.lastAlertTime.set(key, Date.now());
  }

  /**
   * Reset error counts (call this periodically)
   */
  resetErrorCounts() {
    this.errorCounts.clear();
    this.lastAlertTime.clear();
  }

  /**
   * Get current alert status
   */
  getStatus() {
    return {
      errorCounts: Object.fromEntries(this.errorCounts),
      lastAlertTimes: Object.fromEntries(this.lastAlertTime),
      config: {
        slackConfigured: !!this.config.slackWebhook,
        emailConfigured: !!this.config.emailRecipients?.length,
        openaiBudgetLimit: this.config.openaiBudgetLimit
      }
    };
  }
}

// Export singleton instance
export const criticalAlerts = new CriticalAlerts();

// Export types
export type { AlertConfig };
