import React from 'react';
import { Badge } from "@/components/ui/badge";
import { getImageUrl, getPlaceholderImageUrl } from "@/lib/utils/imageUtils";
import { motion } from "framer-motion";
import { 
  CheckCircle,
  Clock,
  Truck,
  Package,
  X,
  Eye 
} from "lucide-react";

const RecentOrderCard = ({ order, onClick, className = "" }) => {
  const getStatusColor = (status) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
      processing: "bg-blue-100 text-blue-800 border-blue-200",
      shipped: "bg-purple-100 text-purple-800 border-purple-200",
      delivered: "bg-green-100 text-green-800 border-green-200",
      cancelled: "bg-red-100 text-red-800 border-red-200"
    };
    return colors[status] || colors.pending;
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'pending': return <Clock className="h-3 w-3" />;
      case 'processing': return <Package className="h-3 w-3" />;
      case 'shipped': return <Truck className="h-3 w-3" />;
      case 'delivered': return <CheckCircle className="h-3 w-3" />;
      case 'cancelled': return <X className="h-3 w-3" />;
      default: return <Clock className="h-3 w-3" />;
    }
  };

  const formatCurrency = (amount, currency) => {
    const symbol = currency === "GHS" ? "₵" : "$";
    return `${symbol}${amount?.toFixed(2) || '0.00'}`;
  };

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      transition={{ duration: 0.2 }}
      className={`border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all cursor-pointer bg-white ${className}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="font-semibold text-gray-900">
            Order #{order.order_number}
          </p>
          <p className="text-sm text-gray-500">
            {new Date(order.created_at).toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            })}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Badge 
            className={`${getStatusColor(order.status)} flex items-center space-x-1 border`}
          >
            {getStatusIcon(order.status)}
            <span className="capitalize">{order.status}</span>
          </Badge>
          <Eye className="h-4 w-4 text-gray-400" />
        </div>
      </div>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex -space-x-2">
            {order.order_items?.slice(0, 3).map((item, index) => (
              <img
                key={index}
                src={getImageUrl(item.products?.image_url) || getPlaceholderImageUrl()}
                alt={item.products?.name || 'Product'}
                className="w-8 h-8 rounded-full border-2 border-white object-cover"
                onError={(e) => {
                  e.target.src = '/api/placeholder/32/32';
                }}
              />
            ))}
            {order.order_items?.length > 3 && (
              <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center">
                <span className="text-xs text-gray-600">
                  +{order.order_items.length - 3}
                </span>
              </div>
            )}
          </div>
          <div>
            <p className="text-sm text-gray-600">
              {order.order_items?.length || 0} item{(order.order_items?.length || 0) !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        
        <div className="text-right">
          <p className="font-semibold text-gray-900">
            {formatCurrency(order.total_amount, order.currency)}
          </p>
          {order.payment_status && (
            <p className={`text-xs ${
              order.payment_status === 'paid' 
                ? 'text-green-600' 
                : 'text-yellow-600'
            }`}>
              {order.payment_status === 'paid' ? 'Paid' : 'Payment Pending'}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default RecentOrderCard; 