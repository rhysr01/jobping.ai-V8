xport class ErrorMonitoringOracle {
    private static errors: any[] = [];
    private static readonly MAX_ERRORS = 1000;
  
    static logError(error: any, context: string, severity: 'low' | 'medium' | 'high' | 'critical' = 'medium') {
      const errorLog = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        context,
        severity,
        message: error.message || error,
        stack: error.stack,
        userAgent: typeof window !== 'undefined' ? navigator.userAgent : 'server',
        url: typeof window !== 'undefined' ? window.location.href : 'server'
      };
  
      this.errors.unshift(errorLog);
      
      // Keep only recent errors
      if (this.errors.length > this.MAX_ERRORS) {
        this.errors = this.errors.slice(0, this.MAX_ERRORS);
      }
  
      // Console log with context
      console.error(`🚨 [${severity.toUpperCase()}] ${context}:`, error);
  
      // Send critical errors immediately
      if (severity === 'critical') {
        this.sendCriticalAlert(errorLog);
      }
  
      return errorLog.id;
    }
  
    static async sendCriticalAlert(errorLog: any) {
      try {
        // Send to your monitoring service (email, Slack, etc.)
        const { Resend } = require('resend');
        const resend = new Resend(process.env.RESEND_API_KEY);
  
        await resend.emails.send({
          from: 'JobPing Alerts <alerts@jobping.ai>',
          to: [process.env.ADMIN_EMAIL || 'admin@jobping.ai'],
          subject: `🚨 CRITICAL: JobPing Error - ${errorLog.context}`,
          html: `
            <h2>Critical Error Alert</h2>
            <p><strong>Context:</strong> ${errorLog.context}</p>
            <p><strong>Time:</strong> ${errorLog.timestamp}</p>
            <p><strong>Message:</strong> ${errorLog.message}</p>
            <pre style="background: #f5f5f5; padding: 10px;">${errorLog.stack}</pre>
          `
        });
      } catch (alertError) {
        console.error('❌ Failed to send critical alert:', alertError);
      }
    }
  
    static getRecentErrors(hours: number = 24) {
      const cutoff = Date.now() - (hours * 60 * 60 * 1000);
      return this.errors.filter(error => 
        new Date(error.timestamp).getTime() > cutoff
      );
    }
  
    static getErrorStats() {
      const recent = this.getRecentErrors(24);
      const bySeverity = {
        critical: recent.filter(e => e.severity === 'critical').length,
        high: recent.filter(e => e.severity === 'high').length,
        medium: recent.filter(e => e.severity === 'medium').length,
        low: recent.filter(e => e.severity === 'low').length
      };
  
      return {
        total: recent.length,
        bySeverity,
        recentErrors: recent.slice(0, 10)
      };
    }
  }
  
  // Global error handler
  if (typeof window !== 'undefined') {
    window.addEventListener('error', (event) => {
      ErrorMonitoringOracle.logError(event.error, 'Global Error', 'high');
    });
  
    window.addEventListener('unhandledrejection', (event) => {
      ErrorMonitoringOracle.logError(event.reason, 'Unhandled Promise Rejection', 'high');
    });
  }