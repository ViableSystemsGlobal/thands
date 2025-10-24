import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Calendar as CalendarIcon, 
  BarChart3, 
  Users, 
  ShoppingCart, 
  Loader2,
  Download,
  RefreshCw,
  Package,
  CreditCard,
  Eye,
  Filter,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Line, Bar, Pie, Doughnut } from 'react-chartjs-2';
import { getSalesAnalytics } from "@/lib/services/adminApi";
import { exportToCSV, exportToPDF } from "@/lib/export";
import { format, subDays, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, parseISO, isWithinInterval } from 'date-fns';
import { cn } from "@/lib/utils";

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

const SalesContent = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dateRange, setDateRange] = useState({
    from: subDays(new Date(), 30),
    to: new Date()
  });
  const [timeframe, setTimeframe] = useState("daily"); // daily, weekly, monthly
  const [comparisonPeriod, setComparisonPeriod] = useState("previous"); // previous, year_ago
  
  // Data states
  const [salesData, setSalesData] = useState({ labels: [], datasets: [] });
  const [categoryData, setCategoryData] = useState({ labels: [], datasets: [] });
  const [productPerformanceData, setProductPerformanceData] = useState({ labels: [], datasets: [] });
  const [paymentMethodData, setPaymentMethodData] = useState({ labels: [], datasets: [] });
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [topCustomers, setTopCustomers] = useState([]);
  
  // Metrics states
  const [metrics, setMetrics] = useState({
    totalSales: 0,
    totalSalesChange: 0,
    averageOrderValue: 0,
    averageOrderValueChange: 0,
    totalOrders: 0,
    totalOrdersChange: 0,
    newCustomers: 0,
    newCustomersChange: 0,
    conversionRate: 0,
    conversionRateChange: 0,
    refundRate: 0,
    refundRateChange: 0
  });

  // Chart configurations
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { 
        position: 'top',
        labels: { 
          color: '#64748B', 
          font: { size: 12, family: 'Inter' },
          usePointStyle: true,
          padding: 20
        } 
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        titleColor: '#F8FAFC',
        bodyColor: '#F8FAFC',
        borderColor: '#334155',
        borderWidth: 1,
        cornerRadius: 8,
        titleFont: { size: 14, weight: 'bold' }, 
        bodyFont: { size: 12 },
        padding: 12,
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) label += ': ';
            if (context.parsed.y !== null) {
              label += new Intl.NumberFormat('en-US', { 
                style: 'currency', 
                currency: 'USD' 
              }).format(context.parsed.y);
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
          color: '#F1F5F9',
          drawBorder: false
        },
        border: { display: false },
        ticks: { 
          color: '#64748B', 
          font: { size: 11, family: 'Inter' },
          callback: value => '$' + value.toLocaleString()
        }
      },
      x: {
        grid: { display: false },
        border: { display: false },
        ticks: { 
          color: '#64748B', 
          font: { size: 11, family: 'Inter' }
        }
      }
    },
    interaction: { mode: 'index', intersect: false },
    elements: {
      line: { tension: 0.4 },
      point: { radius: 4, hoverRadius: 6 }
    }
  };

  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { 
        position: 'right',
        labels: { 
          color: '#64748B', 
          font: { size: 12, family: 'Inter' },
          boxWidth: 12,
          padding: 15,
          usePointStyle: true
        } 
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        titleColor: '#F8FAFC',
        bodyColor: '#F8FAFC',
        borderColor: '#334155',
        borderWidth: 1,
        cornerRadius: 8,
        padding: 12,
        callbacks: {
          label: function(context) {
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((context.parsed / total) * 100).toFixed(1);
            return `${context.label}: $${context.parsed.toLocaleString()} (${percentage}%)`;
          }
        }
      }
    }
  };

  const fetchSalesData = useCallback(async () => {
    const isRefresh = refreshing;
    if (!isRefresh) setLoading(true);
    
    try {
      console.log('🔍 Admin Sales: Starting to fetch sales analytics...');

      // Calculate comparison period dates
      const comparisonStart = comparisonPeriod === 'previous' 
        ? subDays(dateRange.from, (dateRange.to - dateRange.from) / (1000 * 60 * 60 * 24))
        : subDays(dateRange.from, 365);
      const comparisonEnd = comparisonPeriod === 'previous'
        ? dateRange.from
        : subDays(dateRange.to, 365);

      // Fetch sales analytics from our new API
      const analytics = await getSalesAnalytics({
        start_date: dateRange.from.toISOString(),
        end_date: dateRange.to.toISOString(),
        comparison_start_date: comparisonStart.toISOString(),
        comparison_end_date: comparisonEnd.toISOString()
      });

      console.log('✅ Admin Sales: Analytics fetched:', analytics);

      // Set metrics from API response
      setMetrics(analytics.metrics || {});

      // Set chart data from API response
      setSalesData(analytics.charts?.timeSeries || { labels: [], datasets: [] });
      setCategoryData(analytics.charts?.category || { labels: [], datasets: [] });
      setProductPerformanceData(analytics.charts?.productPerformance || { labels: [], datasets: [] });
      setPaymentMethodData(analytics.charts?.paymentMethods || { labels: [], datasets: [] });

      // Set table data from API response
      setRecentTransactions(analytics.tables?.recentTransactions || []);
      setTopCustomers(analytics.tables?.topCustomers || []);

      console.log('📊 Admin Sales: Data set:', {
        metrics: analytics.metrics,
        recentTransactions: analytics.tables?.recentTransactions?.length || 0,
        topCustomers: analytics.tables?.topCustomers?.length || 0
      });

    } catch (error) {
      console.error("❌ Admin Sales: Error fetching sales data:", error);
      toast({ 
        title: "Error", 
        description: "Failed to fetch sales data: " + error.message, 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
      console.log('🏁 Admin Sales: Fetch completed');
    }
  }, [dateRange, comparisonPeriod, toast, refreshing]);


  useEffect(() => {
    fetchSalesData();
  }, [fetchSalesData]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchSalesData();
  };

  const handleExportCSV = async () => {
    const dataToExport = recentTransactions.map(transaction => ({
      OrderID: transaction.id,
      Customer: transaction.customer,
      Amount: transaction.amount,
      Date: format(parseISO(transaction.date), 'yyyy-MM-dd'),
      Status: transaction.status,
      PaymentMethod: transaction.payment_method
    }));
    
    exportToCSV(dataToExport, `sales_report_${format(new Date(), 'yyyy-MM-dd')}`);
    toast({
      title: "Export Successful",
      description: "Sales report has been exported to CSV",
    });
  };

  const MetricCard = ({ title, value, change, icon, isLoading, format: formatType = 'currency' }) => {
    const isPositive = change > 0;
    const isNegative = change < 0;
    
    const formatValue = (val) => {
      // Handle undefined or null values
      if (val === undefined || val === null || isNaN(val)) {
        return formatType === 'currency' ? '$0' : formatType === 'percentage' ? '0.0%' : '0';
      }
      
      if (formatType === 'currency') {
        return new Intl.NumberFormat('en-US', { 
          style: 'currency', 
          currency: 'USD',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }).format(val);
      } else if (formatType === 'percentage') {
        return `${val.toFixed(1)}%`;
      } else {
        return val.toLocaleString();
      }
    };

    return (
      <Card className="relative overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          <div className="h-4 w-4 text-muted-foreground">
            {icon}
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {isLoading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              formatValue(value)
            )}
          </div>
          {!isLoading && change !== undefined && change !== null && !isNaN(change) && change !== 0 && (
            <div className={cn(
              "flex items-center text-xs",
              isPositive ? "text-green-600" : isNegative ? "text-red-600" : "text-muted-foreground"
            )}>
              {isPositive ? (
                <ArrowUpRight className="h-3 w-3 mr-1" />
              ) : isNegative ? (
                <ArrowDownRight className="h-3 w-3 mr-1" />
              ) : null}
              {Math.abs(change).toFixed(1)}% from {comparisonPeriod === 'previous' ? 'last period' : 'last year'}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-slate-50 to-gray-100 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-light text-gray-800 mb-2">Sales & Reports</h1>
          <p className="text-muted-foreground">
            Comprehensive analytics and insights for your business
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Date Range Picker */}
          <div className="flex items-center gap-2 border rounded-md p-2">
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
            <Input
              type="date"
              value={dateRange.from.toISOString().split('T')[0]}
              onChange={(e) => setDateRange({ ...dateRange, from: new Date(e.target.value) })}
              className="border-0 p-0 h-auto focus-visible:ring-0"
            />
            <span className="text-muted-foreground">to</span>
            <Input
              type="date"
              value={dateRange.to.toISOString().split('T')[0]}
              onChange={(e) => setDateRange({ ...dateRange, to: new Date(e.target.value) })}
              className="border-0 p-0 h-auto focus-visible:ring-0"
            />
          </div>

          {/* Comparison Period */}
          <Select value={comparisonPeriod} onValueChange={setComparisonPeriod}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="previous">vs Previous</SelectItem>
              <SelectItem value="year_ago">vs Year Ago</SelectItem>
            </SelectContent>
          </Select>

          {/* Actions */}
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={cn("h-4 w-4 mr-2", refreshing && "animate-spin")} />
            Refresh
          </Button>
          
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        <MetricCard
          title="Total Sales"
          value={metrics.totalSales}
          change={metrics.totalSalesChange}
          icon={<DollarSign className="h-4 w-4" />}
          isLoading={loading}
        />
        <MetricCard
          title="Average Order Value"
          value={metrics.averageOrderValue}
          change={metrics.averageOrderValueChange}
          icon={<ShoppingCart className="h-4 w-4" />}
          isLoading={loading}
        />
        <MetricCard
          title="Total Orders"
          value={metrics.totalOrders}
          change={metrics.totalOrdersChange}
          icon={<Package className="h-4 w-4" />}
          isLoading={loading}
          format="number"
        />
        <MetricCard
          title="Unique Customers"
          value={metrics.newCustomers}
          change={metrics.newCustomersChange}
          icon={<Users className="h-4 w-4" />}
          isLoading={loading}
          format="number"
        />
        <MetricCard
          title="Conversion Rate"
          value={metrics.conversionRate}
          change={metrics.conversionRateChange}
          icon={<TrendingUp className="h-4 w-4" />}
          isLoading={loading}
          format="percentage"
        />
        <MetricCard
          title="Refund Rate"
          value={metrics.refundRate}
          change={metrics.refundRateChange}
          icon={<CreditCard className="h-4 w-4" />}
          isLoading={loading}
          format="percentage"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Sales Trend */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Sales Trend</CardTitle>
              <CardDescription>Revenue over time</CardDescription>
            </div>
            <Select value={timeframe} onValueChange={setTimeframe}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {loading ? (
                <div className="flex justify-center items-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                </div>
              ) : (
                <Line options={chartOptions} data={salesData} />
              )}
            </div>
          </CardContent>
        </Card>

        {/* Sales by Category */}
        <Card>
          <CardHeader>
            <CardTitle>Sales by Category</CardTitle>
            <CardDescription>Revenue distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {loading ? (
                <div className="flex justify-center items-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                </div>
              ) : (
                <Pie options={pieChartOptions} data={categoryData} />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle>Top Selling Products</CardTitle>
            <CardDescription>Best performing products by revenue</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {loading ? (
                <div className="flex justify-center items-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                </div>
              ) : (
                <Bar options={chartOptions} data={productPerformanceData} />
              )}
            </div>
          </CardContent>
        </Card>

        {/* Payment Methods */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Methods</CardTitle>
            <CardDescription>Order distribution by payment type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {loading ? (
                <div className="flex justify-center items-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                </div>
              ) : (
                <Doughnut options={pieChartOptions} data={paymentMethodData} />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tables Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Transactions */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>Latest orders and payments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 text-sm font-medium text-muted-foreground">Order</th>
                    <th className="text-left py-2 text-sm font-medium text-muted-foreground">Customer</th>
                    <th className="text-left py-2 text-sm font-medium text-muted-foreground">Amount</th>
                    <th className="text-left py-2 text-sm font-medium text-muted-foreground">Status</th>
                    <th className="text-left py-2 text-sm font-medium text-muted-foreground">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="5" className="text-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                      </td>
                    </tr>
                  ) : recentTransactions.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="text-center py-8 text-muted-foreground">
                        No transactions found
                      </td>
                    </tr>
                  ) : (
                    recentTransactions.map((transaction) => (
                      <tr key={transaction.id} className="border-b hover:bg-muted/50">
                        <td className="py-3 text-sm font-medium">#{transaction.id}</td>
                        <td className="py-3 text-sm">{transaction.customer}</td>
                        <td className="py-3 text-sm font-medium">
                          ${(transaction.amount || 0).toLocaleString()}
                        </td>
                        <td className="py-3">
                          <span className={cn(
                            "px-2 py-1 text-xs font-medium rounded-full",
                            transaction.status === 'delivered' && "bg-green-100 text-green-700",
                            transaction.status === 'pending' && "bg-yellow-100 text-yellow-700",
                            transaction.status === 'processing' && "bg-blue-100 text-blue-700",
                            transaction.status === 'shipped' && "bg-purple-100 text-purple-700",
                            !['delivered', 'pending', 'processing', 'shipped'].includes(transaction.status) && "bg-gray-100 text-gray-700"
                          )}>
                            {transaction.status?.charAt(0).toUpperCase() + transaction.status?.slice(1) || 'N/A'}
                          </span>
                        </td>
                        <td className="py-3 text-sm text-muted-foreground">
                          {format(parseISO(transaction.date), 'MMM dd, yyyy')}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Top Customers */}
        <Card>
          <CardHeader>
            <CardTitle>Top Customers</CardTitle>
            <CardDescription>Highest spending customers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : topCustomers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No customer data available
                </div>
              ) : (
                topCustomers.map((customer, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium text-blue-600">
                        {index + 1}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{customer.name}</p>
                        <p className="text-xs text-muted-foreground">{customer.orderCount} orders</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">${(customer.totalSpent || 0).toLocaleString()}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const Sales = () => {
  return <SalesContent />;
};

export default Sales;
