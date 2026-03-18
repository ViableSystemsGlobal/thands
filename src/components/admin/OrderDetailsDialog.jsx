import React, { useState } from "react";
import { API_BASE_URL } from "@/lib/services/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { generateOrderPDF } from "@/lib/pdf";
import { Download, Package, CreditCard, Truck } from "lucide-react";
import { useCurrency } from "@/context/CurrencyContext";
import InternationalShipping from "./InternationalShipping";

const OrderDetailsDialog = ({ order, open, onOpenChange }) => {
  const { formatPrice, exchangeRate } = useCurrency(); 
  const [showShipping, setShowShipping] = useState(false);
  
  if (!order) return null;

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    return `${API_BASE_URL}/images/${imagePath}`;
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800",
      processing: "bg-blue-100 text-blue-800",
      shipped: "bg-purple-100 text-purple-800",
      delivered: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800"
    };
    return colors[status?.toLowerCase()] || colors.pending;
  };

  const handleDownload = async () => {
    try {
      await generateOrderPDF(order);
    } catch (error) {
      console.error("Error downloading invoice:", error);
    }
  };

  const displayCurrency = order.display_currency || "USD";
  const paymentCurrency = order.payment_currency || "GHS";

  // Helper function to calculate GHS value using the same logic as OrderTable
  const calculateGHSValue = (usdAmount, storedGHSAmount, orderExchangeRate) => {
    if (storedGHSAmount && storedGHSAmount > 0) {
      if (orderExchangeRate && usdAmount) {
        const expectedGHS = usdAmount * orderExchangeRate;
        const storedGHS = storedGHSAmount;
        const difference = Math.abs(expectedGHS - storedGHS);
        const percentageDiff = (difference / expectedGHS) * 100;
        
        if (percentageDiff < 5) {
          return storedGHS;
        } else {
          return expectedGHS;
        }
      } else {
        const currentRatio = storedGHSAmount / usdAmount;
        if (currentRatio > exchangeRate * 1.2 || currentRatio < exchangeRate * 0.8) {
          return usdAmount * exchangeRate;
        } else {
          return storedGHSAmount;
        }
      }
    } else if (usdAmount) {
      const rateToUse = orderExchangeRate || exchangeRate;
      return usdAmount * rateToUse;
    }
    return 0;
  };
  
  // Get USD and GHS values, with fallback logic
  let orderTotalUSD = parseFloat(order.base_total || order.total_amount || 0);
  let orderTotalGHS = parseFloat(order.base_total_ghs || order.total_amount_ghs || 0);
  
  // If USD is 0 but GHS has a value, calculate USD from GHS
  if (orderTotalUSD === 0 && orderTotalGHS > 0) {
    const rateToUse = order.exchange_rate || exchangeRate;
    orderTotalUSD = orderTotalGHS / rateToUse;
  } else if (orderTotalUSD > 0 && orderTotalGHS === 0) {
    // If GHS is 0 but USD has a value, calculate GHS from USD
    const rateToUse = order.exchange_rate || exchangeRate;
    orderTotalGHS = orderTotalUSD * rateToUse;
  } else if (orderTotalUSD > 0 && orderTotalGHS > 0) {
    // Both exist, use the stored GHS value
    orderTotalGHS = calculateGHSValue(
      orderTotalUSD,
      orderTotalGHS,
      order.exchange_rate
    );
  }

  let subTotalUSD = parseFloat(order.base_subtotal || order.subtotal_amount || 0);
  let subTotalGHS = parseFloat(order.base_subtotal_ghs || 0);
  
  // If USD is 0 but GHS has a value, calculate USD from GHS
  if (subTotalUSD === 0 && subTotalGHS > 0) {
    const rateToUse = order.exchange_rate || exchangeRate;
    subTotalUSD = subTotalGHS / rateToUse;
  } else if (subTotalUSD > 0 && subTotalGHS === 0) {
    const rateToUse = order.exchange_rate || exchangeRate;
    subTotalGHS = subTotalUSD * rateToUse;
  } else if (subTotalUSD > 0 && subTotalGHS > 0) {
    subTotalGHS = calculateGHSValue(
      subTotalUSD,
      subTotalGHS,
      order.exchange_rate
    );
  }

  let shippingUSD = parseFloat(order.base_shipping || order.shipping_amount || 0);
  let shippingGHS = parseFloat(order.base_shipping_ghs || 0);
  
  // If USD is 0 but GHS has a value, calculate USD from GHS
  if (shippingUSD === 0 && shippingGHS > 0) {
    const rateToUse = order.exchange_rate || exchangeRate;
    shippingUSD = shippingGHS / rateToUse;
  } else if (shippingUSD > 0 && shippingGHS === 0) {
    const rateToUse = order.exchange_rate || exchangeRate;
    shippingGHS = shippingUSD * rateToUse;
  } else if (shippingUSD > 0 && shippingGHS > 0) {
    shippingGHS = calculateGHSValue(
      shippingUSD,
      shippingGHS,
      order.exchange_rate
    );
  }

  const couponDiscountUSD = order.coupon_discount_amount || 0;
  const couponDiscountGHS = calculateGHSValue(
    couponDiscountUSD,
    order.coupon_discount_amount_ghs,
    order.exchange_rate
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl bg-white">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <DialogTitle className="text-gray-900">Order Details</DialogTitle>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleDownload}
              className="flex items-center gap-2 border-gray-700 text-gray-700 hover:bg-gray-100"
            >
              <Download className="w-4 h-4" />
              Download Invoice
            </Button>
          </div>
        </DialogHeader>

        <div className="mt-4 text-gray-800">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-xl font-medium mb-2 text-gray-900">Order {order.order_number}</h2>
              <p className="text-gray-500">
                Placed on {new Date(order.created_at).toLocaleDateString()}
              </p>
              <p className="text-sm text-gray-500">Display Currency: {displayCurrency}</p>
              <p className="text-sm text-gray-500">Payment Currency: {paymentCurrency}</p>
              {order.exchange_rate && (
                <p className="text-sm text-gray-500">Historical Exchange Rate: {order.exchange_rate.toFixed(2)} GHS/USD</p>
              )}
            </div>
            <div className="flex flex-col items-end">
              <div className={`px-3 py-1 rounded-full text-sm ${getStatusColor(order.status)}`}>
                {order.status?.charAt(0).toUpperCase() + order.status?.slice(1)}
              </div>
              <div className={`mt-2 px-3 py-1 rounded-full text-sm ${
                order.payment_status === "paid" 
                  ? "bg-green-100 text-green-800" 
                  : "bg-yellow-100 text-yellow-800"
              }`}>
                Payment: {order.payment_status?.charAt(0).toUpperCase() + order.payment_status?.slice(1)}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium mb-4 text-gray-900">Order Items</h3>
              <div className="space-y-4">
                {order.order_items?.map((item) => {
                  const itemPriceUSD = Number(item.price) || 0;
                  const itemPriceGHS = calculateGHSValue(
                    itemPriceUSD,
                    item.price_ghs,
                    order.exchange_rate
                  );
                  const imageUrl = getImageUrl(item.products?.image_url || item.gift_voucher_types?.image_url);
                  return (
                    <div key={item.id} className="flex items-center">
                      {imageUrl ? (
                        <img 
                          src={imageUrl}
                          alt={item.products?.name || item.gift_voucher_types?.name}
                          className="w-16 h-16 object-cover rounded border border-gray-200"
                         />
                      ) : (
                         <div className="w-16 h-16 bg-gray-100 rounded border border-gray-200 flex items-center justify-center text-gray-400 text-xs">
                           No Image
                         </div>
                      )}
                      <div className="ml-4">
                        <h4 className="font-medium text-gray-900">{item.products?.name || item.gift_voucher_types?.name}</h4>
                        <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                        {item.size && (
                          <p className="text-sm text-gray-500">Size: {item.size}</p>
                        )}
                        <p className="text-sm font-medium text-gray-700">
                          {formatPrice(itemPriceUSD, false, "USD")} / {formatPrice(itemPriceGHS, false, "GHS", true)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* International Shipping Section */}
              {order.shipping_country && order.shipping_country !== 'GH' && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                      <Truck className="w-5 h-5" />
                      International Shipping
                    </h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowShipping(!showShipping)}
                    >
                      {showShipping ? 'Hide' : 'Manage'} Shipping
                    </Button>
                  </div>
                  
                  {showShipping && (
                    <InternationalShipping
                      order={order}
                      onLabelCreated={(label) => {
                        console.log('Label created:', label);
                        setShowShipping(false);
                        // Refresh the order data or close dialog
                        onOpenChange(false);
                      }}
                      onClose={() => setShowShipping(false)}
                    />
                  )}
                  
                  {!showShipping && order.tracking_number && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Package className="w-4 h-4 text-green-600" />
                        <span className="font-medium text-green-800">Label Created</span>
                      </div>
                      <p className="text-sm text-green-700">
                        Tracking: <span className="font-mono">{order.tracking_number}</span>
                      </p>
                      <p className="text-sm text-green-600">
                        Carrier: {order.shipping_carrier} - {order.shipping_service}
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Subtotal</span>
                  <div className="text-right">
                    <p className="text-gray-700">{formatPrice(subTotalUSD, false, "USD")}</p>
                    <p className="text-sm text-gray-500">({formatPrice(subTotalGHS, false, "GHS", true)})</p>
                  </div>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Shipping</span>
                  <div className="text-right">
                    <p className="text-gray-700">{formatPrice(shippingUSD, false, "USD")}</p>
                    <p className="text-sm text-gray-500">({formatPrice(shippingGHS, false, "GHS", true)})</p>
                  </div>
                </div>
                {couponDiscountUSD > 0 && (
                  <div className="flex justify-between mb-2 text-green-600">
                    <span className="text-green-700">Coupon Discount</span>
                    <div className="text-right">
                       <p className="text-green-700">- {formatPrice(couponDiscountUSD, false, "USD")}</p>
                       <p className="text-sm text-green-500">(- {formatPrice(couponDiscountGHS, false, "GHS", true)})</p>
                    </div>
                  </div>
                )}
                <div className="flex justify-between text-lg font-medium text-gray-900 mt-2">
                  <span>Total</span>
                   <div className="text-right">
                    <p>{formatPrice(orderTotalUSD, false, "USD")}</p>
                    <p className="text-sm text-gray-500">({formatPrice(orderTotalGHS, false, "GHS", true)})</p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-4 text-gray-900">Customer Details</h3>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <p className="font-medium text-gray-900">
                  {order.shipping_first_name || order.customers?.first_name} {order.shipping_last_name || order.customers?.last_name}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {order.customer_id ? "Registered Customer" : "Guest Customer"}
                </p>
                <p className="mt-2 text-gray-700">{order.shipping_address}</p>
                <p className="text-gray-700">
                  {order.shipping_city}, {order.shipping_state} {order.shipping_postal_code}
                </p>
                <p className="text-gray-700">{order.shipping_country}</p>
                <p className="mt-2 text-gray-700">{order.shipping_phone}</p>
                <p className="text-gray-700">{order.shipping_email}</p>
              </div>

              <div className="mt-6">
                <h3 className="text-lg font-medium mb-4 text-gray-900">Order Timeline</h3>
                <div className="space-y-4">
                  <div className="flex items-start">
                    <Package className="w-5 h-5 text-blue-500 mt-1" />
                    <div className="ml-3">
                      <p className="font-medium text-gray-900">Order Placed</p>
                      <p className="text-sm text-gray-500">
                        {new Date(order.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  {order.updated_at && order.updated_at !== order.created_at && (
                    <div className="flex items-start">
                      <CreditCard className="w-5 h-5 text-green-500 mt-1" />
                      <div className="ml-3">
                        <p className="font-medium text-gray-900">Last Updated</p>
                        <p className="text-sm text-gray-500">
                          {new Date(order.updated_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OrderDetailsDialog;
