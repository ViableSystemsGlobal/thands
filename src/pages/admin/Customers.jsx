import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Search, Users, ShoppingBag, Calendar, Download, Loader2, Eye, Trash2, UserX, ChevronUp, ChevronDown, ChevronsUpDown, Check, MoreHorizontal } from "lucide-react";
import { getCustomers, updateCustomer, getCustomerMetrics } from "@/lib/services/adminApi";
import { exportToCSV, exportToPDF } from "@/lib/export";
import PaginationControls from "@/components/admin/PaginationControls";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";

const ITEMS_PER_PAGE_OPTIONS = [10, 20, 50, 100];

const MetricCard = ({ icon: Icon, title, value, color, loading }) => (
  <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
    <div className="flex items-center">
      <div className={`p-3 rounded-full bg-${color}-100`}>
        <Icon className={`w-7 h-7 text-${color}-500`} />
      </div>
      <div className="ml-4">
        <p className="text-sm text-slate-500">{title}</p>
        <p className="text-2xl font-semibold text-slate-800">
          {loading ? <Loader2 className="animate-spin h-5 w-5" /> : value}
        </p>
      </div>
    </div>
  </div>
);

const SortableHeader = ({ children, sortKey, currentSort, onSort }) => {
  const getSortIcon = () => {
    if (currentSort.key !== sortKey) {
      return <ChevronsUpDown className="w-4 h-4 text-slate-400" />;
    }
    return currentSort.direction === 'asc' ? 
      <ChevronUp className="w-4 h-4 text-slate-600" /> : 
      <ChevronDown className="w-4 h-4 text-slate-600" />;
  };

  return (
    <th 
      className="text-left py-3 px-6 text-xs font-semibold text-slate-600 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors"
      onClick={() => onSort(sortKey)}
    >
      <div className="flex items-center justify-between">
        {children}
        {getSortIcon()}
      </div>
    </th>
  );
};

