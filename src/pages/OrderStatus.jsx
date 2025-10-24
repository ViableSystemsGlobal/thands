import React, { useState, useEffect, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft, Clock, CreditCard, CheckCircle2, Package, ShoppingCart, User, MapPin, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { api } from "@/lib/api";
import { useCurrency } from "@/context/CurrencyContext";
import { usePayment } from "@/hooks/usePayment";

const getImageUrlGlobal = (imagePath) => {
  if (!imagePath) return null;
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  return `http://localhost:3003/api/images/${imagePath}`;
};

const LoadingState = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center">
      <Clock className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
      <p>Loading order details...</p>
    </div>
  </div>
);

const OrderNotFoundState = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center">
      <p className="text-xl mb-4">Order not found</p>
      <Link to="/">
        <Button>Return to Home</Button>
      </Link>
    </div>
  </div>
);

const OrderStatusHeader = ({ orderNumber }) => (
  <div className="text-center mb-8">
    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-gray-700 to-gray-900 rounded-full mb-4 shadow-lg">
      <CheckCircle2 className="h-8 w-8 text-white" />
    </div>
    <h1 className="text-3xl font-bold mb-2 text-gray-900">Thank You!</h1>
    <p className="text-gray-600 mb-4">
      Your order has been received. Please complete payment if pending.
    </p>
    <p className="text-sm text-gray-500">
      Order Number: <span className="font-medium text-gray-700">{orderNumber}</span>
    </p>
  </div>
);

const OrderItemCard = ({ item, displayCurrency, formatPrice }) => {
  const displayItem = item.products || item.gift_voucher_types;
  const itemName = displayItem?.name || (item.gift_voucher_type_id ? "Gift Voucher" : "Product");
  const itemImageUrl = getImageUrlGlobal(displayItem?.image_url);
  const itemPriceUSD = item.price;

  return (
    <div className="flex items-start gap-4 py-3 border-b border-gray-100 last:border-b-0">
      {itemImageUrl ? (
        <img  alt={itemName} className="w-16 h-16 object-cover rounded border border-gray-200" src={itemImageUrl} />
      ) : (
        <div className="w-16 h-16 bg-gray-100 rounded border border-gray-200 flex items-center justify-center text-gray-400 text-xs">
          No Image
        </div>
      )}
      <div className="flex-1">
        <h3 className="font-medium text-gray-900">{itemName}</h3>
        {item.size && <p className="text-sm text-gray-500">Size: {item.size}</p>}
        <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
      </div>
      <div className="text-right">
        <p className="font-medium text-gray-900">
          {formatPrice(itemPriceUSD * item.quantity, true, displayCurrency || "USD")}
        </p>
        {displayCurrency !== "GHS" && (
           <p className="text-xs text-gray-500">({formatPrice(itemPriceUSD * item.quantity, true, "GHS")})</p>
        )}
      </div>
    </div>
  );
};

const OrderSummarySection = ({ order, formatPrice }) => (
  <div className="bg-white rounded-lg shadow-sm p-6 mb-6 border border-gray-200">
    <div className="flex items-center gap-2 mb-4">
      <ShoppingCart className="h-5 w-5 text-gray-700" />
      <h2 className="text-lg font-semibold text-gray-900">Order Summary</h2>
    </div>
    <div className="space-y-2">
      {order.order_items.map((item) => (
        <OrderItemCard key={item.id} item={item} displayCurrency={order.display_currency} formatPrice={formatPrice} />
      ))}
    </div>
    <div className="mt-6 pt-6 border-t border-gray-200">
      <div className="flex justify-between mb-2">
        <span className="text-gray-600">Subtotal</span>
        <div className="text-right">
          <span className="text-gray-700">{formatPrice(order.base_subtotal, true, order.display_currency || "USD")}</span>
          {order.display_currency !== "GHS" && (
            <p className="text-xs text-gray-500">({formatPrice(order.base_subtotal, true, "GHS")})</p>
          )}
        </div>
      </div>
      <div className="flex justify-between mb-2">
        <span className="text-gray-600">Shipping</span>
         <div className="text-right">
          <span className="text-gray-700">{formatPrice(order.base_shipping || 0, true, order.display_currency || "USD")}</span>
          {order.display_currency !== "GHS" && (
            <p className="text-xs text-gray-500">({formatPrice(order.base_shipping || 0, true, "GHS")})</p>
          )}
        </div>
      </div>
      <div className="flex justify-between font-medium text-lg text-gray-900">
        <span>Total</span>
        <div className="text-right">
          <span>{formatPrice(order.base_total, true, order.display_currency || "USD")}</span>
          {order.display_currency !== "GHS" && (
            <p className="text-sm text-gray-500">({formatPrice(order.base_total, true, "GHS")})</p>
          )}
        </div>
      </div>
    </div>
  </div>
);

