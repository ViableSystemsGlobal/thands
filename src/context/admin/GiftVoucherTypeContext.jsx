
import React, { createContext, useState, useEffect, useCallback, useContext } from "react";
import adminApiClient from "@/lib/services/adminApiClient";
import { useToast } from "@/components/ui/use-toast";

const GiftVoucherTypeContext = createContext(null);

export const useGiftVoucherTypes = () => {
  const context = useContext(GiftVoucherTypeContext);
  if (!context) {
    throw new Error("useGiftVoucherTypes must be used within a GiftVoucherTypeProvider");
  }
  return context;
};

export const GiftVoucherTypeProvider = ({ children }) => {
  const [voucherTypes, setVoucherTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingVoucherType, setEditingVoucherType] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    amount: "",
    description: "",
    validity_months: "12",
    image_url: "", 
    is_active: true,
  });
  const { toast } = useToast();

  const fetchVoucherTypes = useCallback(async () => {
    setLoading(true);
    try {
      const response = await adminApiClient.get('/gift-vouchers/types');
      setVoucherTypes(response.data || response || []);
    } catch (error) {
      console.error("Error fetching voucher types:", error);
      toast({
        title: "Error",
        description: "Failed to load gift voucher types",
        variant: "destructive",
      });
      setVoucherTypes([]);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchVoucherTypes();
  }, [fetchVoucherTypes]);

  const resetFormData = useCallback(() => {
    setFormData({
      name: "",
      amount: "",
      description: "",
      validity_months: "12",
      image_url: "",
      is_active: true,
    });
  }, []);

  const handleOpenDialog = (voucherType = null) => {
    if (voucherType) {
      setEditingVoucherType(voucherType);
      setFormData({
        name: voucherType.name,
        amount: (voucherType.amount / 100).toString(),
        description: voucherType.description,
        validity_months: voucherType.validity_months.toString(),
        image_url: voucherType.image_url || "",
        is_active: voucherType.is_active === undefined ? true : voucherType.is_active,
      });
    } else {
      setEditingVoucherType(null);
      resetFormData();
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingVoucherType(null);
    resetFormData();
  };

  const handleSubmit = async () => {
    try {
      const payload = {
        name: formData.name,
        amount: parseInt(formData.amount) * 100, // Convert to cents
        description: formData.description,
        validity_months: parseInt(formData.validity_months),
        image_url: formData.image_url || null,
        is_active: formData.is_active,
      };

      if (editingVoucherType) {
        await adminApiClient.put(`/gift-vouchers/types/${editingVoucherType.id}`, payload);
        toast({ title: "Success", description: "Gift voucher type updated." });
      } else {
        await adminApiClient.post('/gift-vouchers/types', payload);
        toast({ title: "Success", description: "Gift voucher type created." });
      }
      
      handleCloseDialog();
      fetchVoucherTypes();
    } catch (error) {
      console.error("Error saving voucher type:", error);
      toast({ title: "Error", description: `Failed to save: ${error.message}`, variant: "destructive" });
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this voucher type? This action cannot be undone.")) {
      try {
        await adminApiClient.delete(`/gift-vouchers/types/${id}`);
        toast({ title: "Success", description: "Gift voucher type deleted." });
        fetchVoucherTypes();
      } catch (error) {
        console.error("Error deleting voucher type:", error);
        toast({ title: "Error", description: `Failed to delete: ${error.message}`, variant: "destructive" });
      }
    }
  };

  const value = {
    voucherTypes,
    loading,
    isDialogOpen,
    editingVoucherType,
    formData,
    setFormData,
    fetchVoucherTypes,
    handleOpenDialog,
    handleCloseDialog,
    handleSubmit,
    handleDelete,
  };

  return <GiftVoucherTypeContext.Provider value={value}>{children}</GiftVoucherTypeContext.Provider>;
};