const CustomerDetailsDialog = ({ customer, isOpen, onClose }) => {
  if (!customer) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Customer Details</DialogTitle>
          <DialogDescription>
            Detailed information for {customer.first_name} {customer.last_name}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-600">First Name</label>
              <p className="text-slate-800">{customer.first_name || "N/A"}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-600">Last Name</label>
              <p className="text-slate-800">{customer.last_name || "N/A"}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-600">Email</label>
              <p className="text-slate-800">{customer.email}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-600">Phone</label>
              <p className="text-slate-800">{customer.phone || "N/A"}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-600">Status</label>
              <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                customer.user_id ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {customer.user_id ? 'Registered' : 'Guest'}
              </span>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-600">Customer ID</label>
              <p className="text-slate-800 font-mono text-xs">{customer.id}</p>
            </div>
          </div>

          {/* Address Information */}
          {(customer.address || customer.city || customer.state || customer.country) && (
            <div>
              <h3 className="text-lg font-medium text-slate-800 mb-3">Address Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-sm font-medium text-slate-600">Address</label>
                  <p className="text-slate-800">{customer.address || "N/A"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">City</label>
                  <p className="text-slate-800">{customer.city || "N/A"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">State</label>
                  <p className="text-slate-800">{customer.state || "N/A"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">Country</label>
                  <p className="text-slate-800">{customer.country || "N/A"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">Postal Code</label>
                  <p className="text-slate-800">{customer.postal_code || "N/A"}</p>
                </div>
              </div>
            </div>
          )}

          {/* Order Statistics */}
          <div>
            <h3 className="text-lg font-medium text-slate-800 mb-3">Order Statistics</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <label className="text-sm font-medium text-blue-600">Total Orders</label>
                <p className="text-2xl font-bold text-blue-800">{customer.orders_count || 0}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <label className="text-sm font-medium text-green-600">Total Spent</label>
                <p className="text-2xl font-bold text-green-800">${(parseFloat(customer.total_spent) || 0).toFixed(2)}</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <label className="text-sm font-medium text-purple-600">Avg. Order Value</label>
                <p className="text-2xl font-bold text-purple-800">
                  ${customer.orders_count > 0 ? ((parseFloat(customer.total_spent) || 0) / customer.orders_count).toFixed(2) : '0.00'}
                </p>
              </div>
            </div>
          </div>

          {/* Account Information */}
          <div>
            <h3 className="text-lg font-medium text-slate-800 mb-3">Account Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-600">Joined Date</label>
                <p className="text-slate-800">{new Date(customer.created_at).toLocaleDateString()}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600">Last Updated</label>
                <p className="text-slate-800">{new Date(customer.updated_at).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const CustomerTable = ({ customers, loading, initialLoading, sortConfig, onSort, onViewCustomer, onDeleteCustomer, selectedCustomers, onSelectCustomer, onSelectAll, isAllSelected, isIndeterminate }) => (
  <div className="overflow-x-auto">
    <table className="w-full min-w-[700px]">
      <thead className="bg-slate-50">
        <tr className="border-b border-slate-200">
          <th className="text-left py-3 px-6 text-xs font-semibold text-slate-600 uppercase tracking-wider w-12">
            <Checkbox
              checked={isAllSelected}
              onCheckedChange={onSelectAll}
              ref={(el) => {
                if (el) el.indeterminate = isIndeterminate;
              }}
            />
          </th>
          <SortableHeader sortKey="first_name" currentSort={sortConfig} onSort={onSort}>Name</SortableHeader>
          <SortableHeader sortKey="email" currentSort={sortConfig} onSort={onSort}>Email</SortableHeader>
          <SortableHeader sortKey="phone" currentSort={sortConfig} onSort={onSort}>Phone</SortableHeader>
          <SortableHeader sortKey="user_id" currentSort={sortConfig} onSort={onSort}>Status</SortableHeader>
          <SortableHeader sortKey="orders_count" currentSort={sortConfig} onSort={onSort}>Orders</SortableHeader>
          <SortableHeader sortKey="total_spent" currentSort={sortConfig} onSort={onSort}>Total Spent</SortableHeader>
          <SortableHeader sortKey="created_at" currentSort={sortConfig} onSort={onSort}>Joined</SortableHeader>
          <th className="text-left py-3 px-6 text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {initialLoading ? (
          <tr>
            <td colSpan="9" className="text-center py-10 text-slate-500">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mx-auto mb-2" />
              Loading customer data...
            </td>
          </tr>
        ) : loading && customers.length === 0 && !initialLoading ? (
          <tr>
            <td colSpan="9" className="text-center py-10 text-slate-500">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mx-auto mb-2" />
              Fetching customer data...
            </td>
          </tr>
        ) : !loading && customers.length === 0 ? (
          <tr>
            <td colSpan="9" className="text-center py-10 text-slate-500">No customers found matching your search.</td>
          </tr>
        ) : (
          customers.map((customer) => (
            <tr key={customer.id} className={`hover:bg-slate-50 transition-colors ${selectedCustomers.includes(customer.id) ? 'bg-blue-50' : ''}`}>
              <td className="py-4 px-6 text-sm">
                <Checkbox
                  checked={selectedCustomers.includes(customer.id)}
                  onCheckedChange={(checked) => onSelectCustomer(customer.id, checked)}
                />
              </td>
              <td className="py-4 px-6 text-sm text-slate-700">
                {customer.first_name || "N/A"} {customer.last_name || ""}
              </td>
              <td className="py-4 px-6 text-sm text-slate-700">{customer.email || "N/A"}</td>
              <td className="py-4 px-6 text-sm text-slate-700">{customer.phone || "N/A"}</td>
              <td className="py-4 px-6 text-sm">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  customer.user_id ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {customer.user_id ? 'Registered' : 'Guest'}
                </span>
              </td>
              <td className="py-4 px-6 text-sm text-slate-700 text-center">{customer.orders_count || 0}</td>
              <td className="py-4 px-6 text-sm text-slate-700">
                ${(parseFloat(customer.total_spent) || 0).toFixed(2)}
              </td>
              <td className="py-4 px-6 text-sm text-slate-700">
                {new Date(customer.created_at).toLocaleDateString()}
              </td>
              <td className="py-4 px-6 text-sm">
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onViewCustomer(customer)}
                    className="h-8 w-8 p-0"
                    title="View Details"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDeleteCustomer(customer)}
                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                    title={customer.user_id ? "Deactivate Account" : "Delete Customer"}
                  >
                    {customer.user_id ? <UserX className="h-4 w-4" /> : <Trash2 className="h-4 w-4" />}
                  </Button>
                </div>
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  </div>
);

const BulkActionsBar = ({ selectedCount, onBulkDelete, onBulkDeactivate, onBulkExport, onClearSelection }) => {
  if (selectedCount === 0) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 flex items-center justify-between"
    >
      <div className="flex items-center space-x-4">
        <span className="text-sm font-medium text-blue-800">
          {selectedCount} customer{selectedCount > 1 ? 's' : ''} selected
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={onClearSelection}
          className="text-blue-600 border-blue-300 hover:bg-blue-100"
        >
          Clear Selection
        </Button>
      </div>
      
      <div className="flex items-center space-x-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="text-blue-600 border-blue-300 hover:bg-blue-100">
              <MoreHorizontal className="h-4 w-4 mr-2" />
              Bulk Actions
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onBulkExport}>
              <Download className="h-4 w-4 mr-2" />
              Export Selected
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onBulkDeactivate}>
              <UserX className="h-4 w-4 mr-2" />
              Deactivate Registered
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onBulkDelete} className="text-red-600">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Selected
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.div>
  );
};

const Customers = () => {
  const { toast } = useToast();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(ITEMS_PER_PAGE_OPTIONS[0]);
  const [totalCustomersCount, setTotalCustomersCount] = useState(0);

  // Sorting state
  const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' });

  // Dialog states
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showCustomerDetails, setShowCustomerDetails] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState(null);

  const [metrics, setMetrics] = useState({
    totalCustomers: 0,
    newCustomersThisMonth: 0, // Renamed for clarity
    averageOrderValue: 0
  });

  const [selectedCustomers, setSelectedCustomers] = useState([]);
  const [isAllSelected, setIsAllSelected] = useState(false);
  const [isIndeterminate, setIsIndeterminate] = useState(false);

  // Fetch metrics separately for ALL customers
  const fetchMetricsCallback = useCallback(async () => {
    try {
      console.log('🔍 Admin Customers: Fetching metrics for all customers...');
      const metricsData = await getCustomerMetrics();
      console.log('✅ Admin Customers: Metrics fetched:', metricsData);
      
      const metricsDataActual = metricsData?.data || metricsData || {};
      setMetrics({
        totalCustomers: metricsDataActual.totalCustomers || 0,
        newCustomersThisMonth: metricsDataActual.newCustomersThisMonth || 0,
        averageOrderValue: metricsDataActual.averageOrderValue || 0
      });
    } catch (error) {
      console.error("❌ Admin Customers: Error fetching metrics:", error);
    }
  }, []);

  const fetchCustomersData = useCallback(async () => {
    setLoading(true);
    try {
      console.log('🔍 Admin Customers: Starting to fetch customers...');

      // Build query parameters for our API
      const params = {
        page: currentPage,
        limit: itemsPerPage,
        search: searchQuery,
        sort_by: sortConfig.key,
        sort_order: sortConfig.direction
      };

      console.log('📊 Admin Customers: Fetching with params:', params);

      // Fetch customers and metrics in parallel
      const [customersResponse, metricsData] = await Promise.all([
        getCustomers(params),
        getCustomerMetrics()
      ]);
      
      console.log('✅ Admin Customers: Customers fetched:', customersResponse.customers?.length || 0);
      console.log('📊 Admin Customers: Pagination:', customersResponse.pagination);
      console.log('✅ Admin Customers: Metrics fetched:', metricsData);

      const customersData = customersResponse?.data || customersResponse || {};
      const fetchedCustomers = customersData.customers || [];
      setCustomers(fetchedCustomers);
      setTotalCustomersCount(customersData.pagination?.total || 0);

      // Set metrics from the separate API call (for ALL customers)
      const metricsDataActual = metricsData?.data || metricsData || {};
      setMetrics({
        totalCustomers: metricsDataActual.totalCustomers || 0,
        newCustomersThisMonth: metricsDataActual.newCustomersThisMonth || 0,
        averageOrderValue: metricsDataActual.averageOrderValue || 0
      });

      console.log('📊 Admin Customers: Metrics set:', {
        totalCustomers: metricsDataActual.totalCustomers,
        newCustomersThisMonth: metricsDataActual.newCustomersThisMonth,
        averageOrderValue: metricsDataActual.averageOrderValue
      });

    } catch (error) {
      console.error("❌ Admin Customers: Error fetching customers:", error);
      toast({
        title: "Error",
        description: "Failed to fetch customers",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      console.log('🏁 Admin Customers: Fetch completed');
    }
  }, [toast, currentPage, itemsPerPage, searchQuery, sortConfig]);

  useEffect(() => {
    fetchCustomersData();
  }, [fetchCustomersData]);

  useEffect(() => {
    setCurrentPage(1); // Reset to first page when search query changes
  }, [searchQuery]);


  const handleExportCSV = async () => {
    try {
      console.log('📤 Admin Customers: Starting CSV export...');
      
      // Fetch all customers for export using our API
      const response = await getCustomers({
        page: 1,
        limit: 1000, // Large limit to get all customers
        search: searchQuery,
        sort_by: 'created_at',
        sort_order: 'desc'
      });

      if (!response.customers) {
        toast({ title: "Export Error", description: "Could not fetch data for CSV export.", variant: "destructive" });
        return;
      }

      const dataToExport = response.customers.map(c => ({
        ID: c.id,
        FirstName: c.first_name,
        LastName: c.last_name,
        Email: c.email,
        Phone: c.phone,
        Status: c.user_id ? 'Registered' : 'Guest',
        Orders: c.orders_count || 0,
        TotalSpent: (parseFloat(c.total_spent) || 0).toFixed(2),
        Joined: new Date(c.created_at).toLocaleDateString(),
      }));

      exportToCSV(dataToExport, "customers");
      toast({ title: "Export Complete", description: "Customer data exported successfully." });
    } catch (error) {
      console.error("❌ Admin Customers: CSV export error:", error);
      toast({ title: "Export Error", description: "Could not export customer data.", variant: "destructive" });
    }
  };

  const handleExportPDF = async () => {
    try {
      console.log('📤 Admin Customers: Starting PDF export...');
      
      // Fetch all customers for export using our API
      const response = await getCustomers({
        page: 1,
        limit: 1000, // Large limit to get all customers
        search: searchQuery,
        sort_by: 'created_at',
        sort_order: 'desc'
      });

      if (!response.customers) {
        toast({ title: "Export Error", description: "Could not fetch data for PDF export.", variant: "destructive" });
        return;
      }

      const headers = ["Name", "Email", "Phone", "Status", "Orders", "Total Spent", "Joined"];
      const body = response.customers.map(c => [
        `${c.first_name || ""} ${c.last_name || ""}`,
        c.email || "N/A",
        c.phone || "N/A",
        c.user_id ? 'Registered' : 'Guest',
        c.orders_count || 0,
        `${(parseFloat(c.total_spent) || 0).toFixed(2)}`,
        new Date(c.created_at).toLocaleDateString(),
      ]);
      
      exportToPDF("Customers List", headers, body, "customers");
      toast({ title: "Export Complete", description: "Customer data exported successfully." });
    } catch (error) {
      console.error("❌ Admin Customers: PDF export error:", error);
      toast({ title: "Export Error", description: "Could not export customer data.", variant: "destructive" });
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (value) => {
    setItemsPerPage(value);
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(totalCustomersCount / itemsPerPage);

  // Handler functions
  const handleSort = (key) => {
    setSortConfig(prevSort => ({
      key,
      direction: prevSort.key === key && prevSort.direction === 'asc' ? 'desc' : 'asc'
    }));
    setCurrentPage(1); // Reset to first page when sorting
  };

  const handleViewCustomer = (customer) => {
    setSelectedCustomer(customer);
    setShowCustomerDetails(true);
  };

  const handleDeleteCustomer = (customer) => {
    setCustomerToDelete(customer);
    setShowDeleteDialog(true);
  };

  const confirmDeleteCustomer = async () => {
    if (!customerToDelete) return;

    try {
      console.log('🗑️ Admin Customers: Deleting/deactivating customer:', customerToDelete.id);
      
      if (customerToDelete.user_id) {
        // For registered users, deactivate by setting user_id to null
        await updateCustomer(customerToDelete.id, { 
          user_id: null,
          updated_at: new Date().toISOString()
        });

        toast({
          title: "Success",
          description: "Customer account has been deactivated",
        });
      } else {
        // For guest customers, we'll deactivate them since we don't have delete endpoint yet
        await updateCustomer(customerToDelete.id, { 
          is_active: false,
          updated_at: new Date().toISOString()
        });

        toast({
          title: "Success",
          description: "Guest customer has been deactivated",
        });
      }

      // Refresh both customers and metrics
      await Promise.all([fetchCustomersData(), fetchMetricsCallback()]);
    } catch (error) {
      console.error("❌ Admin Customers: Error deleting/deactivating customer:", error);
      toast({
        title: "Error",
        description: "Failed to delete/deactivate customer",
        variant: "destructive",
      });
    } finally {
      setShowDeleteDialog(false);
      setCustomerToDelete(null);
    }
  };

  const handleSelectCustomer = (id, checked) => {
    if (checked) {
      setSelectedCustomers([...selectedCustomers, id]);
    } else {
      setSelectedCustomers(selectedCustomers.filter((i) => i !== id));
    }
  };

  const handleSelectAll = () => {
    if (selectedCustomers.length === customers.length) {
      setSelectedCustomers([]);
      setIsAllSelected(false);
      setIsIndeterminate(false);
    } else {
      setSelectedCustomers(customers.map((customer) => customer.id));
      setIsAllSelected(true);
      setIsIndeterminate(false);
    }
  };

  const handleClearSelection = () => {
    setSelectedCustomers([]);
    setIsAllSelected(false);
    setIsIndeterminate(false);
  };

  const handleBulkExport = async () => {
    const selectedCustomerData = customers.filter(c => selectedCustomers.includes(c.id));
    const dataToExport = selectedCustomerData.map(c => ({
      ID: c.id,
      FirstName: c.first_name,
      LastName: c.last_name,
      Email: c.email,
      Phone: c.phone,
      Status: c.user_id ? 'Registered' : 'Guest',
      Orders: c.orders_count || 0,
      TotalSpent: (parseFloat(c.total_spent) || 0).toFixed(2),
      Joined: new Date(c.created_at).toLocaleDateString(),
    }));
    exportToCSV(dataToExport, "selected_customers");
    toast({
      title: "Success",
      description: `Exported ${selectedCustomers.length} customers`,
    });
  };

  const handleBulkDeactivate = async () => {
    const registeredCustomers = customers.filter(c => 
      selectedCustomers.includes(c.id) && c.user_id
    );
    
    if (registeredCustomers.length === 0) {
      toast({
        title: "No Action Needed",
        description: "No registered customers selected for deactivation",
        variant: "destructive",
      });
      return;
    }

    try {
      // Deactivate each registered customer individually using our API
      const updatePromises = registeredCustomers.map(customer => 
        updateCustomer(customer.id, { 
          user_id: null,
          updated_at: new Date().toISOString()
        })
      );

      await Promise.all(updatePromises);

      toast({
        title: "Success",
        description: `Deactivated ${registeredCustomers.length} registered customer accounts`,
      });

      fetchCustomersData();
      handleClearSelection();
    } catch (error) {
      console.error("Error deactivating customers:", error);
      toast({
        title: "Error",
        description: "Failed to deactivate customers",
        variant: "destructive",
      });
    }
  };

  const handleBulkDelete = () => {
    setShowDeleteDialog(true);
  };

  const confirmBulkDelete = async () => {
    try {
      // For now, we'll deactivate customers instead of deleting them
      // since we don't have a bulk delete endpoint yet
      const updatePromises = selectedCustomers.map(customerId => {
        const customer = customers.find(c => c.id === customerId);
        return updateCustomer(customerId, { 
          is_active: false,
          updated_at: new Date().toISOString()
        });
      });

      await Promise.all(updatePromises);

      toast({
        title: "Success",
        description: `Deactivated ${selectedCustomers.length} customers`,
      });

      fetchCustomersData();
      handleClearSelection();
    } catch (error) {
      console.error("Error deactivating customers:", error);
      toast({
        title: "Error",
        description: "Failed to deactivate customers",
        variant: "destructive",
      });
    } finally {
      setShowDeleteDialog(false);
    }
  };

  // Update selection state when customers change
  useEffect(() => {
    if (customers.length === 0) {
      setSelectedCustomers([]);
      setIsAllSelected(false);
      setIsIndeterminate(false);
      return;
    }

    const validSelectedCustomers = selectedCustomers.filter(id => 
      customers.some(customer => customer.id === id)
    );
    
    if (validSelectedCustomers.length !== selectedCustomers.length) {
      setSelectedCustomers(validSelectedCustomers);
    }

    const allSelected = validSelectedCustomers.length === customers.length && customers.length > 0;
    const someSelected = validSelectedCustomers.length > 0 && validSelectedCustomers.length < customers.length;
    
    setIsAllSelected(allSelected);
    setIsIndeterminate(someSelected);
  }, [customers, selectedCustomers]);

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-slate-50 to-gray-100 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <h1 className="text-3xl md:text-4xl font-light text-slate-800">Customer Management</h1>
        <div className="flex space-x-2">
          <Button onClick={handleExportCSV} variant="outline" className="bg-white shadow-sm hover:bg-slate-50">
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>
          <Button onClick={handleExportPDF} variant="outline" className="bg-white shadow-sm hover:bg-slate-50">
            <Download className="mr-2 h-4 w-4" /> Export PDF
          </Button>
        </div>
      </div>

      <motion.div 
        className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <MetricCard icon={Users} title="Total Customers" value={metrics.totalCustomers || 0} color="blue" loading={loading && customers.length === 0 && currentPage === 1} />
        <MetricCard icon={Calendar} title="New This Month" value={metrics.newCustomersThisMonth || 0} color="green" loading={loading && customers.length === 0 && currentPage === 1} />
        <MetricCard icon={ShoppingBag} title="Avg. Order Value" value={`$${(metrics.averageOrderValue || 0).toFixed(2)}`} color="purple" loading={loading && customers.length === 0 && currentPage === 1} />
      </motion.div>

      <motion.div 
        className="bg-white rounded-xl shadow-lg overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <div className="p-6 border-b border-slate-200">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search customers by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-shadow"
            />
          </div>
        </div>
        
        <BulkActionsBar
          selectedCount={selectedCustomers.length}
          onBulkDelete={handleBulkDelete}
          onBulkDeactivate={handleBulkDeactivate}
          onBulkExport={handleBulkExport}
          onClearSelection={handleClearSelection}
        />
        
        <CustomerTable 
          customers={customers} 
          loading={loading} 
          initialLoading={loading && customers.length === 0 && currentPage === 1}
          sortConfig={sortConfig}
          onSort={handleSort}
          onViewCustomer={handleViewCustomer}
          onDeleteCustomer={handleDeleteCustomer}
          selectedCustomers={selectedCustomers}
          onSelectCustomer={handleSelectCustomer}
          onSelectAll={handleSelectAll}
          isAllSelected={isAllSelected}
          isIndeterminate={isIndeterminate}
        />
        
        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          itemsPerPage={itemsPerPage}
          totalItems={totalCustomersCount}
          onItemsPerPageChange={handleItemsPerPageChange}
        />
      </motion.div>

      {selectedCustomer && (
        <CustomerDetailsDialog
          customer={selectedCustomer}
          isOpen={showCustomerDetails}
          onClose={() => setShowCustomerDetails(false)}
        />
      )}

      {showDeleteDialog && (customerToDelete || selectedCustomers.length > 0) && (
        <AlertDialog open={showDeleteDialog} onOpenChange={() => setShowDeleteDialog(false)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {customerToDelete 
                  ? (customerToDelete.user_id ? 'Deactivate Customer Account?' : 'Delete Guest Customer?')
                  : `Delete ${selectedCustomers.length} Selected Customer${selectedCustomers.length > 1 ? 's' : ''}?`
                }
              </AlertDialogTitle>
              <AlertDialogDescription>
                {customerToDelete 
                  ? (customerToDelete.user_id 
                      ? 'This will deactivate the customer account by removing the link to their user account. Their order history will be preserved, but they will need to create a new account to log in again.'
                      : 'This will permanently delete this guest customer record and cannot be undone. Their order history will be preserved.'
                    )
                  : `This will permanently delete ${selectedCustomers.length} customer record${selectedCustomers.length > 1 ? 's' : ''} and cannot be undone. Order history will be preserved.`
                }
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => {
                setShowDeleteDialog(false);
                setCustomerToDelete(null);
              }}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction 
                onClick={customerToDelete ? confirmDeleteCustomer : confirmBulkDelete}
                className={customerToDelete?.user_id ? "bg-orange-600 hover:bg-orange-700" : "bg-red-600 hover:bg-red-700"}
              >
                {customerToDelete 
                  ? (customerToDelete.user_id ? 'Deactivate' : 'Delete')
                  : 'Delete Selected'
                }
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
};

export default Customers;
