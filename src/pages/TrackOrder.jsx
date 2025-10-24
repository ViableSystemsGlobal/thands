
import React, { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Package, Search } from "lucide-react";
import { api } from "@/lib/api";

const TrackOrder = () => {
  const [orderNumber, setOrderNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!orderNumber.trim()) {
      toast({
        title: "Error",
        description: "Please enter an order number",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const data = await api.get(`/orders/track/${orderNumber.trim()}`);

      if (!data || !data.order_number) {
        toast({
          title: "Error",
          description: "Order not found. Please check the order number and try again.",
          variant: "destructive",
        });
        return;
      }

      navigate(`/order-status/${orderNumber.trim()}`);
    } catch (error) {
      console.error("Error tracking order:", error);
      toast({
        title: "Error",
        description: "Failed to track order. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-20 pb-10">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-lg mx-auto"
        >
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
              <Package className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-3xl font-light mb-2">Track Your Order</h1>
            <p className="text-gray-600">
              Enter your order number to track your order status
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Input
                  type="text"
                  placeholder="Enter your order number"
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  className="w-full"
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center">
                    <Search className="animate-spin h-4 w-4 mr-2" />
                    Tracking...
                  </span>
                ) : (
                  <span className="flex items-center">
                    <Search className="h-4 w-4 mr-2" />
                    Track Order
                  </span>
                )}
              </Button>
            </form>
          </div>

          <div className="mt-8 text-center text-gray-600">
            <p>Need help? Contact our support team</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default TrackOrder;
