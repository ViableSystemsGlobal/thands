import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import adminApiClient from "@/lib/services/adminApiClient";
import { Plus, Edit2, Trash2, Loader2, PackageSearch } from "lucide-react";
import ShippingRuleFormDialog from "@/components/admin/shipping/ShippingRuleFormDialog";
import ShippingRulesTable from "@/components/admin/shipping/ShippingRulesTable";

const ShippingRules = () => {
  const { toast } = useToast();
  const [rules, setRules] = useState([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editingRule, setEditingRule] = useState(null);

  const fetchRules = useCallback(async () => {
    setLoading(true);
    try {
      const response = await adminApiClient.get("/shipping");
      // Map backend response to frontend format
      const mappedRules = (response.data || []).map(rule => ({
        ...rule,
        countries: rule.country ? [rule.country] : [],
        min_amount: rule.min_order_value,
        max_amount: rule.max_order_value,
        shipping_fee: rule.shipping_cost,
        delivery_time: rule.estimated_days_min && rule.estimated_days_max 
          ? `${rule.estimated_days_min}-${rule.estimated_days_max}` 
          : null,
        carrier: null // Not in backend schema
      }));
      setRules(mappedRules);
    } catch (error) {
      toast({
        title: "Error Fetching Rules",
        description: error.message || "Failed to fetch shipping rules.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  const handleFormSubmit = async (formData, isEditing) => {
    try {
      const ruleData = {
        name: formData.name,
        country: formData.countries && formData.countries.length > 0 ? formData.countries[0] : null,
        state: formData.state || null,
        min_order_value: formData.min_amount ? Number(formData.min_amount) : 0,
        max_order_value: formData.max_amount ? Number(formData.max_amount) : null,
        shipping_cost: Number(formData.shipping_fee),
        estimated_days_min: formData.delivery_time ? parseInt(formData.delivery_time.split('-')[0]) : null,
        estimated_days_max: formData.delivery_time ? parseInt(formData.delivery_time.split('-')[1]) : null,
        is_active: formData.is_active !== undefined ? formData.is_active : true,
      };

      let response;
      if (isEditing) {
        response = await adminApiClient.put(`/shipping/${editingRule.id}`, ruleData);
      } else {
        response = await adminApiClient.post("/shipping", ruleData);
      }

      toast({
        title: "Success",
        description: `Shipping rule ${isEditing ? "updated" : "created"} successfully.`,
        variant: "success",
      });

      setIsDialogOpen(false);
      setEditingRule(null);
      fetchRules();
      return true; 
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || `Failed to ${isEditing ? "update" : "create"} shipping rule.`,
        variant: "destructive",
      });
      return false;
    }
  };

  const handleEdit = (rule) => {
    setEditingRule(rule);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id) => {
    try {
      await adminApiClient.delete(`/shipping/${id}`);

      toast({
        title: "Success",
        description: "Shipping rule deleted successfully.",
        variant: "success",
      });
      fetchRules();
    } catch (error) {
      toast({
        title: "Error Deleting Rule",
        description: error.message || "Failed to delete shipping rule.",
        variant: "destructive",
      });
    }
  };
  
  const openNewRuleDialog = () => {
    setEditingRule(null);
    setIsDialogOpen(true);
  };

  if (loading) {
    return (
        <div className="p-8 flex justify-center items-center min-h-[calc(100vh-theme(spacing.16))] bg-gradient-to-br from-slate-50 to-gray-100">
          <Loader2 className="h-12 w-12 animate-spin text-indigo-600" />
        </div>
    );
  }

  return (
      <div className="p-4 md:p-8 bg-gradient-to-br from-slate-50 to-gray-100 min-h-full">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-light text-gray-800">Shipping Rules</h1>
            <p className="text-gray-500 mt-1">Manage your shipping configurations and fees.</p>
          </div>
          <Button onClick={openNewRuleDialog} className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 ease-in-out transform hover:scale-105 shadow-lg hover:shadow-xl">
            <Plus className="w-5 h-5 mr-2" />
            Add New Rule
          </Button>
        </div>

        <ShippingRuleFormDialog
          isOpen={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          onSubmit={handleFormSubmit}
          initialData={editingRule}
          onClose={() => setEditingRule(null)}
        />
        
        {rules.length === 0 ? (
           <div className="text-center py-10 bg-white rounded-lg shadow-md border border-dashed border-slate-300">
            <PackageSearch className="mx-auto h-16 w-16 text-slate-400" />
            <h3 className="mt-4 text-lg font-semibold text-slate-800">No Shipping Rules Found</h3>
            <p className="mt-2 text-sm text-slate-500">Get started by adding your first shipping rule.</p>
            <Button onClick={openNewRuleDialog} className="mt-6 bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:from-indigo-600 hover:to-purple-600">
                <Plus className="w-4 h-4 mr-2" />
                Add Shipping Rule
            </Button>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden"
          >
            <ShippingRulesTable rules={rules} onEdit={handleEdit} onDelete={handleDelete} />
          </motion.div>
        )}
      </div>
  );
};

export default ShippingRules;
