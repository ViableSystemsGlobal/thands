import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { Save, Loader2, AlertCircle, CheckCircle, Settings as SettingsIcon, Store, DollarSign, CreditCard, Shield, Image, Users, Database, ShieldCheck, Plus, Trash2, Upload, Download, X, Mail, Truck, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast';
import adminApiClient from '@/lib/services/adminApiClient';
import adminSettingsApi from '@/lib/services/adminSettingsApi';
import { loadExchangeRateFromSettings, forceRefreshExchangeRate, refreshAllPrices } from '@/lib/services/exchangeRate';
import { uploadHeroImage, uploadCollectionImage, deleteImage } from '@/lib/services/uploadApi';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import AdminUserForm from '@/components/admin/users/AdminUserForm';
import AdminUsersList from '@/components/admin/users/AdminUsersList';
import adminUsersApi from '@/lib/services/adminUsersApi';
import GoogleAddressAutocomplete from '@/components/checkout/GoogleAddressAutocomplete';

const SettingsNew = () => {
  const { toast } = useToast();
  const { user } = useAdminAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState('store');
  
  const [settings, setSettings] = useState({
    store_name: '',
    contact_email: '',
    contact_phone: '',
    address: '',
    store_description: '',
    currency: 'USD',
    timezone: 'UTC',
    exchange_rate: 16.0,
    exchange_rate_gbp: 0.79,
    paystack_public_key: '',
    paystack_secret_key: '',
    hero_image_url: '',
    hero_title: '',
    hero_subtitle: '',
    hero_button_text: '',
    navbar_logo_url: '',
    footer_logo_url: '',
    favicon_url: '',
    captcha_enabled: false,
    google_places_api_key: ''
  });

  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [changingPassword, setChangingPassword] = useState(false);

  // Admin users state
  const [adminUsers, setAdminUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [showAddUserForm, setShowAddUserForm] = useState(false);

  // Collections state
  const [collections, setCollections] = useState([]);
  const [loadingCollections, setLoadingCollections] = useState(false);
  const [savingCollections, setSavingCollections] = useState(false);
  const [uploadingCollection, setUploadingCollection] = useState({});

  // Email settings state
  const [emailSettings, setEmailSettings] = useState({
    smtp_host: '',
    smtp_port: 587,
    smtp_username: '',
    smtp_password: '',
    smtp_from_email: '',
    smtp_from_name: '',
    smtp_secure: false
  });
  const [savingEmailSettings, setSavingEmailSettings] = useState(false);

  // DHL Shipping settings state
  const [shippingSettings, setShippingSettings] = useState({
    dhl_api_key: '',
    dhl_api_secret: '',
    dhl_account_number: '',
    dhl_base_url: 'https://express.api.dhl.com/mydhlapi/test',
    dhl_from_name: 'TailoredHands',
    dhl_from_street: '123 Business Street',
    dhl_from_city: 'Accra',
    dhl_from_state: 'Greater Accra',
    dhl_from_zip: '00233',
    dhl_from_country: 'GH'
  });
  const [savingShippingSettings, setSavingShippingSettings] = useState(false);

  // MyDHL test state
  const [testingDhl, setTestingDhl] = useState(false);
  const [dhlTestResult, setDhlTestResult] = useState(null);

  // Database backup/restore state
  const [backupStatus, setBackupStatus] = useState(null); // { pgDumpAvailable, psqlAvailable }
  const [downloadingBackup, setDownloadingBackup] = useState(false);
  const [restoringBackup, setRestoringBackup] = useState(false);
  const [restoreFile, setRestoreFile] = useState(null);

  // Debug collections state
  useEffect(() => {
    console.log('📊 Collections state changed:', collections);
  }, [collections]);

  // Load backup tool status when database section is active
  useEffect(() => {
    if (activeSection === 'database' && !backupStatus) {
      adminApiClient.get('/admin/backup/status')
        .then(res => setBackupStatus(res.data))
        .catch(() => setBackupStatus({ pgDumpAvailable: false, psqlAvailable: false }));
    }
  }, [activeSection, backupStatus]);

  const handleDownloadBackup = async () => {
    setDownloadingBackup(true);
    try {
      const token = localStorage.getItem('adminToken');
      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3003/api';
      const response = await fetch(`${apiBase}/admin/backup/download`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Download failed');
      }
      const blob = await response.blob();
      const disposition = response.headers.get('Content-Disposition') || '';
      const match = disposition.match(/filename="([^"]+)"/);
      const filename = match ? match[1] : 'tailoredhands-backup.sql.gz';
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: 'Backup downloaded', description: filename });
    } catch (err) {
      toast({ title: 'Backup failed', description: err.message, variant: 'destructive' });
    } finally {
      setDownloadingBackup(false);
    }
  };

  const handleRestoreBackup = async () => {
    if (!restoreFile) return;
    if (!window.confirm('⚠️ This will overwrite your current database. Are you sure?')) return;
    setRestoringBackup(true);
    try {
      const token = localStorage.getItem('adminToken');
      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3003/api';
      const formData = new FormData();
      formData.append('backup', restoreFile);
      const response = await fetch(`${apiBase}/admin/backup/restore`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Restore failed');
      toast({ title: 'Restore complete', description: 'Database restored successfully.' });
      setRestoreFile(null);
    } catch (err) {
      toast({ title: 'Restore failed', description: err.message, variant: 'destructive' });
    } finally {
      setRestoringBackup(false);
    }
  };

  // Load admin users when users section is active
  useEffect(() => {
    if (activeSection === 'users') {
      loadAdminUsers();
    }
  }, [activeSection]);

  // Load email settings when email section is active
  useEffect(() => {
    if (activeSection === 'email') {
      loadEmailSettings();
    }
  }, [activeSection]);

  // Load shipping settings when shipping section is active
  useEffect(() => {
    if (activeSection === 'shipping') {
      loadShippingSettings();
    }
  }, [activeSection]);

  // Load email template when email-template section is active
  useEffect(() => {
    if (activeSection === 'email-template') {
      loadEmailTemplate();
    }
  }, [activeSection]);

  // Fetch current settings
  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      try {
        const response = await adminSettingsApi.getSettings();
        if (response.success && response.settings) {
          setSettings({
            store_name: response.settings.store_name || 'Tailored Hands',
            contact_email: response.settings.contact_email || '',
            contact_phone: response.settings.contact_phone || '',
            address: response.settings.address || '',
            store_description: response.settings.store_description || '',
            currency: response.settings.currency || 'USD',
            timezone: response.settings.timezone || 'UTC',
            exchange_rate: response.settings.exchange_rate_ghs || 16.0,
            exchange_rate_gbp: response.settings.exchange_rate_gbp || 0.79,
            paystack_public_key: response.settings.paystack_public_key || '',
            paystack_secret_key: response.settings.paystack_secret_key || '',
            hero_image_url: response.settings.hero_image_url || '',
            hero_title: response.settings.hero_title || 'Modern Elegance Redefined',
            hero_subtitle: response.settings.hero_subtitle || 'Discover our collection of meticulously crafted African-inspired pieces that blend traditional aesthetics with contemporary design.',
            hero_button_text: response.settings.hero_button_text || 'EXPLORE COLLECTION',
            navbar_logo_url: response.settings.navbar_logo_url || '',
            footer_logo_url: response.settings.footer_logo_url || '',
            favicon_url: response.settings.favicon_url || '',
            captcha_enabled: response.settings.captcha_enabled || false,
            google_places_api_key: response.settings.google_places_api_key || ''
          });
        }
      } catch (error) {
        console.error('Error loading settings:', error);
        toast({
          title: "Error",
          description: "Failed to load settings",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [toast]);

  const handleSave = async () => {
    setSaving(true);
    try {
      console.log('🔍 handleSave called with settings:', settings);
      console.log('🔍 google_places_api_key value:', settings.google_places_api_key);
      
      // Save Google Places API key separately if it exists
      if (settings.google_places_api_key) {
        try {
          await adminApiClient.put('/admin/settings/google-places-api-key', {
            google_places_api_key: settings.google_places_api_key
          });
          console.log('✅ Google Places API key saved successfully');
        } catch (error) {
          console.error('❌ Error saving Google Places API key:', error);
        }
      }

      const settingsToSave = {
        store_name: settings.store_name,
        contact_email: settings.contact_email,
        contact_phone: settings.contact_phone,
        address: settings.address,
        store_description: settings.store_description,
        currency: settings.currency,
        timezone: settings.timezone,
        exchange_rate_ghs: parseFloat(settings.exchange_rate),
        exchange_rate_gbp: parseFloat(settings.exchange_rate_gbp) || 0.79,
        paystack_public_key: settings.paystack_public_key,
        paystack_secret_key: settings.paystack_secret_key,
        hero_image_url: settings.hero_image_url,
        hero_title: settings.hero_title,
        hero_subtitle: settings.hero_subtitle,
        hero_button_text: settings.hero_button_text,
        favicon_url: settings.favicon_url,
        navbar_logo_url: settings.navbar_logo_url,
        footer_logo_url: settings.footer_logo_url,
        captcha_enabled: settings.captcha_enabled
      };

      console.log('🔍 Frontend sending to backend:', {
        paystack_public_key: settingsToSave.paystack_public_key ? 'SET' : 'NOT SET',
        paystack_secret_key: settingsToSave.paystack_secret_key ? 'SET' : 'NOT SET',
        actual_public_key: settingsToSave.paystack_public_key,
        actual_secret_key: settingsToSave.paystack_secret_key
      });

      const response = await adminSettingsApi.updateSettings(settingsToSave);
      if (response.success) {
          toast({
        title: "Settings Saved Successfully",
        description: "Your store settings have been updated and are now active across the website.",
        variant: "default",
      });

        // SIMPLE SOLUTION: Refresh all prices everywhere (but don't reload page for API keys)
        if (settings.google_places_api_key || settings.paystack_public_key || settings.paystack_secret_key) {
          console.log('🔄 Skipping page reload for API keys save');
        } else {
          await refreshAllPrices();
        }
        
        // Update favicon immediately after save (use saved value from response or current state)
        const savedFaviconUrl = response.settings?.favicon_url || settings.favicon_url;
        console.log('🎨 Updating favicon with URL:', savedFaviconUrl);
        updateFavicon(savedFaviconUrl);
        
        // Force a page refresh of the favicon by triggering a small delay and re-update
        setTimeout(() => {
          updateFavicon(savedFaviconUrl);
        }, 100);
      } else {
        throw new Error(response.error || 'Failed to save settings');
      }
      } catch (error) {
      console.error('Error saving settings:', error);
        toast({
        title: "Error",
        description: error.message || "Failed to save settings",
          variant: "destructive",
        });
      } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (passwordData.new_password !== passwordData.confirm_password) {
      toast({
        title: "Error",
        description: "New passwords do not match",
        variant: "destructive",
      });
      return;
    }

    setChangingPassword(true);
    try {
      const response = await adminApiClient.put('/auth/change-password', {
        current_password: passwordData.current_password,
        new_password: passwordData.new_password
      });

      if (response.success) {
      toast({
        title: "Password Changed Successfully",
          description: "Your admin password has been updated.",
        variant: "default",
      });
        setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
      } else {
        throw new Error(response.error || 'Failed to change password');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to change password",
        variant: "destructive",
      });
    } finally {
      setChangingPassword(false);
    }
  };

  // Admin users functions
  const loadAdminUsers = async () => {
    if (activeSection !== 'users') return;
    
    setLoadingUsers(true);
    try {
      const response = await adminUsersApi.getUsers();
          setAdminUsers(response.users || []);
    } catch (error) {
      console.error('Error loading admin users:', error);
      toast({
        title: "Error",
        description: "Failed to load admin users",
        variant: "destructive",
      });
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleUserCreated = (newUser) => {
    setAdminUsers(prev => [newUser, ...prev]);
    setShowAddUserForm(false);
      toast({
      title: "Success",
      description: "Admin user created successfully",
    });
  };

  // Email settings functions
  const loadEmailSettings = async () => {
    if (activeSection !== 'email') return;
    
    try {
      const response = await adminApiClient.get('/email/settings');
      console.log('🔍 Email settings response:', response);
      const data = response.data || response;
      console.log('🔍 Email settings data:', data);
      
      if (data && data.data) {
        console.log('🔍 Email settings nested data:', data.data);
        setEmailSettings({
          smtp_host: data.data.host || '',
          smtp_port: data.data.port || 587,
          smtp_username: data.data.user || '',
          smtp_password: data.data.pass || '',
          smtp_from_email: data.data.from_email || '',
          smtp_from_name: data.data.from_name || '',
          smtp_secure: data.data.port === 465
        });
      } else {
        console.log('🔍 No nested data found, trying direct access');
        setEmailSettings({
          smtp_host: data.host || '',
          smtp_port: data.port || 587,
          smtp_username: data.user || '',
          smtp_password: data.pass || '',
          smtp_from_email: data.from_email || '',
          smtp_from_name: data.from_name || '',
          smtp_secure: data.port === 465
        });
      }
    } catch (error) {
      console.error('Error loading email settings:', error);
      toast({
        title: "Error",
        description: "Failed to load email settings",
        variant: "destructive",
      });
    }
  };

  const saveEmailSettings = async () => {
    setSavingEmailSettings(true);
    try {
      const settingsToSave = {
        smtp_host: emailSettings.smtp_host,
        smtp_port: emailSettings.smtp_port,
        smtp_username: emailSettings.smtp_username,
        smtp_password: emailSettings.smtp_password,
        smtp_from_email: emailSettings.smtp_from_email,
        smtp_from_name: emailSettings.smtp_from_name,
        smtp_secure: emailSettings.smtp_secure
      };

      await adminApiClient.put('/email/settings', settingsToSave);
      
      toast({
        title: "Settings Saved",
        description: "Email settings have been updated successfully.",
        className: "bg-green-50 border-green-200 text-green-700",
      });
    } catch (error) {
      console.error('Error saving email settings:', error);
      toast({
        title: "Error",
        description: "Failed to save email settings.",
        variant: "destructive",
      });
    } finally {
      setSavingEmailSettings(false);
    }
  };

  // Shipping settings functions
  const loadShippingSettings = async () => {
    if (activeSection !== 'shipping') return;
    
    try {
      const response = await adminApiClient.get('/shipping-settings/settings');
      console.log('🚢 Shipping settings response:', response);
      const data = response.data || response;
      console.log('🚢 Shipping settings data:', data);
      
      if (data && data.data) {
        console.log('🚢 Shipping settings nested data:', data.data);
        setShippingSettings(prev => ({
          ...prev,
          ...data.data
        }));
      } else if (data) {
        setShippingSettings(prev => ({
          ...prev,
          ...data
        }));
      }
    } catch (error) {
      console.error('Error loading shipping settings:', error);
      // Don't show error toast for loading, just use defaults
    }
  };

  const saveShippingSettings = async () => {
    setSavingShippingSettings(true);
    try {
      const settingsToSave = {
        dhl_api_key: shippingSettings.dhl_api_key,
        dhl_api_secret: shippingSettings.dhl_api_secret,
        dhl_account_number: shippingSettings.dhl_account_number,
        dhl_base_url: shippingSettings.dhl_base_url,
        dhl_from_name: shippingSettings.dhl_from_name,
        dhl_from_street: shippingSettings.dhl_from_street,
        dhl_from_city: shippingSettings.dhl_from_city,
        dhl_from_state: shippingSettings.dhl_from_state,
        dhl_from_zip: shippingSettings.dhl_from_zip,
        dhl_from_country: shippingSettings.dhl_from_country
      };

      await adminApiClient.put('/shipping-settings/settings', settingsToSave);
      
      toast({
        title: "Settings Saved",
        description: "DHL shipping settings have been updated successfully.",
        className: "bg-green-50 border-green-200 text-green-700",
      });
    } catch (error) {
      console.error('Error saving shipping settings:', error);
      toast({
        title: "Error",
        description: "Failed to save DHL shipping settings.",
        variant: "destructive",
      });
    } finally {
      setSavingShippingSettings(false);
    }
  };

  const handleTestMyDhl = async () => {
    setTestingDhl(true);
    setDhlTestResult(null);
    try {
      // Use saved settings if available, otherwise empty (backend will use DB/env)
      const body = {};
      const response = await adminApiClient.post('/shipping-settings/test-dhl', body);
      const data = response?.data || response;
      setDhlTestResult({
        success: data.success,
        message: data.message,
        error: data.error,
        rates: data.rates,
        details: data.details,
      });
      if (data.success) {
        toast({
          title: "MyDHL test passed",
          description: data.message,
          className: "bg-green-50 border-green-200 text-green-700",
        });
      } else if (data.error) {
        toast({
          title: "MyDHL test failed",
          description: data.error,
          variant: "destructive",
        });
      }
    } catch (err) {
      const errorMessage = err.message || 'Request failed';
      setDhlTestResult({ success: false, error: errorMessage });
      toast({
        title: "MyDHL test failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setTestingDhl(false);
    }
  };

  const handleUserUpdated = (updatedUser) => {
    setAdminUsers(prev => prev.map(user => 
      user.id === updatedUser.id ? updatedUser : user
    ));
  };

  const handleUserDeleted = (deletedUserId) => {
    setAdminUsers(prev => prev.filter(user => user.id !== deletedUserId));
  };

  // Favicon update function - more aggressive to force browser refresh
  const updateFavicon = (faviconUrl) => {
    if (!faviconUrl) {
      // Remove all favicon links if no URL provided
      const existingLinks = document.querySelectorAll('link[rel*="icon"], link[rel="shortcut icon"]');
      existingLinks.forEach(link => link.remove());
      return;
    }
    
    try {
      // Remove ALL existing favicon links (including shortcut icon)
      const existingLinks = document.querySelectorAll('link[rel*="icon"], link[rel="shortcut icon"]');
      existingLinks.forEach(link => {
        link.remove();
        // Force removal from DOM
        if (link.parentNode) {
          link.parentNode.removeChild(link);
        }
      });

      // Handle both absolute and relative URLs
      let url;
      try {
        // Try to create URL - works for absolute URLs
        url = new URL(faviconUrl);
      } catch (e) {
        // If it fails, it's a relative URL - create from current origin
        url = new URL(faviconUrl, window.location.origin);
      }
      
      // Add aggressive cache busting with timestamp
      const timestamp = Date.now();
      url.searchParams.set('v', timestamp);
      url.searchParams.set('t', timestamp);
      const finalUrl = url.toString();

      const faviconType = getFaviconType(faviconUrl);

      // Create multiple favicon link types for better browser compatibility
      const linkTypes = [
        { rel: 'icon', type: faviconType },
        { rel: 'shortcut icon', type: faviconType },
        { rel: 'apple-touch-icon', type: faviconType }
      ];

      linkTypes.forEach(({ rel, type }) => {
        const link = document.createElement('link');
        link.rel = rel;
        link.type = type;
        link.href = finalUrl;
        // Insert at the beginning of head for priority
        document.head.insertBefore(link, document.head.firstChild);
      });

      // Force browser to reload favicon by creating an iframe trick (works in some browsers)
      try {
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        iframe.src = finalUrl;
        document.body.appendChild(iframe);
        setTimeout(() => {
          if (iframe.parentNode) {
            iframe.parentNode.removeChild(iframe);
          }
        }, 100);
      } catch (e) {
        // Ignore iframe errors
      }

      console.log('🎨 Favicon updated with multiple link types:', finalUrl);
      
      // Force a small delay and update again to ensure browser picks it up
      setTimeout(() => {
        const links = document.querySelectorAll('link[rel*="icon"]');
        links.forEach(link => {
          const href = link.getAttribute('href');
          if (href && !href.includes('v=')) {
            const newUrl = new URL(href.includes('http') ? href : `${window.location.origin}${href}`, window.location.origin);
            newUrl.searchParams.set('v', Date.now());
            link.href = newUrl.toString();
          }
        });
      }, 500);
    } catch (error) {
      console.error('Error updating favicon:', error);
      // Fallback: try to set it directly without URL manipulation
      const existingLinks = document.querySelectorAll('link[rel*="icon"], link[rel="shortcut icon"]');
      existingLinks.forEach(link => link.remove());
      
      const link = document.createElement('link');
      link.rel = 'icon';
      link.type = getFaviconType(faviconUrl);
      link.href = `${faviconUrl}?v=${Date.now()}&t=${Date.now()}`;
      document.head.insertBefore(link, document.head.firstChild);
    }
  };

  const getFaviconType = (url) => {
    const extension = url.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'ico':
        return 'image/x-icon';
      case 'png':
        return 'image/png';
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg';
      case 'svg':
        return 'image/svg+xml';
      case 'gif':
        return 'image/gif';
      default:
        return 'image/x-icon';
    }
  };

  // Collections management functions
  const loadCollections = useCallback(async () => {
    try {
      setLoadingCollections(true);
      console.log('🔄 Loading collections...');
      const response = await adminApiClient.get('/collections');
      console.log('📦 Collections response:', response);
      if (response.success) {
        console.log('✅ Setting collections:', response.data);
        // Handle double-wrapped response from adminApiClient
        const collectionsData = response.data?.data || response.data || [];
        console.log('🎯 Actual collections data:', collectionsData);
        setCollections(collectionsData);
      } else {
        // Initialize with default collections if none exist
        setCollections([
          {
        id: 1,
            name: 'Kaftan',
            description: 'Explore our collection of elegant kaftans',
            search_terms: 'kaftan, kaftans',
            image_url: ''
          },
          {
            id: 2,
            name: 'Casual Wear',
            description: 'Comfortable and stylish casual wear',
            search_terms: 'casual, everyday',
            image_url: ''
          }
        ]);
      }
    } catch (error) {
      console.error('Error loading collections:', error);
      // Initialize with default collections on error
      setCollections([
        {
          id: 1,
          name: 'Kaftan',
          description: 'Explore our collection of elegant kaftans',
          search_terms: 'kaftan, kaftans',
          image_url: ''
        },
        {
          id: 2,
          name: 'Casual Wear',
          description: 'Comfortable and stylish casual wear',
          search_terms: 'casual, everyday',
          image_url: ''
        }
      ]);
    } finally {
      setLoadingCollections(false);
    }
  }, []); // No dependencies needed

  // Load collections when appearance section is active
  useEffect(() => {
    console.log('🎯 useEffect triggered - activeSection:', activeSection);
    if (activeSection === 'appearance') {
      console.log('🚀 Loading collections for appearance section');
      loadCollections();
    }
  }, [activeSection, loadCollections]);

  const handleCollectionInputChange = useCallback((collectionId, field, value) => {
    console.log('🔄 Updating collection:', { collectionId, field, value });
    setCollections(prev => {
      const prevArray = Array.isArray(prev) ? prev : [];
      return prevArray.map(collection => 
        collection.id === collectionId 
          ? { ...collection, [field]: value }
          : collection
      );
    });
  }, []);

  const handleCollectionImageUpload = async (collectionId, file) => {
    if (!file) {
      console.log('❌ No file provided to handleCollectionImageUpload');
      return;
    }

    console.log('📁 File received:', {
      name: file.name,
      size: file.size,
      type: file.type
    });

    try {
      setUploadingCollection(prev => ({ ...prev, [collectionId]: true }));
      
      console.log('📤 Uploading file...');
      const response = await uploadCollectionImage(file);
      console.log('📥 Upload response:', response);
      if (response.success) {
        console.log('✅ Image uploaded, updating collection with URL:', response.imageUrl);
        handleCollectionInputChange(collectionId, 'image_url', response.imageUrl);
        toast({
          title: "Success",
          description: "Image uploaded successfully",
        });
      } else {
        throw new Error(response.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Error",
        description: "Failed to upload image",
        variant: "destructive",
      });
    } finally {
      setUploadingCollection(prev => ({ ...prev, [collectionId]: false }));
    }
  };

  const removeCollection = useCallback((collectionId) => {
    setCollections(prev => {
      const prevArray = Array.isArray(prev) ? prev : [];
      return prevArray.filter(collection => collection.id !== collectionId);
    });
  }, []);

  const addCollection = useCallback(() => {
    setCollections(prev => {
      const prevArray = Array.isArray(prev) ? prev : [];
      const newId = Math.max(...prevArray.map(c => c.id), 0) + 1;
      return [...prevArray, {
        id: newId,
        name: '',
        description: '',
        search_terms: '',
        image_url: ''
      }];
    });
  }, []);

  const saveCollections = useCallback(async () => {
    try {
      setSavingCollections(true);
      const collectionsArray = Array.isArray(collections) ? collections : [];
      const response = await adminApiClient.post('/collections', { collections: collectionsArray });
      if (response.success) {
        toast({
          title: "Success",
          description: "Collections saved successfully",
        });
        // Reload collections from database to ensure sync
        loadCollections();
      } else {
        throw new Error(response.error || 'Save failed');
      }
    } catch (error) {
      console.error('Error saving collections:', error);
      toast({
        title: "Error",
        description: "Failed to save collections",
        variant: "destructive",
      });
    } finally {
      setSavingCollections(false);
    }
  }, [collections, toast, loadCollections]);

  // Collections Management Section Component (memoized to prevent unnecessary re-renders)
  const CollectionsManagementSection = useMemo(() => {
    if (loadingCollections) {
      return (
        <div className="text-center py-8">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="mt-2 text-gray-600">Loading collections...</p>
        </div>
      );
    }

    // Ensure collections is always an array
    const collectionsArray = Array.isArray(collections) ? collections : [];

    return (
      <div className="space-y-6">
        {/* Collections List */}
        {collectionsArray.map((collection, index) => (
          <motion.div
            key={collection.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <Layers className="h-5 w-5 text-orange-600" />
                    <span>Collection {index + 1}</span>
                  </CardTitle>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => removeCollection(collection.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Remove
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Collection Details */}
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor={`name-${collection.id}`}>Collection Name</Label>
                      <Input
                        id={`name-${collection.id}`}
                        value={collection.name}
                        onChange={(e) => handleCollectionInputChange(collection.id, 'name', e.target.value)}
                        placeholder="e.g., Kaftan"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor={`description-${collection.id}`}>Description</Label>
                      <Textarea
                        id={`description-${collection.id}`}
                        value={collection.description}
                        onChange={(e) => handleCollectionInputChange(collection.id, 'description', e.target.value)}
                        placeholder="e.g., Explore our collection of elegant kaftans"
                        rows={3}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor={`search_terms-${collection.id}`}>Search Terms</Label>
                      <Input
                        id={`search_terms-${collection.id}`}
                        value={collection.search_terms}
                        onChange={(e) => handleCollectionInputChange(collection.id, 'search_terms', e.target.value)}
                        placeholder="e.g., kaftan, kaftans"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Comma-separated terms used when users click this collection
                      </p>
                    </div>
                  </div>

                  {/* Image Upload */}
                  <div className="space-y-4">
                    <Label>Collection Image</Label>
                    
                    {/* Current Image Preview */}
                    {collection.image_url && (
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Current Image</Label>
                        <div className="relative w-full h-48 border rounded-lg overflow-hidden bg-gray-50">
                          <img 
                            src={collection.image_url} 
                            alt={collection.name || 'Collection'} 
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                    )}

                    {/* Upload New Image */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Upload New Image</Label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                        <div className="space-y-2">
                          <Upload className="h-8 w-8 text-gray-400 mx-auto" />
                          <div className="text-sm text-gray-600">
                            <span>Drop your image here, or </span>
                            <label className="text-[#D2B48C] hover:text-[#B8860B] cursor-pointer font-medium">
                              browse files
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleCollectionImageUpload(collection.id, file);
                                }}
                                disabled={uploadingCollection[collection.id]}
                              />
                            </label>
                          </div>
                          <p className="text-xs text-gray-500">PNG, JPG, WebP up to 5MB</p>
                        </div>
                      </div>
                      
                      {uploadingCollection[collection.id] && (
                        <div className="flex items-center justify-center py-2">
                          <Loader2 className="animate-spin h-4 w-4 mr-2" />
                          <span className="text-sm text-gray-600">Uploading...</span>
                        </div>
                      )}
                    </div>

                    {/* Image URL Input */}
                    <div className="space-y-2">
                      <Label htmlFor={`image_url-${collection.id}`}>Or enter image URL</Label>
                      <Input
                        id={`image_url-${collection.id}`}
                        value={collection.image_url}
                        onChange={(e) => handleCollectionInputChange(collection.id, 'image_url', e.target.value)}
                        placeholder="https://example.com/image.jpg"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}

        {/* Add Collection Button */}
        <div className="mt-6">
          <Button
            type="button"
            onClick={addCollection}
            variant="outline"
            className="w-full border-dashed border-2 border-gray-300 hover:border-[#D2B48C] hover:bg-[#D2B48C]/5"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add New Collection
          </Button>
        </div>

        {/* Save Button */}
        <div className="mt-8 flex justify-end">
          <Button
            type="button"
            onClick={saveCollections}
            disabled={savingCollections}
            className="bg-[#D2B48C] hover:bg-[#B8860B] text-white"
          >
            {savingCollections ? (
              <>
                <Loader2 className="animate-spin h-4 w-4 mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Collections
              </>
            )}
          </Button>
        </div>
      </div>
    );
  }, [collections, loadingCollections, savingCollections, uploadingCollection, handleCollectionInputChange, handleCollectionImageUpload, removeCollection, addCollection, saveCollections]);

  const sections = [
    { id: 'store', label: 'Store Info', icon: Store, color: 'text-blue-600' },
    { id: 'currency', label: 'Currency', icon: DollarSign, color: 'text-green-600' },
    { id: 'payment', label: 'Payment', icon: CreditCard, color: 'text-purple-600' },
    { id: 'security', label: 'Security', icon: Shield, color: 'text-red-600' },
    { id: 'appearance', label: 'Appearance', icon: Image, color: 'text-orange-600' },
    { id: 'email', label: 'Email Settings', icon: Mail, color: 'text-cyan-600' },
    { id: 'shipping', label: 'Shipping', icon: Truck, color: 'text-teal-600' },
    { id: 'google', label: 'Google Services', icon: SettingsIcon, color: 'text-blue-500' },
    { id: 'users', label: 'User Management', icon: ShieldCheck, color: 'text-indigo-600' },
    ...(user?.role === 'super_admin' ? [{ id: 'database', label: 'Database Backup', icon: Database, color: 'text-rose-600' }] : []),
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center space-x-2">
          <Loader2 className="animate-spin h-6 w-6 text-[#D2B48C]" />
          <span className="text-lg">Loading settings...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <SettingsIcon className="h-8 w-8 text-[#D2B48C]" />
            <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          </div>
          <p className="text-gray-600">Manage your store configuration and preferences</p>
      </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle className="text-lg">Categories</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {sections.map((section) => {
                  const Icon = section.icon;
                  return (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-all duration-200 ${
                        activeSection === section.id
                          ? 'bg-[#D2B48C] text-white'
                          : 'hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      <Icon className={`h-4 w-4 ${activeSection === section.id ? 'text-white' : section.color}`} />
                      <span className="font-medium">{section.label}</span>
                    </button>
                  );
                })}
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="space-y-6">
              
        {/* Store Information */}
              {activeSection === 'store' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
        <Card>
          <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Store className="h-5 w-5 text-blue-600" />
                        <span>Store Information</span>
                      </CardTitle>
            <CardDescription>
                        Basic information about your store that customers will see
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="store_name">Store Name</Label>
              <Input
                id="store_name"
                value={settings.store_name}
                            onChange={(e) => setSettings(prev => ({ ...prev, store_name: e.target.value }))}
                placeholder="Tailored Hands"
              />
            </div>
            <div>
              <Label htmlFor="contact_email">Contact Email</Label>
              <Input
                id="contact_email"
                type="email"
                value={settings.contact_email}
                            onChange={(e) => setSettings(prev => ({ ...prev, contact_email: e.target.value }))}
                            placeholder="contact@tailoredhands.com"
              />
            </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="contact_phone">Contact Phone</Label>
              <Input
                id="contact_phone"
                value={settings.contact_phone}
                            onChange={(e) => setSettings(prev => ({ ...prev, contact_phone: e.target.value }))}
                            placeholder="+233 XX XXX XXXX"
              />
            </div>
            <div>
                          <Label htmlFor="timezone">Timezone</Label>
                          <Select value={settings.timezone} onValueChange={(value) => setSettings(prev => ({ ...prev, timezone: value }))}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="UTC">UTC</SelectItem>
                              <SelectItem value="Africa/Accra">Africa/Accra (GMT+0)</SelectItem>
                              <SelectItem value="America/New_York">America/New_York (GMT-5)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="address">Store Address</Label>
              <Textarea
                id="address"
                value={settings.address}
                          onChange={(e) => setSettings(prev => ({ ...prev, address: e.target.value }))}
                          placeholder="Enter your store address"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="store_description">Store Description</Label>
              <Textarea
                id="store_description"
                value={settings.store_description}
                          onChange={(e) => setSettings(prev => ({ ...prev, store_description: e.target.value }))}
                          placeholder="Describe your store and what makes it special"
                          rows={4}
              />
            </div>
          </CardContent>
        </Card>
                </motion.div>
              )}

              {/* Currency Settings */}
              {activeSection === 'currency' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
        <Card>
          <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <DollarSign className="h-5 w-5 text-green-600" />
                        <span>Currency Settings</span>
                      </CardTitle>
            <CardDescription>
                        Configure your store's currency and exchange rates
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                          <Label htmlFor="currency">Primary Currency</Label>
                          <Select value={settings.currency} onValueChange={(value) => setSettings(prev => ({ ...prev, currency: value }))}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="USD">USD - US Dollar</SelectItem>
                              <SelectItem value="GHS">GHS - Ghanaian Cedi</SelectItem>
                            </SelectContent>
                          </Select>
            </div>
            <div>
                          <Label htmlFor="exchange_rate">Exchange Rate (GHS per USD)</Label>
                          <div className="flex space-x-2">
              <Input
                id="exchange_rate"
                type="number"
                step="0.01"
                              value={settings.exchange_rate}
                              onChange={(e) => setSettings(prev => ({ ...prev, exchange_rate: parseFloat(e.target.value) || 16.0 }))}
                              placeholder="16.00"
                              className="flex-1"
                            />
                            <Button
                              type="button"
                              onClick={() => {
                                console.log('🔄 Manual refresh of all prices...');
                                refreshAllPrices();
                              }}
                              variant="outline"
                              size="sm"
                            >
                              Refresh All
                            </Button>
                          </div>
                          <p className="text-sm text-gray-500 mt-1">
                            Current rate: 1 USD = {settings.exchange_rate} GHS
              </p>
            </div>
            <div>
                          <Label htmlFor="exchange_rate_gbp">Exchange Rate (GBP per USD)</Label>
                          <Input
                id="exchange_rate_gbp"
                type="number"
                step="0.01"
                              value={settings.exchange_rate_gbp}
                              onChange={(e) => setSettings(prev => ({ ...prev, exchange_rate_gbp: parseFloat(e.target.value) || 0.79 }))}
                              placeholder="0.79"
                              className="flex-1"
                            />
                          <p className="text-sm text-gray-500 mt-1">
                            Current rate: 1 USD = {settings.exchange_rate_gbp} GBP
              </p>
            </div>
                      </div>
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          Changing the exchange rate will immediately update all product prices across your store. 
                          This affects both the shop page and product detail pages.
                        </AlertDescription>
                      </Alert>
          </CardContent>
        </Card>
                </motion.div>
              )}

        {/* Payment Settings */}
              {activeSection === 'payment' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
        <Card>
          <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <CreditCard className="h-5 w-5 text-purple-600" />
                        <span>Payment Configuration</span>
                      </CardTitle>
            <CardDescription>
                        Configure your payment gateway settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="paystack_public_key">Paystack Public Key</Label>
              <Input
                id="paystack_public_key"
                value={settings.paystack_public_key}
                          onChange={(e) => setSettings(prev => ({ ...prev, paystack_public_key: e.target.value }))}
                placeholder="pk_test_..."
              />
            </div>
            <div>
              <Label htmlFor="paystack_secret_key">Paystack Secret Key</Label>
              <Input
                id="paystack_secret_key"
                type="password"
                value={settings.paystack_secret_key}
                          onChange={(e) => setSettings(prev => ({ ...prev, paystack_secret_key: e.target.value }))}
                placeholder="sk_test_..."
              />
            </div>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                          Keep your secret keys secure. Never share them publicly or commit them to version control.
                </AlertDescription>
              </Alert>
          </CardContent>
        </Card>
                </motion.div>
              )}

              {/* Security Settings */}
              {activeSection === 'security' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
        <Card>
          <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Shield className="h-5 w-5 text-red-600" />
                        <span>Security Settings</span>
                      </CardTitle>
            <CardDescription>
                        Manage security features and admin password
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
                        <Label htmlFor="captcha_enabled">reCAPTCHA Protection</Label>
                        <div className="flex items-center space-x-2 mt-2">
                          <Switch
                            id="captcha_enabled"
                            checked={settings.captcha_enabled}
                            onCheckedChange={(checked) => setSettings(prev => ({ ...prev, captcha_enabled: checked }))}
                          />
                          <span className="text-sm text-gray-600">
                            {settings.captcha_enabled ? 'Enabled' : 'Disabled'}
                          </span>
                      </div>
                  </div>

                      <div className="border-t pt-6">
                        <h4 className="font-medium mb-4">Change Admin Password</h4>
                      <div className="space-y-4">
                        <div>
                            <Label htmlFor="current_password">Current Password</Label>
                          <Input
                              id="current_password"
                              type="password"
                              value={passwordData.current_password}
                              onChange={(e) => setPasswordData(prev => ({ ...prev, current_password: e.target.value }))}
                          />
                    </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                              <Label htmlFor="new_password">New Password</Label>
                          <Input
                                id="new_password"
                                type="password"
                                value={passwordData.new_password}
                                onChange={(e) => setPasswordData(prev => ({ ...prev, new_password: e.target.value }))}
                              />
                        </div>
                          <div>
                              <Label htmlFor="confirm_password">Confirm Password</Label>
                          <Input
                                id="confirm_password"
                                type="password"
                                value={passwordData.confirm_password}
                                onChange={(e) => setPasswordData(prev => ({ ...prev, confirm_password: e.target.value }))}
                          />
                        </div>
                      </div>
                      <Button
                            onClick={handlePasswordChange}
                            disabled={changingPassword || !passwordData.current_password || !passwordData.new_password || !passwordData.confirm_password}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            {changingPassword ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Changing Password...
                          </>
                        ) : (
                              'Change Password'
                        )}
                      </Button>
                    </div>
                  </div>
          </CardContent>
        </Card>
                </motion.div>
              )}

              {/* Appearance Settings */}
              {activeSection === 'appearance' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  {/* Logo Management Card */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Image className="h-5 w-5 text-orange-600" />
                        <span>Brand Logos</span>
                      </CardTitle>
                      <CardDescription>
                        Manage your website logos and favicon
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Navbar Logo */}
                      <div className="space-y-2">
                        <Label htmlFor="navbar_logo">Navbar Logo</Label>
                        <div className="flex items-center space-x-4">
                          {settings.navbar_logo_url && (
                            <div className="relative w-32 h-16 border rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center">
                              <img 
                                src={settings.navbar_logo_url} 
                                alt="Navbar Logo" 
                                className="max-w-full max-h-full object-contain"
                              />
                            </div>
                          )}
                          <div className="flex-1">
                            <Input
                              id="navbar_logo"
                    type="file"
                    accept="image/*"
                              onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                                  try {
                                    const formData = new FormData();
                                    formData.append('image', file);
                                    const response = await uploadHeroImage(formData);
                                    if (response.success) {
                                      setSettings(prev => ({ ...prev, navbar_logo_url: response.imageUrl }));
                                      toast({ title: "Success", description: "Navbar logo uploaded successfully" });
                                    }
                                  } catch (error) {
                                    toast({ title: "Error", description: "Failed to upload navbar logo", variant: "destructive" });
                                  }
                      }
                    }}
                  />
                            <p className="text-xs text-gray-500 mt-1">Recommended: PNG with transparent background, max 200x60px</p>
                          </div>
                        </div>
                </div>

                      {/* Footer Logo */}
                      <div className="space-y-2">
                        <Label htmlFor="footer_logo">Footer Logo</Label>
                        <div className="flex items-center space-x-4">
                          {settings.footer_logo_url && (
                            <div className="relative w-32 h-16 border rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center">
                              <img 
                                src={settings.footer_logo_url} 
                                alt="Footer Logo" 
                                className="max-w-full max-h-full object-contain"
                              />
                            </div>
                          )}
                          <div className="flex-1">
                  <Input
                              id="footer_logo"
                              type="file"
                              accept="image/*"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  try {
                                    const formData = new FormData();
                                    formData.append('image', file);
                                    const response = await uploadHeroImage(formData);
                                    if (response.success) {
                                      setSettings(prev => ({ ...prev, footer_logo_url: response.imageUrl }));
                                      toast({ title: "Success", description: "Footer logo uploaded successfully" });
                                    }
                                  } catch (error) {
                                    toast({ title: "Error", description: "Failed to upload footer logo", variant: "destructive" });
                                  }
                                }
                              }}
                            />
                            <p className="text-xs text-gray-500 mt-1">Recommended: PNG with transparent background, max 200x60px</p>
                </div>
              </div>
            </div>

                      {/* Favicon */}
                      <div className="space-y-2">
                        <Label htmlFor="favicon">Favicon</Label>
                        <div className="flex items-center space-x-4">
                          {settings.favicon_url && (
                            <div className="relative w-16 h-16 border rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center group">
                              <img 
                                src={settings.favicon_url} 
                                alt="Favicon" 
                                className="max-w-full max-h-full object-contain"
                                onError={(e) => {
                                  console.error('Failed to load favicon preview:', settings.favicon_url);
                                  e.target.style.display = 'none';
                                }}
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  setSettings(prev => ({ ...prev, favicon_url: '' }));
                                  updateFavicon('');
                                }}
                                className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs"
                                title="Remove favicon"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                          <div className="flex-1">
              <Input
                              id="favicon"
                              type="file"
                              accept="image/*"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  try {
                                    console.log('📤 Uploading favicon file:', file.name, file.type);
                                    const response = await uploadHeroImage(file);
                                    console.log('📥 Favicon upload response:', response);
                                    if (response.success) {
                                      const imageUrl = response.imageUrl || response.url;
                                      console.log('✅ Favicon uploaded, URL:', imageUrl);
                                      
                                      // Update state immediately so preview shows
                                      setSettings(prev => ({ ...prev, favicon_url: imageUrl }));
                                      
                                      // Update favicon in browser immediately
                                      updateFavicon(imageUrl);
                                      
                                      toast({ 
                                        title: "Success", 
                                        description: "Favicon uploaded and applied! Don't forget to save settings to persist it." 
                                      });
                                    } else {
                                      throw new Error(response.error || 'Upload failed');
                                    }
                                  } catch (error) {
                                    console.error('❌ Favicon upload error:', error);
                                    toast({ 
                                      title: "Error", 
                                      description: error.message || "Failed to upload favicon", 
                                      variant: "destructive" 
                                    });
                                  }
                                }
                              }}
                            />
                            <p className="text-xs text-gray-500 mt-1">Recommended: ICO or PNG, 32x32px or 64x64px</p>
                          </div>
                        </div>
            </div>
          </CardContent>
        </Card>

                  {/* Hero Section Card */}
        <Card>
          <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Image className="h-5 w-5 text-orange-600" />
                        <span>Hero Section</span>
                      </CardTitle>
            <CardDescription>
                        Customize your homepage hero section
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
                      {/* Hero Background Image */}
                      <div className="space-y-4">
                        <Label>Hero Background Image</Label>
                        
                        {/* Current Image Preview */}
                        {settings.hero_image_url && (
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">Current Image</Label>
                            <div className="relative w-full h-64 border rounded-lg overflow-hidden bg-gray-50">
                              <img 
                                src={settings.hero_image_url} 
                                alt="Hero Background" 
                                className="w-full h-full object-cover"
                              />
                            </div>
                          </div>
                        )}

                        {/* Upload New Image */}
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Upload New Image</Label>
                          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                            <div className="space-y-2">
                              <Image className="h-8 w-8 text-gray-400 mx-auto" />
                              <div className="text-sm text-gray-600">
                                <span>Drop your hero image here, or </span>
                                <label className="text-[#D2B48C] hover:text-[#B8860B] cursor-pointer font-medium">
                                  browse files
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                                    onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                        try {
                                          const formData = new FormData();
                                          formData.append('image', file);
                                          const response = await uploadHeroImage(formData);
                                          if (response.success) {
                                            setSettings(prev => ({ ...prev, hero_image_url: response.imageUrl }));
                                            toast({ title: "Success", description: "Hero image uploaded successfully" });
                                          }
                                        } catch (error) {
                                          toast({ title: "Error", description: "Failed to upload hero image", variant: "destructive" });
                                        }
                                }
                              }}
                            />
                                </label>
                              </div>
                              <p className="text-xs text-gray-500">PNG, JPG, WebP up to 5MB</p>
                            </div>
                          </div>
                        </div>

                        {/* Image URL Input */}
                        <div className="space-y-2">
                          <Label htmlFor="hero_image_url">Or enter image URL</Label>
                          <Input
                            id="hero_image_url"
                            value={settings.hero_image_url}
                            onChange={(e) => setSettings(prev => ({ ...prev, hero_image_url: e.target.value }))}
                            placeholder="https://example.com/hero-image.jpg"
                          />
                        </div>
                      </div>

                      {/* Hero Text Content */}
              <div className="space-y-4">
                <div>
                          <Label htmlFor="hero_title">Hero Title</Label>
                  <Input
                            id="hero_title"
                            value={settings.hero_title}
                            onChange={(e) => setSettings(prev => ({ ...prev, hero_title: e.target.value }))}
                            placeholder="Modern Elegance Redefined"
                  />
                </div>
                <div>
                          <Label htmlFor="hero_subtitle">Hero Subtitle</Label>
                          <Textarea
                            id="hero_subtitle"
                            value={settings.hero_subtitle}
                            onChange={(e) => setSettings(prev => ({ ...prev, hero_subtitle: e.target.value }))}
                            placeholder="Discover our collection of meticulously crafted pieces..."
                            rows={3}
                  />
                </div>
                <div>
                          <Label htmlFor="hero_button_text">Button Text</Label>
                  <Input
                            id="hero_button_text"
                            value={settings.hero_button_text}
                            onChange={(e) => setSettings(prev => ({ ...prev, hero_button_text: e.target.value }))}
                            placeholder="EXPLORE COLLECTION"
                  />
                </div>
              </div>
                    </CardContent>
                  </Card>

                  {/* Collections Management Card */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Image className="h-5 w-5 text-orange-600" />
                        <span>Collections Management</span>
                      </CardTitle>
                      <CardDescription>
                        Manage the collections displayed on your homepage
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {CollectionsManagementSection}
          </CardContent>
        </Card>
                </motion.div>
              )}

              {/* User Management Settings */}
              {activeSection === 'users' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
        <Card>
          <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <ShieldCheck className="h-5 w-5 text-indigo-600" />
                        <span>User Management</span>
                      </CardTitle>
            <CardDescription>
                        Manage administrative users and access controls
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
                      {/* Current User Info */}
                      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-lg border border-indigo-200">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <ShieldCheck className="h-8 w-8 text-indigo-600" />
              <div>
                              <h3 className="text-lg font-semibold text-gray-900">Current Admin User</h3>
                              <p className="text-sm text-gray-600">Your administrative account information</p>
                  </div>
                          </div>
                          <Badge className="bg-indigo-100 text-indigo-800">
                            {user?.role || 'Admin'}
                          </Badge>
                  </div>
                  
                        <div className="bg-white p-4 rounded-lg shadow-sm border">
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                              <Users className="h-6 w-6 text-indigo-600" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900">
                                {user?.full_name || user?.email?.split('@')[0] || 'Admin User'}
                              </h4>
                              <p className="text-sm text-gray-600">{user?.email || 'admin@tailoredhands.africa'}</p>
                            </div>
                          </div>
                        </div>
                  </div>
                  
                      {/* Admin Users Management */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold text-gray-900">Admin Users</h3>
                  <Button
                            onClick={() => setShowAddUserForm(!showAddUserForm)}
                            className="bg-indigo-600 hover:bg-indigo-700"
                          >
                            {showAddUserForm ? 'Cancel' : 'Add New Admin'}
                  </Button>
              </div>
              
                        {showAddUserForm && (
                          <AdminUserForm
                            onUserCreated={handleUserCreated}
                            onCancel={() => setShowAddUserForm(false)}
                          />
                        )}

                {loadingUsers ? (
                          <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
                            <span className="ml-2 text-gray-600">Loading admin users...</span>
                  </div>
                ) : (
                          <AdminUsersList
                            users={adminUsers}
                            onUserUpdated={handleUserUpdated}
                            onUserDeleted={handleUserDeleted}
                          />
                        )}
            </div>
          </CardContent>
        </Card>
                </motion.div>
              )}

              {/* Email Settings */}
              {activeSection === 'email' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Mail className="h-5 w-5 text-cyan-600" />
                        <span>Email Settings</span>
                      </CardTitle>
                      <CardDescription>
                        Configure SMTP settings for sending emails to customers and subscribers
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <Label htmlFor="smtp_host">SMTP Host</Label>
                          <Input
                            id="smtp_host"
                            value={emailSettings.smtp_host}
                            onChange={(e) => setEmailSettings(prev => ({ ...prev, smtp_host: e.target.value }))}
                            placeholder="smtp.gmail.com"
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="smtp_port">SMTP Port</Label>
                          <Input
                            id="smtp_port"
                            type="number"
                            value={emailSettings.smtp_port}
                            onChange={(e) => setEmailSettings(prev => ({ ...prev, smtp_port: parseInt(e.target.value) }))}
                            placeholder="587"
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="smtp_username">Username</Label>
                          <Input
                            id="smtp_username"
                            value={emailSettings.smtp_username}
                            onChange={(e) => setEmailSettings(prev => ({ ...prev, smtp_username: e.target.value }))}
                            placeholder="your-email@gmail.com"
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="smtp_password">Password</Label>
                          <Input
                            id="smtp_password"
                            type="password"
                            value={emailSettings.smtp_password}
                            onChange={(e) => setEmailSettings(prev => ({ ...prev, smtp_password: e.target.value }))}
                            placeholder="App password"
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="smtp_from_email">From Email</Label>
                          <Input
                            id="smtp_from_email"
                            value={emailSettings.smtp_from_email}
                            onChange={(e) => setEmailSettings(prev => ({ ...prev, smtp_from_email: e.target.value }))}
                            placeholder="noreply@yourstore.com"
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="smtp_from_name">From Name</Label>
                          <Input
                            id="smtp_from_name"
                            value={emailSettings.smtp_from_name}
                            onChange={(e) => setEmailSettings(prev => ({ ...prev, smtp_from_name: e.target.value }))}
                            placeholder="Your Store Name"
                          />
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="smtp_secure"
                          checked={emailSettings.smtp_secure}
                          onChange={(e) => setEmailSettings(prev => ({ ...prev, smtp_secure: e.target.checked }))}
                          className="rounded border-gray-300"
                        />
                        <Label htmlFor="smtp_secure">Use SSL/TLS</Label>
                      </div>

                      <div className="flex justify-end">
                        <Button 
                          onClick={saveEmailSettings}
                          disabled={savingEmailSettings}
                          className="bg-[#D2B48C] hover:bg-[#C19A6B]"
                        >
                          {savingEmailSettings ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className="w-4 h-4 mr-2" />
                              Save Email Settings
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* DHL Shipping Settings */}
              {activeSection === 'shipping' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Truck className="h-5 w-5 text-teal-600" />
                        <span>DHL Shipping Settings</span>
                      </CardTitle>
                      <CardDescription>
                        Configure MyDHL API settings for shipping with DHL Express
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <Label htmlFor="dhl_api_key">DHL API Key</Label>
                          <Input
                            id="dhl_api_key"
                            type="text"
                            value={shippingSettings.dhl_api_key}
                            onChange={(e) => setShippingSettings(prev => ({ ...prev, dhl_api_key: e.target.value }))}
                            placeholder="Your DHL API Key (Consumer Key)"
                          />
                          <p className="text-sm text-gray-500 mt-1">
                            From DHL Developer Portal - My Apps
                          </p>
                        </div>
                        
                        <div>
                          <Label htmlFor="dhl_api_secret">DHL API Secret</Label>
                          <Input
                            id="dhl_api_secret"
                            type="password"
                            value={shippingSettings.dhl_api_secret}
                            onChange={(e) => setShippingSettings(prev => ({ ...prev, dhl_api_secret: e.target.value }))}
                            placeholder="Your DHL API Secret"
                          />
                          <p className="text-sm text-gray-500 mt-1">
                            From DHL Developer Portal - My Apps
                          </p>
                        </div>
                        
                        <div>
                          <Label htmlFor="dhl_account_number">DHL Account Number</Label>
                          <Input
                            id="dhl_account_number"
                            type="text"
                            value={shippingSettings.dhl_account_number}
                            onChange={(e) => setShippingSettings(prev => ({ ...prev, dhl_account_number: e.target.value }))}
                            placeholder="Your DHL shipper account number"
                          />
                          <p className="text-sm text-gray-500 mt-1">
                            Your DHL export/shipper account number
                          </p>
                        </div>
                        
                        <div>
                          <Label htmlFor="dhl_base_url">API Base URL</Label>
                          <select
                            id="dhl_base_url"
                            value={shippingSettings.dhl_base_url}
                            onChange={(e) => setShippingSettings(prev => ({ ...prev, dhl_base_url: e.target.value }))}
                            className="w-full h-10 px-3 border border-gray-300 rounded-md bg-white text-sm"
                          >
                            <option value="https://express.api.dhl.com/mydhlapi/test">Test (Sandbox)</option>
                            <option value="https://express.api.dhl.com/mydhlapi">Production (Live)</option>
                          </select>
                          <p className="text-sm text-gray-500 mt-1">
                            Use Test for testing, Production for live shipments
                          </p>
                        </div>
                      </div>

                      <div className="border-t pt-6">
                        <h3 className="text-lg font-medium mb-4">Origin Address (Shipper)</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <Label htmlFor="dhl_from_name">Business Name</Label>
                            <Input
                              id="dhl_from_name"
                              value={shippingSettings.dhl_from_name}
                              onChange={(e) => setShippingSettings(prev => ({ ...prev, dhl_from_name: e.target.value }))}
                              placeholder="TailoredHands"
                            />
                          </div>
                          
                          <div>
                            <Label htmlFor="dhl_from_street">Street Address</Label>
                            <GoogleAddressAutocomplete
                              value={shippingSettings.dhl_from_street}
                              onChange={(value) => setShippingSettings(prev => ({ ...prev, dhl_from_street: value }))}
                              onAddressSelect={(addressData) => {
                                setShippingSettings(prev => ({
                                  ...prev,
                                  dhl_from_street: addressData.address,
                                  dhl_from_city: addressData.city || prev.dhl_from_city,
                                  dhl_from_state: addressData.state || prev.dhl_from_state,
                                  dhl_from_zip: addressData.zip || prev.dhl_from_zip,
                                  dhl_from_country: addressData.country || prev.dhl_from_country
                                }));
                              }}
                              placeholder="Enter your business address"
                              label=""
                              required={false}
                            />
                          </div>
                          
                          <div>
                            <Label htmlFor="dhl_from_city">City</Label>
                            <Input
                              id="dhl_from_city"
                              value={shippingSettings.dhl_from_city}
                              onChange={(e) => setShippingSettings(prev => ({ ...prev, dhl_from_city: e.target.value }))}
                              placeholder="Accra"
                            />
                          </div>
                          
                          <div>
                            <Label htmlFor="dhl_from_state">State/Region</Label>
                            <Input
                              id="dhl_from_state"
                              value={shippingSettings.dhl_from_state}
                              onChange={(e) => setShippingSettings(prev => ({ ...prev, dhl_from_state: e.target.value }))}
                              placeholder="Greater Accra"
                            />
                          </div>
                          
                          <div>
                            <Label htmlFor="dhl_from_zip">ZIP/Postal Code</Label>
                            <Input
                              id="dhl_from_zip"
                              value={shippingSettings.dhl_from_zip}
                              onChange={(e) => setShippingSettings(prev => ({ ...prev, dhl_from_zip: e.target.value }))}
                              placeholder="00233"
                            />
                          </div>
                          
                          <div>
                            <Label htmlFor="dhl_from_country">Country Code</Label>
                            <Input
                              id="dhl_from_country"
                              value={shippingSettings.dhl_from_country}
                              onChange={(e) => setShippingSettings(prev => ({ ...prev, dhl_from_country: e.target.value }))}
                              placeholder="GH"
                              maxLength={2}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <Button
                          onClick={saveShippingSettings}
                          disabled={savingShippingSettings}
                          className="bg-[#D2B48C] hover:bg-[#C4A484] text-white"
                        >
                          {savingShippingSettings ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className="w-4 h-4 mr-2" />
                              Save DHL Settings
                            </>
                          )}
                        </Button>
                      </div>

                      <div className="border-t pt-6 mt-6">
                        <h3 className="text-lg font-medium mb-2">Test DHL Connection</h3>
                        <p className="text-sm text-gray-500 mb-4">
                          Test your DHL API credentials by making a sample rates request. Uses the saved settings above.
                        </p>
                        <div className="flex items-center gap-4">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={handleTestMyDhl}
                            disabled={testingDhl}
                          >
                            {testingDhl ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Testing...
                              </>
                            ) : (
                              'Test MyDHL connection'
                            )}
                          </Button>
                          {dhlTestResult !== null && (
                            <div className={`text-sm ${dhlTestResult.success ? 'text-green-600' : 'text-red-600'}`}>
                              {dhlTestResult.success ? (
                                <span>{dhlTestResult.message}</span>
                              ) : (
                                <span>{dhlTestResult.error}</span>
                              )}
                            </div>
                          )}
                        {dhlTestResult?.details && !dhlTestResult.success && (
                          <div className="mt-2 p-3 bg-red-50 rounded text-sm text-red-700">
                            <strong>DHL response details:</strong>
                            <pre className="mt-1 overflow-auto max-h-32 text-xs whitespace-pre-wrap">
                              {JSON.stringify(dhlTestResult.details, null, 2)}
                            </pre>
                          </div>
                        )}
                        </div>
                        {dhlTestResult?.rates?.length > 0 && (
                          <div className="mt-3 p-3 bg-gray-50 rounded text-sm">
                            <strong>Sample rates:</strong>
                            <pre className="mt-1 overflow-auto max-h-24">
                              {JSON.stringify(dhlTestResult.rates, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Google Services Settings */}
              {activeSection === 'google' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <SettingsIcon className="h-5 w-5 text-blue-500" />
                        <span>Google Services</span>
                      </CardTitle>
                      <CardDescription>
                        Configure Google Places API for address autocomplete
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div>
                        <Label htmlFor="google_places_api_key">Google Places API Key</Label>
                        <Input
                          id="google_places_api_key"
                          type="password"
                          value={settings.google_places_api_key || ''}
                          onChange={(e) => {
                            console.log('🔍 Google Places API key input changed:', e.target.value);
                            setSettings(prev => ({ ...prev, google_places_api_key: e.target.value }));
                          }}
                          placeholder="AIzaSyB..."
                        />
                        <p className="text-sm text-gray-500 mt-1">
                          Get your API key from the Google Cloud Console. Enable Places API and restrict it to your domain.
                        </p>
                      </div>
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h4 className="font-medium text-blue-900 mb-2">Setup Instructions:</h4>
                        <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                          <li>Go to <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Google Cloud Console</a></li>
                          <li>Create a new project or select existing one</li>
                          <li>Enable the "Places API"</li>
                          <li>Go to "Credentials" and create an API key</li>
                          <li>Restrict the API key to your domain for security</li>
                          <li>Copy the API key and paste it above</li>
                        </ol>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

      </div>

              {/* Database Backup & Restore (super_admin only) */}
              {activeSection === 'database' && user?.role === 'super_admin' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Database className="h-5 w-5 text-rose-600" />
                        <span>Database Backup &amp; Restore</span>
                      </CardTitle>
                      <CardDescription>
                        Download a full pg_dump backup or restore from a previous backup file.
                        Only super admins can access this section.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">

                      {/* Tool availability */}
                      {backupStatus && (
                        <div className="flex gap-4 text-sm">
                          <span className={backupStatus.pgDumpAvailable ? 'text-green-600' : 'text-red-600'}>
                            {backupStatus.pgDumpAvailable ? '✓' : '✗'} pg_dump
                          </span>
                          <span className={backupStatus.psqlAvailable ? 'text-green-600' : 'text-red-600'}>
                            {backupStatus.psqlAvailable ? '✓' : '✗'} psql
                          </span>
                        </div>
                      )}

                      {/* Download */}
                      <div className="rounded-lg border border-dashed border-gray-300 p-5 space-y-3">
                        <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                          <Download className="h-4 w-4 text-rose-500" /> Download Backup
                        </h3>
                        <p className="text-sm text-gray-500">
                          Creates a compressed <code>.sql.gz</code> dump of the entire database and downloads it to your machine.
                        </p>
                        <Button
                          onClick={handleDownloadBackup}
                          disabled={downloadingBackup || (backupStatus && !backupStatus.pgDumpAvailable)}
                          className="bg-rose-600 hover:bg-rose-700 text-white"
                        >
                          {downloadingBackup ? (
                            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating…</>
                          ) : (
                            <><Download className="mr-2 h-4 w-4" /> Download Backup</>
                          )}
                        </Button>
                      </div>

                      {/* Restore */}
                      <div className="rounded-lg border border-dashed border-red-200 bg-red-50/40 p-5 space-y-3">
                        <h3 className="font-semibold text-red-800 flex items-center gap-2">
                          <Upload className="h-4 w-4 text-red-500" /> Restore from Backup
                        </h3>
                        <p className="text-sm text-red-700">
                          <strong>Warning:</strong> This will overwrite your current database with the contents of the uploaded file. This cannot be undone.
                        </p>
                        <div className="space-y-2">
                          <Input
                            type="file"
                            accept=".sql,.gz"
                            onChange={(e) => setRestoreFile(e.target.files?.[0] || null)}
                            className="bg-white"
                          />
                          {restoreFile && (
                            <p className="text-xs text-gray-600">Selected: {restoreFile.name} ({(restoreFile.size / 1024 / 1024).toFixed(2)} MB)</p>
                          )}
                        </div>
                        <Button
                          onClick={handleRestoreBackup}
                          disabled={!restoreFile || restoringBackup || (backupStatus && !backupStatus.psqlAvailable)}
                          variant="destructive"
                        >
                          {restoringBackup ? (
                            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Restoring…</>
                          ) : (
                            'Restore Database'
                          )}
                        </Button>
                      </div>

                    </CardContent>
                  </Card>
                </motion.div>
              )}

      {/* Save Button */}
            <div className="mt-8 flex justify-end">
        <Button 
          onClick={handleSave} 
          disabled={saving}
                className="bg-[#D2B48C] hover:bg-[#C4A484] text-white px-8 py-2"
        >
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
                    Save All Settings
            </>
          )}
        </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsNew;
