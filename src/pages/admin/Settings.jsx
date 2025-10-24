import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { Save, Loader2, AlertCircle, CheckCircle, Settings as SettingsIcon, Store, DollarSign, CreditCard, Shield, Image, Users, Database, ShieldCheck, Plus, Trash2, Upload, X, Layers } from 'lucide-react';
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
    paystack_public_key: '',
    paystack_secret_key: '',
    hero_image_url: '',
    hero_title: '',
    hero_subtitle: '',
    hero_button_text: '',
    navbar_logo_url: '',
    footer_logo_url: '',
    favicon_url: '',
    captcha_enabled: false
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

  // Debug collections state
  useEffect(() => {
    console.log('📊 Collections state changed:', collections);
  }, [collections]);

  // Load admin users when users section is active
  useEffect(() => {
    if (activeSection === 'users') {
      loadAdminUsers();
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
            paystack_public_key: response.settings.paystack_public_key || '',
            paystack_secret_key: response.settings.paystack_secret_key || '',
            hero_image_url: response.settings.hero_image_url || '',
            hero_title: response.settings.hero_title || 'Modern Elegance Redefined',
            hero_subtitle: response.settings.hero_subtitle || 'Discover our collection of meticulously crafted African-inspired pieces that blend traditional aesthetics with contemporary design.',
            hero_button_text: response.settings.hero_button_text || 'EXPLORE COLLECTION',
            navbar_logo_url: response.settings.navbar_logo_url || '',
            footer_logo_url: response.settings.footer_logo_url || '',
            favicon_url: response.settings.favicon_url || '',
            captcha_enabled: response.settings.captcha_enabled || false
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
      const settingsToSave = {
        store_name: settings.store_name,
        contact_email: settings.contact_email,
        contact_phone: settings.contact_phone,
        address: settings.address,
        store_description: settings.store_description,
        currency: settings.currency,
        timezone: settings.timezone,
        exchange_rate_ghs: parseFloat(settings.exchange_rate),
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

      const response = await adminSettingsApi.updateSettings(settingsToSave);
      if (response.success) {
          toast({
        title: "Settings Saved Successfully",
        description: "Your store settings have been updated and are now active across the website.",
        variant: "default",
      });

        // SIMPLE SOLUTION: Refresh all prices everywhere
        await refreshAllPrices();
        
        // Update favicon if favicon_url was changed
        if (settings.favicon_url) {
          updateFavicon(settings.favicon_url);
        }
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

  const handleUserUpdated = (updatedUser) => {
    setAdminUsers(prev => prev.map(user => 
      user.id === updatedUser.id ? updatedUser : user
    ));
  };

  const handleUserDeleted = (deletedUserId) => {
    setAdminUsers(prev => prev.filter(user => user.id !== deletedUserId));
  };

  // Favicon update function
  const updateFavicon = (faviconUrl) => {
    if (!faviconUrl) return;
    
    // Remove existing favicon links
    const existingLinks = document.querySelectorAll('link[rel*="icon"]');
    existingLinks.forEach(link => link.remove());

    // Create new favicon link
    const link = document.createElement('link');
    link.rel = 'icon';
    link.type = getFaviconType(faviconUrl);
    link.href = faviconUrl;
    
    // Add cache busting parameter
    const url = new URL(faviconUrl);
    url.searchParams.set('v', Date.now());
    link.href = url.toString();

    document.head.appendChild(link);

    // Also add apple-touch-icon for mobile devices
    const appleLink = document.createElement('link');
    appleLink.rel = 'apple-touch-icon';
    appleLink.href = url.toString();
    document.head.appendChild(appleLink);

    console.log('🎨 Favicon updated:', faviconUrl);
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
    { id: 'users', label: 'User Management', icon: ShieldCheck, color: 'text-indigo-600' },
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
                            <div className="relative w-16 h-16 border rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center">
                              <img 
                                src={settings.favicon_url} 
                                alt="Favicon" 
                                className="max-w-full max-h-full object-contain"
              />
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
                                    const formData = new FormData();
                                    formData.append('image', file);
                                    const response = await uploadHeroImage(formData);
                                    if (response.success) {
                                      setSettings(prev => ({ ...prev, favicon_url: response.imageUrl }));
                                      toast({ title: "Success", description: "Favicon uploaded successfully" });
                                    }
                                  } catch (error) {
                                    toast({ title: "Error", description: "Failed to upload favicon", variant: "destructive" });
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
      </div>

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
