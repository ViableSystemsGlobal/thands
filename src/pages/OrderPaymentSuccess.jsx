import React, { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft, CheckCircle2, ShoppingCart, MapPin, Clock } from "lucide-react";
import { api, API_BASE_URL } from "@/lib/services/api";
import { useCurrency } from "@/context/CurrencyContext";

const LoadingState = () => (
  <div className="min-h-screen bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center">
    <div className="text-center">
      <Clock className="h-12 w-12 animate-spin mx-auto mb-6 text-white" />
      <p className="text-white text-xl">Loading your order confirmation...</p>
    </div>
  </div>
);

const OrderNotFoundState = () => (
  <div className="min-h-screen bg-gradient-to-br from-red-400 to-pink-600 flex items-center justify-center">
    <div className="text-center p-8">
      <p className="text-2xl mb-6 text-white font-semibold">Oops! Order Not Found</p>
      <p className="text-white mb-8">We couldn't find the details for this order. It might have been an issue with the order number or the order doesn't exist.</p>
      <Link to="/">
        <Button variant="outline" className="bg-white text-pink-600 hover:bg-gray-100 border-transparent">Return to Home</Button>
      </Link>
    </div>
  </div>
);

const SuccessHeader = ({ orderNumber }) => (
  <div className="text-center mb-10">
    <motion.div
      initial={{ scale: 0.5, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.2 }}
      className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full mb-6 shadow-2xl"
    >
      <CheckCircle2 className="h-12 w-12 text-emerald-500" />
    </motion.div>
    <h1 className="text-4xl font-bold mb-3 text-white">Payment Successful!</h1>
    <p className="text-emerald-100 text-lg mb-4">
      Thank you for your purchase! Your order is confirmed and being processed.
    </p>
    <p className="text-sm text-emerald-200">
      Order Number: <span className="font-semibold text-white">{orderNumber}</span>
    </p>
  </div>
);

const OrderItemCard = ({ item, displayCurrency, formatPrice }) => {
  // Handle both backend format (product_name, product_image_url) and legacy format (products, gift_voucher_types)
  const displayItem = item.products || item.gift_voucher_types;
  const itemName = item.product_name || displayItem?.name || (item.gift_voucher_type_id ? "Gift Voucher" : "Product");
  const itemImageUrl = item.product_image_url || displayItem?.image_url;
  const itemPriceUSD = item.price;

  // Use the same image URL processing as other pages
  const getImageUrlGlobal = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    return `${API_BASE_URL}/images/${imagePath}`;
  };

  const processedImageUrl = getImageUrlGlobal(itemImageUrl);

  return (
    <div className="flex items-start gap-4 py-4 border-b border-emerald-400/30 last:border-b-0">
      {processedImageUrl ? (
         <img  alt={itemName} className="w-16 h-16 object-cover rounded-md border border-emerald-400/50 shadow-sm" src={processedImageUrl} />
      ) : (
        <div className="w-16 h-16 bg-emerald-400/20 rounded-md border border-emerald-400/50 flex items-center justify-center text-emerald-100 text-xs shadow-sm">
          No Image
        </div>
      )}
      <div className="flex-1">
        <h3 className="font-medium text-white">{itemName}</h3>
        {item.size && <p className="text-sm text-emerald-200">Size: {item.size}</p>}
        <p className="text-sm text-emerald-200">Quantity: {item.quantity}</p>
      </div>
      <div className="text-right">
        <p className="font-medium text-white">
          {formatPrice(parseFloat(itemPriceUSD) * item.quantity, true, displayCurrency || "USD")}
        </p>
         {displayCurrency !== "GHS" && (
           <p className="text-xs text-emerald-200">
             ({formatPrice(parseFloat(itemPriceUSD) * item.quantity, true, "GHS")})
           </p>
        )}
      </div>
    </div>
  );
};

