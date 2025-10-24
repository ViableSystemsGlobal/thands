import React, { createContext, useState, useEffect, useCallback, useContext } from "react";
import adminApiClient from "@/lib/services/adminApiClient";
import { useToast } from "@/components/ui/use-toast";

const IssuedGiftVoucherContext = createContext(null);

export const useIssuedGiftVouchers = () => {
  const context = useContext(IssuedGiftVoucherContext);
  if (!context) {
    throw new Error("useIssuedGiftVouchers must be used within an IssuedGiftVoucherProvider");
  }
  return context;
};

export const IssuedGiftVoucherProvider = ({ children }) => {
  const [issuedVouchers, setIssuedVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: "all", searchTerm: "" });
  const { toast } = useToast();

  const fetchIssuedVouchers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      
      if (filters.status !== 'all') {
        params.append('status', filters.status);
      }
      
      if (filters.searchTerm) {
        params.append('search', filters.searchTerm);
      }

      const response = await adminApiClient.get(`/gift-vouchers?${params.toString()}`);
      const vouchersData = response.data || response;
      setIssuedVouchers(vouchersData.vouchers || vouchersData || []);
    } catch (error) {
      console.error("Error fetching issued gift vouchers:", error);
      toast({
        title: "Error",
        description: "Failed to load issued gift vouchers. " + error.message,
        variant: "destructive",
      });
      setIssuedVouchers([]);
    } finally {
      setLoading(false);
    }
  }, [toast, filters]);

  useEffect(() => {
    fetchIssuedVouchers();
  }, [fetchIssuedVouchers]);
  
  const updateVoucherStatus = async (id, newStatus) => {
    try {
      const response = await adminApiClient.put(`/gift-vouchers/${id}/status`, { status: newStatus });
      const updatedVoucher = response.data || response;
      
      setIssuedVouchers(prev => prev.map(v => v.id === id ? updatedVoucher : v));
      toast({ title: "Success", description: `Voucher status updated to ${newStatus}.` });
    } catch (error) {
       console.error("Error updating voucher status:", error);
       toast({ title: "Error", description: `Failed to update status: ${error.message}`, variant: "destructive" });
    }
  };

  const deleteVoucher = async (id) => {
    try {
      await adminApiClient.delete(`/gift-vouchers/${id}`);
      setIssuedVouchers(prev => prev.filter(v => v.id !== id));
      toast({ title: "Success", description: "Gift voucher deleted successfully." });
    } catch (error) {
      console.error("Error deleting gift voucher:", error);
      toast({ title: "Error", description: `Failed to delete voucher: ${error.message}`, variant: "destructive" });
    }
  };

  const deleteBulkVouchers = async (ids) => {
    try {
      // Delete each voucher individually
      const deletePromises = ids.map(id => adminApiClient.delete(`/gift-vouchers/${id}`));
      await Promise.all(deletePromises);
      
      setIssuedVouchers(prev => prev.filter(v => !ids.includes(v.id)));
      toast({ 
        title: "Success", 
        description: `${ids.length} gift voucher${ids.length > 1 ? 's' : ''} deleted successfully.` 
      });
    } catch (error) {
      console.error("Error deleting gift vouchers:", error);
      toast({ title: "Error", description: `Failed to delete vouchers: ${error.message}`, variant: "destructive" });
    }
  };

  const value = {
    issuedVouchers,
    loading,
    filters,
    setFilters,
    fetchIssuedVouchers,
    updateVoucherStatus,
    deleteVoucher,
    deleteBulkVouchers,
  };

  return <IssuedGiftVoucherContext.Provider value={value}>{children}</IssuedGiftVoucherContext.Provider>;
};
