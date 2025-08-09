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
    errors: any;
    performance: any;
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
            title="Email Delivery"
            value={`${Math.round(((metrics?.emails.delivered || 0) / (metrics?.emails.sent || 1)) * 100)}%`}
            subtitle={`${metrics?.emails.sent || 0} sent`}
            color="orange"
          />
        </div>

        {/* Detailed Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <UserActivity metrics={metrics} />
          <SystemHealth metrics={metrics} />
        </div>

        <RecentErrors />
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
        <div className={`w-4 h-4 ${colorClasses[color]} rounded-full mr-3`}></div>
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
      </div>
      <p className="text-2xl font-bold text-gray-900 mt-2">{value}</p>
      <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
    </div>
  );
}

function UserActivity({ metrics }: { metrics: PilotMetrics | null }) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">User Activity</h3>
      <div className="space-y-3">
        <div className="flex justify-between">
          <span>Email Open Rate</span>
          <span className="font-medium">
            {Math.round(((metrics?.emails.opened || 0) / (metrics?.emails.sent || 1)) * 100)}%
          </span>
        </div>
        <div className="flex justify-between">
          <span>Click Rate</span>
          <span className="font-medium">
            {Math.round(((metrics?.emails.clicked || 0) / (metrics?.emails.sent || 1)) * 100)}%
          </span>
        </div>
        <div className="flex justify-between">
          <span>Avg Matches/User</span>
          <span className="font-medium">{metrics?.matches.avgPerUser || 0}</span>
        </div>
      </div>
    </div>
  );
}

function SystemHealth({ metrics }: { metrics: PilotMetrics | null }) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">System Health</h3>
      <div className="space-y-3">
        <div className="flex justify-between">
          <span>Errors (24h)</span>
          <span className="font-medium text-red-600">
            {metrics?.system.errors?.total || 0}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Avg Response Time</span>
          <span className="font-medium">
            {metrics?.system.performance?.avgResponseTime || 0}ms
          </span>
        </div>
        <div className="flex justify-between">
          <span>Cache Hit Rate</span>
          <span className="font-medium text-green-600">
            {metrics?.system.performance?.cacheHitRate || 0}%
          </span>
        </div>
      </div>
    </div>
  );
}

function RecentErrors() {
  const [errors, setErrors] = useState([]);

  useEffect(() => {
    fetchRecentErrors();
  }, []);

  const fetchRecentErrors = async () => {
    try {
      const response = await fetch('/api/admin/recent-errors');
      const data = await response.json();
      setErrors(data.errors || []);
    } catch (error) {
      console.error('Failed to fetch errors:', error);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 mt-8">
      <h3 className="text-lg font-semibold mb-4">Recent Errors</h3>
      {errors.length === 0 ? (
        <p className="text-gray-500">No recent errors 🎉</p>
      ) : (
        <div className="space-y-2">
          {errors.slice(0, 10).map((error: any, index) => (
            <div key={index} className="border-l-4 border-red-500 pl-4 py-2">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-red-700">{error.context}</p>
                  <p className="text-sm text-gray-600">{error.message}</p>
                </div>
                <span className="text-xs text-gray-500">
                  {new Date(error.timestamp).toLocaleString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}