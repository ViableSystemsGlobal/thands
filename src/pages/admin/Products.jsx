import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Pencil, Trash, Search, Package, Star, TrendingUp, Loader2, Download, Upload, Trash2, FileDown, Shirt, Ruler, Image, ImageIcon, Eye } from "lucide-react";
import { getProducts, createProduct, updateProduct, deleteProduct, getProductMetrics } from "@/lib/services/adminApi";
import ProductDialog from "@/components/admin/ProductDialog";
import BulkImageUploadDialog from "@/components/admin/BulkImageUploadDialog";
import { Checkbox } from "@/components/ui/checkbox";
import { exportToCSV, fetchProductsForExport, getProductTemplateData, exportProductImages, downloadProductImagesAsZip } from "@/lib/export";
import adminApiClient from "@/lib/services/adminApiClient";
import PaginationControls from "@/components/admin/PaginationControls";
import { getImageUrl, getPlaceholderImageUrl } from "@/lib/utils/imageUtils";
import { useCurrency } from "@/context/CurrencyContext";
import exchangeRateService from "@/lib/services/exchangeRate";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const ITEMS_PER_PAGE_OPTIONS = [10, 20, 50, 100];

const ProductMetrics = ({ metrics, loading }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
      <div className="flex items-center">
        <Package className="w-8 h-8 text-indigo-500" />
        <div className="ml-4">
          <p className="text-gray-500">Total Products</p>
          <p className="text-2xl font-semibold text-gray-700">{loading ? <Loader2 className="animate-spin h-5 w-5" /> : metrics.totalProducts || 0}</p>
        </div>
      </div>
    </motion.div>
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
      <div className="flex items-center">
        <Shirt className="w-8 h-8 text-blue-500" />
        <div className="ml-4">
          <p className="text-gray-500">Active Products</p>
          <p className="text-2xl font-semibold text-gray-700">{loading ? <Loader2 className="animate-spin h-5 w-5" /> : metrics.readyToWearProducts || 0}</p>
        </div>
      </div>
    </motion.div>
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }} className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
      <div className="flex items-center">
        <Ruler className="w-8 h-8 text-purple-500" />
        <div className="ml-4">
          <p className="text-gray-500">Inactive Products</p>
          <p className="text-2xl font-semibold text-gray-700">{loading ? <Loader2 className="animate-spin h-5 w-5" /> : metrics.madeToMeasureProducts || 0}</p>
        </div>
      </div>
    </motion.div>
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.4 }} className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
      <div className="flex items-center">
        <Star className="w-8 h-8 text-amber-500" />
        <div className="ml-4">
          <p className="text-gray-500">Featured Products</p>
          <p className="text-2xl font-semibold text-gray-700">{loading ? <Loader2 className="animate-spin h-5 w-5" /> : metrics.featuredProducts || 0}</p>
        </div>
      </div>
    </motion.div>
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.5 }} className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
      <div className="flex items-center">
        <TrendingUp className="w-8 h-8 text-emerald-500" />
        <div className="ml-4">
          <p className="text-gray-500">Average Price (M Size)</p>
          <p className="text-2xl font-semibold text-gray-700">{loading ? <Loader2 className="animate-spin h-5 w-5" /> : `$${(metrics.averagePrice || 0).toFixed(2)}`}</p>
        </div>
      </div>
    </motion.div>
  </div>
);

