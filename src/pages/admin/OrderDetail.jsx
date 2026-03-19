import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import { useCurrency } from '@/context/CurrencyContext';
import adminApiClient from '@/lib/services/adminApiClient';
import { generateOrderPDF, generateWaybillPDF } from '@/lib/pdf';
import {
  ArrowLeft,
  Download,
  Package,
  Truck,
  Clock,
  MapPin,
  User,
  FileText,
  CheckCircle,
  AlertCircle,
  Loader2,
  Copy,
  Calendar,
  RefreshCw,
  XCircle,
} from 'lucide-react';

// ─── helpers ──────────────────────────────────────────────────────────────────

const STATUS_COLORS = {
  pending:    'bg-yellow-100 text-yellow-800',
  confirmed:  'bg-indigo-100 text-indigo-800',
  processing: 'bg-blue-100 text-blue-800',
  shipped:    'bg-purple-100 text-purple-800',
  delivered:  'bg-green-100 text-green-800',
  cancelled:  'bg-red-100 text-red-800',
};

const getStatusColor = (s) => STATUS_COLORS[s?.toLowerCase()] || 'bg-gray-100 text-gray-800';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3003/api';

function getImageUrl(imagePath) {
  if (!imagePath) return null;
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) return imagePath;
  return `${API_BASE.replace('/api', '')}/api/images/${imagePath}`;
}

