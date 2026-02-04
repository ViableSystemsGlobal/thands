import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import adminApiClient from '@/lib/services/adminApiClient';
import { 
  Mail, 
  Settings, 
  Users, 
  TrendingUp, 
  Calendar,
  Download,
  Trash2,
  Edit,
  Eye,
  EyeOff,
  Image,
  Sparkles,
  Upload,
  X
} from 'lucide-react';

const Newsletter = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [subscribers, setSubscribers] = useState([]);
  const [stats, setStats] = useState({
    total_subscribers: 0,
    active_subscribers: 0,
    recent_subscribers: 0,
    unsubscribed_count: 0
  });
  const [newsletterSettings, setNewsletterSettings] = useState({
    title: '',
    subtitle: '',
    description: '',
    offer_text: '',
    button_text: '',
    image_url: '',
    is_enabled: true
  });
  const [subscribersPage, setSubscribersPage] = useState(1);
  const [subscribersPerPage] = useState(20);
  const [totalSubscribers, setTotalSubscribers] = useState(0);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadSubscribers();
  }, [subscribersPage]);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadNewsletterSettings(),
        loadSubscribers(),
        loadStats()
      ]);
    } catch (error) {
      console.error('Error loading newsletter data:', error);
      toast({
        title: "Error",
        description: "Failed to load newsletter data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadNewsletterSettings = async () => {
    try {
      const response = await adminApiClient.get('/newsletter/settings');
      const settings = response.data || response;
      if (settings) {
        setNewsletterSettings(settings);
      }
    } catch (error) {
      console.error('Error loading newsletter settings:', error);
    }
  };

  const loadSubscribers = async () => {
    try {
      const response = await adminApiClient.get(`/newsletter/subscribers?page=${subscribersPage}&limit=${subscribersPerPage}`);
      const data = response.data || response;
      
      setSubscribers(data.subscribers || []);
      setTotalSubscribers(data.pagination?.total || 0);
    } catch (error) {
      console.error('Error loading newsletter subscribers:', error);
      setSubscribers([]);
      setTotalSubscribers(0);
    }
  };

  const loadStats = async () => {
    try {
      const response = await adminApiClient.get('/newsletter/stats');
      const statsData = response.data || response;
      if (statsData) {
        setStats(statsData);
      }
    } catch (error) {
      console.error('Error loading newsletter stats:', error);
      setStats({
        total_subscribers: 0,
        active_subscribers: 0,
        recent_subscribers: 0,
        unsubscribed_count: 0
      });
    }
  };

  const handleSettingsChange = (field, value) => {
    setNewsletterSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File",
        description: "Please select an image file.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please select an image smaller than 5MB.",
        variant: "destructive",
      });
      return;
    }

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await adminApiClient.post('/upload/newsletter', formData);

      const imageUrl = response.data?.url || response.url;
      if (imageUrl) {
        handleSettingsChange('image_url', imageUrl);
        setImagePreview(imageUrl);
        toast({
          title: "Image Uploaded",
          description: "Newsletter image uploaded successfully.",
          className: "bg-green-50 border-green-200 text-green-700",
        });
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload newsletter image.",
        variant: "destructive",
      });
    } finally {
      setUploadingImage(false);
    }
  };

  const removeImage = () => {
    handleSettingsChange('image_url', '');
    setImagePreview(null);
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      await adminApiClient.put('/newsletter/settings', newsletterSettings);
      
      toast({
        title: "Settings Saved",
        description: "Newsletter settings have been updated successfully.",
        className: "bg-green-50 border-green-200 text-green-700",
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error",
        description: "Failed to save newsletter settings.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const unsubscribeUser = async (email) => {
    try {
      await adminApiClient.post('/newsletter/unsubscribe', { email });
      
      toast({
        title: "User Unsubscribed",
        description: `${email} has been unsubscribed from the newsletter.`,
        className: "bg-yellow-50 border-yellow-200 text-yellow-700",
      });
      
      // Reload data
      await loadData();
    } catch (error) {
      console.error('Error unsubscribing user:', error);
      toast({
        title: "Error",
        description: "Failed to unsubscribe user.",
        variant: "destructive",
      });
    }
  };

  const exportSubscribers = async () => {
    try {
      // Fetch all subscribers for export
      const response = await adminApiClient.get('/newsletter/subscribers?page=1&limit=10000');
      const data = response.data || response;
      const allSubscribers = data.subscribers || [];
      
      // Create CSV content
      const csvContent = [
        ['Email', 'Subscribed Date', 'Status'],
        ...allSubscribers.map(sub => [
          sub.email,
          new Date(sub.subscribed_at).toLocaleDateString(),
          sub.is_active ? 'Active' : 'Unsubscribed'
        ])
      ].map(row => row.join(',')).join('\n');
      
      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `newsletter_subscribers_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Export Successful",
        description: "Newsletter subscribers exported successfully.",
        className: "bg-green-50 border-green-200 text-green-700",
      });
    } catch (error) {
      console.error('Error exporting subscribers:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export newsletter subscribers.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex justify-center items-center min-h-[calc(100vh-theme(spacing.16))]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D2B48C]"></div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-slate-50 to-gray-100 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-light text-gray-800 flex items-center">
          <Mail className="w-8 h-8 mr-3 text-[#D2B48C]" />
          Newsletter Management
        </h1>
        <p className="text-gray-500 mt-1">Manage newsletter popup settings and subscribers</p>
      </div>

      <Tabs defaultValue="settings" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Settings
          </TabsTrigger>
          <TabsTrigger value="subscribers" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Subscribers
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Newsletter Popup Configuration
              </CardTitle>
              <CardDescription>
                Configure the newsletter popup content and appearance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Enable/Disable Toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="enabled">Enable Newsletter Popup</Label>
                  <p className="text-sm text-gray-500">Show the newsletter popup to new visitors</p>
                </div>
                <Switch
                  id="enabled"
                  checked={newsletterSettings.is_enabled}
                  onCheckedChange={(checked) => handleSettingsChange('is_enabled', checked)}
                />
              </div>

              {/* Content Settings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={newsletterSettings.title}
                      onChange={(e) => handleSettingsChange('title', e.target.value)}
                      placeholder="Get 15% Off Your First Order!"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="subtitle">Subtitle</Label>
                    <Input
                      id="subtitle"
                      value={newsletterSettings.subtitle}
                      onChange={(e) => handleSettingsChange('subtitle', e.target.value)}
                      placeholder="Join our newsletter for exclusive offers"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={newsletterSettings.description}
                      onChange={(e) => handleSettingsChange('description', e.target.value)}
                      placeholder="Be the first to know about new arrivals..."
                      rows={3}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="offer_text">Offer Text</Label>
                    <Input
                      id="offer_text"
                      value={newsletterSettings.offer_text}
                      onChange={(e) => handleSettingsChange('offer_text', e.target.value)}
                      placeholder="Use code WELCOME15 at checkout"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="button_text">Button Text</Label>
                    <Input
                      id="button_text"
                      value={newsletterSettings.button_text}
                      onChange={(e) => handleSettingsChange('button_text', e.target.value)}
                      placeholder="Claim Your Discount"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="image_upload">Newsletter Image</Label>
                    <div className="space-y-3">
                      {/* Image Preview */}
                      {(newsletterSettings.image_url || imagePreview) && (
                        <div className="relative inline-block">
                          <img
                            src={newsletterSettings.image_url || imagePreview}
                            alt="Newsletter preview"
                            className="w-32 h-32 object-cover rounded-lg border"
                          />
                          <Button
                            type="button"
                            size="sm"
                            variant="destructive"
                            className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                            onClick={removeImage}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                      
                      {/* Upload Button */}
                      <div className="flex items-center gap-3">
                        <input
                          type="file"
                          id="image_upload"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                          disabled={uploadingImage}
                        />
                        <Label
                          htmlFor="image_upload"
                          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 disabled:opacity-50"
                        >
                          {uploadingImage ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#D2B48C]"></div>
                          ) : (
                            <Upload className="w-4 h-4" />
                          )}
                          {uploadingImage ? 'Uploading...' : 'Upload Image'}
                        </Label>
                        
                        {/* Manual URL Input */}
                        <div className="flex-1">
                          <Input
                            value={newsletterSettings.image_url}
                            onChange={(e) => handleSettingsChange('image_url', e.target.value)}
                            placeholder="Or enter image URL manually"
                            className="text-sm"
                          />
                        </div>
                      </div>
                      
                      <p className="text-xs text-gray-500">
                        Upload an image or enter a URL. Recommended size: 400x300px
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Preview */}
              <div className="border rounded-lg p-4 bg-gray-50">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  Preview
                </h3>
                <div className="bg-white rounded-lg p-4 max-w-sm mx-auto shadow-lg">
                  <img
                    src={newsletterSettings.image_url}
                    alt="Newsletter preview"
                    className="w-full h-32 object-cover rounded-lg mb-3"
                  />
                  <div className="text-center">
                    <h4 className="font-bold text-lg mb-1">{newsletterSettings.title}</h4>
                    <p className="text-sm text-gray-600 mb-2">{newsletterSettings.subtitle}</p>
                    <p className="text-xs text-gray-500 mb-3">{newsletterSettings.description}</p>
                    <div className="bg-[#D2B48C] text-white px-3 py-1 rounded-full text-xs mb-3 inline-flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      {newsletterSettings.offer_text}
                    </div>
                    <Button size="sm" className="w-full bg-[#D2B48C] hover:bg-[#C19A6B]">
                      {newsletterSettings.button_text}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button 
                  onClick={saveSettings} 
                  disabled={saving}
                  className="bg-[#D2B48C] hover:bg-[#C19A6B]"
                >
                  {saving ? 'Saving...' : 'Save Settings'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Subscribers Tab */}
        <TabsContent value="subscribers" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Newsletter Subscribers
                  </CardTitle>
                  <CardDescription>
                    Manage your newsletter subscribers
                  </CardDescription>
                </div>
                <Button 
                  onClick={exportSubscribers}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Export CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-200">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-200 p-3 text-left">Email</th>
                      <th className="border border-gray-200 p-3 text-left">Subscribed</th>
                      <th className="border border-gray-200 p-3 text-left">Status</th>
                      <th className="border border-gray-200 p-3 text-left">Source</th>
                      <th className="border border-gray-200 p-3 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subscribers.map((subscriber) => (
                      <tr key={subscriber.id} className="hover:bg-gray-50">
                        <td className="border border-gray-200 p-3">{subscriber.email}</td>
                        <td className="border border-gray-200 p-3">
                          {new Date(subscriber.subscribed_at).toLocaleDateString()}
                        </td>
                        <td className="border border-gray-200 p-3">
                          <Badge variant={subscriber.is_active ? "default" : "secondary"}>
                            {subscriber.is_active ? "Active" : "Unsubscribed"}
                          </Badge>
                        </td>
                        <td className="border border-gray-200 p-3 capitalize">{subscriber.source}</td>
                        <td className="border border-gray-200 p-3">
                          {subscriber.is_active && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => unsubscribeUser(subscriber.email)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-3 h-3 mr-1" />
                              Unsubscribe
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination */}
              {totalSubscribers > subscribersPerPage && (
                <div className="flex items-center justify-between mt-6">
                  <div className="text-sm text-gray-500">
                    Showing {((subscribersPage - 1) * subscribersPerPage) + 1} to {Math.min(subscribersPage * subscribersPerPage, totalSubscribers)} of {totalSubscribers} subscribers
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSubscribersPage(prev => Math.max(1, prev - 1))}
                      disabled={subscribersPage === 1}
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-gray-500">
                      Page {subscribersPage} of {Math.ceil(totalSubscribers / subscribersPerPage)}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSubscribersPage(prev => prev + 1)}
                      disabled={subscribersPage >= Math.ceil(totalSubscribers / subscribersPerPage)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">Total Subscribers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-[#D2B48C]">{stats.total_subscribers}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">Active Subscribers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.active_subscribers}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">Recent (30 days)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{stats.recent_subscribers}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">Unsubscribed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{stats.unsubscribed_count}</div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Newsletter; 