const ProductTable = ({ products, onEdit, onDeletePrompt, selectedProducts, onSelectProduct, onSelectAll, loading }) => {
  const { formatPrice } = useCurrency();
  const navigate = useNavigate();
  
  return (
  <div className="overflow-x-auto">
    <table className="w-full min-w-[900px]">
      <thead>
        <tr className="border-b border-gray-200 bg-gray-50">
          <th className="py-3 px-6 w-[50px] text-center">
            <Checkbox
              checked={products.length > 0 && selectedProducts.length === products.length}
              onCheckedChange={onSelectAll}
              disabled={products.length === 0}
            />
          </th>
          <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Image</th>
          <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
          <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
          <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
          <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Price (M Size)</th>
          <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
          <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-200">
        {(() => {
          console.log('🎨 Admin Products: Rendering - loading:', loading, 'products.length:', products.length);
          console.log('🎨 Admin Products: Products array:', products);
          return null;
        })()}
        {loading ? (
          <tr>
            <td colSpan="8" className="text-center py-10 text-gray-500">
              <div className="flex justify-center items-center">
                <Loader2 className="w-8 h-8 mr-2 animate-spin text-indigo-600" />
                Loading products...
              </div>
            </td>
          </tr>
        ) : products.length === 0 ? (
          <tr>
            <td colSpan="8" className="text-center py-10 text-gray-500">No products found.</td>
          </tr>
        ) : (
          products.map((product) => (
            <tr key={product.id} className="hover:bg-gray-50 transition-colors">
              <td className="py-4 px-6 text-center">
                <Checkbox
                  checked={selectedProducts.includes(product.id)}
                  onCheckedChange={() => onSelectProduct(product.id)}
                />
              </td>
              <td className="py-4 px-6">
                <div
                  className="w-16 h-16 rounded-lg overflow-hidden shadow-sm border border-gray-200 cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => navigate(`/admin/products/${product.id}`)}
                >
                  <img
                    src={getImageUrl(product.image_url) || getPlaceholderImageUrl()}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              </td>
              <td
                className="py-4 px-6 font-medium text-gray-700 cursor-pointer hover:text-indigo-600 transition-colors"
                onClick={() => navigate(`/admin/products/${product.id}`)}
              >
                {product.name}
              </td>
              <td className="py-4 px-6 text-gray-600">{product.category}</td>
              <td className="py-4 px-6">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  product.product_type === 'ready_to_wear' 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'bg-purple-100 text-purple-800'
                }`}>
                  {product.product_type === 'ready_to_wear' ? 'Ready to Wear' : 'Made to Measure'}
                </span>
              </td>
              <td className="py-4 px-6 text-gray-600">
                {product.base_price ? (
                  <div className="flex flex-col">
                    <div className="font-medium">{exchangeRateService.formatUsdPrice(product.base_price)}</div>
                    <div className="text-xs text-gray-500">
                      {exchangeRateService.formatGhsPrice(product.base_price)}
                    </div>
                  </div>
                ) : 'N/A'}
              </td>
              <td className="py-4 px-6 text-gray-600">
                {new Date(product.created_at).toLocaleDateString()}
              </td>
              <td className="py-4 px-6">
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/admin/products/${product.id}`)}
                    className="hover:bg-gray-100 hover:border-gray-400"
                    title="View details"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(product)}
                    className="hover:bg-indigo-50 hover:border-indigo-500 hover:text-indigo-600"
                    title="Edit product"
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 border-red-300 hover:bg-red-50 hover:border-red-500 hover:text-red-700"
                    onClick={() => onDeletePrompt(product)}
                    title="Delete product"
                  >
                    <Trash className="w-4 h-4" />
                  </Button>
                </div>
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  </div>
  );
};


