
import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft, Package, Clock, CreditCard } from "lucide-react";
import { api, API_BASE_URL } from "@/lib/services/api";

const OrderDetails = () => {
  const { id } = useParams();
  const { toast } = useToast();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    return `${API_BASE_URL}/images/${imagePath}`;
  };

  useEffect(() => {
    fetchOrderDetails();
  }, [id]);

  const fetchOrderDetails = async () => {
    try {
      const response = await api.get(`/orders/by-number/${id}`);

      if (!response.success) throw new Error(response.error);
      setOrder(response.order);
    } catch (error) {
      console.error('Error fetching order:', error);
      toast({
        title: "Error",
        description: "Failed to load order details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800",
      processing: "bg-blue-100 text-blue-800",
      shipped: "bg-purple-100 text-purple-800",
      delivered: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800"
    };
    return colors[status] || colors.pending;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          Loading...
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          Order not found
        </div>
      </div>
    );
  }

  const currencySymbol = order.currency === 'GHS' ? '₵' : '$';

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center mb-8">
          <Link
            to="/"
            className="flex items-center text-sm text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-2xl font-light mb-2">Order {order.order_number}</h1>
              <p className="text-gray-500">
                Placed on {new Date(order.created_at).toLocaleDateString()}
              </p>
            </div>
            <div className="flex flex-col items-end">
              <div className={`px-3 py-1 rounded-full text-sm ${getStatusColor(order.status)}`}>
                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
              </div>
              <div className={`mt-2 px-3 py-1 rounded-full text-sm ${
                order.payment_status === 'paid' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                Payment: {order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1)}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h2 className="text-lg font-medium mb-4">Order Details</h2>
              <div className="space-y-4">
                {order.order_items.map((item) => {
                  const displayItem = item.products || item.gift_voucher_types;
                  const itemName = displayItem?.name || (item.gift_voucher_type_id ? "Gift Voucher" : "Product");
                  const itemImageUrl = getImageUrl(displayItem?.image_url);
                  return (
                    <div key={item.id} className="flex items-center">
                      {itemImageUrl ? (
                        <img
                          src={itemImageUrl}
                          alt={itemName}
                          className="w-20 h-20 object-cover rounded"
                        />
                      ) : (
                        <div className="w-20 h-20 bg-gray-100 rounded flex items-center justify-center text-gray-400 text-xs">
                          No Image
                        </div>
                      )}
                      <div className="ml-4">
                        <h3 className="font-medium">{itemName}</h3>
                        <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                        {item.size && (
                          <p className="text-sm text-gray-500">Size: {item.size}</p>
                        )}
                        <p className="text-sm font-medium">
                          {currencySymbol}{item.price.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 pt-6 border-t">
                <div className="flex justify-between mb-2">
                  <span>Subtotal</span>
                  <span>{currencySymbol}{(order.base_subtotal || order.total_amount).toFixed(2)}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span>Shipping</span>
                  <span>{currencySymbol}{(order.base_shipping || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-medium">
                  <span>Total</span>
                  <span>{currencySymbol}{(order.base_total || order.total_amount).toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-medium mb-4">Shipping Details</h2>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="font-medium">
                  {order.customers.first_name} {order.customers.last_name}
                </p>
                <p>{order.shipping_address || order.customers.address}</p>
                <p>
                  {order.shipping_city || order.customers.city}, {order.shipping_state || order.customers.state} {order.shipping_postal_code || order.customers.postal_code}
                </p>
                <p>{order.shipping_country || order.customers.country}</p>
                <p className="mt-2">{order.shipping_phone || order.customers.phone}</p>
                <p>{order.shipping_email || order.customers.email}</p>
              </div>

              <div className="mt-6">
                <h2 className="text-lg font-medium mb-4">Order Timeline</h2>
                <div className="space-y-4">
                  <div className="flex items-start">
                    <div className="flex items-center h-6">
                      <div className="relative">
                        <span className="flex h-2 w-2 relative">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                      </div>
                      <div className="h-0.5 w-16 bg-gray-200 ml-2"></div>
                    </div>
                    <div className="ml-4">
                      <p className="font-medium">Order Placed</p>
                      <p className="text-sm text-gray-500">
                        {new Date(order.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;
