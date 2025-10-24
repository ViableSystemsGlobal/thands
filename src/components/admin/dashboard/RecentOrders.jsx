
import React from 'react';
import { Button } from '@/components/ui/button';
import { Eye, ShoppingCart, Loader2 } from 'lucide-react';

const RecentOrders = ({ orders, onViewOrder, loading }) => {
  return (
    <div className="bg-white p-6 rounded-xl shadow-lg h-full">
      <div className="flex items-center mb-6">
        <ShoppingCart className="w-6 h-6 text-indigo-500 mr-3" />
        <h2 className="text-xl font-semibold text-gray-800">Recent Orders</h2>
      </div>
      {loading ? (
        <div className="flex justify-center items-center h-40">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        </div>
      ) : orders.length === 0 ? (
         <p className="text-gray-500 text-center py-4">No recent orders found for the selected period.</p>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
              <div>
                <p className="font-medium text-gray-700">Order #{order.order_number}</p>
                <p className="text-xs text-gray-500">
                  {order.first_name || 'Guest'} {order.last_name || ''}
                </p>
                <p className="text-sm font-semibold text-indigo-600">${(parseFloat(order.base_total) || 0).toFixed(2)}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onViewOrder(order)}
                className="text-indigo-500 hover:text-indigo-700"
              >
                <Eye className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RecentOrders;