// ─── OrderDetail ──────────────────────────────────────────────────────────────

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { formatPrice, exchangeRate } = useCurrency();

  // Core order state
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusUpdating, setStatusUpdating] = useState(false);

  // Waybill tab state
  const [rates, setRates] = useState([]);
  const [selectedRate, setSelectedRate] = useState(null);
  const [ratesLoading, setRatesLoading] = useState(false);
  const [waybillLoading, setWaybillLoading] = useState(false);
  const [waybill, setWaybill] = useState(null); // populated after generation
  const [pickupLoading, setPickupLoading] = useState(false);
  const [pickupDate, setPickupDate] = useState('');
  const [pickupTimeFrom, setPickupTimeFrom] = useState('09:00');
  const [pickupTimeTo, setPickupTimeTo] = useState('17:00');
  const [pickupConfirmation, setPickupConfirmation] = useState(null);
  const [voidLoading, setVoidLoading] = useState(false);

  // Tracking tab state
  const [trackingData, setTrackingData] = useState(null);
  const [trackingLoading, setTrackingLoading] = useState(false);

  // ─── fetch order ────────────────────────────────────────────────────────────

  const fetchOrder = useCallback(async () => {
    try {
      setLoading(true);
      const res = await adminApiClient.get(`/orders/${id}`);
      const fetchedOrder = res.data;
      setOrder(fetchedOrder);

      // Restore persisted waybill label content from localStorage if available
      if (fetchedOrder?.tracking_number) {
        const stored = localStorage.getItem(`waybill_label_${fetchedOrder.tracking_number}`);
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            setWaybill(parsed);
          } catch (_) { /* ignore */ }
        }
      }
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchOrder(); }, [fetchOrder]);

  // ─── currency helpers ────────────────────────────────────────────────────────

  const calcGHS = (usd, storedGhs, orderRate) => {
    if (storedGhs > 0 && orderRate && usd > 0) {
      const expected = usd * orderRate;
      if (Math.abs(expected - storedGhs) / expected < 0.05) return storedGhs;
      return expected;
    }
    if (storedGhs > 0) return storedGhs;
    return usd * (orderRate || exchangeRate);
  };

  // ─── status update ───────────────────────────────────────────────────────────

  const handleStatusChange = async (newStatus) => {
    try {
      setStatusUpdating(true);
      await adminApiClient.put(`/orders/${order.id}/status`, { status: newStatus });
      setOrder(prev => ({ ...prev, status: newStatus }));
      toast({ title: 'Status updated', description: `Order marked as ${newStatus}` });
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setStatusUpdating(false);
    }
  };

  // ─── waybill: get rates ──────────────────────────────────────────────────────

  const fetchRates = async () => {
    try {
      setRatesLoading(true);
      setRates([]);
      const res = await adminApiClient.post('/shipping/rates', {
        orderId: order.id,
        address: {
          name:    `${order.shipping_first_name || ''} ${order.shipping_last_name || ''}`.trim(),
          street1: order.shipping_address,
          city:    order.shipping_city,
          state:   order.shipping_state,
          zip:     order.shipping_postal_code,
          country: order.shipping_country,
        },
      });
      const fetchedRates = res.data.rates || [];
      setRates(fetchedRates);
      if (fetchedRates.length === 0) {
        toast({ title: 'No rates found', description: 'No shipping options available for this address.', variant: 'destructive' });
      } else {
        setSelectedRate(fetchedRates[0]);
      }
    } catch (err) {
      toast({ title: 'Error fetching rates', description: err.message, variant: 'destructive' });
    } finally {
      setRatesLoading(false);
    }
  };

  // ─── waybill: generate ───────────────────────────────────────────────────────

  const generateWaybill = async () => {
    if (!selectedRate) {
      toast({ title: 'Select a rate first', variant: 'destructive' });
      return;
    }
    try {
      setWaybillLoading(true);
      const res = await adminApiClient.post('/shipping/label', {
        orderId: order.id,
        rateId: selectedRate.id,
      });
      const label = res.data.label;
      setWaybill(label);
      // Persist label so it survives page refreshes
      if (label.trackingNumber) {
        localStorage.setItem(`waybill_label_${label.trackingNumber}`, JSON.stringify(label));
      }
      setOrder(prev => ({
        ...prev,
        tracking_number:  label.trackingNumber,
        shipping_carrier: label.carrier,
        shipping_service: label.service,
        status:           'processing',
      }));
      toast({ title: 'Waybill generated', description: `AWB: ${label.trackingNumber}` });
    } catch (err) {
      toast({ title: 'Failed to generate waybill', description: err.message, variant: 'destructive' });
    } finally {
      setWaybillLoading(false);
    }
  };

  // ─── waybill: download PDF ───────────────────────────────────────────────────

  const downloadLabel = () => {
    const content = waybill?.labelContent;
    if (!content) {
      toast({ title: 'No PDF available', description: 'Label PDF was not returned by DHL.', variant: 'destructive' });
      return;
    }
    const binary = atob(content);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const blob = new Blob([bytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `waybill-${waybill.trackingNumber}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ─── waybill: schedule pickup ────────────────────────────────────────────────

  const schedulePickup = async () => {
    if (!pickupDate) {
      toast({ title: 'Select a pickup date', variant: 'destructive' });
      return;
    }
    const trackingNumber = order.tracking_number;
    if (!trackingNumber) {
      toast({ title: 'No waybill found', description: 'Generate a waybill first.', variant: 'destructive' });
      return;
    }
    try {
      setPickupLoading(true);
      const res = await adminApiClient.post('/shipping/pickup', {
        trackingNumbers: [trackingNumber],
        pickupDate,
        pickupTimeFrom,
        pickupTimeTo,
      });
      setPickupConfirmation(res.data.dispatchConfirmationNumber);
      toast({ title: 'Pickup scheduled', description: `Confirmation: ${res.data.dispatchConfirmationNumber}` });
    } catch (err) {
      toast({ title: 'Failed to schedule pickup', description: err.message, variant: 'destructive' });
    } finally {
      setPickupLoading(false);
    }
  };

  // ─── waybill: void/cancel ────────────────────────────────────────────────────

  const voidWaybill = async () => {
    if (!window.confirm(`Void waybill ${order.tracking_number}? This cannot be undone.`)) return;
    try {
      setVoidLoading(true);
      const voidedAWB = order.tracking_number;
      await adminApiClient.delete(`/shipping/shipments/${voidedAWB}`);
      localStorage.removeItem(`waybill_label_${voidedAWB}`);
      setOrder(prev => ({
        ...prev,
        tracking_number:  null,
        shipping_carrier: null,
        shipping_service: null,
        status:           'processing',
      }));
      setWaybill(null);
      setRates([]);
      setSelectedRate(null);
      setPickupConfirmation(null);
      toast({ title: 'Waybill voided' });
    } catch (err) {
      toast({ title: 'Failed to void waybill', description: err.message, variant: 'destructive' });
    } finally {
      setVoidLoading(false);
    }
  };

  // ─── tracking: fetch events ──────────────────────────────────────────────────

  const fetchTracking = async () => {
    const trackingNumber = order?.tracking_number;
    if (!trackingNumber) {
      toast({ title: 'No tracking number available', variant: 'destructive' });
      return;
    }
    try {
      setTrackingLoading(true);
      const res = await adminApiClient.get(`/shipping/track/${trackingNumber}`);
      setTrackingData(res.data.tracking);
    } catch (err) {
      toast({ title: 'Tracking error', description: err.message, variant: 'destructive' });
    } finally {
      setTrackingLoading(false);
    }
  };

  // ─── copy to clipboard ───────────────────────────────────────────────────────

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied to clipboard' });
  };

  // ─── render: loading / not found ────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-8 text-center text-gray-500">
        <AlertCircle className="w-12 h-12 mx-auto mb-3" />
        <p className="text-lg font-medium">Order not found</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/admin/orders')}>
          Back to Orders
        </Button>
      </div>
    );
  }

  // ─── currency values ─────────────────────────────────────────────────────────

  const rate     = order.exchange_rate;
  const totalUSD = parseFloat(order.base_total    || order.total_amount    || 0);
  const totalGHS = calcGHS(totalUSD, parseFloat(order.base_total_ghs    || 0), rate);
  const subUSD   = parseFloat(order.base_subtotal || order.subtotal_amount || 0);
  const subGHS   = calcGHS(subUSD, parseFloat(order.base_subtotal_ghs || 0), rate);
  const shipUSD  = parseFloat(order.base_shipping || order.shipping_amount  || 0);
  const shipGHS  = calcGHS(shipUSD, parseFloat(order.base_shipping_ghs || 0), rate);
  const discUSD  = parseFloat(order.coupon_discount_amount || 0);
  const discGHS  = calcGHS(discUSD, parseFloat(order.coupon_discount_amount_ghs || 0), rate);

  // Current waybill data: from state (just generated) or from order (pre-existing)
  const activeWaybill = waybill?.waybillData || null;
  const hasWaybill    = !!order.tracking_number;

  // Tomorrow's date as default pickup date
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  // ─── render ──────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 max-w-6xl mx-auto">

      {/* ── Page header ── */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/admin/orders')} className="text-gray-500 hover:text-gray-900">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Orders
          </Button>
          <span className="text-gray-300">/</span>
          <h1 className="text-xl font-semibold text-gray-900">Order {order.order_number}</h1>
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
            {order.status?.charAt(0).toUpperCase() + order.status?.slice(1)}
          </span>
          {order.tracking_number && (
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 flex items-center gap-1">
              <Package className="w-3 h-3" />
              Waybill Issued
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Status dropdown */}
          <select
            value={order.status || 'pending'}
            onChange={(e) => handleStatusChange(e.target.value)}
            disabled={statusUpdating}
            className="border border-gray-300 rounded px-3 py-1.5 text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <Button variant="outline" size="sm" onClick={() => generateOrderPDF(order)} className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            Invoice
          </Button>
        </div>
      </div>

      {/* ── Tabs ── */}
      <Tabs defaultValue="info">
        <TabsList className="mb-6">
          <TabsTrigger value="info" className="flex items-center gap-1.5">
            <FileText className="w-4 h-4" />
            Order Info
          </TabsTrigger>
          <TabsTrigger value="waybill" className="flex items-center gap-1.5">
            <Package className="w-4 h-4" />
            Waybill
            {hasWaybill && <span className="ml-1 w-2 h-2 rounded-full bg-green-500 inline-block" />}
          </TabsTrigger>
          <TabsTrigger value="tracking" className="flex items-center gap-1.5">
            <Truck className="w-4 h-4" />
            Tracking
          </TabsTrigger>
          <TabsTrigger value="timeline" className="flex items-center gap-1.5">
            <Clock className="w-4 h-4" />
            Timeline
          </TabsTrigger>
        </TabsList>

        {/* ══════════════════════════════════════════════════════════════════════
            TAB: ORDER INFO
        ══════════════════════════════════════════════════════════════════════ */}
        <TabsContent value="info">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Customer Photo */}
            {order.customer_photo_url && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    Customer Photo
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <img
                    src={order.customer_photo_url}
                    alt="Customer photo"
                    className="w-40 h-52 object-cover rounded-lg border"
                  />
                </CardContent>
              </Card>
            )}

            {/* Items */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  Order Items
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {(order.items || order.order_items)?.map((item) => {
                  const itemUSD = Number(item.price) || 0;
                  const itemGHS = calcGHS(itemUSD, item.price_ghs, rate);
                  const imgUrl  = getImageUrl(item.product_image || item.products?.image_url);
                  return (
                    <div key={item.id} className="flex items-start gap-3">
                      {imgUrl ? (
                        <img src={imgUrl} alt={item.product_name} className="w-14 h-14 object-cover rounded border border-gray-200 flex-shrink-0" />
                      ) : (
                        <div className="w-14 h-14 bg-gray-100 rounded border border-gray-200 flex items-center justify-center text-gray-400 text-xs flex-shrink-0">
                          No Image
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-gray-900 text-sm">
                          {item.product_name || item.products?.name || 'Product'}
                        </p>
                        <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                        {item.size && <p className="text-xs text-gray-500">Size: {item.size}</p>}
                        <p className="text-xs text-gray-700 mt-0.5">
                          {formatPrice(itemUSD, false, 'USD')} / {formatPrice(itemGHS, false, 'GHS', true)}
                        </p>
                      </div>
                    </div>
                  );
                })}

                <Separator />

                {/* Financial summary */}
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span>{formatPrice(subUSD, false, 'USD')} <span className="text-gray-400 text-xs">({formatPrice(subGHS, false, 'GHS', true)})</span></span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Shipping</span>
                    <span>{formatPrice(shipUSD, false, 'USD')} <span className="text-gray-400 text-xs">({formatPrice(shipGHS, false, 'GHS', true)})</span></span>
                  </div>
                  {discUSD > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount</span>
                      <span>− {formatPrice(discUSD, false, 'USD')} <span className="text-green-400 text-xs">({formatPrice(discGHS, false, 'GHS', true)})</span></span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between font-semibold text-gray-900">
                    <span>Total</span>
                    <span>{formatPrice(totalUSD, false, 'USD')} <span className="text-gray-500 font-normal text-xs">({formatPrice(totalGHS, false, 'GHS', true)})</span></span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Customer + Shipping address */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Customer
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-1">
                  <p className="font-medium text-gray-900">
                    {order.shipping_first_name || order.customers?.first_name} {order.shipping_last_name || order.customers?.last_name}
                  </p>
                  <p className="text-gray-500">{order.customer_id ? 'Registered Customer' : 'Guest'}</p>
                  <p className="text-gray-700">{order.shipping_email || order.customers?.email}</p>
                  <p className="text-gray-700">{order.shipping_phone}</p>
                  <div className="mt-2 pt-2 border-t border-gray-100 space-y-0.5">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Payment</p>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        order.payment_status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {order.payment_status?.charAt(0).toUpperCase() + order.payment_status?.slice(1) || 'N/A'}
                      </span>
                      <span className="text-xs text-gray-400">{order.display_currency} / {order.payment_currency}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Shipping Address
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-0.5 text-gray-700">
                  <p className="font-medium">{order.shipping_first_name} {order.shipping_last_name}</p>
                  <p>{order.shipping_address}</p>
                  <p>{order.shipping_city}{order.shipping_state ? `, ${order.shipping_state}` : ''} {order.shipping_postal_code}</p>
                  <p className="font-medium">{order.shipping_country}</p>
                </CardContent>
              </Card>

              {/* Order metadata */}
              <Card>
                <CardContent className="pt-4 text-xs text-gray-500 space-y-1">
                  <p>Placed: {new Date(order.created_at).toLocaleString()}</p>
                  {order.exchange_rate && <p>Exchange rate: {order.exchange_rate.toFixed(2)} GHS/USD</p>}
                  <p>Order ID: <span className="font-mono">{order.id}</span></p>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* ══════════════════════════════════════════════════════════════════════
            TAB: WAYBILL
        ══════════════════════════════════════════════════════════════════════ */}
        <TabsContent value="waybill">
          {hasWaybill ? (
            /* ── Waybill already exists ── */
            <div className="space-y-6">
              <Card className="border-green-200 bg-green-50">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2 text-green-800">
                    <CheckCircle className="w-5 h-5" />
                    Waybill Issued
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* AWB number row */}
                  <div className="flex flex-wrap items-center gap-3">
                    <div>
                      <p className="text-xs text-green-600 font-medium uppercase tracking-wide">AWB Number</p>
                      <p className="text-2xl font-mono font-bold text-green-900">{order.tracking_number}</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => copyToClipboard(order.tracking_number)} className="border-green-300 text-green-700 hover:bg-green-100">
                      <Copy className="w-3.5 h-3.5 mr-1" /> Copy
                    </Button>
                  </div>

                  {/* Download buttons — always visible */}
                  <div className="flex flex-wrap gap-2 pt-1">
                    <Button
                      onClick={() => generateWaybillPDF(order, activeWaybill?.sender || {})}
                      className="bg-green-700 hover:bg-green-800 text-white flex items-center gap-2"
                    >
                      <FileText className="w-4 h-4" />
                      Download Waybill PDF
                    </Button>

                    {waybill?.labelContent ? (
                      <Button
                        variant="outline"
                        onClick={downloadLabel}
                        className="border-green-400 text-green-800 hover:bg-green-100 flex items-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        Download DHL Label
                      </Button>
                    ) : (
                      <div className="flex items-center gap-2 px-3 py-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-700">
                        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                        DHL label PDF not available — regenerate waybill to get it
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Waybill details grid */}
              {activeWaybill && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader><CardTitle className="text-sm text-gray-500 uppercase tracking-wide">Sender</CardTitle></CardHeader>
                    <CardContent className="text-sm space-y-0.5">
                      <p className="font-medium">{activeWaybill.sender.name}</p>
                      <p className="text-gray-600">{activeWaybill.sender.address}</p>
                      <p className="text-gray-600">{activeWaybill.sender.city}</p>
                      <p className="text-gray-600">{activeWaybill.sender.country} {activeWaybill.sender.zip}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader><CardTitle className="text-sm text-gray-500 uppercase tracking-wide">Receiver</CardTitle></CardHeader>
                    <CardContent className="text-sm space-y-0.5">
                      <p className="font-medium">{activeWaybill.receiver.name}</p>
                      <p className="text-gray-600">{activeWaybill.receiver.address}</p>
                      <p className="text-gray-600">{activeWaybill.receiver.city}{activeWaybill.receiver.state ? `, ${activeWaybill.receiver.state}` : ''}</p>
                      <p className="text-gray-600">{activeWaybill.receiver.country} {activeWaybill.receiver.zip}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader><CardTitle className="text-sm text-gray-500 uppercase tracking-wide">Package & Service</CardTitle></CardHeader>
                    <CardContent className="text-sm space-y-1">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Weight</span>
                        <span className="font-medium">{activeWaybill.package.weightKg} kg</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Dimensions</span>
                        <span className="font-medium">{activeWaybill.package.lengthCm} × {activeWaybill.package.widthCm} × {activeWaybill.package.heightCm} cm</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Service</span>
                        <span className="font-medium">{activeWaybill.service}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Type</span>
                        <span className="font-medium">{activeWaybill.isDomestic ? 'Domestic' : 'International'}</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              <Separator />

              {/* Schedule pickup section */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Schedule DHL Pickup
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {pickupConfirmation ? (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm font-medium text-blue-800">Pickup Scheduled</p>
                      <p className="text-xs text-blue-600 mt-1">Confirmation: <span className="font-mono font-semibold">{pickupConfirmation}</span></p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <Label className="text-xs font-medium text-gray-600">Pickup Date</Label>
                          <Input
                            type="date"
                            value={pickupDate || tomorrowStr}
                            min={tomorrowStr}
                            onChange={(e) => setPickupDate(e.target.value)}
                            className="mt-1 text-sm"
                          />
                        </div>
                        <div>
                          <Label className="text-xs font-medium text-gray-600">Ready From</Label>
                          <Input type="time" value={pickupTimeFrom} onChange={(e) => setPickupTimeFrom(e.target.value)} className="mt-1 text-sm" />
                        </div>
                        <div>
                          <Label className="text-xs font-medium text-gray-600">Close By</Label>
                          <Input type="time" value={pickupTimeTo} onChange={(e) => setPickupTimeTo(e.target.value)} className="mt-1 text-sm" />
                        </div>
                      </div>
                      <Button onClick={schedulePickup} disabled={pickupLoading} className="bg-blue-600 hover:bg-blue-700 text-white">
                        {pickupLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Calendar className="w-4 h-4 mr-2" />}
                        Schedule Pickup
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Void waybill */}
              <Card className="border-red-200">
                <CardHeader>
                  <CardTitle className="text-base text-red-700 flex items-center gap-2">
                    <XCircle className="w-4 h-4" />
                    Void Waybill
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-500 mb-3">
                    This will cancel the DHL shipment and clear the tracking number. Only void if the waybill was created in error.
                  </p>
                  <Button
                    variant="outline"
                    onClick={voidWaybill}
                    disabled={voidLoading}
                    className="border-red-300 text-red-700 hover:bg-red-50"
                  >
                    {voidLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <XCircle className="w-4 h-4 mr-2" />}
                    Void Waybill
                  </Button>
                </CardContent>
              </Card>
            </div>
          ) : (
            /* ── Generate new waybill ── */
            <div className="space-y-6 max-w-2xl">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Generate DHL Waybill</CardTitle>
                  <p className="text-sm text-gray-500">Fetch shipping rates, select a service, then generate the waybill.</p>
                </CardHeader>
                <CardContent className="space-y-6">

                  {/* Destination summary */}
                  <div className="p-3 bg-gray-50 rounded-lg text-sm">
                    <p className="font-medium text-gray-700 mb-1">Shipping to</p>
                    <p className="text-gray-600">{order.shipping_address}</p>
                    <p className="text-gray-600">{order.shipping_city}{order.shipping_state ? `, ${order.shipping_state}` : ''} {order.shipping_postal_code}</p>
                    <p className="font-medium text-gray-700">{order.shipping_country}</p>
                  </div>

                  {/* Get rates */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-medium text-gray-700">Shipping Options</p>
                      <Button variant="outline" size="sm" onClick={fetchRates} disabled={ratesLoading}>
                        {ratesLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <RefreshCw className="w-3.5 h-3.5 mr-1" />}
                        {rates.length > 0 ? 'Refresh Rates' : 'Get Rates'}
                      </Button>
                    </div>

                    {ratesLoading && (
                      <div className="flex items-center justify-center py-8 text-gray-400">
                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                        Fetching rates from DHL...
                      </div>
                    )}

                    {rates.length > 0 && (
                      <div className="space-y-2">
                        {rates.map((r) => (
                          <div
                            key={r.id}
                            onClick={() => setSelectedRate(r)}
                            className={`p-3 border rounded-lg cursor-pointer transition-all ${
                              selectedRate?.id === r.id
                                ? 'border-indigo-500 bg-indigo-50'
                                : 'border-gray-200 hover:border-indigo-300'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${selectedRate?.id === r.id ? 'border-indigo-600' : 'border-gray-300'}`}>
                                  {selectedRate?.id === r.id && <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full" />}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="text-xs">{r.carrier}</Badge>
                                    <span className="text-sm font-medium text-gray-900">{r.service}</span>
                                  </div>
                                  {r.description && r.description !== r.service && (
                                    <p className="text-xs text-gray-400">{r.description}</p>
                                  )}
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-bold text-gray-900">
                                  {new Intl.NumberFormat('en-US', { style: 'currency', currency: r.currency || 'USD' }).format(r.cost)}
                                </p>
                                <p className="text-xs text-gray-400 flex items-center justify-end gap-0.5">
                                  <Clock className="w-3 h-3" />
                                  {r.estimatedDays} days
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {!ratesLoading && rates.length === 0 && (
                      <div className="text-center py-8 text-gray-400">
                        <Truck className="w-8 h-8 mx-auto mb-2" />
                        <p className="text-sm">Click "Get Rates" to load DHL shipping options</p>
                      </div>
                    )}
                  </div>

                  <Button
                    onClick={generateWaybill}
                    disabled={!selectedRate || waybillLoading}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    {waybillLoading ? (
                      <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Generating Waybill...</>
                    ) : (
                      <><Package className="w-4 h-4 mr-2" /> Generate Waybill</>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* ══════════════════════════════════════════════════════════════════════
            TAB: TRACKING
        ══════════════════════════════════════════════════════════════════════ */}
        <TabsContent value="tracking">
          <Card className="max-w-2xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Truck className="w-4 h-4" />
                  Live Tracking
                </CardTitle>
                <Button variant="outline" size="sm" onClick={fetchTracking} disabled={trackingLoading || !order.tracking_number}>
                  {trackingLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <RefreshCw className="w-3.5 h-3.5 mr-1" />}
                  {trackingData ? 'Refresh' : 'Load Tracking'}
                </Button>
              </div>
              {order.tracking_number && (
                <p className="text-sm text-gray-500">AWB: <span className="font-mono">{order.tracking_number}</span></p>
              )}
            </CardHeader>
            <CardContent>
              {!order.tracking_number && (
                <div className="text-center py-8 text-gray-400">
                  <Package className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-sm">No waybill yet. Generate one in the Waybill tab.</p>
                </div>
              )}

              {trackingLoading && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin text-indigo-600 mr-2" />
                  <span className="text-sm text-gray-500">Loading tracking data...</span>
                </div>
              )}

              {trackingData && !trackingLoading && (() => {
                const shipment = trackingData.shipments?.[0];
                const events   = shipment?.events || [];
                return (
                  <div className="space-y-4">
                    {shipment?.status && (
                      <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
                        <p className="text-xs font-medium text-indigo-600 uppercase tracking-wide">Current Status</p>
                        <p className="text-sm font-semibold text-indigo-900 mt-0.5">{shipment.status.description || shipment.status.code}</p>
                        {shipment.estimatedDeliveryDate && (
                          <p className="text-xs text-indigo-500 mt-0.5">Est. delivery: {new Date(shipment.estimatedDeliveryDate).toLocaleDateString()}</p>
                        )}
                      </div>
                    )}

                    {events.length > 0 && (
                      <div className="space-y-3">
                        {events.map((event, i) => (
                          <div key={i} className="flex gap-3">
                            <div className="flex flex-col items-center">
                              <div className={`w-2.5 h-2.5 rounded-full mt-1 flex-shrink-0 ${i === 0 ? 'bg-indigo-600' : 'bg-gray-300'}`} />
                              {i < events.length - 1 && <div className="w-0.5 bg-gray-200 flex-1 mt-1" />}
                            </div>
                            <div className="pb-3">
                              <p className="text-sm font-medium text-gray-900">{event.description || event.status}</p>
                              <p className="text-xs text-gray-500">
                                {event.location?.address?.addressLocality && `${event.location.address.addressLocality}, `}
                                {event.location?.address?.countryCode}
                              </p>
                              <p className="text-xs text-gray-400">
                                {event.timestamp ? new Date(event.timestamp).toLocaleString() : ''}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {events.length === 0 && (
                      <p className="text-sm text-gray-400 text-center py-4">No tracking events yet.</p>
                    )}
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ══════════════════════════════════════════════════════════════════════
            TAB: TIMELINE
        ══════════════════════════════════════════════════════════════════════ */}
        <TabsContent value="timeline">
          <Card className="max-w-2xl">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Order Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Static events derived from order data */}
                {[
                  {
                    icon: Package,
                    color: 'text-blue-500',
                    title: 'Order Placed',
                    detail: `Payment: ${order.payment_status || 'N/A'}`,
                    time: order.created_at,
                  },
                  order.tracking_number && {
                    icon: Truck,
                    color: 'text-purple-500',
                    title: 'Waybill Issued',
                    detail: `AWB: ${order.tracking_number} — ${order.shipping_carrier || 'DHL'} ${order.shipping_service || ''}`,
                    time: order.updated_at,
                  },
                  order.status === 'shipped' && {
                    icon: Truck,
                    color: 'text-indigo-500',
                    title: 'Shipped',
                    detail: `Carrier: ${order.shipping_carrier || 'DHL'}`,
                    time: order.updated_at,
                  },
                  order.status === 'delivered' && {
                    icon: CheckCircle,
                    color: 'text-green-500',
                    title: 'Delivered',
                    detail: 'Order delivered to customer',
                    time: order.updated_at,
                  },
                  order.status === 'cancelled' && {
                    icon: XCircle,
                    color: 'text-red-500',
                    title: 'Cancelled',
                    detail: 'Order was cancelled',
                    time: order.updated_at,
                  },
                ].filter(Boolean).map((event, i) => {
                  const Icon = event.icon;
                  return (
                    <div key={i} className="flex gap-3">
                      <Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${event.color}`} />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{event.title}</p>
                        <p className="text-xs text-gray-500">{event.detail}</p>
                        <p className="text-xs text-gray-400">{new Date(event.time).toLocaleString()}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default OrderDetail;
