import { useState, useEffect } from 'react';
import { Users, Upload, FileText, TrendingUp, Activity } from 'lucide-react';

interface DashboardStats {
  totalAgents: number;
  activeAgents: number;
  totalUploads: number;
  totalRecords: number;
  recentUploads: any[];
  agentDistribution: any[];
}

const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalAgents: 0,
    activeAgents: 0,
    totalUploads: 0,
    totalRecords: 0,
    recentUploads: [],
    agentDistribution: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Fetch agents
      const agentsResponse = await fetch('/api/agents', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!agentsResponse.ok) {
        throw new Error('Failed to fetch agents');
      }
      
      const agentsData = await agentsResponse.json();
      
      // Fetch upload history
      const uploadsResponse = await fetch('/api/upload/history', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!uploadsResponse.ok) {
        throw new Error('Failed to fetch uploads');
      }
      
      const uploadsData = await uploadsResponse.json();
      
      // Calculate stats
      const totalAgents = agentsData.data.agents.length;
      const activeAgents = agentsData.data.agents.filter((agent: any) => agent.status === 'active').length;
      const totalUploads = uploadsData.data.uploads.length;
      const totalRecords = uploadsData.data.uploads.reduce((sum: number, upload: any) => sum + upload.original_count, 0);
      
      setStats({
        totalAgents,
        activeAgents,
        totalUploads,
        totalRecords,
        recentUploads: uploadsData.data.uploads.slice(0, 5),
        agentDistribution: agentsData.data.agents
      });
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon: Icon, color, subtitle }: any) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 card-hover">
      <div className="flex items-center">
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div className="ml-5">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm p-6">
              <div className="animate-pulse">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                  <div className="ml-5 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                    <div className="h-6 bg-gray-200 rounded w-16"></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 mb-2">⚠️</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Dashboard</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={fetchDashboardData}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-600">Overview of your agent management system</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Agents"
          value={stats.totalAgents}
          icon={Users}
          color="bg-blue-500"
          subtitle={`${stats.activeAgents} active`}
        />
        <StatCard
          title="File Uploads"
          value={stats.totalUploads}
          icon={Upload}
          color="bg-green-500"
          subtitle="Total uploads"
        />
        <StatCard
          title="Records Processed"
          value={stats.totalRecords.toLocaleString()}
          icon={FileText}
          color="bg-purple-500"
          subtitle="All time"
        />
        <StatCard
          title="Distribution Rate"
          value="100%"
          icon={TrendingUp}
          color="bg-orange-500"
          subtitle="Success rate"
        />
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Uploads */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Recent Uploads</h2>
            <Activity className="h-5 w-5 text-gray-400" />
          </div>

          {stats.recentUploads.length > 0 ? (
            <div className="space-y-4">
              {stats.recentUploads.map((upload, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {upload.filename}
                    </p>
                    <p className="text-xs text-gray-500">
                      {upload.original_count} records • {new Date(upload.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      upload.status === 'completed' ? 'bg-green-100 text-green-800' : 
                      upload.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {upload.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Upload className="mx-auto h-12 w-12 text-gray-300" />
              <p className="mt-2 text-sm text-gray-500">No uploads yet</p>
            </div>
          )}
        </div>

        {/* Agent Status */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Agent Status</h2>
            <Users className="h-5 w-5 text-gray-400" />
          </div>

          {stats.agentDistribution.length > 0 ? (
            <div className="space-y-4">
              {stats.agentDistribution.slice(0, 5).map((agent, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium text-blue-800">
                        {agent.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">{agent.name}</p>
                      <p className="text-xs text-gray-500">{agent.email}</p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    agent.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {agent.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className="mx-auto h-12 w-12 text-gray-300" />
              <p className="mt-2 text-sm text-gray-500">No agents yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors group">
            <Users className="h-8 w-8 text-gray-400 group-hover:text-blue-500 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-700 group-hover:text-blue-700">Add New Agent</p>
          </button>
          <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors group">
            <Upload className="h-8 w-8 text-gray-400 group-hover:text-green-500 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-700 group-hover:text-green-700">Upload File</p>
          </button>
          <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors group">
            <FileText className="h-8 w-8 text-gray-400 group-hover:text-purple-500 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-700 group-hover:text-purple-700">View Reports</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;