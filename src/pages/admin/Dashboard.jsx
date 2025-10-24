
import React, { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";
import { getDashboardStats } from "@/lib/services/adminApi";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  BarElement, 
  ArcElement 
} from 'chart.js';

import DashboardStats from "@/components/admin/dashboard/DashboardStats";
import SalesChart from "@/components/admin/dashboard/SalesChart";
import RecentOrders from "@/components/admin/dashboard/RecentOrders";
import RecentActivity from "@/components/admin/dashboard/RecentActivity";
import VisitorAnalytics from "@/components/admin/dashboard/VisitorAnalytics";
import DashboardHeader from "@/components/admin/dashboard/DashboardHeader";
import OrderDetailsDialog from "@/components/admin/OrderDetailsDialog";
import { getDateFilterRange, calculateMonthlySales } from "@/lib/dashboardUtils";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const DashboardContent = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState("month");
  const [stats, setStats] = useState({
    totalCustomers: 0,
    totalOrders: 0,
    totalSales: 0,
    pendingOrders: 0,
  });
  const [recentOrdersData, setRecentOrdersData] = useState([]);
  const [recentActivityData, setRecentActivityData] = useState([]);
  const [salesChartData, setSalesChartData] = useState({
    labels: [],
    datasets: [{
      label: 'Sales',
      data: [],
      borderColor: 'rgb(75, 192, 192)',
      backgroundColor: 'rgba(75, 192, 192, 0.5)',
      tension: 0.4,
    }]
  });
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { start, end } = getDateFilterRange(dateRange);

      // Check if admin is authenticated
      const token = localStorage.getItem('admin_auth_token');
      console.log('🔐 Dashboard: Admin auth token exists:', !!token);
      
      if (!token) {
        throw new Error('No admin authentication token found. Please log in again.');
      }

      // Use new API to get dashboard stats
      console.log('🔍 Dashboard: Fetching dashboard stats...');
      const dashboardData = await getDashboardStats({
        start_date: start?.toISOString(),
        end_date: end?.toISOString()
      });

      console.log('📊 Dashboard: Received data:', dashboardData);

      if (!dashboardData || !dashboardData.success) {
        throw new Error('No data received from dashboard API');
      }

      // Extract the actual data from the API response
      const data = dashboardData.data || dashboardData;
      
      setStats(data.stats || {});
      setRecentOrdersData(data.recentOrders || []);
      setSalesChartData(data.salesChartData || { labels: [], datasets: [] });
      
      // For now, just use orders as recent activity (consultations can be added later)
      // Limit to 5 items
      const activity = (data.recentOrders || []).slice(0, 5).map(o => ({ ...o, type: 'order' }));
      setRecentActivityData(activity);

    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast({
        title: "Error Fetching Data",
        description: error.message || "Failed to fetch dashboard data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [dateRange, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);


  const handleViewOrder = (order) => {
    setSelectedOrder(order);
    setIsOrderDialogOpen(true);
  };
  
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#4A5568', 
          font: {
            size: 14,
            family: 'Inter, sans-serif',
          }
        }
      },
      title: {
        display: false, 
      },
      tooltip: {
        backgroundColor: 'rgba(0,0,0,0.7)',
        titleFont: { size: 14, family: 'Inter, sans-serif' },
        bodyFont: { size: 12, family: 'Inter, sans-serif' },
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(context.parsed.y);
            }
            return label;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: '#E2E8F0', 
        },
        ticks: {
          color: '#718096', 
          font: {
            size: 12,
            family: 'Inter, sans-serif',
          },
          callback: function(value) {
            if (Number.isInteger(value)) {
              return '$' + value.toLocaleString();
            }
            return '$' + value.toFixed(2).toLocaleString();
          }
        }
      },
      x: {
        grid: {
          display: false, 
        },
        ticks: {
          color: '#718096', 
          font: {
            size: 12,
            family: 'Inter, sans-serif',
          }
        }
      }
    },
    interaction: {
      mode: 'index',
      intersect: false,
    },
  };


  return (
      <div className="p-4 md:p-8 space-y-8">
        <DashboardHeader dateRange={dateRange} onDateRangeChange={setDateRange} />
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <DashboardStats stats={stats} loading={loading} />
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <motion.div 
            className="lg:col-span-2"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <SalesChart chartData={salesChartData} chartOptions={chartOptions} loading={loading} />
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <RecentOrders orders={recentOrdersData} onViewOrder={handleViewOrder} loading={loading} />
          </motion.div>
        </div>

        {/* Visitor Analytics and Recent Activity - Side by Side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <VisitorAnalytics stats={stats} loading={loading} />
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <RecentActivity activities={recentActivityData} loading={loading} />
          </motion.div>
        </div>

        <OrderDetailsDialog
          order={selectedOrder}
          open={isOrderDialogOpen}
          onOpenChange={setIsOrderDialogOpen}
        />
      </div>
  );
};


const Dashboard = () => {
  return <DashboardContent />;
};
export default Dashboard;