const ProductsContent = () => {
  const { toast } = useToast();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productToDelete, setProductToDelete] = useState(null);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [isExporting, setIsExporting] = useState(false);
  const [isExportingImages, setIsExportingImages] = useState(false);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [isBulkUploadDialogOpen, setIsBulkUploadDialogOpen] = useState(false);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(ITEMS_PER_PAGE_OPTIONS[0]);
  const [totalProductsCount, setTotalProductsCount] = useState(0);

  const [metrics, setMetrics] = useState({
    totalProducts: 0,
    readyToWearProducts: 0,
    madeToMeasureProducts: 0,
    featuredProducts: 0,
    averagePrice: 0
  });

  // Fetch metrics separately for ALL products
  const fetchMetricsCallback = useCallback(async () => {
    try {
      console.log('🔍 Admin Products: Fetching metrics for all products...');
      const metricsData = await getProductMetrics();
      console.log('✅ Admin Products: Metrics fetched:', metricsData);
      
      // Set metrics with fallback values to prevent undefined errors
      setMetrics({
        totalProducts: metricsData?.totalProducts || 0,
        readyToWearProducts: metricsData?.activeProducts || 0,
        madeToMeasureProducts: metricsData?.inactiveProducts || 0,
        featuredProducts: metricsData?.featuredProducts || 0,
        averagePrice: metricsData?.averagePrice || 0
      });
    } catch (error) {
      console.error("❌ Admin Products: Error fetching metrics:", error);
      // Set default metrics on error
      setMetrics({
        totalProducts: 0,
        readyToWearProducts: 0,
        madeToMeasureProducts: 0,
        featuredProducts: 0,
        averagePrice: 0
      });
    }
  }, []);

  const fetchProductsCallback = useCallback(async () => {
    setLoading(true);
    try {
      console.log('🔍 Admin Products: Starting to fetch products...');
      console.log('🔍 Admin Products: Current page:', currentPage);
      console.log('🔍 Admin Products: Items per page:', itemsPerPage);
      console.log('🔍 Admin Products: Search query:', searchQuery);

      // Fetch products and metrics in parallel
      const [productsResponse, metricsData] = await Promise.all([
        getProducts({
          page: currentPage,
          limit: itemsPerPage,
          search: searchQuery,
          active: 'all' // Get all products for admin
        }),
        getProductMetrics()
      ]);

      console.log('✅ Admin Products: Products fetched:', (productsResponse?.data?.products || productsResponse?.products || []).length);
      console.log('✅ Admin Products: Full products response:', productsResponse);
      console.log('✅ Admin Products: Metrics fetched:', metricsData);

      const productsData = productsResponse?.data || productsResponse || {};
      const productsArray = productsData.products || [];
      const totalCount = productsData.pagination?.total || 0;
      
      console.log('📊 Admin Products: Setting products:', productsArray.length);
      console.log('📊 Admin Products: Setting total count:', totalCount);
      console.log('📊 Admin Products: First product:', productsArray[0]);

      setProducts(productsArray);
      setTotalProductsCount(totalCount);

      // Set metrics from the separate API call (for ALL products)
      const metricsDataActual = metricsData?.data || metricsData || {};
      setMetrics({
        totalProducts: metricsDataActual.totalProducts || 0,
        readyToWearProducts: metricsDataActual.activeProducts || 0,
        madeToMeasureProducts: metricsDataActual.inactiveProducts || 0,
        featuredProducts: metricsDataActual.featuredProducts || 0,
        averagePrice: metricsDataActual.averagePrice || 0
      });

      console.log('📊 Frontend: Metrics set:', {
        totalProducts: metricsDataActual.totalProducts,
        activeProducts: metricsDataActual.activeProducts,
        inactiveProducts: metricsDataActual.inactiveProducts,
        featuredProducts: metricsDataActual.featuredProducts,
        averagePrice: metricsDataActual.averagePrice
      });

    } catch (error) {
      console.error("❌ Admin Products: Error fetching products:", error);
      console.error("❌ Admin Products: Error details:", {
        message: error.message,
        stack: error.stack,
        response: error.response
      });

      // Set empty state on error
      setProducts([]);
      setTotalProductsCount(0);
      setMetrics({
        totalProducts: 0,
        readyToWearProducts: 0,
        madeToMeasureProducts: 0,
        featuredProducts: 0,
        averagePrice: 0
      });

      toast({
        title: "Error",
        description: error.message || "Failed to fetch products",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      console.log('🏁 Admin Products: Fetch completed');
    }
  }, [toast, currentPage, itemsPerPage, searchQuery]);


  useEffect(() => {
    fetchProductsCallback();
  }, [fetchProductsCallback]);

  const handleEdit = (product) => {
    setSelectedProduct(product);
    setIsDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!productToDelete) return;
    
    setDeleteLoading(true);
    try {
      await deleteProduct(productToDelete.id);
      
      toast({ title: "Success", description: "Product deleted successfully" });
      setProductToDelete(null);
      // Refresh both products and metrics
      await Promise.all([fetchProductsCallback(), fetchMetricsCallback()]);
      setSelectedProducts(prev => prev.filter(id => id !== productToDelete.id));
    } catch (error) {
      console.error("Error deleting product:", error);
      toast({ title: "Error", description: error.message || "Failed to delete product.", variant: "destructive" });
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleDownloadTemplate = () => {
    const templateData = getProductTemplateData();
    exportToCSV(templateData, 'products_template');
    toast({ title: "Success", description: "Template downloaded successfully" });
  };

  const handleImport = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const csv = e.target.result;
        console.log("CSV data for import:", csv);
        toast({ title: "Success", description: "Products imported successfully (Placeholder)" });
      } catch (error) {
        console.error("Error importing products:", error);
        toast({ title: "Error", description: "Failed to import products", variant: "destructive" });
      }
    };
    reader.readAsText(file);
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const data = await fetchProductsForExport(searchQuery); // Pass search query if export should be filtered
      exportToCSV(data, 'products');
      toast({ title: "Success", description: "Products exported successfully" });
    } catch (error) {
      console.error("Error exporting products:", error);
      toast({ title: "Error", description: "Failed to export products", variant: "destructive" });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportImages = async () => {
    setIsExportingImages(true);
    try {
      const imageData = await exportProductImages(searchQuery);
      exportToCSV(imageData, 'product_images');
      toast({ title: "Success", description: "Product images list exported successfully" });
    } catch (error) {
      console.error("Error exporting product images:", error);
      toast({ title: "Error", description: "Failed to export product images", variant: "destructive" });
    } finally {
      setIsExportingImages(false);
    }
  };

  const handleDownloadImagesZip = async () => {
    setIsExportingImages(true);
    try {
      const result = await downloadProductImagesAsZip(searchQuery);
      toast({ 
        title: "Success", 
        description: `Downloaded ${result.downloadedCount} images${result.failedCount > 0 ? `, ${result.failedCount} failed` : ''}` 
      });
    } catch (error) {
      console.error("Error downloading images:", error);
      toast({ 
        title: "Error", 
        description: error.message || "Failed to download images. Make sure JSZip is installed.", 
        variant: "destructive" 
      });
    } finally {
      setIsExportingImages(false);
    }
  };

  const handleBulkImageUpload = () => {
    setIsBulkUploadDialogOpen(true);
  };

  const handleBulkUploadComplete = async () => {
    // Refresh products after images are assigned
    await fetchProductsCallback();
  };

  const handleAdd = () => {
    setSelectedProduct(null);
    setIsDialogOpen(true);
  };

  const handleBulkDelete = async () => {
    if (selectedProducts.length === 0) return;
    setDeleteLoading(true);
    try {
      // Delete each product individually using our API
      // The deleteProduct function should handle deleting associated product_sizes
      const deletePromises = selectedProducts.map(productId => deleteProduct(productId));
      await Promise.all(deletePromises);
      
      toast({ title: "Success", description: `${selectedProducts.length} products deleted successfully` });
      setSelectedProducts([]);
      
      // Refresh both products and metrics
      await Promise.all([fetchProductsCallback(), fetchMetricsCallback()]);
    } catch (error) {
      console.error("Error deleting products:", error);
      toast({ title: "Error", description: "Failed to delete products.", variant: "destructive" });
    } finally {
      setDeleteLoading(false);
    }
  };

  const toggleSelectAll = (checked) => {
    if (checked) {
      setSelectedProducts(products.map(p => p.id));
    } else {
      setSelectedProducts([]);
    }
  };

  const toggleSelectProduct = (productId) => {
    setSelectedProducts(prev => 
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (value) => {
    setItemsPerPage(value);
    setCurrentPage(1); // Reset to first page when items per page changes
  };

  const totalPages = Math.ceil(totalProductsCount / itemsPerPage);

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-slate-50 to-gray-100 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-light text-gray-800">Products Management</h1>
        </div>
        <div className="flex flex-col md:flex-row gap-2 md:items-center">
            <input type="file" accept=".csv" onChange={handleImport} className="hidden" id="import-file" />
            <div className="flex gap-2 flex-wrap justify-end">
              <Button variant="outline" onClick={handleDownloadTemplate} className="text-indigo-600 border-indigo-600 hover:bg-indigo-50">
                <FileDown className="w-4 h-4 mr-2" /> Template
              </Button>
              <Button variant="outline" onClick={() => document.getElementById('import-file').click()} className="text-indigo-600 border-indigo-600 hover:bg-indigo-50">
                <Upload className="w-4 h-4 mr-2" /> Import
              </Button>
              <Button variant="outline" onClick={handleExport} disabled={isExporting} className="text-indigo-600 border-indigo-600 hover:bg-indigo-50">
                {isExporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />} Export
              </Button>
              <Button 
                variant="outline" 
                onClick={handleExportImages} 
                disabled={isExportingImages} 
                className="text-indigo-600 border-indigo-600 hover:bg-indigo-50"
                title="Export image URLs as CSV"
              >
                {isExportingImages ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ImageIcon className="w-4 h-4 mr-2" />} Export Images
              </Button>
              <Button 
                variant="outline" 
                onClick={handleDownloadImagesZip} 
                disabled={isExportingImages} 
                className="text-indigo-600 border-indigo-600 hover:bg-indigo-50"
                title="Download all images as ZIP"
              >
                {isExportingImages ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Image className="w-4 h-4 mr-2" />} Download Images
              </Button>
              <Button 
                variant="outline" 
                onClick={handleBulkImageUpload} 
                className="text-indigo-600 border-indigo-600 hover:bg-indigo-50"
                title="Upload multiple images and assign to products"
              >
                <Upload className="w-4 h-4 mr-2" /> Upload Images
              </Button>
              <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white" onClick={handleAdd}>
                <Plus className="w-4 h-4 mr-2" /> Add Product
              </Button>
            </div>
        </div>
      </div>

      <ProductMetrics metrics={metrics} loading={loading && products.length === 0} />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.4 }} className="bg-white rounded-xl shadow-xl border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="relative flex-1 w-full md:w-auto">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search products by name or category..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow"
              />
            </div>
            {selectedProducts.length > 0 && (
              <Button variant="destructive" onClick={handleBulkDelete} disabled={deleteLoading} className="w-full md:w-auto bg-red-600 hover:bg-red-700 text-white">
                <Trash2 className="w-4 h-4 mr-2" /> Delete Selected ({selectedProducts.length})
              </Button>
            )}
          </div>
        </div>
        
        <ProductTable 
          products={products}
          onEdit={handleEdit}
          onDeletePrompt={setProductToDelete}
          selectedProducts={selectedProducts}
          onSelectProduct={toggleSelectProduct}
          onSelectAll={toggleSelectAll}
          loading={loading}
        />

        {/* Bulk Image Upload Dialog */}
        <BulkImageUploadDialog
          isOpen={isBulkUploadDialogOpen}
          onOpenChange={setIsBulkUploadDialogOpen}
          onComplete={handleBulkUploadComplete}
        />
        
        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          itemsPerPage={itemsPerPage}
          totalItems={totalProductsCount}
          onItemsPerPageChange={handleItemsPerPageChange}
        />
      </motion.div>

      <ProductDialog isOpen={isDialogOpen} onClose={() => setIsDialogOpen(false)} product={selectedProduct} onSuccess={fetchProductsCallback} />

      <AlertDialog open={!!productToDelete} onOpenChange={() => setProductToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the product "{productToDelete?.name}" and all its associated data (like sizes).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700 text-white" onClick={handleDelete} disabled={deleteLoading}>
              {deleteLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deleting...</> : "Yes, delete product"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Image Upload Dialog */}
      <BulkImageUploadDialog
        isOpen={isBulkUploadDialogOpen}
        onOpenChange={setIsBulkUploadDialogOpen}
        onComplete={handleBulkUploadComplete}
      />
    </div>
  );
};

const Products = () => {
  return <ProductsContent />;
};

export default Products;
