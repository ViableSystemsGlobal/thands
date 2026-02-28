import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { useCurrency } from '@/context/CurrencyContext';
import exchangeRateService from '@/lib/services/exchangeRate';
import { getImageUrl, getPlaceholderImageUrl } from '@/lib/utils/imageUtils';
import { deleteProduct } from '@/lib/services/adminApi';
import adminApiClient from '@/lib/services/adminApiClient';
import ProductDialog from '@/components/admin/ProductDialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Loader2,
  Package,
  Star,
  Ruler,
  Weight,
  Tag,
  BarChart3,
  ImageIcon,
} from 'lucide-react';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (val, suffix = '') =>
  val != null && val !== '' ? `${val}${suffix}` : '—';

function InfoRow({ label, value }) {
  return (
    <div className="flex justify-between py-2 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-900 text-right">{value ?? '—'}</span>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [product, setProduct]         = useState(null);
  const [sizes, setSizes]             = useState([]);
  const [loading, setLoading]         = useState(true);
  const [editOpen, setEditOpen]       = useState(false);
  const [deleteOpen, setDeleteOpen]   = useState(false);
  const [deleting, setDeleting]       = useState(false);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const res = await adminApiClient.get(`/products/${id}`);
      const p   = res.data?.product || res.data;
      setProduct(p);
      setSizes(p?.product_sizes || p?.sizes || []);
    } catch {
      toast({ title: 'Error', description: 'Failed to load product', variant: 'destructive' });
      navigate('/admin/products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProduct(); }, [id]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteProduct(id);
      toast({ title: 'Deleted', description: `${product?.name} was deleted.` });
      navigate('/admin/products');
    } catch {
      toast({ title: 'Error', description: 'Failed to delete product', variant: 'destructive' });
    } finally {
      setDeleting(false);
      setDeleteOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <Loader2 className="h-10 w-10 animate-spin text-[#D2B48C]" />
      </div>
    );
  }

  if (!product) return null;

  const hasDimensions =
    product.dimensions_length || product.dimensions_width || product.dimensions_height;

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-slate-50 to-gray-100 min-h-full">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate('/admin/products')}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Products
        </button>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEditOpen(true)}
            className="hover:bg-indigo-50 hover:border-indigo-400 hover:text-indigo-700"
          >
            <Pencil className="h-4 w-4 mr-1.5" /> Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDeleteOpen(true)}
            className="text-red-600 border-red-300 hover:bg-red-50 hover:border-red-500"
          >
            <Trash2 className="h-4 w-4 mr-1.5" /> Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left — image + status chips */}
        <div className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                <img
                  src={getImageUrl(product.image_url) || getPlaceholderImageUrl()}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex flex-wrap gap-2 mt-4">
                <Badge className={product.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}>
                  {product.is_active ? 'Active' : 'Inactive'}
                </Badge>
                {product.is_featured && (
                  <Badge className="bg-amber-100 text-amber-800 flex items-center gap-1">
                    <Star className="h-3 w-3" /> Featured
                  </Badge>
                )}
                <Badge className={
                  product.product_type === 'ready_to_wear'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-purple-100 text-purple-800'
                }>
                  {product.product_type === 'ready_to_wear' ? 'Ready to Wear' : 'Made to Measure'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Shipping info */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Package className="h-4 w-4 text-gray-400" /> Shipping Info
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <InfoRow label="Weight" value={product.weight ? `${product.weight} lbs` : '—'} />
              {hasDimensions ? (
                <InfoRow
                  label="Dimensions (L×W×H)"
                  value={`${fmt(product.dimensions_length, '"')} × ${fmt(product.dimensions_width, '"')} × ${fmt(product.dimensions_height, '"')}`}
                />
              ) : (
                <InfoRow label="Dimensions" value="Not set" />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right — details */}
        <div className="lg:col-span-2 space-y-4">

          {/* Title + description */}
          <Card>
            <CardContent className="p-6">
              <h1 className="text-2xl font-semibold text-gray-900 mb-1">{product.name}</h1>
              <p className="text-sm text-gray-500 mb-4">{product.category}</p>
              <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">{product.description}</p>
            </CardContent>
          </Card>

          {/* Pricing */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Tag className="h-4 w-4 text-gray-400" /> Pricing
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <InfoRow
                label="Base Price (USD)"
                value={product.base_price ? exchangeRateService.formatUsdPrice(product.base_price) : '—'}
              />
              <InfoRow
                label="Base Price (GHS)"
                value={product.base_price ? exchangeRateService.formatGhsPrice(product.base_price) : '—'}
              />
            </CardContent>
          </Card>

          {/* Sizes */}
          {sizes.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Ruler className="h-4 w-4 text-gray-400" /> Sizes &amp; Prices
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {sizes.map((s) => {
                    const total = parseFloat(product.base_price || 0) + parseFloat(s.price_adjustment || 0);
                    return (
                      <div key={s.size} className="rounded-lg border border-gray-200 p-3 text-center bg-gray-50">
                        <p className="font-semibold text-gray-800">{s.size}</p>
                        <p className="text-sm text-gray-600 mt-0.5">
                          {exchangeRateService.formatUsdPrice(total)}
                        </p>
                        <p className="text-xs text-gray-400">
                          {exchangeRateService.formatGhsPrice(total)}
                        </p>
                        {!s.is_available && (
                          <span className="text-xs text-red-500 mt-1 block">Unavailable</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Inventory */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-gray-400" /> Inventory
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <InfoRow label="SKU" value={product.sku || '—'} />
              <InfoRow label="Stock Quantity" value={product.stock_quantity ?? '—'} />
              <InfoRow label="Created" value={product.created_at ? new Date(product.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'} />
              <InfoRow label="Last Updated" value={product.updated_at ? new Date(product.updated_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'} />
            </CardContent>
          </Card>

        </div>
      </div>

      {/* Edit dialog */}
      <ProductDialog
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        product={product}
        onSuccess={() => { setEditOpen(false); fetchProduct(); }}
      />

      {/* Delete confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete product?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{product.name}</strong> and all its sizes. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deleting…</> : 'Yes, delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ProductDetail;
