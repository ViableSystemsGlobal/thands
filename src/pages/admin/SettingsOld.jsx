
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast';
import adminApiClient from '@/lib/services/adminApiClient';
import adminSettingsApi from '@/lib/services/adminSettingsApi';
import { loadExchangeRateFromSettings } from '@/lib/services/exchangeRate';
import { uploadHeroImage, uploadCollectionImage, deleteImage } from '@/lib/services/uploadApi';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';

// Collection image upload is now handled by uploadApi service

const Settings = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
    hero_image_url: 'https://storage.googleapis.com/hostinger-horizons-assets-prod/3a44a4a9-7b05-4768-be68-8eeb55d662d7/f9e9c1ced82f14bddc858a8dd7b36cff.png',
    hero_title: 'Modern Elegance Redefined',
    hero_subtitle: 'Discover our collection of meticulously crafted African-inspired pieces that blend traditional aesthetics with contemporary design.',
    hero_button_text: 'EXPLORE COLLECTION',
    captcha_enabled: false
  });

  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [changingPassword, setChangingPassword] = useState(false);
  const [uploadingHeroImage, setUploadingHeroImage] = useState(false);
  const [heroImagePreview, setHeroImagePreview] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  const [collections, setCollections] = useState([]);
  const [loadingCollections, setLoadingCollections] = useState(true);
  const [savingCollections, setSavingCollections] = useState(false);

  // Add state for password change
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingAdminPassword, setChangingAdminPassword] = useState(false);

  // Add state for user management
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newUserRole, setNewUserRole] = useState('admin');
  const [invitingUser, setInvitingUser] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [adminUsers, setAdminUsers] = useState([]);

  // Fetch current settings
  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      try {
        const response = await adminSettingsApi.getSettings();

        if (!response.success) {
          throw new Error(response.error || 'Failed to load settings');
        }

        if (response.settings) {
          console.log('Settings data loaded:', response.settings);
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
            hero_image_url: response.settings.hero_image_url || 'https://storage.googleapis.com/hostinger-horizons-assets-prod/3a44a4a9-7b05-4768-be68-8eeb55d662d7/f9e9c1ced82f14bddc858a8dd7b36cff.png',
            hero_title: response.settings.hero_title || 'Modern Elegance Redefined',
            hero_subtitle: response.settings.hero_subtitle || 'Discover our collection of meticulously crafted African-inspired pieces that blend traditional aesthetics with contemporary design.',
            hero_button_text: response.settings.hero_button_text || 'EXPLORE COLLECTION',
            captcha_enabled: response.settings.captcha_enabled || false
          });
        } else {
          // No settings found, will create defaults on save
          console.log('No settings found, using defaults');
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
        toast({
          title: "Database Error",
          description: error.message,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [toast]);

  // Add collections fetch in useEffect
  useEffect(() => {
    const fetchCollections = async () => {
      setLoadingCollections(true);
      try {
        const response = await adminSettingsApi.getCollections();

        if (!response.success) {
          console.error('Error fetching collections:', response.error);
          // Set default collections
          setCollections([
            {
              id: 'new-1',
              name: 'Kaftan',
              description: 'Explore our collection of elegant kaftans',
              image_url: 'https://storage.googleapis.com/hostinger-horizons-assets-prod/3a44a4a9-7b05-4768-be68-8eeb55d662d7/fa019d4560e5a2e09dc05211ac6fcb00.jpg',
              search_terms: ['kaftan', 'kaftans'],
              is_active: true,
              sort_order: 1
            },
            {
              id: 'new-2',
              name: 'Casual Wear',
              description: 'Explore our casual wear collection',
              image_url: 'https://storage.googleapis.com/hostinger-horizons-assets-prod/3a44a4a9-7b05-4768-be68-8eeb55d662d7/cc6e91ffdbb67de6a4d6ac4baf0ce080.png',
              search_terms: ['casual', 'casual wear'],
              is_active: true,
              sort_order: 2
            },
            {
              id: 'new-3',
              name: 'Agbada',
              description: 'Discover our regal Agbada collection',
              image_url: 'https://storage.googleapis.com/hostinger-horizons-assets-prod/3a44a4a9-7b05-4768-be68-8eeb55d662d7/cc0ba00c0ee5afba16f73e4f65191966.png',
              search_terms: ['agbada', 'grand boubou'],
              is_active: true,
              sort_order: 3
            }
          ]);
        } else {
          setCollections(response.collections || []);
        }
      } catch (error) {
        console.error('Error fetching collections:', error);
      } finally {
        setLoadingCollections(false);
      }
    };

    fetchCollections();
  }, [toast]);

  // Add user management fetch in useEffect
  useEffect(() => {
    const fetchUsers = async () => {
      setLoadingUsers(true);
      try {
        const response = await adminSettingsApi.getUsers();
          
        if (!response.success) {
          console.error('Error fetching admin users:', response.error);
          toast({
            title: "Error Loading Users",
            description: "Failed to load admin users from database.",
            variant: "destructive",
          });
          return;
        }
        setAdminUsers(response.users || []);
      } catch (error) {
        console.error('Error fetching users:', error);
        toast({
          title: "Database Error",
          description: error.message,
          variant: "destructive",
        });
      } finally {
        setLoadingUsers(false);
      }
    };

    fetchUsers();
  }, [toast]);

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }));
  };

  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "New password and confirmation don't match.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Password Too Short",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }

    setChangingAdminPassword(true);
    try {
      const response = await adminSettingsApi.updateUserPassword('current-user', newPassword);

      if (!response.success) {
        throw new Error(response.error);
      }

      toast({
        title: "Password Changed Successfully",
        description: "Your password has been updated.",
        variant: "default",
      });

      // Clear password fields
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

    } catch (error) {
      console.error('Error changing password:', error);
      toast({
        title: "Password Change Failed",
        description: error.message || "Failed to change password.",
        variant: "destructive",
      });
    } finally {
      setChangingAdminPassword(false);
    }
  };

  const handleHeroImageUpload = async (file) => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File Type",
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

    setUploadingHeroImage(true);
    try {
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setHeroImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);

      // Upload image
      const uploadResult = await uploadHeroImage(file);
      if (uploadResult.error) {
        throw new Error(uploadResult.error);
      }

      // Update settings with new image URL
      setSettings(prev => ({
        ...prev,
        hero_image_url: uploadResult.url
      }));

      toast({
        title: "Image Uploaded Successfully",
        description: "Hero image has been updated. Don't forget to save your settings.",
        variant: "default",
      });

    } catch (error) {
      console.error('Error uploading hero image:', error);
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload hero image.",
        variant: "destructive",
      });
      setHeroImagePreview(null);
    } finally {
      setUploadingHeroImage(false);
    }
  };

  const handleCollectionChange = (index, field, value) => {
    setCollections(prev => prev.map((collection, i) => 
      i === index ? { ...collection, [field]: value } : collection
    ));
  };

  const handleCollectionImageUpload = async (index, file) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File Type",
        description: "Please select an image file.",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please select an image smaller than 5MB.",
        variant: "destructive",
      });
      return;
    }

    try {
      const uploadResult = await uploadCollectionImage(file);
      if (uploadResult.error) {
        throw new Error(uploadResult.error);
      }

      handleCollectionChange(index, 'image_url', uploadResult.url);

      toast({
        title: "Image Uploaded Successfully",
        description: "Collection image has been updated.",
        variant: "default",
      });
    } catch (error) {
      console.error('Error uploading collection image:', error);
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload collection image.",
        variant: "destructive",
      });
    }
  };

  const addNewCollection = () => {
    const newCollection = {
      id: `new-${Date.now()}`,
      name: '',
      description: '',
      image_url: '',
      search_terms: [],
      is_active: true,
      sort_order: collections.length + 1
    };
    setCollections(prev => [...prev, newCollection]);
  };

  const removeCollection = (index) => {
    setCollections(prev => prev.filter((_, i) => i !== index));
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleHeroImageUpload(files[0]);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const settingsToSave = {
        id: 1,
        store_name: settings.store_name,
        contact_email: settings.contact_email,
        email: settings.contact_email, // Duplicate for compatibility
        contact_phone: settings.contact_phone,
        phone: settings.contact_phone, // Duplicate for compatibility
        address: settings.address,
        store_description: settings.store_description,
        currency: settings.currency,
        timezone: settings.timezone,
        exchange_rate: parseFloat(settings.exchange_rate),
        exchange_rate_ghs: parseFloat(settings.exchange_rate), // Duplicate for compatibility
        paystack_public_key: settings.paystack_public_key,
        paystack_secret_key: settings.paystack_secret_key,
        hero_image_url: settings.hero_image_url,
        hero_title: settings.hero_title,
        hero_subtitle: settings.hero_subtitle,
        hero_button_text: settings.hero_button_text,
        captcha_enabled: settings.captcha_enabled,
        updated_at: new Date().toISOString()
      };

      const response = await adminSettingsApi.updateSettings({
        store_name: settings.store_name,
        contact_email: settings.contact_email,
        contact_phone: settings.contact_phone,
        exchange_rate_ghs: parseFloat(settings.exchange_rate),
        hero_image_url: settings.hero_image_url,
        hero_title: settings.hero_title,
        hero_subtitle: settings.hero_subtitle,
        hero_button_text: settings.hero_button_text
      });

      if (!response.success) {
        throw new Error(response.error);
      }

      toast({
        title: "Settings Saved Successfully",
        description: "Your store settings have been updated and are now active across the website.",
        variant: "default",
      });

      // Reload exchange rate from updated settings
      await loadExchangeRateFromSettings();

      // Trigger a page reload to refresh currency context
      setTimeout(() => {
        window.location.reload();
      }, 1500);

    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Save Failed",
        description: error.message || "Failed to save settings to database.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const saveCollections = async () => {
    setSavingCollections(true);
    try {
      const response = await adminSettingsApi.bulkUpdateCollections(collections);

      if (!response.success) throw new Error(response.error);

      toast({
        title: "Collections Saved Successfully",
        description: "Your collections have been updated and are now live on the homepage.",
        variant: "default",
      });

    } catch (error) {
      console.error('Error saving collections:', error);
      toast({
        title: "Save Failed",
        description: error.message || "Failed to save collections.",
        variant: "destructive",
      });
    } finally {
      setSavingCollections(false);
    }
  };

  const handleInviteUser = async () => {
    setInvitingUser(true);
    try {
      // For now, we'll create a profile entry and show instructions
      // In a real implementation, you'd want to use Supabase Edge Functions
      // to securely invite users with auth.admin.inviteUserByEmail
      
      const response = await adminSettingsApi.createUser({
        email: newUserEmail,
        full_name: newUserName,
        role: newUserRole
      });

      if (!response.success) {
        throw new Error(response.error);
      }

      toast({
        title: "User Profile Created",
        description: `Profile for ${newUserEmail} has been created. They will need to sign up with this email to access the system.`,
        variant: "default",
      });

      // Clear invite fields
      setNewUserEmail('');
      setNewUserName('');
      setNewUserRole('admin');

      // Refresh users list
      const usersResponse = await adminSettingsApi.getUsers();
      if (usersResponse.success) {
        setAdminUsers(usersResponse.users || []);
      }

    } catch (error) {
      console.error('Error creating user profile:', error);
      toast({
        title: "Profile Creation Failed",
        description: error.message || "Failed to create user profile.",
        variant: "destructive",
      });
    } finally {
      setInvitingUser(false);
    }
  };

  const handleRemoveUser = async (userId) => {
    if (window.confirm('Are you sure you want to remove this user profile?')) {
      try {
        const response = await adminSettingsApi.deleteUser(userId);
          
        if (!response.success) {
          throw new Error(response.error);
        }
        
        toast({
          title: "User Profile Removed",
          description: "User profile has been removed from the system.",
          variant: "default",
        });
        
        // Refresh users list
        const usersResponse = await adminSettingsApi.getUsers();
        if (usersResponse.success) {
          setAdminUsers(usersResponse.users || []);
        }
        
      } catch (error) {
        console.error('Error removing user profile:', error);
        toast({
          title: "Remove Failed",
          description: error.message || "Failed to remove user profile.",
          variant: "destructive",
        });
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading settings...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Store Settings</h1>
        <p className="text-muted-foreground">
          Configure your store information, exchange rates, and payment settings
        </p>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          These settings control how your store appears to customers and affect pricing across the entire website.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6">
        {/* Store Information */}
        <Card>
          <CardHeader>
            <CardTitle>Store Information</CardTitle>
            <CardDescription>
              Basic information about your store (displayed on Contact page)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="store_name">Store Name</Label>
              <Input
                id="store_name"
                name="store_name"
                value={settings.store_name}
                onChange={handleInputChange}
                placeholder="Tailored Hands"
              />
            </div>

            <div>
              <Label htmlFor="contact_email">Contact Email</Label>
              <Input
                id="contact_email"
                name="contact_email"
                type="email"
                value={settings.contact_email}
                onChange={handleInputChange}
                placeholder="hello@tailoredhands.africa"
              />
            </div>

            <div>
              <Label htmlFor="contact_phone">Contact Phone</Label>
              <Input
                id="contact_phone"
                name="contact_phone"
                value={settings.contact_phone}
                onChange={handleInputChange}
                placeholder="+233 24 532 7668"
              />
            </div>

            <div>
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                name="address"
                value={settings.address}
                onChange={handleInputChange}
                placeholder="Nii Odai Ayiku Road, Accra, Ghana"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="store_description">Store Description</Label>
              <Textarea
                id="store_description"
                name="store_description"
                value={settings.store_description}
                onChange={handleInputChange}
                placeholder="Brief description of your store..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Currency & Exchange Rate */}
        <Card>
          <CardHeader>
            <CardTitle>Currency Settings</CardTitle>
            <CardDescription>
              Controls pricing display and payment processing across the website
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="currency">Base Currency</Label>
              <select
                id="currency"
                name="currency"
                value={settings.currency}
                onChange={handleInputChange}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="USD">USD ($)</option>
                <option value="GHS">GHS (₵)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
              </select>
            </div>

            <div>
              <Label htmlFor="exchange_rate">USD to GHS Exchange Rate</Label>
              <Input
                id="exchange_rate"
                name="exchange_rate"
                type="number"
                value={settings.exchange_rate}
                onChange={handleInputChange}
                step="0.01"
                min="0"
                placeholder="16.0"
              />
              <p className="text-sm text-muted-foreground mt-1">
                1 USD = {settings.exchange_rate} GHS (This rate controls all price conversions on the website)
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Payment Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Configuration</CardTitle>
            <CardDescription>
              Paystack API keys for processing payments
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="paystack_public_key">Paystack Public Key</Label>
              <Input
                id="paystack_public_key"
                name="paystack_public_key"
                value={settings.paystack_public_key}
                onChange={handleInputChange}
                placeholder="pk_test_..."
              />
            </div>

            <div>
              <Label htmlFor="paystack_secret_key">Paystack Secret Key</Label>
              <Input
                id="paystack_secret_key"
                name="paystack_secret_key"
                type="password"
                value={settings.paystack_secret_key}
                onChange={handleInputChange}
                placeholder="sk_test_..."
              />
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Security Settings</CardTitle>
            <CardDescription>
              Configure security features for your website
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="captcha_enabled">Enable reCAPTCHA</Label>
                <p className="text-sm text-muted-foreground">
                  Enable Google reCAPTCHA verification on forms (sign up, sign in, contact, consultation)
                </p>
              </div>
              <Switch
                id="captcha_enabled"
                checked={settings.captcha_enabled}
                onCheckedChange={(checked) => {
                  setSettings(prev => ({ ...prev, captcha_enabled: checked }));
                }}
              />
            </div>
            {!settings.captcha_enabled && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  reCAPTCHA is currently disabled. Forms will not require verification.
                </AlertDescription>
              </Alert>
            )}
            {settings.captcha_enabled && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  reCAPTCHA is enabled. Users will need to complete verification on forms.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Hero Section Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Hero Section</CardTitle>
            <CardDescription>
              Customize the main hero section on your homepage
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Hero Background Image</Label>
              <div className="space-y-4">
                {/* Image Preview */}
                {(heroImagePreview || settings.hero_image_url) && (
                  <div className="relative">
                    <img
                      src={heroImagePreview || settings.hero_image_url}
                      alt="Hero background preview"
                      className="w-full h-48 object-cover rounded-lg border"
                    />
                    {uploadingHeroImage && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
                        <Loader2 className="h-8 w-8 text-white animate-spin" />
                      </div>
                    )}
                  </div>
                )}

                {/* Upload Area */}
                <div
                  className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                    dragActive 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <div className="flex flex-col items-center space-y-4">
                    <div className="p-3 bg-gray-100 rounded-full">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">
                        Drop your hero image here, or
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        disabled={uploadingHeroImage}
                        onClick={() => document.getElementById('hero-image-upload').click()}
                      >
                        {uploadingHeroImage ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          'Browse Files'
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500">
                      PNG, JPG, WebP up to 5MB
                    </p>
                  </div>
                  <input
                    id="hero-image-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={uploadingHeroImage}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleHeroImageUpload(file);
                      }
                    }}
                  />
                </div>

                {/* URL Input (Alternative) */}
                <div>
                  <Label htmlFor="hero_image_url">Or enter image URL</Label>
                  <Input
                    id="hero_image_url"
                    name="hero_image_url"
                    value={settings.hero_image_url}
                    onChange={handleInputChange}
                    placeholder="https://example.com/hero-image.jpg"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    You can either upload an image or enter a URL to an existing image
                  </p>
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="hero_title">Hero Title</Label>
              <Input
                id="hero_title"
                name="hero_title"
                value={settings.hero_title}
                onChange={handleInputChange}
                placeholder="Modern Elegance Redefined"
              />
            </div>

            <div>
              <Label htmlFor="hero_subtitle">Hero Subtitle</Label>
              <Textarea
                id="hero_subtitle"
                name="hero_subtitle"
                value={settings.hero_subtitle}
                onChange={handleInputChange}
                placeholder="Discover our collection of meticulously crafted African-inspired pieces..."
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="hero_button_text">Button Text</Label>
              <Input
                id="hero_button_text"
                name="hero_button_text"
                value={settings.hero_button_text}
                onChange={handleInputChange}
                placeholder="EXPLORE COLLECTION"
              />
            </div>
          </CardContent>
        </Card>

        {/* Collections Management */}
        <Card>
          <CardHeader>
            <CardTitle>Collections Management</CardTitle>
            <CardDescription>
              Manage the collections displayed on your homepage
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {loadingCollections ? (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                <p className="mt-2 text-gray-600">Loading collections...</p>
              </div>
            ) : (
              <>
                {collections.map((collection, index) => (
                  <div key={collection.id} className="border rounded-lg p-4 space-y-4">
                    <div className="flex justify-between items-start">
                      <h4 className="font-medium">Collection {index + 1}</h4>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeCollection(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        Remove
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor={`collection-name-${index}`}>Collection Name</Label>
                          <Input
                            id={`collection-name-${index}`}
                            value={collection.name}
                            onChange={(e) => handleCollectionChange(index, 'name', e.target.value)}
                            placeholder="e.g., Kaftan"
                          />
                        </div>

                        <div>
                          <Label htmlFor={`collection-description-${index}`}>Description</Label>
                          <Textarea
                            id={`collection-description-${index}`}
                            value={collection.description}
                            onChange={(e) => handleCollectionChange(index, 'description', e.target.value)}
                            placeholder="Brief description of this collection..."
                            rows={3}
                          />
                        </div>

                        <div>
                          <Label htmlFor={`collection-search-terms-${index}`}>Search Terms</Label>
                          <Input
                            id={`collection-search-terms-${index}`}
                            value={Array.isArray(collection.search_terms) ? collection.search_terms.join(', ') : collection.search_terms}
                            onChange={(e) => handleCollectionChange(index, 'search_terms', e.target.value)}
                            placeholder="kaftan, kaftans, traditional"
                          />
                          <p className="text-sm text-muted-foreground mt-1">
                            Comma-separated terms used when users click this collection
                          </p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        {collection.image_url && (
                          <div>
                            <Label>Current Image</Label>
                            <img
                              src={collection.image_url}
                              alt={`${collection.name} preview`}
                              className="w-full h-32 object-cover rounded-lg border"
                            />
                          </div>
                        )}

                        <div>
                          <Label>Upload New Image</Label>
                          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => document.getElementById(`collection-image-${index}`).click()}
                            >
                              Choose Image
                            </Button>
                            <input
                              id={`collection-image-${index}`}
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  handleCollectionImageUpload(index, file);
                                }
                              }}
                            />
                            <p className="text-xs text-gray-500 mt-2">
                              PNG, JPG, WebP up to 5MB
                            </p>
                          </div>
                        </div>

                        <div>
                          <Label htmlFor={`collection-image-url-${index}`}>Or enter image URL</Label>
                          <Input
                            id={`collection-image-url-${index}`}
                            value={collection.image_url}
                            onChange={(e) => handleCollectionChange(index, 'image_url', e.target.value)}
                            placeholder="https://example.com/image.jpg"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                <div className="flex justify-between items-center pt-4">
                  <Button
                    variant="outline"
                    onClick={addNewCollection}
                  >
                    Add New Collection
                  </Button>

                  <Button
                    onClick={saveCollections}
                    disabled={savingCollections}
                  >
                    {savingCollections ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving Collections...
                      </>
                    ) : (
                      'Save Collections'
                    )}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Password Change */}
        <Card>
          <CardHeader>
            <CardTitle>Change Admin Password</CardTitle>
            <CardDescription>
              Update your admin account password for security
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="current-password">Current Password</Label>
                  <Input
                    id="current-password"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter your current password"
                  />
                </div>
                
                <div>
                  <Label htmlFor="new-password">New Password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password (min 6 characters)"
                  />
                </div>
                
                <div>
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your new password"
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Password Requirements</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• At least 6 characters long</li>
                    <li>• Must be different from current password</li>
                    <li>• Use a strong, unique password</li>
                  </ul>
                </div>
                
                <Button
                  onClick={handlePasswordChange}
                  disabled={changingAdminPassword || !currentPassword || !newPassword || !confirmPassword}
                  className="w-full"
                >
                  {changingAdminPassword ? (
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

        {/* User Management Section */}
        <Card>
          <CardHeader>
            <CardTitle>User Management</CardTitle>
            <CardDescription>
              Manage admin users and their access to the system
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-4">Invite New Admin User</h4>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="new-user-email">Email Address</Label>
                    <Input
                      id="new-user-email"
                      type="email"
                      value={newUserEmail}
                      onChange={(e) => setNewUserEmail(e.target.value)}
                      placeholder="admin@example.com"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="new-user-name">Full Name</Label>
                    <Input
                      id="new-user-name"
                      value={newUserName}
                      onChange={(e) => setNewUserName(e.target.value)}
                      placeholder="Admin User"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="new-user-role">Role</Label>
                    <Select value={newUserRole} onValueChange={setNewUserRole}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="editor">Editor</SelectItem>
                        <SelectItem value="viewer">Viewer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <Button
                    onClick={handleInviteUser}
                    disabled={invitingUser || !newUserEmail || !newUserName}
                    className="w-full"
                  >
                    {invitingUser ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending Invite...
                      </>
                    ) : (
                      'Invite User'
                    )}
                  </Button>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-4">Current Admin Users</h4>
                {loadingUsers ? (
                  <div className="text-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                    <p className="mt-2 text-gray-600">Loading users...</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {adminUsers.map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{user.full_name}</p>
                          <p className="text-sm text-gray-600">{user.email}</p>
                          <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                            {user.role}
                          </Badge>
                        </div>
                        {user.id !== user?.id && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRemoveUser(user.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Technical Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Technical Settings</CardTitle>
            <CardDescription>
              System configuration options
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="timezone">Timezone</Label>
              <select
                id="timezone"
                name="timezone"
                value={settings.timezone}
                onChange={handleInputChange}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="UTC">UTC</option>
                <option value="Africa/Accra">Africa/Accra (GMT)</option>
                <option value="Africa/Lagos">Africa/Lagos (WAT)</option>
                <option value="America/New_York">America/New_York (EST)</option>
                <option value="Europe/London">Europe/London (GMT/BST)</option>
              </select>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Save Button */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex justify-end"
      >
        <Button 
          onClick={handleSave} 
          disabled={saving}
          size="lg"
          className="min-w-[150px]"
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
      </motion.div>
    </div>
  );
};

export default Settings;
