import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { AlertTriangle, Shield, Clock, Ban, Search, RefreshCw, Eye } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../components/ui/use-toast';
import { format } from 'date-fns';

const ChatMonitoring = () => {
  const { toast } = useToast();
  const [abuseReports, setAbuseReports] = useState([]);
  const [rateLimits, setRateLimits] = useState([]);
  const [flaggedSessions, setFlaggedSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
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
    try {
      // Fetch abuse reports
      const { data: reports, error: reportsError } = await supabase
        .from('chat_abuse_reports')
        .select(`
          *,
          chat_sessions (
            id,
            user_email,
            created_at
          )
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (reportsError) throw reportsError;

      // Fetch rate limits
      const { data: limits, error: limitsError } = await supabase
        .from('chat_rate_limits')
        .select('*')
        .order('last_session_at', { ascending: false })
        .limit(100);

      if (limitsError) throw limitsError;

      // Fetch flagged sessions
      const { data: flagged, error: flaggedError } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('is_flagged', true)
        .order('created_at', { ascending: false })
        .limit(50);

      if (flaggedError) throw flaggedError;

      setAbuseReports(reports || []);
      setRateLimits(limits || []);
      setFlaggedSessions(flagged || []);

      // Calculate stats
      const today = new Date().toISOString().split('T')[0];
      const dailyReports = reports?.filter(r => 
        r.created_at.startsWith(today)
      ).length || 0;

      setStats({
        totalReports: reports?.length || 0,
        blockedIPs: limits?.filter(l => l.is_blocked).length || 0,
        flaggedSessions: flagged?.length || 0,
        dailyReports
      });

    } catch (error) {
      console.error('Error fetching monitoring data:', error);
      toast({
        title: "Error",
        description: "Failed to load monitoring data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUnblockIP = async (ipAddress) => {
    try {
      const { error } = await supabase
        .from('chat_rate_limits')
        .update({
          is_blocked: false,
          blocked_until: null
        })
        .eq('ip_address', ipAddress);

      if (error) throw error;

      toast({
        title: "Success",
        description: "IP address unblocked successfully"
      });
      
      fetchMonitoringData();
    } catch (error) {
      console.error('Error unblocking IP:', error);
      toast({
        title: "Error",
        description: "Failed to unblock IP address",
        variant: "destructive"
      });
    }
  };

  const handleResetRateLimit = async (ipAddress) => {
    try {
      const { error } = await supabase
        .from('chat_rate_limits')
        .update({
          daily_message_count: 0,
          session_count: 0,
          is_blocked: false,
          blocked_until: null
        })
        .eq('ip_address', ipAddress);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Rate limit reset successfully"
      });
      
      fetchMonitoringData();
    } catch (error) {
      console.error('Error resetting rate limit:', error);
      toast({
        title: "Error",
        description: "Failed to reset rate limit",
        variant: "destructive"
      });
    }
  };

  const getAbuseTypeBadge = (type) => {
    const colors = {
      'long_message': 'bg-yellow-100 text-yellow-800',
      'flooding': 'bg-red-100 text-red-800',
      'duplicate_spam': 'bg-orange-100 text-orange-800',
      'spam_content': 'bg-red-100 text-red-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const filteredReports = abuseReports.filter(report =>
    report.ip_address?.includes(searchTerm) ||
    report.abuse_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.details?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredLimits = rateLimits.filter(limit =>
    limit.ip_address?.includes(searchTerm)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D2B48C]"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#1A1A1A]">Chat Monitoring</h1>
        <Button
          onClick={fetchMonitoringData}
          disabled={loading}
          className="bg-[#D2B48C] hover:bg-[#B8860B] text-white"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
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
              <p className="text-gray-500 text-center py-4">No abuse reports found</p>
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
                  {report.chat_sessions?.user_email && (
                    <p className="text-sm text-gray-600">
                      User: {report.chat_sessions.user_email}
                    </p>
                  )}
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
              <p className="text-gray-500 text-center py-4">No rate limit data found</p>
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
                          Unblock
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleResetRateLimit(limit.ip_address)}
                      >
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
            {flaggedSessions.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No flagged sessions found</p>
            ) : (
              flaggedSessions.map((session) => (
                <div key={session.id} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm">{session.id}</span>
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
                      <span className="ml-2 font-medium truncate">{session.user_agent}</span>
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