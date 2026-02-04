import React, { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";
import { getDashboardStats } from "@/lib/services/adminApi";

const DashboardSimple = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getDashboardStats();
      if (response.success) {
        setStats(response.data);
      } else {
        toast({
          title: "Error",
          description: "Failed to load dashboard data",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D2B48C] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div 
          className="bg-white p-6 rounded-xl shadow-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h3 className="text-lg font-semibold text-gray-800">Total Sales</h3>
          <p className="text-2xl font-bold text-green-600">
            ${stats?.total_sales || 0}
          </p>
        </motion.div>
        
        <motion.div 
          className="bg-white p-6 rounded-xl shadow-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <h3 className="text-lg font-semibold text-gray-800">Total Orders</h3>
          <p className="text-2xl font-bold text-blue-600">
            {stats?.total_orders || 0}
          </p>
        </motion.div>
        
        <motion.div 
          className="bg-white p-6 rounded-xl shadow-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <h3 className="text-lg font-semibold text-gray-800">Total Customers</h3>
          <p className="text-2xl font-bold text-purple-600">
            {stats?.total_customers || 0}
          </p>
        </motion.div>
        
        <motion.div 
          className="bg-white p-6 rounded-xl shadow-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <h3 className="text-lg font-semibold text-gray-800">Pending Orders</h3>
          <p className="text-2xl font-bold text-orange-600">
            {stats?.pending_orders || 0}
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default DashboardSimple;
