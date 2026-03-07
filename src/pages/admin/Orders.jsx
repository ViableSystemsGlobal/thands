import React, { useState, useEffect, useCallback } from "react";
import { useToast } from "@/components/ui/use-toast";
import { getOrders, updateOrderStatus, bulkUpdateOrderStatus, bulkDeleteOrders } from "@/lib/services/adminApi";
import OrderMetrics from "@/components/admin/orders/OrderMetrics";
import OrderTable from "@/components/admin/orders/OrderTable";
import OrderFilters from "@/components/admin/orders/OrderFilters";
import CreateOrderDialog from "@/components/admin/orders/CreateOrderDialog";
import { useCurrency } from "@/context/CurrencyContext";
import { Loader2, Plus, Trash2, CheckSquare } from "lucide-react";
import { Button } from "@/components/ui/button";

const ITEMS_PER_PAGE_OPTIONS = [10, 20, 50, 100];

const OrdersContent = () => {
  const { toast } = useToast();
  const { exchangeRate, loadingRate } = useCurrency();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedOrderIds, setSelectedOrderIds] = useState([]);
  const [bulkStatusValue, setBulkStatusValue] = useState('');
  const [bulkLoading, setBulkLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentTab, setCurrentTab] = useState("all");
  const [dateRange, setDateRange] = useState("month"); 
  
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(ITEMS_PER_PAGE_OPTIONS[0]);
  const [totalOrdersCount, setTotalOrdersCount] = useState(0);

  const [metrics, setMetrics] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    averageOrderValueUSD: 0,
    totalOrderValueUSD: 0,
    averageOrderValueGHS: 0,
    totalOrderValueGHS: 0,
  });

  const getDateFilterRange = useCallback(() => {
    const now = new Date();
    let start = new Date(now);
    
    switch (dateRange) {
      case "today":
        start.setHours(0, 0, 0, 0);
        return { start, end: now };
      case "7days":
        start.setDate(now.getDate() - 7);
        start.setHours(0,0,0,0);
        return { start, end: now };
      case "month":
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        return { start, end: now };
      case "ytd":
        start = new Date(now.getFullYear(), 0, 1);
        return { start, end: now };
      case "all_time":
        return { start: null, end: null }; 
      default: 
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        return { start, end: now };
    }
  }, [dateRange]);



  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      // Don't proceed if exchange rate is still loading for accurate calculations
      if (loadingRate) {
        return;
      }

      console.log('🔍 Admin Orders: Starting to fetch orders...');

      // Build query parameters for our API
      const { start, end } = getDateFilterRange();
      const params = {
        page: currentPage,
        limit: itemsPerPage,
        search: searchQuery,
        start_date: start?.toISOString(),
        end_date: end?.toISOString()
      };

      // Add status filters based on current tab
      switch (currentTab) {
        case "completed":
          params.status = "delivered";
          params.payment_status = "paid";
          break;
        case "in-progress":
          // This is complex - we'll handle it in the backend or filter on frontend
          break;
        case "pending_payment":
          params.payment_status = "pending";
          params.status = "!cancelled";
          break;
        default: // all
          break;
      }

      console.log('📊 Admin Orders: Fetching with params:', params);

      // Fetch orders using our new API
      const response = await getOrders(params);
      
      console.log('✅ Admin Orders: Orders fetched:', response.orders?.length || 0);
      console.log('📊 Admin Orders: Pagination:', response.pagination);

      const fetchedOrders = response.orders || [];
      setOrders(fetchedOrders);
      setTotalOrdersCount(response.pagination?.total || 0);

      // Calculate metrics from the fetched orders
      const totalOrdersCountMetric = fetchedOrders.length;
      const pendingOrdersCount = fetchedOrders.filter(order => 
        order.status?.toLowerCase() === 'pending'
      ).length;
      
      const totalValueUSD = fetchedOrders.reduce((sum, order) => {
        // Use base_total (database field) or total_amount (fallback)
        let usdValue = parseFloat(order.base_total || order.total_amount || 0);
        const ghsValue = parseFloat(order.base_total_ghs || order.total_amount_ghs || 0);
        
        // If USD is 0 but GHS has a value, calculate USD from GHS
        if (usdValue === 0 && ghsValue > 0) {
          const rateToUse = order.exchange_rate || exchangeRate || 16;
          usdValue = ghsValue / rateToUse;
        }
        
        return sum + usdValue;
      }, 0);
      
      const totalValueGHS = fetchedOrders.reduce((sum, order) => {
        // Use base_total_ghs (database field) or total_amount_ghs (fallback)
        let ghsValue = parseFloat(order.base_total_ghs || order.total_amount_ghs || 0);
        const usdValue = parseFloat(order.base_total || order.total_amount || 0);
        
        // If GHS is 0 but USD has a value, calculate GHS from USD
        if (ghsValue === 0 && usdValue > 0) {
          const rateToUse = order.exchange_rate || exchangeRate || 16;
          ghsValue = usdValue * rateToUse;
        }
        
        return sum + ghsValue;
      }, 0);
      
      setMetrics({
        totalOrders: totalOrdersCountMetric,
        pendingOrders: pendingOrdersCount,
        totalOrderValueUSD: totalValueUSD,
        averageOrderValueUSD: totalOrdersCountMetric > 0 ? totalValueUSD / totalOrdersCountMetric : 0,
        totalOrderValueGHS: totalValueGHS,
        averageOrderValueGHS: totalOrdersCountMetric > 0 ? totalValueGHS / totalOrdersCountMetric : 0,
      });

      console.log('📊 Admin Orders: Metrics calculated:', {
        totalOrders: totalOrdersCountMetric,
        pendingOrders: pendingOrdersCount,
        totalValueUSD,
        totalValueGHS
      });

    } catch (error) {
      console.error("❌ Admin Orders: Error fetching orders:", error);
      toast({
        title: "Error Fetching Orders",
        description: error.message || "Failed to fetch orders. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      console.log('🏁 Admin Orders: Fetch completed');
    }
  }, [currentPage, itemsPerPage, searchQuery, currentTab, dateRange, getDateFilterRange, toast, exchangeRate, loadingRate]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);
  
  useEffect(() => {
    setCurrentPage(1);
    setSelectedOrderIds([]);
  }, [searchQuery, currentTab, dateRange]);


  const handleUpdateOrderStatus = async (orderId, status) => {
    try {
      console.log('🔄 Admin Orders: Updating order status:', { orderId, status });
      
      await updateOrderStatus(orderId, status, null);

      // Optimistic update for UI responsiveness
      setOrders(prevOrders => prevOrders.map(order =>
        order.id === orderId ? { ...order, status } : order
      ));
      
      fetchOrders(); // Re-fetch to ensure data consistency and update metrics

      toast({
        title: "Success",
        description: "Order status updated successfully.",
        variant: "success",
      });
    } catch (error) {
      console.error("❌ Admin Orders: Error updating order status:", error);
      toast({
        title: "Error Updating Status",
        description: error.message || "Failed to update order status.",
        variant: "destructive",
      });
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (value) => {
    setItemsPerPage(value);
    setCurrentPage(1);
  };
  
  const totalPages = Math.ceil(totalOrdersCount / itemsPerPage);

  const handleDeleteOrder = async (orderId) => {
    toast({
      title: "Feature Not Available",
      description: "Use bulk selection to delete orders.",
      variant: "destructive",
    });
  };

  const handleBulkStatusUpdate = async () => {
    if (!bulkStatusValue || selectedOrderIds.length === 0) return;
    setBulkLoading(true);
    try {
      const isPaymentStatus = ['paid', 'pending', 'failed'].includes(bulkStatusValue);
      await bulkUpdateOrderStatus(
        selectedOrderIds,
        isPaymentStatus ? undefined : bulkStatusValue,
        isPaymentStatus ? bulkStatusValue : undefined
      );
      toast({
        title: 'Success',
        description: `Updated ${selectedOrderIds.length} order(s) to "${bulkStatusValue}".`,
        variant: 'success',
      });
      setSelectedOrderIds([]);
      setBulkStatusValue('');
      fetchOrders();
    } catch (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setBulkLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedOrderIds.length === 0) return;
    if (!window.confirm(`Permanently delete ${selectedOrderIds.length} order(s)? This cannot be undone.`)) return;
    setBulkLoading(true);
    try {
      await bulkDeleteOrders(selectedOrderIds);
      toast({
        title: 'Deleted',
        description: `${selectedOrderIds.length} order(s) deleted.`,
        variant: 'success',
      });
      setSelectedOrderIds([]);
      fetchOrders();
    } catch (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setBulkLoading(false);
    }
  };

  if (loading && orders.length === 0 && currentPage === 1) { 
    return (
      <div className="p-4 md:p-8 bg-gradient-to-br from-slate-50 to-gray-100 min-h-screen flex justify-center items-center">
        <Loader2 className="h-12 w-12 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
      <div className="p-4 md:p-8 bg-gradient-to-br from-slate-50 to-gray-100 min-h-screen">
        <div className="flex justify-end mb-4">
          <Button
            onClick={() => setIsCreateDialogOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Order
          </Button>
        </div>
        <OrderFilters
          currentTab={currentTab}
          onTabChange={setCurrentTab}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
        />
        <OrderMetrics metrics={metrics} loading={loading && orders.length > 0 && currentPage === 1} />
        {/* Bulk actions bar */}
        {selectedOrderIds.length > 0 && (
          <div className="flex items-center gap-3 mt-6 px-4 py-3 bg-indigo-50 border border-indigo-200 rounded-xl">
            <CheckSquare className="h-4 w-4 text-indigo-600 shrink-0" />
            <span className="text-sm font-medium text-indigo-800">
              {selectedOrderIds.length} order{selectedOrderIds.length > 1 ? 's' : ''} selected
            </span>
            <div className="flex items-center gap-2 ml-2">
              <select
                className="border border-slate-300 rounded-md px-2 py-1.5 text-sm bg-white"
                value={bulkStatusValue}
                onChange={(e) => setBulkStatusValue(e.target.value)}
              >
                <option value="">Change status…</option>
                <optgroup label="Order Status">
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </optgroup>
                <optgroup label="Payment Status">
                  <option value="paid">Paid</option>
                  <option value="pending">Unpaid (pending)</option>
                  <option value="failed">Failed</option>
                </optgroup>
              </select>
              <Button
                size="sm"
                disabled={!bulkStatusValue || bulkLoading}
                onClick={handleBulkStatusUpdate}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                {bulkLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Apply'}
              </Button>
            </div>
            <Button
              size="sm"
              variant="outline"
              disabled={bulkLoading}
              onClick={handleBulkDelete}
              className="ml-auto border-red-300 text-red-600 hover:bg-red-50"
            >
              <Trash2 className="h-3.5 w-3.5 mr-1" />
              Delete Selected
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setSelectedOrderIds([])}
              className="text-slate-500"
            >
              Clear
            </Button>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-xl border border-gray-200 mt-4">
          <OrderTable
            orders={orders}
            onUpdateStatus={handleUpdateOrderStatus}
            onDelete={handleDeleteOrder}
            onSelectionChange={setSelectedOrderIds}
            loading={loading}
            initialLoading={loading && orders.length === 0 && currentPage === 1}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            itemsPerPage={itemsPerPage}
            totalItems={totalOrdersCount}
            onItemsPerPageChange={handleItemsPerPageChange}
          />
        </div>
        <CreateOrderDialog
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
          onSave={fetchOrders}
        />
      </div>
  );
};

const Orders = () => {
  return <OrdersContent />;
};
export default Orders;
