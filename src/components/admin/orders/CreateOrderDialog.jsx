import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Plus, Trash2, Loader2, Truck, Search, Package } from 'lucide-react';
import { createOrder, getCustomers, getProducts, getGiftVoucherTypes } from '@/lib/services/adminApi';
import adminApiClient from '@/lib/services/adminApiClient';
import { countries } from '@/lib/location-data';
import GoogleAddressAutocomplete from '@/components/checkout/GoogleAddressAutocomplete';

// Map Google's 2-letter ISO codes to full country names used in our countries list
const ISO_TO_COUNTRY = {
  GH: 'Ghana', US: 'United States', GB: 'United Kingdom', NG: 'Nigeria',
  CA: 'Canada', AU: 'Australia', DE: 'Germany', FR: 'France', IT: 'Italy',
  ES: 'Spain', ZA: 'South Africa', KE: 'Kenya', UG: 'Uganda', TG: 'Togo',
  BJ: 'Benin', CI: "Côte d'Ivoire", SN: 'Senegal', CM: 'Cameroon',
  IN: 'India', CN: 'China', JP: 'Japan', BR: 'Brazil', MX: 'Mexico',
  AE: 'United Arab Emirates', SA: 'Saudi Arabia', NL: 'Netherlands',
  BE: 'Belgium', SE: 'Sweden', NO: 'Norway', CH: 'Switzerland',
  AT: 'Austria', NZ: 'New Zealand', SG: 'Singapore', MY: 'Malaysia',
  PH: 'Philippines', IE: 'Ireland', PT: 'Portugal', PL: 'Poland',
  LR: 'Liberia', SL: 'Sierra Leone', GM: 'Gambia', GN: 'Guinea',
  ML: 'Mali', BF: 'Burkina Faso',
};

const resolveCountryName = (code) => {
  if (!code) return '';
  if (code.length > 2) return code; // already a full name
  return ISO_TO_COUNTRY[code.toUpperCase()] || code;
};

const INITIAL_FORM = {
  customerSearch: '',
  customer_id: null,
  shipping_first_name: '',
  shipping_last_name: '',
  shipping_email: '',
  shipping_phone: '',
  shipping_address: '',
  shipping_city: '',
  shipping_state: '',
  shipping_postal_code: '',
  shipping_country: '',
  items: [],
  base_shipping: 0,
  payment_method: 'cash',
  payment_status: 'pending',
  notes: '',
};

const ITEM_TYPES = ['Product', 'Gift Voucher', 'Custom Item'];
const PAYMENT_METHODS = ['cash', 'bank_transfer', 'paystack', 'other'];

const emptyItem = () => ({
  type: 'Product',
  product_id: '',
  productSearch: '',       // local search text for product picker
  gift_voucher_type_id: '',
  custom_item_name: '',
  size: '',
  quantity: 1,
  price: '',
});

