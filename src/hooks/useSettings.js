import { useState, useCallback, useEffect } from 'react';
import { api } from '@/lib/services/api';
import { useToast } from '@/components/ui/use-toast';
import { TOAST_MESSAGES } from '@/lib/toast-messages';

const initialSettings = {
  storeName: "Tailored Hands",
  email: "admin@tailoredhands.com",
  phone: "+234 123 456 7890",
  address: "123 Fashion Street, Lagos, Nigeria",
  currency: "USD",
  timezone: "Africa/Lagos",
  paystackPublicKey: "",
  paystackSecretKey: "",
  exchangeRateGHS: 16,
  captchaEnabled: false,
  favicon_url: "",
  navbar_logo_url: "",
  footer_logo_url: "",
  hero_image_url: "",
  hero_title: "",
  hero_subtitle: "",
  hero_button_text: "",
};

export const useSettings = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState(initialSettings);
  const [loading, setLoading] = useState(true); // Start as true since we'll fetch immediately
  const [saving, setSaving] = useState(false);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/settings/public');

      if (!response.success) {
        console.error('Error fetching settings:', response.error);
        // Don't show error toast, just use defaults
        return;
      }
      
      if (response.settings) {
        const data = response.settings;
        setSettings({
          storeName: data.store_name || initialSettings.storeName,
          email: data.contact_email || initialSettings.email,
          phone: data.contact_phone || initialSettings.phone,
          address: data.address || initialSettings.address,
          currency: data.currency || initialSettings.currency,
          timezone: data.timezone || initialSettings.timezone,
          paystackPublicKey: data.paystack_public_key || '',
          paystackSecretKey: data.paystack_secret_key || '', 
          exchangeRateGHS: data.exchange_rate_ghs ? Number(data.exchange_rate_ghs) : initialSettings.exchangeRateGHS,
          captchaEnabled: data.captcha_enabled || data.recaptcha_enabled || initialSettings.captchaEnabled,
          favicon_url: data.favicon_url || initialSettings.favicon_url,
          navbar_logo_url: data.navbar_logo_url || initialSettings.navbar_logo_url,
          footer_logo_url: data.footer_logo_url || initialSettings.footer_logo_url,
          hero_image_url: data.hero_image_url || initialSettings.hero_image_url,
          hero_title: data.hero_title || initialSettings.hero_title,
          hero_subtitle: data.hero_subtitle || initialSettings.hero_subtitle,
          hero_button_text: data.hero_button_text || initialSettings.hero_button_text,
        });
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      // Don't show error toast, just use defaults
    } finally {
      setLoading(false);
    }
  }, []);

  const updateSettings = useCallback(async (newSettings) => {
    setSaving(true);
    try {
      const response = await api.put('/admin/settings', {
        store_name: newSettings.storeName,
        contact_email: newSettings.email,
        contact_phone: newSettings.phone,
        address: newSettings.address,
        currency: newSettings.currency,
        timezone: newSettings.timezone,
        paystack_public_key: newSettings.paystackPublicKey,
        paystack_secret_key: newSettings.paystackSecretKey,
        exchange_rate_ghs: newSettings.exchangeRateGHS,
        recaptcha_enabled: newSettings.captchaEnabled,
      });

      if (!response.success) {
        throw new Error(response.error || 'Failed to update settings');
      }

      setSettings(newSettings);
      toast({
        ...TOAST_MESSAGES.success,
        description: "Settings updated successfully!"
      });
      
      return { success: true };
    } catch (error) {
      console.error('Error updating settings:', error);
      toast({
        ...TOAST_MESSAGES.error,
        description: error.message || "Failed to update settings"
      });
      return { success: false, error: error.message };
    } finally {
      setSaving(false);
    }
  }, [toast]);

  // Automatically fetch settings on mount
  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  return {
    settings,
    loading,
    saving,
    fetchSettings,
    updateSettings,
    setSettings
  };
};