const ShippingDetailsSection = ({ order }) => (
  <div className="bg-white rounded-lg shadow-sm p-6 mb-6 border border-gray-200">
    <div className="flex items-center gap-2 mb-4">
      <MapPin className="h-5 w-5 text-gray-700" />
      <h2 className="text-lg font-semibold text-gray-900">Shipping Details</h2>
    </div>
    <div className="text-gray-700">
      <p className="font-medium text-gray-900">
        {order.customers?.first_name} {order.customers?.last_name}
      </p>
      <p>{order.shipping_address}</p>
      <p>
        {order.shipping_city}, {order.shipping_state} {order.shipping_postal_code}
      </p>
      <p>{order.shipping_country}</p>
      <p className="mt-2">{order.shipping_phone}</p>
      <p>{order.shipping_email}</p>
    </div>
  </div>
);

const PaymentStatusSection = ({ order, formatPrice, exchangeRate, onPaymentClick, paymentLoading, resetPaymentState, scriptLoaded }) => {
  const paymentAmountForProcessor = order.total_amount_ghs || (order.total_amount * exchangeRate);
  const paymentCurrencyForProcessor = order.payment_currency || "GHS";

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-6 border border-gray-200">
      <div className="flex items-center gap-2 mb-4">
        <CreditCard className="h-5 w-5 text-gray-700" />
        <h2 className="text-lg font-semibold text-gray-900">Payment Status</h2>
      </div>
      <div className="flex items-center gap-3 mb-4">
         <div className={`h-10 w-10 rounded-full flex items-center justify-center ${order.payment_status === 'paid' ? 'bg-green-100' : 'bg-yellow-100'}`}>
          {order.payment_status === 'paid' ? <CheckCircle2 className="h-5 w-5 text-green-700" /> : <Clock className="h-5 w-5 text-yellow-700" />}
        </div>
        <div>
          <p className="font-medium text-gray-900">{order.payment_status === 'paid' ? 'Payment Confirmed' : 'Awaiting Payment'}</p>
          <p className="text-sm text-gray-500">
            {order.payment_status === 'paid' ? 'Your payment has been successfully processed.' : 'Please complete your payment to process your order'}
          </p>
          {order.payment_reference && (
            <p className="text-xs text-gray-400 mt-1">Reference: {order.payment_reference}</p>
          )}
        </div>
      </div>
      {order.payment_status !== 'paid' && (
        <div className="space-y-3">
          {!scriptLoaded && (
            <div className="text-xs text-gray-500 text-center p-2 bg-gray-50 rounded">
              Loading payment system...
            </div>
          )}
          <Button 
            className="w-full bg-amber-600 hover:bg-amber-700 text-white disabled:opacity-50" 
            onClick={onPaymentClick}
            disabled={paymentLoading || !scriptLoaded}
          >
            {paymentLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing Payment...
              </>
            ) : !scriptLoaded ? (
              <>
                Loading Payment System...
              </>
            ) : (
              <>
                Pay Now - {formatPrice(paymentAmountForProcessor, true, paymentCurrencyForProcessor)}
              </>
            )}
          </Button>
          {paymentLoading && (
            <Button 
              variant="outline" 
              className="w-full border-gray-300 text-gray-700 hover:bg-gray-50" 
              onClick={resetPaymentState}
            >
              Reset & Try Again
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

const OrderStatus = () => {
  const { orderNumber } = useParams();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { formatPrice, exchangeRate } = useCurrency();
  const { retryPayment, paymentLoading, resetPaymentState, scriptLoaded } = usePayment();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchOrderDetails = useCallback(async () => {
    setLoading(true);
    try {
      const orderData = await api.get(`/orders/by-number/${orderNumber}`);
      setOrder(orderData);
    } catch (error) {
      console.error('Error fetching order:', error);
      toast({
        title: "Error",
        description: "Failed to load order details. " + error.message,
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [orderNumber, toast]);

  useEffect(() => {
    fetchOrderDetails();
  }, [fetchOrderDetails]);

  const handlePaymentClick = async () => {
    if (!order) return;
    
    try {
      // Create order data for payment processing
      const orderForPayment = {
        id: order.id,
        order_number: order.order_number,
        shipping_email: order.shipping_email,
        shipping_phone: order.shipping_phone,
        total_amount_ghs: order.total_amount_ghs,
        customers: order.customers
      };

      // Process payment with Paystack
      await retryPayment(orderForPayment);
    } catch (error) {
      console.error('Error processing payment:', error);
      toast({
        title: "Payment Error",
        description: "There was an issue processing your payment. Please try again.",
        variant: "destructive"
      });
    }
  };

  if (loading) return <LoadingState />;
  if (!order) return <OrderNotFoundState />;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-gray-50 py-12"
    >
      <div className="max-w-3xl mx-auto px-4">
        <OrderStatusHeader orderNumber={order.order_number} />
        <OrderSummarySection order={order} formatPrice={formatPrice} />
        <ShippingDetailsSection order={order} />
        <PaymentStatusSection 
          order={order} 
          onPaymentClick={handlePaymentClick} 
          formatPrice={formatPrice} 
          exchangeRate={exchangeRate}
          paymentLoading={paymentLoading}
          resetPaymentState={resetPaymentState}
          scriptLoaded={scriptLoaded}
        />

        <div className="text-center mt-8">
          <Link to="/shop">
            <Button variant="outline" className="border-gray-700 text-gray-700 hover:bg-gray-100">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Continue Shopping
            </Button>
          </Link>
        </div>
      </div>
    </motion.div>
  );
};

export default OrderStatus;