// ── Searchable product picker ──────────────────────────────────────────────
const ProductPicker = ({ products, value, searchText, onSearchChange, onSelect, onSizeChange, sizes, selectedSize }) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  const filtered = products.filter((p) =>
    !searchText || p.name.toLowerCase().includes(searchText.toLowerCase())
  );

  const selectedProduct = products.find((p) => String(p.id) === String(value));

  useEffect(() => {
    const handleOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  return (
    <div className="grid grid-cols-2 gap-3">
      {/* Product selector */}
      <div className="space-y-1" ref={containerRef}>
        <Label className="text-xs">Product</Label>
        <div className="relative">
          {/* Show selected product with image, or search input */}
          {selectedProduct && !open ? (
            <button
              type="button"
              onClick={() => { onSearchChange(''); setOpen(true); }}
              className="w-full flex items-center gap-2 border border-slate-300 rounded-md px-2 py-1.5 bg-white text-sm text-left hover:border-indigo-400 transition-colors"
            >
              {selectedProduct.image_url ? (
                <img
                  src={selectedProduct.image_url}
                  alt={selectedProduct.name}
                  className="h-7 w-7 rounded object-cover flex-shrink-0"
                />
              ) : (
                <div className="h-7 w-7 rounded bg-slate-100 flex items-center justify-center flex-shrink-0">
                  <Package className="h-4 w-4 text-slate-400" />
                </div>
              )}
              <span className="flex-1 truncate">{selectedProduct.name}</span>
              <span className="text-slate-400 text-xs">▾</span>
            </button>
          ) : (
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <Input
                autoFocus={open}
                className="pl-7 text-sm"
                placeholder="Search products…"
                value={searchText}
                onChange={(e) => { onSearchChange(e.target.value); setOpen(true); }}
                onFocus={() => setOpen(true)}
              />
            </div>
          )}

          {/* Dropdown */}
          {open && (
            <ul className="absolute z-50 w-72 bg-white border border-slate-200 rounded-md shadow-lg mt-1 max-h-56 overflow-y-auto">
              {filtered.length === 0 && (
                <li className="px-3 py-2 text-sm text-slate-400">No products found</li>
              )}
              {filtered.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center gap-2 px-2 py-2 cursor-pointer hover:bg-indigo-50 text-sm"
                  onMouseDown={() => {
                    onSelect(p);
                    setOpen(false);
                  }}
                >
                  {p.image_url ? (
                    <img
                      src={p.image_url}
                      alt={p.name}
                      className="h-8 w-8 rounded object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded bg-slate-100 flex items-center justify-center flex-shrink-0">
                      <Package className="h-4 w-4 text-slate-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-medium">{p.name}</p>
                    <p className="text-xs text-slate-500">
                      ${parseFloat(p.base_price || p.price || 0).toFixed(2)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Size selector */}
      <div className="space-y-1">
        <Label className="text-xs">Size</Label>
        <select
          className="w-full border border-slate-300 rounded-md px-2 py-1.5 text-sm bg-white"
          value={selectedSize}
          onChange={(e) => onSizeChange(e.target.value)}
          disabled={!value}
        >
          <option value="">No size</option>
          {sizes.map((s) => {
            const sizeLabel = s.size || s;
            const adj = parseFloat(s.price_adjustment || 0);
            const suffix = adj !== 0 ? ` (${adj > 0 ? '+' : ''}$${adj.toFixed(2)})` : '';
            return (
              <option key={sizeLabel} value={sizeLabel}>
                {sizeLabel}{suffix}
              </option>
            );
          })}
        </select>
      </div>
    </div>
  );
};

// ── Main dialog ────────────────────────────────────────────────────────────
const CreateOrderDialog = ({ open, onOpenChange, onSave }) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [isLoading, setIsLoading] = useState(false);

  // Customer search
  const [customerResults, setCustomerResults] = useState([]);
  const [customerSearching, setCustomerSearching] = useState(false);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const customerSearchTimer = useRef(null);

  // Catalog data
  const [products, setProducts] = useState([]);
  const [voucherTypes, setVoucherTypes] = useState([]);

  // Shipping rates
  const [shippingRates, setShippingRates] = useState([]);
  const [shippingRatesLoading, setShippingRatesLoading] = useState(false);
  const [selectedRateId, setSelectedRateId] = useState(null);

  // Reset on open/close
  useEffect(() => {
    if (open) {
      setFormData(INITIAL_FORM);
      setCustomerResults([]);
      setShowCustomerDropdown(false);
      setShippingRates([]);
      setSelectedRateId(null);
    }
  }, [open]);

  // Load catalog data once when dialog opens
  useEffect(() => {
    if (!open) return;
    getProducts({ limit: 200 })
      .then((data) => setProducts(data.products || data || []))
      .catch(() => {});
    getGiftVoucherTypes()
      .then((data) => setVoucherTypes(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, [open]);

  // ── Customer search ────────────────────────────────────────────────
  const handleCustomerSearchChange = (e) => {
    const value = e.target.value;
    setFormData((prev) => ({ ...prev, customerSearch: value, customer_id: null }));
    setShowCustomerDropdown(true);
    if (customerSearchTimer.current) clearTimeout(customerSearchTimer.current);
    if (!value.trim()) {
      setCustomerResults([]);
      setShowCustomerDropdown(false);
      return;
    }
    customerSearchTimer.current = setTimeout(async () => {
      setCustomerSearching(true);
      try {
        const data = await getCustomers({ search: value, limit: 8 });
        setCustomerResults(data.customers || []);
      } catch {
        setCustomerResults([]);
      } finally {
        setCustomerSearching(false);
      }
    }, 300);
  };

  const selectCustomer = (customer) => {
    setFormData((prev) => ({
      ...prev,
      customerSearch: `${customer.first_name} ${customer.last_name} (${customer.email})`,
      customer_id: customer.id,
      shipping_first_name: customer.first_name || '',
      shipping_last_name: customer.last_name || '',
      shipping_email: customer.email || '',
      shipping_phone: customer.phone || '',
      shipping_address: customer.address || '',
      shipping_city: customer.city || '',
      shipping_state: customer.state || '',
      shipping_postal_code: customer.postal_code || '',
      shipping_country: customer.country || '',
    }));
    setShowCustomerDropdown(false);
    setCustomerResults([]);
  };

  // ── Google address autocomplete ────────────────────────────────────
  const handleAddressSelect = (addressData) => {
    setFormData((prev) => ({
      ...prev,
      shipping_address: addressData.street1 || addressData.address || '',
      shipping_city: addressData.city || '',
      shipping_state: addressData.state || '',
      shipping_postal_code: addressData.zip || '',
      shipping_country: resolveCountryName(addressData.country),
    }));
    setShippingRates([]);
    setSelectedRateId(null);
  };

  // ── Field helpers ──────────────────────────────────────────────────
  const setField = (field, value) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  // ── Item helpers ───────────────────────────────────────────────────
  const addItem = () =>
    setFormData((prev) => ({ ...prev, items: [...prev.items, emptyItem()] }));

  const removeItem = (index) =>
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));

  const updateItem = (index, field, value) =>
    setFormData((prev) => ({
      ...prev,
      items: prev.items.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ),
    }));

  const handleItemTypeChange = (index, type) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.map((item, i) =>
        i === index ? { ...emptyItem(), type } : item
      ),
    }));
  };

  // Select a product → auto-fill price
  const handleProductSelect = (index, product) => {
    const basePrice = parseFloat(product.base_price || product.price || 0);
    setFormData((prev) => ({
      ...prev,
      items: prev.items.map((item, i) =>
        i === index
          ? {
              ...item,
              product_id: String(product.id),
              productSearch: product.name,
              size: '',
              price: basePrice > 0 ? basePrice : item.price,
            }
          : item
      ),
    }));
  };

  // Change size → recalculate price with adjustment
  const handleSizeChange = (index, sizeValue) => {
    const item = formData.items[index];
    const product = products.find((p) => String(p.id) === String(item.product_id));
    const sizeObj = product?.product_sizes?.find((s) => (s.size || s) === sizeValue);
    const basePrice = parseFloat(product?.base_price || product?.price || 0);
    const adjustment = parseFloat(sizeObj?.price_adjustment || 0);
    const finalPrice = basePrice + adjustment;

    setFormData((prev) => ({
      ...prev,
      items: prev.items.map((it, i) =>
        i === index
          ? { ...it, size: sizeValue, price: finalPrice > 0 ? finalPrice : it.price }
          : it
      ),
    }));
  };

  const getProductSizes = (productId) => {
    const product = products.find((p) => String(p.id) === String(productId));
    return product?.product_sizes || [];
  };

  // ── Shipping rate calculation ──────────────────────────────────────
  const fetchShippingRates = async () => {
    if (!formData.shipping_country) {
      toast({
        title: 'Address Required',
        description: 'Please fill in at least the destination country before fetching rates.',
        variant: 'destructive',
      });
      return;
    }
    if (formData.items.length === 0) {
      toast({
        title: 'Items Required',
        description: 'Add at least one item before fetching shipping rates.',
        variant: 'destructive',
      });
      return;
    }

    setShippingRatesLoading(true);
    setShippingRates([]);
    setSelectedRateId(null);

    try {
      // Build items array — include product items for dimension lookup,
      // fall back to a single default item if none have a product_id
      const productItems = formData.items
        .filter((item) => item.type === 'Product' && item.product_id)
        .map((item) => ({
          product_id: item.product_id,
          quantity: parseInt(item.quantity) || 1,
          size: item.size || null,
        }));

      const itemsPayload =
        productItems.length > 0 ? productItems : [{ quantity: formData.items.length || 1 }];

      // Use adminApiClient directly — api.post returns data without a .data wrapper
      // (adminApiClient wraps as { success, data })
      const response = await adminApiClient.post('/shipping/rates', {
        address: {
          street1: formData.shipping_address,
          city: formData.shipping_city,
          state: formData.shipping_state,
          zip: formData.shipping_postal_code,
          country: formData.shipping_country,
        },
        items: itemsPayload,
      });

      const rates = response?.data?.rates;

      if (rates && rates.length > 0) {
        setShippingRates(rates);
      } else {
        toast({
          title: 'No Rates Found',
          description: 'No shipping rates were returned for this destination. Enter the cost manually.',
          variant: 'destructive',
        });
      }
    } catch (err) {
      toast({
        title: 'Rate Fetch Failed',
        description: err.message || 'Could not fetch shipping rates.',
        variant: 'destructive',
      });
    } finally {
      setShippingRatesLoading(false);
    }
  };

  const selectShippingRate = (rate) => {
    setSelectedRateId(rate.id);
    setField('base_shipping', rate.cost ?? rate.amount ?? 0);
  };

  // ── Totals ─────────────────────────────────────────────────────────
  const subtotal = formData.items.reduce(
    (sum, item) =>
      sum + (parseFloat(item.price) || 0) * (parseInt(item.quantity) || 0),
    0
  );
  const total = subtotal + (parseFloat(formData.base_shipping) || 0);

  // ── Submit ─────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.items.length === 0) {
      toast({ title: 'Validation Error', description: 'Add at least one item.', variant: 'destructive' });
      return;
    }
    if (!formData.shipping_email) {
      toast({ title: 'Validation Error', description: 'Shipping email is required.', variant: 'destructive' });
      return;
    }
    for (const item of formData.items) {
      if (!parseFloat(item.price) || parseFloat(item.price) <= 0) {
        toast({
          title: 'Validation Error',
          description: 'All items must have a price greater than 0.',
          variant: 'destructive',
        });
        return;
      }
    }

    setIsLoading(true);
    try {
      const orderNumber = `ORD-${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 5)
        .toUpperCase()}`;
      const base_subtotal = subtotal;
      const base_shipping = parseFloat(formData.base_shipping) || 0;
      const base_total = base_subtotal + base_shipping;

      const payload = {
        order_number: orderNumber,
        customer_id: formData.customer_id || null,
        status: 'pending',
        payment_status: formData.payment_status,
        payment_method: formData.payment_method,
        base_subtotal,
        base_shipping,
        base_total,
        shipping_email: formData.shipping_email,
        shipping_phone: formData.shipping_phone,
        shipping_first_name: formData.shipping_first_name,
        shipping_last_name: formData.shipping_last_name,
        shipping_address: formData.shipping_address,
        shipping_city: formData.shipping_city,
        shipping_state: formData.shipping_state,
        shipping_postal_code: formData.shipping_postal_code,
        shipping_country: formData.shipping_country,
        notes: formData.notes,
        items: formData.items.map((item) => ({
          product_id: item.type === 'Product' && item.product_id ? item.product_id : null,
          gift_voucher_type_id:
            item.type === 'Gift Voucher' && item.gift_voucher_type_id
              ? item.gift_voucher_type_id
              : null,
          custom_item_name: item.type === 'Custom Item' ? item.custom_item_name : null,
          size: item.size || null,
          quantity: parseInt(item.quantity) || 1,
          price: parseFloat(item.price),
        })),
      };

      await createOrder(payload);
      toast({ title: 'Success', description: 'Order created successfully.' });
      onOpenChange(false);
      onSave();
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create order.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl bg-white shadow-2xl rounded-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold text-slate-800">
            Create Order
          </DialogTitle>
          <DialogDescription className="text-slate-600">
            Manually record an offline or in-person order.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit}
          className="space-y-6 py-4 px-1 max-h-[75vh] overflow-y-auto"
        >
          {/* ── Customer ──────────────────────────────────────────── */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide border-b pb-1">
              Customer
            </h3>

            {/* Search existing customer */}
            <div className="relative space-y-1">
              <Label>Search Existing Customer</Label>
              <Input
                placeholder="Type name or email…"
                value={formData.customerSearch}
                onChange={handleCustomerSearchChange}
                onFocus={() => customerResults.length > 0 && setShowCustomerDropdown(true)}
                autoComplete="off"
              />
              {customerSearching && (
                <p className="text-xs text-slate-500 flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" /> Searching…
                </p>
              )}
              {showCustomerDropdown && customerResults.length > 0 && (
                <ul className="absolute z-50 w-full bg-white border border-slate-200 rounded-md shadow-lg mt-1 max-h-48 overflow-y-auto">
                  {customerResults.map((c) => (
                    <li
                      key={c.id}
                      className="px-3 py-2 cursor-pointer hover:bg-slate-100 text-sm"
                      onMouseDown={() => selectCustomer(c)}
                    >
                      <span className="font-medium">
                        {c.first_name} {c.last_name}
                      </span>
                      <span className="text-slate-500 ml-2">{c.email}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Name + contact */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>First Name</Label>
                <Input
                  value={formData.shipping_first_name}
                  onChange={(e) => setField('shipping_first_name', e.target.value)}
                  placeholder="First name"
                />
              </div>
              <div className="space-y-1">
                <Label>Last Name</Label>
                <Input
                  value={formData.shipping_last_name}
                  onChange={(e) => setField('shipping_last_name', e.target.value)}
                  placeholder="Last name"
                />
              </div>
              <div className="space-y-1">
                <Label>
                  Email <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="email"
                  value={formData.shipping_email}
                  onChange={(e) => setField('shipping_email', e.target.value)}
                  placeholder="customer@email.com"
                  required
                />
              </div>
              <div className="space-y-1">
                <Label>Phone</Label>
                <Input
                  value={formData.shipping_phone}
                  onChange={(e) => setField('shipping_phone', e.target.value)}
                  placeholder="+1 555 000 0000"
                />
              </div>
            </div>

            {/* Google address autocomplete */}
            <GoogleAddressAutocomplete
              value={formData.shipping_address}
              onChange={(value) => {
                setField('shipping_address', value);
                if (shippingRates.length > 0) {
                  setShippingRates([]);
                  setSelectedRateId(null);
                }
              }}
              onAddressSelect={handleAddressSelect}
              placeholder="Start typing the shipping address…"
              label="Address"
            />

            {/* City / State / Postal / Country */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>City</Label>
                <Input
                  value={formData.shipping_city}
                  onChange={(e) => setField('shipping_city', e.target.value)}
                  placeholder="City"
                />
              </div>
              <div className="space-y-1">
                <Label>State / Region</Label>
                <Input
                  value={formData.shipping_state}
                  onChange={(e) => setField('shipping_state', e.target.value)}
                  placeholder="State"
                />
              </div>
              <div className="space-y-1">
                <Label>Postal Code</Label>
                <Input
                  value={formData.shipping_postal_code}
                  onChange={(e) => setField('shipping_postal_code', e.target.value)}
                  placeholder="Postal code"
                />
              </div>
              <div className="space-y-1">
                <Label>Country</Label>
                {/* Plain single-select — avoids the checkbox / multi-select confusion */}
                <select
                  className="w-full border border-slate-300 rounded-md px-2 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={formData.shipping_country}
                  onChange={(e) => {
                    setField('shipping_country', e.target.value);
                    setShippingRates([]);
                    setSelectedRateId(null);
                  }}
                >
                  <option value="">Select country…</option>
                  {countries.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* ── Order Items ────────────────────────────────────────── */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b pb-1">
              <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
                Order Items
              </h3>
              <Button type="button" variant="outline" size="sm" onClick={addItem}>
                <Plus className="h-4 w-4 mr-1" /> Add Item
              </Button>
            </div>

            {formData.items.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-4">
                No items yet. Click "Add Item" to start.
              </p>
            )}

            {formData.items.map((item, index) => (
              <div
                key={index}
                className="border border-slate-200 rounded-lg p-3 space-y-3 bg-slate-50"
              >
                {/* Type + remove */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 space-y-1">
                    <Label className="text-xs">Type</Label>
                    <select
                      className="w-full border border-slate-300 rounded-md px-2 py-1.5 text-sm bg-white"
                      value={item.type}
                      onChange={(e) => handleItemTypeChange(index, e.target.value)}
                    >
                      {ITEM_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="mt-5 text-red-500 hover:text-red-700 hover:bg-red-50"
                    onClick={() => removeItem(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                {/* Product picker with image + search */}
                {item.type === 'Product' && (
                  <ProductPicker
                    products={products}
                    value={item.product_id}
                    searchText={item.productSearch}
                    onSearchChange={(text) => updateItem(index, 'productSearch', text)}
                    onSelect={(product) => handleProductSelect(index, product)}
                    sizes={getProductSizes(item.product_id)}
                    selectedSize={item.size}
                    onSizeChange={(sizeValue) => handleSizeChange(index, sizeValue)}
                  />
                )}

                {item.type === 'Gift Voucher' && (
                  <div className="space-y-1">
                    <Label className="text-xs">Gift Voucher Type</Label>
                    <select
                      className="w-full border border-slate-300 rounded-md px-2 py-1.5 text-sm bg-white"
                      value={item.gift_voucher_type_id}
                      onChange={(e) =>
                        updateItem(index, 'gift_voucher_type_id', e.target.value)
                      }
                    >
                      <option value="">Select voucher type…</option>
                      {voucherTypes.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.name || `$${v.amount} Voucher`}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {item.type === 'Custom Item' && (
                  <div className="space-y-1">
                    <Label className="text-xs">Item Name</Label>
                    <Input
                      placeholder="e.g. Bespoke Wedding Dress"
                      value={item.custom_item_name}
                      onChange={(e) =>
                        updateItem(index, 'custom_item_name', e.target.value)
                      }
                    />
                  </div>
                )}

                {/* Quantity + price */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Quantity</Label>
                    <Input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Unit Price (USD)</Label>
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      placeholder="0.00"
                      value={item.price}
                      onChange={(e) => updateItem(index, 'price', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ))}

            {formData.items.length > 0 && (
              <div className="text-right text-sm text-slate-600">
                Subtotal:{' '}
                <span className="font-semibold text-slate-800">
                  ${subtotal.toFixed(2)}
                </span>
              </div>
            )}
          </div>

          {/* ── Payment ────────────────────────────────────────────── */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide border-b pb-1">
              Payment
            </h3>

            {/* Shipping cost + rate calculator */}
            <div className="space-y-3">
              <div className="flex items-end gap-3">
                <div className="flex-1 space-y-1">
                  <Label>Shipping Cost (USD)</Label>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={formData.base_shipping}
                    onChange={(e) => {
                      setField('base_shipping', e.target.value);
                      setSelectedRateId(null);
                    }}
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={fetchShippingRates}
                  disabled={shippingRatesLoading}
                  className="shrink-0"
                >
                  {shippingRatesLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Truck className="h-4 w-4 mr-2" />
                  )}
                  Get Rates
                </Button>
              </div>

              {/* Rate results */}
              {shippingRates.length > 0 && (
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide px-3 py-2 bg-slate-50 border-b border-slate-200">
                    Available Shipping Rates — click to apply
                  </p>
                  <ul className="divide-y divide-slate-100">
                    {shippingRates.map((rate) => {
                      const cost = rate.cost ?? rate.amount ?? 0;
                      const isSelected = selectedRateId === rate.id;
                      return (
                        <li
                          key={rate.id}
                          onClick={() => selectShippingRate(rate)}
                          className={`flex items-center justify-between px-3 py-2.5 cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-indigo-50 border-l-2 border-indigo-500'
                              : 'hover:bg-slate-50'
                          }`}
                        >
                          <div>
                            <p className="text-sm font-medium text-slate-800">
                              {rate.description || rate.service}
                            </p>
                            <p className="text-xs text-slate-500">
                              {rate.carrier}
                              {rate.estimatedDays ? ` · ${rate.estimatedDays} days` : ''}
                            </p>
                          </div>
                          <span className="text-sm font-semibold text-slate-800">
                            ${parseFloat(cost).toFixed(2)}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>

            {/* Total */}
            <div className="space-y-1">
              <Label>Total (USD)</Label>
              <Input
                readOnly
                value={`$${total.toFixed(2)}`}
                className="bg-slate-100 cursor-default font-semibold"
              />
            </div>

            {/* Method + status */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Payment Method</Label>
                <select
                  className="w-full border border-slate-300 rounded-md px-2 py-1.5 text-sm bg-white"
                  value={formData.payment_method}
                  onChange={(e) => setField('payment_method', e.target.value)}
                >
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m} value={m}>
                      {m === 'bank_transfer'
                        ? 'Bank Transfer'
                        : m.charAt(0).toUpperCase() + m.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <Label>Payment Status</Label>
                <div className="flex items-center gap-4 mt-2">
                  {['pending', 'paid'].map((status) => (
                    <label
                      key={status}
                      className="flex items-center gap-1.5 text-sm cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="payment_status"
                        value={status}
                        checked={formData.payment_status === status}
                        onChange={(e) => setField('payment_status', e.target.value)}
                        className="accent-indigo-600"
                      />
                      {status === 'pending' ? 'Unpaid' : 'Paid'}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-1">
              <Label>Internal Notes</Label>
              <textarea
                className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm bg-white resize-none"
                rows={3}
                placeholder="Optional notes for this order…"
                value={formData.notes}
                onChange={(e) => setField('notes', e.target.value)}
              />
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Creating…
                </>
              ) : (
                'Create Order'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateOrderDialog;