const OrderSummaryDetails = ({ order, formatPrice }) => (
  <div className="bg-white/10 backdrop-blur-md rounded-xl shadow-lg p-6 mb-8 border border-white/20">
    <div className="flex items-center gap-3 mb-5">
      <ShoppingCart className="h-6 w-6 text-emerald-200" />
      <h2 className="text-xl font-semibold text-white">Order Summary</h2>
    </div>
    <div className="space-y-3 mb-6">
      {(order.items || order.order_items || []).map((item) => (
        <OrderItemCard key={item.id} item={item} displayCurrency={order.display_currency} formatPrice={formatPrice} />
      ))}
    </div>
    <div className="mt-6 pt-6 border-t border-emerald-400/30">
      <div className="flex justify-between mb-2 text-sm">
        <span className="text-emerald-200">Subtotal</span>
        <div className="text-right">
          <span className="text-white">{formatPrice(parseFloat(order.base_subtotal || 0), true, order.display_currency || "USD")}</span>
           {order.display_currency !== "GHS" && (
            <p className="text-xs text-emerald-200">({formatPrice(parseFloat(order.base_subtotal || 0), true, "GHS")})</p>
          )}
        </div>
      </div>
      <div className="flex justify-between mb-2 text-sm">
        <span className="text-emerald-200">Shipping</span>
        <div className="text-right">
          <span className="text-white">{formatPrice(parseFloat(order.base_shipping || 0), true, order.display_currency || "USD")}</span>
          {order.display_currency !== "GHS" && (
            <p className="text-xs text-emerald-200">({formatPrice(parseFloat(order.base_shipping || 0), true, "GHS")})</p>
          )}
        </div>
      </div>
      <div className="flex justify-between font-semibold text-xl text-white mt-3">
        <span>Total</span>
         <div className="text-right">
          <span>{formatPrice(parseFloat(order.base_total || 0), true, order.display_currency || "USD")}</span>
          {order.display_currency !== "GHS" && (
            <p className="text-sm text-emerald-200">({formatPrice(parseFloat(order.base_total || 0), true, "GHS")})</p>
          )}
        </div>
      </div>
    </div>
  </div>
);

const ShippingInfo = ({ order }) => (
 <div className="bg-white/10 backdrop-blur-md rounded-xl shadow-lg p-6 border border-white/20">
    <div className="flex items-center gap-3 mb-5">
      <MapPin className="h-6 w-6 text-emerald-200" />
      <h2 className="text-xl font-semibold text-white">Shipping To</h2>
    </div>
    <div className="text-emerald-100 space-y-1 text-sm">
      <p className="font-medium text-white text-base">
        {order.customers?.first_name} {order.customers?.last_name}
      </p>
      <p>{order.shipping_address}</p>
      <p>
        {order.shipping_city}, {order.shipping_state} {order.shipping_postal_code}
      </p>
      <p>{order.shipping_country}</p>
      <p className="mt-3">{order.shipping_phone}</p>
      <p>{order.shipping_email}</p>
    </div>
  </div>
);


const OrderPaymentSuccess = () => {
  const { orderNumber } = useParams();
  const { toast } = useToast();
  const { formatPrice } = useCurrency();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchOrderDetails = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get(`/orders/by-number/${orderNumber}`);

      // Backend returns order directly, not wrapped in success property
      if (response.error) throw new Error(response.error);
      setOrder(response);
    } catch (error) {
      console.error('Error fetching paid order:', error);
      toast({
        title: "Error",
        description: "Failed to load order confirmation. " + error.message,
        variant: "error",
      });
      setOrder(null); 
    } finally {
      setLoading(false);
    }
  }, [orderNumber, toast]);

  useEffect(() => {
    fetchOrderDetails();
  }, [fetchOrderDetails]);

  if (loading) return <LoadingState />;
  if (!order) return <OrderNotFoundState />;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-gradient-to-br from-green-400 to-emerald-600 py-12 px-4"
    >
      <div className="max-w-2xl mx-auto">
        <SuccessHeader orderNumber={order.order_number} />
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <OrderSummaryDetails order={order} formatPrice={formatPrice} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          <ShippingInfo order={order} />
        </motion.div>

        <motion.div 
          className="text-center mt-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.5 }}
        >
          <Link to="/shop">
            <Button variant="outline" className="bg-white text-emerald-600 hover:bg-emerald-50 border-transparent shadow-md px-8 py-3 text-base">
              <ArrowLeft className="w-5 h-5 mr-2" />
              Continue Shopping
            </Button>
          </Link>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default OrderPaymentSuccess;
