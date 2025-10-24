import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, Upload, Image as ImageIcon, Loader2, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { uploadCollectionImage } from '@/lib/services/uploadApi';
import adminApiClient from '@/lib/services/adminApiClient';

const Collections = () => {
  const { toast } = useToast();
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState({});

  // Load collections on component mount
  useEffect(() => {
    loadCollections();
  }, []);

  const loadCollections = async () => {
    try {
      setLoading(true);
      const response = await adminApiClient.get('/collections');
      console.log('Collections API response:', response);
      
      if (response.success && Array.isArray(response.data)) {
        setCollections(response.data);
      } else {
        console.warn('Collections API returned unexpected format:', response);
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
      setLoading(false);
    }
  };

  const handleInputChange = (collectionId, field, value) => {
    setCollections(prev => {
      if (!Array.isArray(prev)) return [];
      return prev.map(collection => 
        collection.id === collectionId 
          ? { ...collection, [field]: value }
          : collection
      );
    });
  };

  const handleImageUpload = async (collectionId, file) => {
    if (!file) return;

    try {
      setUploading(prev => ({ ...prev, [collectionId]: true }));
      
      const formData = new FormData();
      formData.append('image', file);
      
      const response = await uploadCollectionImage(formData);
      if (response.success) {
        handleInputChange(collectionId, 'image_url', response.imageUrl);
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
      setUploading(prev => ({ ...prev, [collectionId]: false }));
    }
  };

  const removeCollection = (collectionId) => {
    setCollections(prev => {
      if (!Array.isArray(prev)) return [];
      return prev.filter(collection => collection.id !== collectionId);
    });
  };

  const addCollection = () => {
    const newId = Array.isArray(collections) && collections.length > 0 
      ? Math.max(...collections.map(c => c.id), 0) + 1 
      : 1;
    setCollections(prev => [...(Array.isArray(prev) ? prev : []), {
      id: newId,
      name: '',
      description: '',
      search_terms: '',
      image_url: ''
    }]);
  };

  const saveCollections = async () => {
    try {
      setSaving(true);
      const collectionsToSave = Array.isArray(collections) ? collections : [];
      const response = await adminApiClient.post('/collections', { collections: collectionsToSave });
      if (response.success) {
        toast({
          title: "Success",
          description: "Collections saved successfully",
        });
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
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center space-x-2">
          <Loader2 className="animate-spin h-6 w-6 text-[#D2B48C]" />
          <span className="text-lg">Loading collections...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Collections Management</h1>
          <p className="text-gray-600">Manage the collections displayed on your homepage</p>
        </div>

        {/* Collections */}
        <div className="space-y-6">
          {Array.isArray(collections) && collections.map((collection, index) => (
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
                      <ImageIcon className="h-5 w-5 text-orange-600" />
                      <span>Collection {index + 1}</span>
                    </CardTitle>
                    <Button
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
                          onChange={(e) => handleInputChange(collection.id, 'name', e.target.value)}
                          placeholder="e.g., Kaftan"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor={`description-${collection.id}`}>Description</Label>
                        <Textarea
                          id={`description-${collection.id}`}
                          value={collection.description}
                          onChange={(e) => handleInputChange(collection.id, 'description', e.target.value)}
                          placeholder="e.g., Explore our collection of elegant kaftans"
                          rows={3}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor={`search_terms-${collection.id}`}>Search Terms</Label>
                        <Input
                          id={`search_terms-${collection.id}`}
                          value={collection.search_terms}
                          onChange={(e) => handleInputChange(collection.id, 'search_terms', e.target.value)}
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
                                    if (file) handleImageUpload(collection.id, file);
                                  }}
                                  disabled={uploading[collection.id]}
                                />
                              </label>
                            </div>
                            <p className="text-xs text-gray-500">PNG, JPG, WebP up to 5MB</p>
                          </div>
                        </div>
                        
                        {uploading[collection.id] && (
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
                          onChange={(e) => handleInputChange(collection.id, 'image_url', e.target.value)}
                          placeholder="https://example.com/image.jpg"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Add Collection Button */}
        <div className="mt-6">
          <Button
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
            onClick={saveCollections}
            disabled={saving}
            className="bg-[#D2B48C] hover:bg-[#B8860B] text-white"
          >
            {saving ? (
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
    </div>
  );
};

export default Collections;
