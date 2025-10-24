
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/ui/use-toast";
import { api } from "@/lib/api";
import { getImageUrl, getPlaceholderImageUrl } from "@/lib/utils/imageUtils";
import { Package, ChevronRight, Loader2 } from "lucide-react";

const Orders = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    fetchOrders();
  }, [user]);

  const fetchOrders = async () => {
    try {
      if (!user) return;

      const data = await api.get('/orders?sort_by=created_at&sort_order=desc');
      setOrders(data.orders || []);
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast({
        title: "Error",
        description: "Failed to load orders",
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
      <div className="min-h-screen pt-20 pb-10">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center min-h-[60vh]">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-10">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto"
        >
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-light">My Orders</h1>
            <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center">
              <Package className="h-6 w-6 text-gray-600" />
            </div>
          </div>

          {orders.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
              <Package className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium mb-2">No Orders Yet</h3>
              <p className="text-gray-500 mb-4">
                You haven't placed any orders yet.
              </p>
              <Link
                to="/shop"
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                Start Shopping
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <Link
                  key={order.id}
                  to={`/order/${order.order_number}`}
                  className="block"
                >
                  <motion.div
                    whileHover={{ scale: 1.01 }}
                    className="bg-white rounded-lg shadow-sm p-6 transition-shadow hover:shadow-md"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-sm text-gray-500">
                          Order #{order.order_number}
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(order.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div
                          className={`px-3 py-1 rounded-full text-sm ${getStatusColor(
                            order.status
                          )}`}
                        >
                          {order.status.charAt(0).toUpperCase() +
                            order.status.slice(1)}
                        </div>
                        <ChevronRight className="h-5 w-5 text-gray-400" />
                      </div>
                    </div>

                    <div className="flex items-center">
                      <div className="flex -space-x-4">
                        {order.order_items
                          .slice(0, 3)
                          .map((item) => (
                            <img
                              key={item.id}
                              src={getImageUrl(item.products.image_url) || getPlaceholderImageUrl()}
                              alt={item.products.name}
                              className="w-12 h-12 rounded-full border-2 border-white object-cover"
                            />
                          ))}
                        {order.order_items.length > 3 && (
                          <div className="w-12 h-12 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center">
                            <span className="text-sm text-gray-600">
                              +{order.order_items.length - 3}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="ml-6">
                        <p className="font-medium">
                          {order.currency === "GHS" ? "₵" : "$"}
                          {order.total_amount.toFixed(2)}
                        </p>
                        <p className="text-sm text-gray-500">
                          {order.order_items.length}{" "}
                          {order.order_items.length === 1 ? "item" : "items"}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                </Link>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Orders;
