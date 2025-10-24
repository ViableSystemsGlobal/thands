import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
// Notification settings functionality temporarily disabled - backend endpoints not yet implemented
import { Save, Loader2, Mail, MessageSquare, TrendingUp, CheckCircle2, XCircle, Clock } from "lucide-react";
import { getNotificationSettings, getNotificationStats } from "@/lib/services/notifications";

const NotificationToggle = ({ label, description, enabled, onChange, icon: Icon }) => (
  <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
    <div className="flex items-start space-x-3">
      <div className="flex-shrink-0 mt-1">
        <Icon className="h-5 w-5 text-slate-500" />
      </div>
      <div>
        <h4 className="font-medium text-slate-900">{label}</h4>
        <p className="text-sm text-slate-600 mt-1">{description}</p>
      </div>
    </div>
    <label className="relative inline-flex items-center cursor-pointer">
      <input
        type="checkbox"
        checked={enabled}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only peer"
      />
      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-sky-300 dark:peer-focus:ring-sky-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-600"></div>
    </label>
  </div>
);

const StatsCard = ({ title, value, icon: Icon, color = "sky" }) => {
  const colorClasses = {
    sky: "from-sky-500 to-sky-600 text-sky-600",
    green: "from-green-500 to-green-600 text-green-600",
    red: "from-red-500 to-red-600 text-red-600",
    yellow: "from-yellow-500 to-yellow-600 text-yellow-600"
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-600">{title}</p>
          <p className="text-2xl font-bold text-slate-900 mt-2">{value}</p>
        </div>
        <div className={`bg-gradient-to-r ${colorClasses[color]} rounded-lg p-3`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  );
};

const NotificationSettings = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState(null);
  const [statsTimeframe, setStatsTimeframe] = useState('30 days');
  const [settings, setSettings] = useState({
    email_enabled: true,
    sms_enabled: true,
    order_confirmation_email: true,
    order_confirmation_sms: true,
    payment_success_email: true,
    payment_success_sms: true,
    order_shipped_email: true,
    order_shipped_sms: true,
    order_delivered_email: true,
    order_delivered_sms: false,
    gift_voucher_email: true,
    gift_voucher_sms: false
  });

  const loadSettings = useCallback(async () => {
    try {
      const fetchedSettings = await getNotificationSettings();
      setSettings(fetchedSettings);
    } catch (error) {
      console.error("Error loading notification settings:", error);
      toast({
        title: "Error",
        description: "Failed to load notification settings.",
        variant: "destructive"
      });
    }
  }, [toast]);

  const loadStats = useCallback(async () => {
    try {
      const fetchedStats = await getNotificationStats(statsTimeframe);
      setStats(fetchedStats);
    } catch (error) {
      console.error("Error loading notification stats:", error);
      toast({
        title: "Error",
        description: "Failed to load notification statistics.",
        variant: "destructive"
      });
    }
  }, [statsTimeframe, toast]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([loadSettings(), loadStats()]);
      setLoading(false);
    };
    loadData();
  }, [loadSettings, loadStats]);

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Notification settings save endpoint not yet implemented in backend
      console.log('📧 Notification settings save endpoint not yet implemented in backend');
      
      toast({
        title: "Feature Not Available",
        description: "Notification settings save functionality is not yet implemented in the backend.",
        variant: "destructive",
      });
    } catch (error) {
      console.error("Error saving notification settings:", error);
      toast({
        title: "Save Failed",
        description: "Failed to save notification settings. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 md:p-8 bg-gradient-to-br from-slate-50 to-gray-100 min-h-screen">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-slate-50 to-gray-100 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-light text-slate-800">Notification Settings</h1>
          <p className="text-slate-600 mt-2">Control automated email and SMS notifications sent to customers</p>
        </div>
        <Button 
          onClick={handleSave} 
          disabled={saving}
          className="bg-sky-600 hover:bg-sky-700 text-white"
        >
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Settings
            </>
          )}
        </Button>
      </div>

      {/* Statistics */}
      {stats && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-slate-800">Notification Statistics</h2>
            <select 
              value={statsTimeframe}
              onChange={(e) => setStatsTimeframe(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg bg-white"
            >
              <option value="7 days">Last 7 days</option>
              <option value="30 days">Last 30 days</option>
            </select>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <StatsCard 
              title="Total Sent" 
              value={stats.total} 
              icon={TrendingUp} 
              color="sky" 
            />
            <StatsCard 
              title="Successful" 
              value={stats.successful} 
              icon={CheckCircle2} 
              color="green" 
            />
            <StatsCard 
              title="Failed" 
              value={stats.failed} 
              icon={XCircle} 
              color="red" 
            />
            <StatsCard 
              title="Success Rate" 
              value={stats.total > 0 ? `${Math.round((stats.successful / stats.total) * 100)}%` : "0%"} 
              icon={TrendingUp} 
              color="yellow" 
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Email Notifications */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200">
          <div className="flex items-center gap-3 mb-6">
            <Mail className="h-6 w-6 text-sky-600" />
            <h2 className="text-xl font-semibold text-slate-800">Email Notifications</h2>
          </div>
          
          <div className="space-y-4">
            <NotificationToggle
              label="Enable Email Notifications"
              description="Master switch for all email notifications"
              enabled={settings.email_enabled}
              onChange={(value) => handleSettingChange('email_enabled', value)}
              icon={Mail}
            />
            
            <div className={`space-y-3 ${!settings.email_enabled ? 'opacity-50 pointer-events-none' : ''}`}>
              <NotificationToggle
                label="Order Confirmation"
                description="Send email when customer places an order"
                enabled={settings.order_confirmation_email}
                onChange={(value) => handleSettingChange('order_confirmation_email', value)}
                icon={Clock}
              />
              
              <NotificationToggle
                label="Payment Success"
                description="Send email when payment is confirmed"
                enabled={settings.payment_success_email}
                onChange={(value) => handleSettingChange('payment_success_email', value)}
                icon={CheckCircle2}
              />
              
              <NotificationToggle
                label="Order Shipped"
                description="Send email when order is shipped"
                enabled={settings.order_shipped_email}
                onChange={(value) => handleSettingChange('order_shipped_email', value)}
                icon={TrendingUp}
              />
              
              <NotificationToggle
                label="Order Delivered"
                description="Send email when order is delivered"
                enabled={settings.order_delivered_email}
                onChange={(value) => handleSettingChange('order_delivered_email', value)}
                icon={CheckCircle2}
              />
              
              <NotificationToggle
                label="Gift Voucher Purchase"
                description="Send email with voucher details after purchase"
                enabled={settings.gift_voucher_email}
                onChange={(value) => handleSettingChange('gift_voucher_email', value)}
                icon={Mail}
              />
            </div>
          </div>
        </div>

        {/* SMS Notifications */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200">
          <div className="flex items-center gap-3 mb-6">
            <MessageSquare className="h-6 w-6 text-green-600" />
            <h2 className="text-xl font-semibold text-slate-800">SMS Notifications</h2>
          </div>
          
          <div className="space-y-4">
            <NotificationToggle
              label="Enable SMS Notifications"
              description="Master switch for all SMS notifications"
              enabled={settings.sms_enabled}
              onChange={(value) => handleSettingChange('sms_enabled', value)}
              icon={MessageSquare}
            />
            
            <div className={`space-y-3 ${!settings.sms_enabled ? 'opacity-50 pointer-events-none' : ''}`}>
              <NotificationToggle
                label="Order Confirmation"
                description="Send SMS when customer places an order"
                enabled={settings.order_confirmation_sms}
                onChange={(value) => handleSettingChange('order_confirmation_sms', value)}
                icon={Clock}
              />
              
              <NotificationToggle
                label="Payment Success"
                description="Send SMS when payment is confirmed"
                enabled={settings.payment_success_sms}
                onChange={(value) => handleSettingChange('payment_success_sms', value)}
                icon={CheckCircle2}
              />
              
              <NotificationToggle
                label="Order Shipped"
                description="Send SMS when order is shipped"
                enabled={settings.order_shipped_sms}
                onChange={(value) => handleSettingChange('order_shipped_sms', value)}
                icon={TrendingUp}
              />
              
              <NotificationToggle
                label="Order Delivered"
                description="Send SMS when order is delivered"
                enabled={settings.order_delivered_sms}
                onChange={(value) => handleSettingChange('order_delivered_sms', value)}
                icon={CheckCircle2}
              />
              
              <NotificationToggle
                label="Gift Voucher Purchase"
                description="Send SMS with voucher details after purchase"
                enabled={settings.gift_voucher_sms}
                onChange={(value) => handleSettingChange('gift_voucher_sms', value)}
                icon={MessageSquare}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Information Panel */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">How Automated Notifications Work</h3>
        <div className="text-blue-800 space-y-2">
          <p>• <strong>Order Confirmation:</strong> Sent immediately when a customer places an order</p>
          <p>• <strong>Payment Success:</strong> Sent when payment is confirmed via Paystack</p>
          <p>• <strong>Order Shipped:</strong> Sent when you mark an order as "shipped" in admin panel</p>
          <p>• <strong>Order Delivered:</strong> Sent when you mark an order as "delivered" in admin panel</p>
          <p>• <strong>Gift Voucher:</strong> Sent with voucher code and instructions after purchase</p>
        </div>
        <div className="mt-4 p-3 bg-blue-100 rounded-lg">
          <p className="text-sm text-blue-700">
            <strong>Note:</strong> Make sure your email and SMS gateways are properly configured before enabling notifications.
            Failed notifications will be logged for troubleshooting.
          </p>
        </div>
      </div>
    </div>
  );
};

export default NotificationSettings; 