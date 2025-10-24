import React from "react";
import { Button } from "@/components/ui/button";
import { Eye, Loader2, Trash2 } from "lucide-react";
import { useCurrency } from "@/context/CurrencyContext";
import PaginationControls from "@/components/admin/PaginationControls";

const OrderTable = ({ 
  orders, 
  onUpdateStatus, 
  onViewDetails,
  onDelete,
  loading, 
  initialLoading,
  currentPage,
  totalPages,
  onPageChange,
  itemsPerPage,
  totalItems,
  onItemsPerPageChange
}) => {
  const { formatPrice, exchangeRate, convertToGHS } = useCurrency();

  const getPaymentStatusClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  const getOrderStatusClass = (status) => {
     switch (status?.toLowerCase()) {
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'shipped':
        return 'bg-blue-100 text-blue-800';
      case 'processing':
        return 'bg-purple-100 text-purple-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
         return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };


  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 font-medium text-gray-600">Order #</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">Customer</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">Total (USD)</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">Total (GHS)</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">Payment</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">Date</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {initialLoading ? (
              <tr>
                <td colSpan="8" className="text-center py-10 text-gray-500">
                  <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mx-auto mb-2" />
                  Loading orders...
                </td>
              </tr>
            ) : loading && orders.length === 0 && !initialLoading ? (
               <tr>
                <td colSpan="8" className="text-center py-10 text-gray-500">
                  <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mx-auto mb-2" />
                  Fetching orders...
                </td>
              </tr>
            ) : !loading && orders.length === 0 ? (
              <tr>
                <td colSpan="8" className="text-center py-10 text-gray-500">No orders found for the selected criteria.</td>
              </tr>
            ) : (
              orders.map((order) => {
                // Use historical exchange rate for each order when available
                let ghsTotalValue = 0;
                
                if (order.total_amount_ghs && order.total_amount_ghs > 0) {
                  // If we have stored GHS value, check if it's reasonable using the stored exchange rate
                  if (order.exchange_rate && order.total_amount) {
                    const expectedGHS = order.total_amount * order.exchange_rate;
                    const storedGHS = order.total_amount_ghs;
                    const difference = Math.abs(expectedGHS - storedGHS);
                    const percentageDiff = (difference / expectedGHS) * 100;
                    
                    // If stored value is close to expected (within 5%), use it
                    if (percentageDiff < 5) {
                      ghsTotalValue = storedGHS;
                    } else {
                      // Use calculated value with stored rate if difference is too high
                      ghsTotalValue = expectedGHS;
                    }
                  } else {
                    // Fallback to double-conversion detection if no stored rate
                    const currentRatio = order.total_amount_ghs / order.total_amount;
                    if (currentRatio > exchangeRate * 1.2 || currentRatio < exchangeRate * 0.8) {
                      ghsTotalValue = order.total_amount * exchangeRate;
                    } else {
                      ghsTotalValue = order.total_amount_ghs;
                    }
                  }
                } else if (order.total_amount) {
                  // No stored GHS value - calculate using stored rate or current rate
                  const rateToUse = order.exchange_rate || exchangeRate;
                  ghsTotalValue = order.total_amount * rateToUse;
                }
                
                return (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4 text-gray-700">{order.order_number}</td>
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium text-gray-900">
                          {order.customers?.first_name || order.shipping_first_name} {order.customers?.last_name || order.shipping_last_name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {order.customers?.id?.length === 36 ? "Registered" : "Guest"}
                        </p>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-700">{formatPrice(order.total_amount, false, "USD")}</td>
                    <td className="py-3 px-4 text-gray-700">
                      {formatPrice(ghsTotalValue, false, "GHS", true)}
                    </td>
                    <td className="py-3 px-4">
                       <select
                          value={order.status || "pending"}
                          onChange={(e) => onUpdateStatus(order.id, e.target.value)}
                          className={`border rounded px-2 py-1 text-xs ${getOrderStatusClass(order.status)}`}
                        >
                          <option value="pending">Pending</option>
                          <option value="processing">Processing</option>
                          <option value="shipped">Shipped</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPaymentStatusClass(order.payment_status)}`}>
                        {order.payment_status || 'N/A'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-500">
                      {new Date(order.created_at || Date.now()).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="flex items-center gap-1.5 text-xs border-gray-300 hover:bg-gray-100 text-gray-700"
                          onClick={() => onViewDetails(order)}
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Details
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="flex items-center gap-1.5 text-xs border-gray-300 hover:bg-red-100 hover:text-red-700 text-gray-700"
                          onClick={() => onDelete(order.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      { totalItems > 0 && (
        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
          itemsPerPage={itemsPerPage}
          totalItems={totalItems}
          onItemsPerPageChange={onItemsPerPageChange}
        />
      )}
    </>
  );
};

export default OrderTable;
