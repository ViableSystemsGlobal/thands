import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { AlertTriangle, Shield, Clock, Ban, Search, RefreshCw, Eye, CheckCircle } from 'lucide-react';
// Chat monitoring functionality temporarily disabled - backend endpoints not yet implemented
import { useToast } from '../../components/ui/use-toast';
import { format } from 'date-fns';

const ChatMonitoring = () => {
  const { toast } = useToast();
  const [abuseReports, setAbuseReports] = useState([]);
  const [rateLimits, setRateLimits] = useState([]);
  const [flaggedSessions, setFlaggedSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalReports: 0,
    blockedIPs: 0,
    flaggedSessions: 0,
    dailyReports: 0
  });

  useEffect(() => {
    fetchMonitoringData();
  }, []);

  const fetchMonitoringData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Chat monitoring endpoints not yet implemented in backend
      console.log('📧 Chat monitoring endpoints not yet implemented in backend');
      
      // Set empty data
      setAbuseReports([]);
      setRateLimits([]);
      setFlaggedSessions([]);
      
      setStats({
        totalReports: 0,
        blockedIPs: 0,
        flaggedSessions: 0,
        dailyReports: 0
      });

      // Data fetching completed - no automatic sample data creation

    } catch (error) {
      console.error('Error fetching monitoring data:', error);
      setError(`Unexpected error: ${error.message}`);
      toast({
        title: "Error",
        description: "Failed to load monitoring data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createSampleAbuseReports = () => {
    const sampleReports = [
      {
        id: 'c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1',
        ip_address: '192.168.1.102',
        abuse_type: 'rapid_messaging',
        details: 'User sent multiple messages in quick succession',
        auto_detected: true,
        created_at: new Date(Date.now() - 25 * 60 * 1000).toISOString()
      },
      {
        id: 'c2c2c2c2-c2c2-c2c2-c2c2-c2c2c2c2c2c2',
        ip_address: '192.168.1.103',
        abuse_type: 'spam_content',
        details: 'Message contained spam keywords',
        auto_detected: true,
        created_at: new Date(Date.now() - 45 * 60 * 1000).toISOString()
      }
    ];
    
    setAbuseReports(sampleReports);
    console.log('Created sample abuse reports');
  };

  const createSampleRateLimits = () => {
    const sampleLimits = [
      {
        id: 'd1d1d1d1-d1d1-d1d1-d1d1-d1d1d1d1d1d1',
        ip_address: '192.168.1.100',
        session_count: 1,
        daily_message_count: 5,
        last_session_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        is_blocked: false,
        created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'd2d2d2d2-d2d2-d2d2-d2d2-d2d2d2d2d2d2',
        ip_address: '192.168.1.101',
        session_count: 3,
        daily_message_count: 25,
        last_session_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        is_blocked: false,
        created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'd3d3d3d3-d3d3-d3d3-d3d3-d3d3d3d3d3d3',
        ip_address: '192.168.1.102',
        session_count: 5,
        daily_message_count: 50,
        last_session_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        is_blocked: true,
        blocked_until: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
        created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString()
      }
    ];
    
    setRateLimits(sampleLimits);
    console.log('Created sample rate limits');
  };

  const createSampleFlaggedSessions = () => {
    const sampleSessions = [
      {
        id: 'f1f1f1f1-f1f1-f1f1-f1f1-f1f1f1f1f1f1',
        session_id: 'flagged_session_001',
        user_email: 'suspicious@example.com',
        ip_address: '192.168.1.102',
        user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        is_flagged: true,
        flagged_reason: 'rapid_messaging',
        created_at: new Date(Date.now() - 25 * 60 * 1000).toISOString()
      },
      {
        id: 'f2f2f2f2-f2f2-f2f2-f2f2-f2f2f2f2f2f2',
        session_id: 'flagged_session_002',
        user_email: null,
        ip_address: '192.168.1.103',
        user_agent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15',
        is_flagged: true,
        flagged_reason: 'spam_content',
        created_at: new Date(Date.now() - 45 * 60 * 1000).toISOString()
      }
    ];
    
    setFlaggedSessions(sampleSessions);
    console.log('Created sample flagged sessions');
  };

  const createAllSampleData = () => {
    createSampleAbuseReports();
    createSampleRateLimits();
    createSampleFlaggedSessions();
    
    // Update stats
    setStats({
      totalReports: 2,
      blockedIPs: 1,
      flaggedSessions: 2,
      dailyReports: 2
    });
    
    toast({
      title: "Sample Data Created",
      description: "Created sample monitoring data for demonstration.",
    });
  };

  const handleUnblockIP = async (ipAddress) => {
    try {
      // Chat monitoring endpoints not yet implemented in backend
      console.log('📧 Chat unblock IP endpoint not yet implemented in backend');
      
      toast({
        title: "Feature Not Available",
        description: "Chat monitoring unblock IP functionality is not yet implemented in the backend.",
        variant: "destructive",
      });
    } catch (error) {
      console.error('Exception unblocking IP:', error);
      toast({
        title: "Error",
        description: "Failed to unblock IP address",
        variant: "destructive"
      });
    }
  };

  const handleResetRateLimit = async (ipAddress) => {
    try {
      // Chat monitoring endpoints not yet implemented in backend
      console.log('📧 Chat reset rate limit endpoint not yet implemented in backend');
      
      toast({
        title: "Feature Not Available",
        description: "Chat monitoring reset rate limit functionality is not yet implemented in the backend.",
        variant: "destructive",
      });
    } catch (error) {
      console.error('Exception resetting rate limit:', error);
      toast({
        title: "Error",
        description: "Failed to reset rate limit",
        variant: "destructive"
      });
    }
  };

  const getAbuseTypeBadge = (type) => {
    const colors = {
      'rapid_messaging': 'bg-red-100 text-red-800',
      'spam_content': 'bg-orange-100 text-orange-800',
      'long_message': 'bg-yellow-100 text-yellow-800',
      'flooding': 'bg-red-100 text-red-800',
      'duplicate_spam': 'bg-orange-100 text-orange-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const filteredReports = abuseReports.filter(report =>
    report.ip_address?.toString().includes(searchTerm) ||
    report.abuse_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.details?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredLimits = rateLimits.filter(limit =>
    limit.ip_address?.toString().includes(searchTerm)
  );

  const filteredSessions = flaggedSessions.filter(session =>
    session.ip_address?.toString().includes(searchTerm) ||
    session.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    session.flagged_reason?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D2B48C] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading monitoring data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A1A]">Chat Monitoring</h1>
          <p className="text-gray-600">Monitor chat system security and usage</p>
          {error && (
            <div className="mt-2 p-2 bg-red-100 border border-red-400 text-red-700 rounded">
              <p className="text-sm">{error}</p>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            onClick={fetchMonitoringData}
            disabled={loading}
            variant="outline"
            size="sm"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          {(abuseReports.length === 0 && rateLimits.length === 0 && flaggedSessions.length === 0) && (
            <Button
              onClick={createAllSampleData}
              className="bg-[#D2B48C] hover:bg-[#B8860B] text-white"
            >
              Create Sample Data
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalReports}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Blocked IPs</CardTitle>
            <Ban className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.blockedIPs}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Flagged Sessions</CardTitle>
            <Shield className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.flaggedSessions}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Reports</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.dailyReports}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search by IP address, abuse type, or details..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Abuse Reports */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Abuse Reports
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredReports.length === 0 ? (
              <div className="text-center py-8">
                <AlertTriangle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No abuse reports found</p>
              </div>
            ) : (
              filteredReports.map((report) => (
                <div key={report.id} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge className={getAbuseTypeBadge(report.abuse_type)}>
                        {report.abuse_type}
                      </Badge>
                      <span className="text-sm text-gray-500">
                        IP: {report.ip_address}
                      </span>
                    </div>
                    <span className="text-sm text-gray-500">
                      {format(new Date(report.created_at), 'MMM dd, yyyy HH:mm')}
                    </span>
                  </div>
                  <p className="text-sm">{report.details}</p>
                  <div className="flex items-center gap-2">
                    <Badge variant={report.auto_detected ? "secondary" : "outline"}>
                      {report.auto_detected ? "Auto-detected" : "Manual"}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Rate Limits */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-500" />
            Rate Limits
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredLimits.length === 0 ? (
              <div className="text-center py-8">
                <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No rate limit data found</p>
              </div>
            ) : (
              filteredLimits.map((limit) => (
                <div key={limit.id} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm">{limit.ip_address}</span>
                      {limit.is_blocked && (
                        <Badge variant="destructive">Blocked</Badge>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {limit.is_blocked && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUnblockIP(limit.ip_address)}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Unblock
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleResetRateLimit(limit.ip_address)}
                      >
                        <RefreshCw className="w-4 h-4 mr-1" />
                        Reset
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Daily Messages:</span>
                      <span className="ml-2 font-medium">{limit.daily_message_count}/50</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Sessions:</span>
                      <span className="ml-2 font-medium">{limit.session_count}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Last Session:</span>
                      <span className="ml-2 font-medium">
                        {format(new Date(limit.last_session_at), 'MMM dd, HH:mm')}
                      </span>
                    </div>
                    {limit.blocked_until && (
                      <div>
                        <span className="text-gray-500">Blocked Until:</span>
                        <span className="ml-2 font-medium text-red-600">
                          {format(new Date(limit.blocked_until), 'MMM dd, HH:mm')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Flagged Sessions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-yellow-500" />
            Flagged Sessions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredSessions.length === 0 ? (
              <div className="text-center py-8">
                <Eye className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No flagged sessions found</p>
              </div>
            ) : (
              filteredSessions.map((session) => (
                <div key={session.id} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm">{session.session_id}</span>
                      <Badge variant="outline" className="text-yellow-700 border-yellow-300">
                        {session.flagged_reason}
                      </Badge>
                    </div>
                    <span className="text-sm text-gray-500">
                      {format(new Date(session.created_at), 'MMM dd, yyyy HH:mm')}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Email:</span>
                      <span className="ml-2 font-medium">{session.user_email || 'Not provided'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">IP:</span>
                      <span className="ml-2 font-medium">{session.ip_address}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">User Agent:</span>
                      <span className="ml-2 font-medium truncate">{session.user_agent?.substring(0, 50) || 'Unknown'}...</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ChatMonitoring; 