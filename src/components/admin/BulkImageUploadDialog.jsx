import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, X, Check, Image as ImageIcon } from "lucide-react";
import adminApiClient from "@/lib/services/adminApiClient";
import { useToast } from "@/components/ui/use-toast";

const BulkImageUploadDialog = ({ isOpen, onOpenChange, onComplete }) => {
  const { toast } = useToast();
  const [files, setFiles] = useState([]);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [productMappings, setProductMappings] = useState({}); // { imageId: productId }
  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch products for mapping
  useEffect(() => {
    if (isOpen && uploadedImages.length > 0 && products.length === 0) {
      fetchProducts();
    }
  }, [isOpen, uploadedImages]);

  // Auto-match products when both uploaded images and products are available
  useEffect(() => {
    if (uploadedImages.length > 0 && products.length > 0 && Object.keys(productMappings).length === 0) {
      const autoMappings = {};
      uploadedImages.forEach((image) => {
        const fileName = image.originalName || image.name || '';
        // Try to find matching product by name or SKU in filename
        const matchedProduct = products.find(product => {
          const productName = product.name?.toLowerCase().replace(/\s+/g, '_');
          const productSku = product.sku?.toLowerCase();
          const lowerFileName = fileName.toLowerCase();
          return lowerFileName.includes(productName) || 
                 (productSku && lowerFileName.includes(productSku));
        });
        if (matchedProduct) {
          autoMappings[image.id] = matchedProduct.id;
        }
      });
      if (Object.keys(autoMappings).length > 0) {
        setProductMappings(autoMappings);
      }
    }
  }, [uploadedImages, products]);

  const fetchProducts = async () => {
    try {
      const response = await adminApiClient.get('/products?limit=1000&active=all');
      const productsData = response.data?.products || response.data || [];
      setProducts(productsData);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const handleFileSelect = (event) => {
    const selectedFiles = Array.from(event.target.files);
    setFiles(selectedFiles);
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append('images', file);
      });

      const response = await adminApiClient.post('/upload/multiple', formData);
      const uploaded = response.data?.files || response.files || [];
      
      setUploadedImages(uploaded);
      
      // Fetch products for mapping (auto-matching will happen in useEffect)
      await fetchProducts();
      
      toast({
        title: "Success",
        description: `${uploaded.length} images uploaded successfully. Map them to products below.`
      });
    } catch (error) {
      console.error("Error uploading images:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to upload images",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleAssignImages = async () => {
    if (Object.keys(productMappings).length === 0) {
      toast({
        title: "No Mappings",
        description: "Please map at least one image to a product",
        variant: "destructive"
      });
      return;
    }

    setIsAssigning(true);
    try {
      const assignments = Object.entries(productMappings).map(([imageId, productId]) => {
        const image = uploadedImages.find(img => img.id === imageId);
        return { imageId, productId, imageUrl: getImageUrlForProduct(image) };
      });

      // Update each product with its assigned image
      const updatePromises = assignments.map(async ({ productId, imageUrl }) => {
        try {
          // Ensure the URL is a relative path (not full URL) for database storage
          const relativeUrl = imageUrl.startsWith('http') 
            ? imageUrl.replace(window.location.origin, '')
            : imageUrl;
          
          await adminApiClient.put(`/products/${productId}`, {
            image_url: relativeUrl
          });
        } catch (error) {
          console.error(`Error updating product ${productId}:`, error);
          throw error;
        }
      });

      await Promise.all(updatePromises);

      toast({
        title: "Success",
        description: `${assignments.length} images assigned to products successfully`
      });

      if (onComplete) {
        onComplete();
      }
      handleClose();
    } catch (error) {
      console.error("Error assigning images:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to assign images to products",
        variant: "destructive"
      });
    } finally {
      setIsAssigning(false);
    }
  };

  const handleClose = () => {
    setFiles([]);
    setUploadedImages([]);
    setProductMappings({});
    setSearchQuery('');
    onOpenChange(false);
  };

  const filteredProducts = products.filter(product =>
    product.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.sku?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getImageUrl = (image) => {
    // Handle different response structures from the upload endpoint
    if (image.processedImages?.thumbnails?.url) {
      const url = image.processedImages.thumbnails.url;
      return url.startsWith('http') ? url : `${window.location.origin}${url}`;
    }
    if (image.processedImages?.original?.url) {
      const url = image.processedImages.original.url;
      return url.startsWith('http') ? url : `${window.location.origin}${url}`;
    }
    if (image.url) {
      return image.url.startsWith('http') ? image.url : `${window.location.origin}${image.url}`;
    }
    // Fallback: construct URL from file structure
    if (image.id) {
      return `${window.location.origin}/uploads/products/thumbnails/${image.id}-thumb.webp`;
    }
    return null;
  };

  const getImageUrlForProduct = (image) => {
    // Get the original or medium size URL for product assignment
    if (image.processedImages?.original?.url) {
      const url = image.processedImages.original.url;
      return url.startsWith('http') ? url : `${window.location.origin}${url}`;
    }
    if (image.processedImages?.medium?.url) {
      const url = image.processedImages.medium.url;
      return url.startsWith('http') ? url : `${window.location.origin}${url}`;
    }
    if (image.url) {
      return image.url.startsWith('http') ? image.url : `${window.location.origin}${image.url}`;
    }
    if (image.id) {
      return `${window.location.origin}/uploads/products/original/${image.id}-original.webp`;
    }
    return null;
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bulk Image Upload</DialogTitle>
          <DialogDescription>
            Upload multiple images and assign them to products
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* File Selection */}
          {uploadedImages.length === 0 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="bulk-images">Select Images</Label>
                <input
                  type="file"
                  id="bulk-images"
                  accept="image/*"
                  multiple
                  onChange={handleFileSelect}
                  className="mt-2 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                />
                {files.length > 0 && (
                  <p className="mt-2 text-sm text-gray-600">
                    {files.length} file(s) selected
                  </p>
                )}
              </div>
              <Button
                onClick={handleUpload}
                disabled={files.length === 0 || isUploading}
                className="w-full"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  'Upload Images'
                )}
              </Button>
            </div>
          )}

          {/* Image Mapping */}
          {uploadedImages.length > 0 && (
            <div className="space-y-4">
              <div>
                <Label>Search Products</Label>
                <input
                  type="text"
                  placeholder="Search by product name or SKU..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {uploadedImages.map((image) => {
                  const imageUrl = getImageUrl(image);
                  const mappedProductId = productMappings[image.id];
                  const mappedProduct = products.find(p => p.id === mappedProductId);

                  return (
                    <div
                      key={image.id}
                      className="flex items-center gap-4 p-3 border rounded-lg"
                    >
                      {/* Image Preview */}
                      <div className="w-20 h-20 flex-shrink-0">
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt="Uploaded"
                            className="w-full h-full object-cover rounded"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-200 rounded flex items-center justify-center">
                            <ImageIcon className="w-8 h-8 text-gray-400" />
                          </div>
                        )}
                      </div>

                      {/* Product Selection */}
                      <div className="flex-1">
                        <Label className="text-sm font-medium">
                          Assign to Product:
                        </Label>
                        <select
                          value={mappedProductId || ''}
                          onChange={(e) => {
                            setProductMappings(prev => ({
                              ...prev,
                              [image.id]: e.target.value || undefined
                            }));
                          }}
                          className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        >
                          <option value="">-- Select Product --</option>
                          {filteredProducts.map((product) => (
                            <option key={product.id} value={product.id}>
                              {product.name} {product.sku ? `(${product.sku})` : ''}
                            </option>
                          ))}
                        </select>
                        {mappedProduct && (
                          <p className="mt-1 text-xs text-green-600 flex items-center">
                            <Check className="w-3 h-3 mr-1" />
                            Will update: {mappedProduct.name}
                          </p>
                        )}
                      </div>

                      {/* Remove Button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setUploadedImages(prev => prev.filter(img => img.id !== image.id));
                          setProductMappings(prev => {
                            const newMappings = { ...prev };
                            delete newMappings[image.id];
                            return newMappings;
                          });
                        }}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          {uploadedImages.length > 0 && (
            <Button
              onClick={handleAssignImages}
              disabled={isAssigning || Object.keys(productMappings).length === 0}
            >
              {isAssigning ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Assigning...
                </>
              ) : (
                `Assign ${Object.keys(productMappings).length} Image(s) to Products`
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BulkImageUploadDialog;

