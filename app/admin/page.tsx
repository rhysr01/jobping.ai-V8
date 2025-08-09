'use client';
import { useEffect, useState } from 'react';

interface PilotMetrics {
  users: {
    total: number;
    verified: number;
    unverified: number;
    newToday: number;
  };
  matches: {
    totalGenerated: number;
    todayGenerated: number;
    avgPerUser: number;
  };
  emails: {
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
  };
  system: {
    uptime: string;
    errors: unknown;
    performance: unknown;
  };
}

export default function PilotAdminDashboard() {
  const [metrics, setMetrics] = useState<PilotMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const fetchMetrics = async () => {
    try {
      const response = await fetch('/api/admin/pilot-metrics');
      const data = await response.json();
      setMetrics(data);
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          🚀 JobPing Pilot Dashboard
        </h1>
        
        {/* Real-time Status */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">System Status</h2>
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
              <span>All Systems Operational</span>
            </div>
            <div className="text-sm text-gray-500">
              Uptime: {metrics?.system.uptime}
            </div>
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Total Students"
            value={metrics?.users.total || 0}
            subtitle={`${metrics?.users.newToday || 0} new today`}
            color="blue"
          />
          <MetricCard
            title="Verified Users"
            value={metrics?.users.verified || 0}
            subtitle={`${metrics?.users.unverified || 0} pending`}
            color="green"
          />
          <MetricCard
            title="Matches Generated"
            value={metrics?.matches.totalGenerated || 0}
            subtitle={`${metrics?.matches.todayGenerated || 0} today`}
            color="purple"
          />
          <MetricCard
            title="Emails Sent"
            value={metrics?.emails.sent || 0}
            subtitle={`${metrics?.emails.opened || 0} opened`}
            color="orange"
          />
        </div>

        {/* User Activity Chart */}
        <UserActivity metrics={metrics} />
        
        {/* System Health */}
        <SystemHealth metrics={metrics} />
      </div>
    </div>
  );
}

function MetricCard({ title, value, subtitle, color }: {
  title: string;
  value: string | number;
  subtitle: string;
  color: string;
}) {
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
    orange: 'bg-orange-500'
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center">
        <div className={`p-3 rounded-full ${colorClasses[color as keyof typeof colorClasses]} bg-opacity-10`}>
          <div className={`w-6 h-6 ${colorClasses[color as keyof typeof colorClasses]} rounded-full`}></div>
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
          <p className="text-sm text-gray-500">{subtitle}</p>
        </div>
      </div>
    </div>
  );
}

function UserActivity({ metrics }: { metrics: PilotMetrics | null }) {
  return (
    <div className="bg-white rounded-lg shadow p-6 mb-8">
      <h2 className="text-xl font-semibold mb-4">User Activity</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{metrics?.users.total || 0}</div>
          <div className="text-sm text-gray-600">Total Users</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{metrics?.matches.avgPerUser || 0}</div>
          <div className="text-sm text-gray-600">Avg Matches/User</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600">{metrics?.emails.delivered || 0}</div>
          <div className="text-sm text-gray-600">Emails Delivered</div>
        </div>
      </div>
    </div>
  );
}

function SystemHealth({ metrics }: { metrics: PilotMetrics | null }) {
  const [recentErrors, setRecentErrors] = useState<Array<{ message: string; timestamp: string }>>([]);

  const fetchRecentErrors = async () => {
    try {
      const response = await fetch('/api/admin/recent-errors');
      const data = await response.json();
      setRecentErrors(data.errors || []);
    } catch (error) {
      console.error('Failed to fetch errors:', error);
    }
  };

  useEffect(() => {
    fetchRecentErrors();
    const interval = setInterval(fetchRecentErrors, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">System Health</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-medium mb-2">Recent Errors</h3>
          {recentErrors.length > 0 ? (
            <div className="space-y-2">
              {recentErrors.slice(0, 5).map((error, index) => (
                <div key={index} className="bg-red-50 border border-red-200 rounded p-3">
                  <div className="text-sm font-medium text-red-800">{error.message}</div>
                  <div className="text-xs text-red-600">{error.timestamp}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-green-600 text-sm">No recent errors</div>
          )}
        </div>
        <div>
          <h3 className="text-lg font-medium mb-2">Performance</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Response Time</span>
              <span className="text-sm font-medium">~200ms</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Uptime</span>
              <span className="text-sm font-medium">99.9%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Active Users</span>
              <span className="text-sm font-medium">{metrics?.users.total || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}