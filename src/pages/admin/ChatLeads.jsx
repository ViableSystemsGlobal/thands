import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { 
  Users, 
  MessageSquare, 
  Clock, 
  Mail, 
  User, 
  Eye,
  Trash2,
  Search,
  Download,
  Phone,
  Star,
  TrendingUp,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import adminApiClient from '@/lib/services/adminApiClient';

const ChatLeads = () => {
  const [leads, setLeads] = useState([]);
  const [filteredLeads, setFilteredLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedLead, setSelectedLead] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [error, setError] = useState(null);
  const { toast } = useToast();

  // Fetch chat leads
  useEffect(() => {
    fetchLeads();
  }, []);

  // Filter leads based on search and status
  useEffect(() => {
    let filtered = leads;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(lead => 
        lead.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.customer_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.chat_summary?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(lead => lead.status === statusFilter);
    }

    setFilteredLeads(filtered);
  }, [leads, searchTerm, statusFilter]);

  const fetchLeads = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch from our new API
      const response = await adminApiClient.get('/chat-leads');
      console.log('Fetched leads response:', response);
      
      // adminApiClient wraps response in data property
      const leadsData = response.data || response;
      setLeads(Array.isArray(leadsData) ? leadsData : []);
      
    } catch (error) {
      console.error('Exception fetching chat leads:', error);
      setError(`Unexpected error: ${error.message}`);
      setLeads([]);
      toast({
        title: "Error",
        description: "An unexpected error occurred while fetching chat leads.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };


  const updateLeadStatus = async (leadId, newStatus) => {
    try {
      // Update in database
      await adminApiClient.patch(`/chat-leads/${leadId}/status`, { status: newStatus });

      console.log('Lead status updated successfully');

      // Update local state
      setLeads(leads.map(lead => 
        lead.id === leadId ? { ...lead, status: newStatus } : lead
      ));

      toast({
        title: "Success",
        description: "Lead status updated successfully.",
      });
    } catch (error) {
      console.error('Exception updating lead status:', error);
      toast({
        title: "Error",
        description: "Failed to update lead status.",
        variant: "destructive",
      });
    }
  };

  const deleteLead = async (leadId) => {
    if (!confirm('Are you sure you want to delete this lead?')) return;

    try {
      // Delete from database
      await adminApiClient.delete(`/chat-leads/${leadId}`);

      // Update local state
      setLeads(leads.filter(lead => lead.id !== leadId));

      toast({
        title: "Success",
        description: "Lead deleted successfully.",
      });
    } catch (error) {
      console.error('Exception deleting lead:', error);
      toast({
        title: "Error",
        description: "Failed to delete lead.",
        variant: "destructive",
      });
    }
  };

  const exportLeads = () => {
    try {
      const csvContent = [
        ['Name', 'Email', 'Phone', 'Status', 'Priority', 'Messages', 'Duration (min)', 'Created', 'Summary'],
        ...filteredLeads.map(lead => [
          lead.customer_name || 'N/A',
          lead.customer_email || 'N/A',
          extractPhoneFromSummary(lead.chat_summary) || 'N/A',
          lead.status,
          calculatePriorityScore(lead),
          lead.message_count || 0,
          lead.chat_duration_minutes || 0,
          new Date(lead.created_at).toLocaleString(),
          lead.chat_summary?.replace(/\n/g, ' ') || 'N/A'
        ])
      ].map(row => row.map(field => `"${field}"`).join(',')).join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `chat-leads-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Export Successful",
        description: "Chat leads exported to CSV file.",
      });
    } catch (error) {
      console.error('Error exporting leads:', error);
      toast({
        title: "Export Error",
        description: "Failed to export leads.",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'contacted': return 'bg-yellow-100 text-yellow-800';
      case 'converted': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const extractPhoneFromSummary = (summary) => {
    if (!summary) return null;
    
    // Look for phone number patterns in the summary
    const phonePatterns = [
      /Phone:\s*([+\d\s\-\(\)]+)/i,
      /phone.*?([+\d\s\-\(\)]{10,})/i,
      /contact.*?([+\d\s\-\(\)]{10,})/i,
      /(\+?\d{1,3}[-.\s]?\(?\d{1,3}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,9})/
    ];
    
    for (const pattern of phonePatterns) {
      const match = summary.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }
    
    return null;
  };

  const calculatePriorityScore = (lead) => {
    let score = 0;
    
    // Basic contact info (30 points)
    if (lead.customer_name && lead.customer_email) {
      score += 30;
    }
    
    // Phone number in summary (20 points)
    if (extractPhoneFromSummary(lead.chat_summary)) {
      score += 20;
    }
    
    // Message engagement (25 points)
    if (lead.message_count >= 3) {
      score += 25;
    }
    
    // High-value keywords (25 points)
    if (lead.chat_summary && (
      lead.chat_summary.toLowerCase().includes('consultation') ||
      lead.chat_summary.toLowerCase().includes('custom') ||
      lead.chat_summary.toLowerCase().includes('bespoke') ||
      lead.chat_summary.toLowerCase().includes('tailored') ||
      lead.chat_summary.toLowerCase().includes('wedding')
    )) {
      score += 25;
    }
    
    return score;
  };

  const getLeadPriority = (score) => {
    if (score >= 70) return { label: 'High', color: 'bg-red-100 text-red-800', icon: AlertCircle };
    if (score >= 40) return { label: 'Medium', color: 'bg-yellow-100 text-yellow-800', icon: TrendingUp };
    return { label: 'Low', color: 'bg-gray-100 text-gray-800', icon: Clock };
  };

  const formatDuration = (minutes) => {
    if (!minutes) return '0m';
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading chat leads...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Chat Leads</h1>
          <p className="text-gray-600">Manage customer leads from chatbot conversations</p>
          {error && (
            <div className="mt-2 p-2 bg-red-100 border border-red-400 text-red-700 rounded">
              <p className="text-sm">{error}</p>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            onClick={fetchLeads}
            variant="outline"
            size="sm"
            disabled={loading}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={exportLeads} className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Leads</p>
                <p className="text-2xl font-bold text-gray-900">{leads.length}</p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">New Leads</p>
                <p className="text-2xl font-bold text-blue-600">
                  {leads.filter(l => l.status === 'new').length}
                </p>
              </div>
              <MessageSquare className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">High Priority</p>
                <p className="text-2xl font-bold text-red-600">
                  {leads.filter(l => calculatePriorityScore(l) >= 70).length}
                </p>
              </div>
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Converted</p>
                <p className="text-2xl font-bold text-green-600">
                  {leads.filter(l => l.status === 'converted').length}
                </p>
              </div>
              <Star className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg. Duration</p>
                <p className="text-2xl font-bold text-gray-900">
                  {leads.length > 0 ? formatDuration(Math.round(leads.reduce((sum, l) => sum + (l.chat_duration_minutes || 0), 0) / leads.length)) : '0m'}
                </p>
              </div>
              <Clock className="w-8 h-8 text-gray-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="search"
                  placeholder="Search by name, email, phone, or chat content..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="contacted">Contacted</SelectItem>
                  <SelectItem value="converted">Converted</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Leads Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Leads ({filteredLeads.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-medium">Customer</th>
                  <th className="text-left p-3 font-medium">Contact</th>
                  <th className="text-left p-3 font-medium">Priority</th>
                  <th className="text-left p-3 font-medium">Status</th>
                  <th className="text-left p-3 font-medium">Chat Info</th>
                  <th className="text-left p-3 font-medium">Date</th>
                  <th className="text-left p-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeads.map((lead) => {
                  const score = calculatePriorityScore(lead);
                  const priority = getLeadPriority(score);
                  const PriorityIcon = priority.icon;
                  
                  return (
                    <tr key={lead.id} className="border-b hover:bg-gray-50">
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <div>
                            <div className="font-medium">
                              {lead.customer_name || 'Anonymous'}
                            </div>
                            <div className="text-xs text-gray-500">
                              Score: {score}/100
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="w-3 h-3 text-gray-400" />
                            <span className="text-gray-600 truncate max-w-[150px]">
                              {lead.customer_email || 'No email'}
                            </span>
                          </div>
                          {extractPhoneFromSummary(lead.chat_summary) && (
                            <div className="flex items-center gap-2 text-sm">
                              <Phone className="w-3 h-3 text-gray-400" />
                              <span className="text-gray-600">
                                {extractPhoneFromSummary(lead.chat_summary)}
                              </span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <PriorityIcon className="w-4 h-4" />
                          <Badge className={priority.color}>
                            {priority.label}
                          </Badge>
                        </div>
                      </td>
                      <td className="p-3">
                        <Badge className={getStatusColor(lead.status)}>
                          {lead.status}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <div className="text-sm text-gray-600">
                          <div>{lead.message_count || 0} messages</div>
                          <div>{formatDuration(lead.chat_duration_minutes)}</div>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="text-sm text-gray-600">
                          {new Date(lead.created_at).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedLead(lead);
                              setShowDetailModal(true);
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Select
                            value={lead.status}
                            onValueChange={(value) => updateLeadStatus(lead.id, value)}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="new">New</SelectItem>
                              <SelectItem value="contacted">Contacted</SelectItem>
                              <SelectItem value="converted">Converted</SelectItem>
                              <SelectItem value="closed">Closed</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteLead(lead.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          {filteredLeads.length === 0 && (
            <div className="text-center py-8">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No leads found matching your criteria</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Enhanced Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Lead Details</DialogTitle>
          </DialogHeader>
          {selectedLead && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Customer Name</Label>
                    <p className="text-sm text-gray-900 font-medium">{selectedLead.customer_name || 'Not provided'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Email</Label>
                    <p className="text-sm text-gray-900">{selectedLead.customer_email || 'Not provided'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Phone</Label>
                    <p className="text-sm text-gray-900">{extractPhoneFromSummary(selectedLead.chat_summary) || 'Not provided'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Lead Score</Label>
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-medium text-gray-900">{calculatePriorityScore(selectedLead)}/100</div>
                      <Badge className={getLeadPriority(calculatePriorityScore(selectedLead)).color}>
                        {getLeadPriority(calculatePriorityScore(selectedLead)).label} Priority
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Status</Label>
                    <Badge className={getStatusColor(selectedLead.status)}>
                      {selectedLead.status}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Chat Duration</Label>
                    <p className="text-sm text-gray-900">{formatDuration(selectedLead.chat_duration_minutes)}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Messages</Label>
                    <p className="text-sm text-gray-900">{selectedLead.message_count || 0}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Date</Label>
                    <p className="text-sm text-gray-900">{new Date(selectedLead.created_at).toLocaleString()}</p>
                  </div>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">Chat Summary</Label>
                <Textarea
                  value={selectedLead.chat_summary || 'No summary available'}
                  readOnly
                  className="mt-2 min-h-[300px] font-mono text-xs"
                />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ChatLeads; 