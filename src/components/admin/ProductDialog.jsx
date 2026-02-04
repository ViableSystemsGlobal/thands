import React, { useState, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, AlertCircle, Star, Loader2, Shirt, Ruler } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { productSizesApi } from "@/lib/services/productSizesApi";
import { uploadProductImage, deleteProductImage } from "@/lib/services/uploadApi";
import { getImageUrl } from "@/lib/utils/imageUtils";
import { createProduct, updateProduct } from "@/lib/services/adminApi";
import exchangeRateService, { loadExchangeRateFromSettings } from "@/lib/services/exchangeRate";

const SIZES = ["S", "M", "L", "XL", "XXL", "XXXL", "XXXXL"];

const ProductDialog = ({ isOpen, onClose, product, onSuccess }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [updateError, setUpdateError] = useState("");
  const [errors, setErrors] = useState({});
  const [exchangeRate, setExchangeRate] = useState(10.0); // Use 10.0 as default to match current API
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    product_type: "made_to_measure",
    base_price: 0,
    price_usd: 0,
    image: null,
    is_featured: false,
    image_url: "",
    weight: 0,
    stock_quantity: 0,
    sku: "",
    sizes: SIZES.map(size => ({ size, price: "" }))
  });

  useEffect(() => {
    // Load current exchange rate and subscribe to changes
    const loadExchangeRate = async () => {
      // Ensure the exchange rate is loaded from the API
      await loadExchangeRateFromSettings();
      const currentRate = exchangeRateService.getExchangeRate();
      setExchangeRate(currentRate);
      console.log('📊 ProductDialog loaded exchange rate:', currentRate);
    };
    
    loadExchangeRate();
    
    // Subscribe to exchange rate changes
    const unsubscribe = exchangeRateService.subscribe((newRate) => {
      setExchangeRate(newRate);
      console.log('🔄 Exchange rate updated in ProductDialog:', newRate);
    });
    
    if (product) {
      // First, set the basic product data
      setFormData({
        name: product.name || "",
        description: product.description || "",
        category: product.category || "",
        product_type: product.product_type || "made_to_measure",
        base_price: product.base_price || 0,
        price_usd: product.price_usd || 0,
        image: null,
        is_featured: product.is_featured || false,
        image_url: product.image_url || "",
        weight: product.weight || 0,
        stock_quantity: product.stock_quantity || 0,
        sku: product.sku || "",
        sizes: SIZES.map(size => ({ size, price: "" }))
      });

      // Then fetch and set the prices for each size
      fetchProductSizes(product.id);
    } else {
      setFormData({
        name: "",
        description: "",
        category: "",
        product_type: "made_to_measure",
        base_price: 0,
        price_usd: 0,
        image: null,
        is_featured: false,
        image_url: "",
        weight: 0,
        stock_quantity: 0,
        sku: "",
        sizes: SIZES.map(size => ({ size, price: "" }))
      });
    }
    setErrors({});
    setUploadError("");
    setUpdateError("");
    
    // Cleanup: unsubscribe from exchange rate changes
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [product]);

  const fetchProductSizes = async (productId) => {
    try {
      const sizesData = await productSizesApi.fetchProductSizes(productId);

      // Update formData with fetched sizes - show total price (base + adjustment)
      setFormData(prev => ({
        ...prev,
        sizes: SIZES.map(size => {
          const existingSize = sizesData.find(s => s.size === size);
          if (existingSize) {
            // Calculate total price: base_price + price_adjustment
            const totalPrice = parseFloat(prev.base_price || 0) + parseFloat(existingSize.price_adjustment || 0);
            return {
              size,
              price: totalPrice.toFixed(2), // Round to 2 decimal places
              price_adjustment: existingSize.price_adjustment // Keep original adjustment for saving
            };
          }
          return {
            size,
            price: "",
            price_adjustment: 0
          };
        })
      }));
    } catch (error) {
      console.error("Error fetching product sizes:", error);
      toast({
        title: "Error",
        description: "Failed to fetch product sizes",
        variant: "destructive",
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    }

    if (!formData.category.trim()) {
      newErrors.category = "Category is required";
    }

    if (!formData.base_price || formData.base_price <= 0) {
      newErrors.base_price = "Base price is required and must be greater than 0";
    }

    if (!formData.product_type) {
      newErrors.product_type = "Product type is required";
    }

    if (!formData.image && !formData.image_url) {
      newErrors.image = "Image is required";
    }

    const sizesWithPrices = formData.sizes.filter(size => size.price.trim());
    if (sizesWithPrices.length === 0) {
      newErrors.sizes = "At least one size with price is required";
    }

    sizesWithPrices.forEach(size => {
      if (isNaN(parseFloat(size.price))) {
        newErrors.sizes = "All prices must be valid numbers";
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setUpdateError("");

    try {
      let imageUrl = formData.image_url;

      if (formData.image) {
        const uploadResult = await uploadProductImage(formData.image);
        if (uploadResult.error || !uploadResult.success) {
          throw new Error(uploadResult.error || 'Failed to upload image');
        }
        imageUrl = uploadResult.url || uploadResult.imageUrl;

        // Delete old image if it exists (non-blocking)
        if (product?.image_url && !product.image_url.includes('supabase.co')) {
          deleteProductImage(product.image_url).catch(err => {
            console.warn('Failed to delete old image:', err);
          });
        }
      }

      const productData = {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        product_type: formData.product_type,
        price: formData.base_price, // Save base_price as price in database
        price_usd: formData.price_usd, // Save USD price
        image_url: imageUrl,
        is_featured: formData.is_featured,
        is_active: formData.is_active !== undefined ? formData.is_active : true,
        stock_quantity: formData.stock_quantity || 0,
        weight: formData.weight || 0
      };

      // Only include SKU if it's not empty
      if (formData.sku && formData.sku.trim()) {
        productData.sku = formData.sku.trim();
      }

      let productId;
      if (product) {
        const response = await updateProduct(product.id, productData);
        if (!response.success) throw new Error(response.error || 'Failed to update product');
        productId = product.id;
      } else {
        const response = await createProduct(productData);
        if (!response.success) throw new Error(response.error || 'Failed to create product');
        productId = response.data.id;
      }

      // Handle sizes
      const validSizes = formData.sizes.filter(size => size.price.trim());
      // Handle sizes using new API
      if (validSizes.length > 0) {
        const sizesData = validSizes.map(size => ({
          size: size.size,
          price_adjustment: parseFloat(size.price) - formData.base_price, // Convert total price back to adjustment
          stock_quantity: 10, // Default stock quantity
          is_available: true
        }));

        await productSizesApi.createProductSizes(productId, sizesData);
      }

      toast({
        title: "Success",
        description: `Product ${product ? 'updated' : 'created'} successfully`,
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error saving product:", error);
      setUpdateError("Failed to save product. Please try again.");
      toast({
        title: "Error",
        description: "Failed to save product",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setUploadError("Image size must be less than 5MB");
        return;
      }
      if (!file.type.startsWith('image/')) {
        setUploadError("File must be an image");
        return;
      }
      setFormData(prev => ({ ...prev, image: file }));
      setUploadError("");
    }
  };

  const handleSizeChange = (size, value) => {
    setFormData(prev => ({
      ...prev,
      sizes: prev.sizes.map(s => 
        s.size === size ? { ...s, price: value } : s
      )
    }));
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50" />
        <Dialog.Content className="fixed left-[50%] top-[50%] max-h-[85vh] w-[90vw] max-w-[800px] translate-x-[-50%] translate-y-[-50%] rounded-lg bg-white p-6 shadow-lg overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <Dialog.Title className="text-xl font-semibold">
              {product ? 'Edit Product' : 'Add New Product'}
            </Dialog.Title>
            <Dialog.Close className="rounded-full p-1.5 hover:bg-gray-100">
              <X className="h-4 w-4" />
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block mb-2">Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full p-2 border rounded"
                placeholder="Product name"
              />
              {errors.name && (
                <p className="text-red-500 text-sm mt-1">{errors.name}</p>
              )}
            </div>

            <div>
              <label className="block mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full p-2 border rounded"
                rows="4"
                placeholder="Product description"
              />
              {errors.description && (
                <p className="text-red-500 text-sm mt-1">{errors.description}</p>
              )}
            </div>

            <div>
              <label className="block mb-2">Category</label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                className="w-full p-2 border rounded"
                placeholder="Product category"
              />
              {errors.category && (
                <p className="text-red-500 text-sm mt-1">{errors.category}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-2">Base Price (USD)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.base_price}
                  onChange={(e) => {
                    const newUsdPrice = parseFloat(e.target.value) || 0;
                    setFormData(prev => ({
                      ...prev,
                      base_price: newUsdPrice, // base_price stores USD
                      // Auto-calculate GHS price (approximate exchange rate)
                      price_usd: newUsdPrice,
                      // Recalculate size prices when base price changes
                      sizes: prev.sizes.map(size => {
                        if (size.price && !isNaN(parseFloat(size.price))) {
                          const currentTotal = parseFloat(size.price);
                          const oldAdjustment = currentTotal - parseFloat(prev.base_price || 0);
                          return {
                            ...size,
                            price: (newUsdPrice + oldAdjustment).toString()
                          };
                        }
                        return size;
                      })
                    }));
                  }}
                  className="w-full p-2 border rounded"
                  placeholder="Enter base price in USD"
                />
                {errors.base_price && (
                  <p className="text-red-500 text-sm mt-1">{errors.base_price}</p>
                )}
              </div>

              <div>
                <label className="block mb-2">Price in GHS (Calculated)</label>
                <input
                  type="number"
                  step="0.01"
                  value={exchangeRateService.usdToGhs(formData.base_price || 0).toFixed(2)}
                  disabled
                  className="w-full p-2 border rounded bg-gray-100"
                  placeholder="Auto-calculated from USD"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Exchange rate: {exchangeRate} GHS = 1 USD
                </p>
              </div>
            </div>

            <div>
              <label className="block mb-3 text-sm font-medium text-gray-700">Product Type</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div 
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-all duration-200 hover:shadow-md ${
                    formData.product_type === 'ready_to_wear' 
                      ? 'border-indigo-500 bg-indigo-50 shadow-md' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setFormData(prev => ({ ...prev, product_type: 'ready_to_wear' }))}
                >
                  <div className="flex items-center space-x-3">
                    <input
                      type="radio"
                      name="product_type"
                      value="ready_to_wear"
                      checked={formData.product_type === 'ready_to_wear'}
                      onChange={(e) => setFormData(prev => ({ ...prev, product_type: e.target.value }))}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    <Shirt className="w-5 h-5 text-indigo-600" />
                    <div>
                      <div className="font-medium text-gray-900">Ready to Wear</div>
                      <div className="text-sm text-gray-500">Standard sizes in stock</div>
                    </div>
                  </div>
                </div>

                <div 
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-all duration-200 hover:shadow-md ${
                    formData.product_type === 'made_to_measure' 
                      ? 'border-indigo-500 bg-indigo-50 shadow-md' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setFormData(prev => ({ ...prev, product_type: 'made_to_measure' }))}
                >
                  <div className="flex items-center space-x-3">
                    <input
                      type="radio"
                      name="product_type"
                      value="made_to_measure"
                      checked={formData.product_type === 'made_to_measure'}
                      onChange={(e) => setFormData(prev => ({ ...prev, product_type: e.target.value }))}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    <Ruler className="w-5 h-5 text-indigo-600" />
                    <div>
                      <div className="font-medium text-gray-900">Made to Measure</div>
                      <div className="text-sm text-gray-500">Custom tailored to fit</div>
                    </div>
                  </div>
                </div>
              </div>
              {errors.product_type && (
                <p className="text-red-500 text-sm mt-1">{errors.product_type}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-2">Weight (lbs)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.weight || 0}
                  onChange={(e) => setFormData(prev => ({ ...prev, weight: parseFloat(e.target.value) || 0 }))}
                  className="w-full p-2 border rounded"
                  placeholder="0.5"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Product weight in pounds (used for shipping calculations)
                </p>
              </div>
              <div>
                <label className="block mb-2">Stock Quantity</label>
                <input
                  type="number"
                  min="0"
                  value={formData.stock_quantity || 0}
                  onChange={(e) => setFormData(prev => ({ ...prev, stock_quantity: parseInt(e.target.value) || 0 }))}
                  className="w-full p-2 border rounded"
                  placeholder="0"
                />
              </div>
            </div>

            <div>
              <label className="block mb-2">SKU (Optional)</label>
              <input
                type="text"
                value={formData.sku || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
                className="w-full p-2 border rounded"
                placeholder="Product SKU"
              />
            </div>

            <div>
              <label className="block mb-2">Image</label>
              <input
                type="file"
                onChange={handleImageChange}
                accept="image/*"
                className="w-full p-2 border rounded"
              />
              {uploadError && (
                <p className="text-red-500 text-sm mt-1">{uploadError}</p>
              )}
              {errors.image && (
                <p className="text-red-500 text-sm mt-1">{errors.image}</p>
              )}
              {(formData.image_url || formData.image) && (
                <div className="mt-2">
                  <img
                    src={formData.image ? URL.createObjectURL(formData.image) : getImageUrl(formData.image_url)}
                    alt="Preview"
                    className="w-32 h-32 object-cover rounded"
                  />
                </div>
              )}
            </div>

            <div>
              <label className="flex items-center space-x-2 mb-2">
                <input
                  type="checkbox"
                  checked={formData.is_featured}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_featured: e.target.checked }))}
                  className="rounded"
                />
                <span>Featured Product</span>
              </label>
            </div>

            <div>
              <label className="block mb-2">Sizes and Prices</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {formData.sizes.map((size) => (
                  <div key={size.size} className="space-y-1">
                    <label className="text-sm font-medium">{size.size}</label>
                    <input
                      type="text"
                      value={size.price}
                      onChange={(e) => handleSizeChange(size.size, e.target.value)}
                      className="w-full p-2 border rounded"
                      placeholder="Price"
                    />
                  </div>
                ))}
              </div>
              {errors.sizes && (
                <p className="text-red-500 text-sm mt-1">{errors.sizes}</p>
              )}
            </div>

            {updateError && (
              <div className="flex items-center space-x-2 text-red-600">
                <AlertCircle className="h-4 w-4" />
                <p className="text-sm">{updateError}</p>
              </div>
            )}

            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-black hover:bg-gray-800 text-white"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </div>
                ) : (
                  'Save Product'
                )}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default ProductDialog;
