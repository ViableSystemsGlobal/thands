import React, { useState, useEffect, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft, Clock, CreditCard, CheckCircle2, Package, ShoppingCart, User, MapPin, Loader2 } from "lucide-react";
import { api } from "@/lib/services/api";
import { useCurrency } from "@/context/CurrencyContext";
import { useShop } from "@/context/ShopContext";
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
      <Link to="/shop">
        <Button>Continue Shopping</Button>
      </Link>
    </div>
  </div>
);

const OrderConfirmationHeader = ({ orderNumber }) => (
  <div className="text-center mb-8">
    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full mb-4 shadow-lg">
      <Package className="h-8 w-8 text-white" />
    </div>
    <h1 className="text-3xl font-bold mb-2 text-gray-900">Order Confirmation</h1>
    <p className="text-gray-600 mb-4">
      Your order has been created successfully. Please proceed with payment to confirm.
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
        <img alt={itemName} className="w-16 h-16 object-cover rounded border border-gray-200" src={itemImageUrl} />
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

const PaymentSection = ({ order, formatPrice, onPaymentClick, paymentLoading, scriptLoaded }) => {
  // Use total_amount_ghs if available, otherwise fall back to base_total_ghs for PAYMENT PROCESSING
  const paymentAmount = order.total_amount_ghs || order.base_total_ghs;
  
  // Use USD amount for formatPrice display (it will convert to GHS automatically)
  const displayAmount = order.total_amount || order.base_total;

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow-sm p-6 mb-6 border border-blue-200">
      <div className="flex items-center gap-2 mb-4">
        <CreditCard className="h-5 w-5 text-blue-700" />
        <h2 className="text-lg font-semibold text-gray-900">Payment Required</h2>
      </div>
      
      <div className="mb-4">
        <p className="text-gray-700 mb-2">
          To complete your order, please proceed with payment:
        </p>
        <p className="text-2xl font-bold text-blue-700">
          {formatPrice(displayAmount, true, "GHS")}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          Amount to be charged: GH₵{paymentAmount?.toFixed(2)}
        </p>
      </div>

      <div className="bg-blue-100 rounded-lg p-4 mb-4">
        <p className="text-sm text-blue-800">
          <strong>💳 Secure Payment:</strong> Your payment is processed securely through Paystack. 
          We accept all major cards and mobile money payments.
        </p>
      </div>

      {!scriptLoaded && (
        <div className="text-xs text-gray-500 text-center p-2 bg-gray-50 rounded mb-3">
          Loading payment system...
        </div>
      )}

      <Button 
        className="w-full bg-blue-600 hover:bg-blue-700 text-white text-lg py-3 disabled:opacity-50" 
        onClick={onPaymentClick}
        disabled={paymentLoading || !scriptLoaded}
        size="lg"
      >
        {paymentLoading ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Processing Payment...
          </>
        ) : !scriptLoaded ? (
          <>
            Loading Payment System...
          </>
        ) : (
          <>
            <CreditCard className="mr-2 h-5 w-5" />
            Pay Now - {formatPrice(displayAmount, true, "GHS")}
          </>
        )}
      </Button>
      
      <p className="text-xs text-gray-500 text-center mt-2">
        Your order will be confirmed after successful payment
      </p>
    </div>
  );
};

const OrderConfirmation = () => {
  const { orderNumber } = useParams();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { formatPrice } = useCurrency();
  const { clearCart } = useShop();
  const { retryPayment, paymentLoading, scriptLoaded } = usePayment();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchOrderDetails = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get(`/orders/by-number/${orderNumber}`);

      if (!response.success) throw new Error(response.error);
      
      // If order is already paid, redirect to success page
      if (response.order.payment_status === 'paid') {
        navigate(`/order-payment-success/${orderNumber}`);
        return;
      }
      
      setOrder(response.order);
    } catch (error) {
      console.error('Error fetching order:', error);
      toast({
        title: "Error",
        description: "Failed to load order details. " + error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [orderNumber, toast, navigate]);

  useEffect(() => {
    fetchOrderDetails();
  }, [fetchOrderDetails]);

  const handlePaymentClick = async () => {
    if (!order) return;
    
    console.log('🎯 Payment button clicked for order:', order.order_number);
    console.log('💰 Order total_amount_ghs:', order.total_amount_ghs);
    console.log('💰 Order base_total_ghs:', order.base_total_ghs);
    console.log('📋 Full order data:', order);
    
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

      console.log('📦 Order data for payment:', orderForPayment);

      // Process payment with Paystack and clear cart on success
      await retryPayment(orderForPayment, clearCart);
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
        <OrderConfirmationHeader orderNumber={order.order_number} />
        <OrderSummarySection order={order} formatPrice={formatPrice} />
        <ShippingDetailsSection order={order} />
        <PaymentSection 
          order={order} 
          onPaymentClick={handlePaymentClick} 
          formatPrice={formatPrice} 
          paymentLoading={paymentLoading}
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

export default OrderConfirmation; 