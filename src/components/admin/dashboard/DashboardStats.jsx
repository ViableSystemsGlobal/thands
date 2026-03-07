import React from 'react';
import { motion } from 'framer-motion';
import { Users, ShoppingBag, DollarSign, Clock, Mail, Eye, Loader2, Package, CreditCard, TrendingUp } from 'lucide-react';

const StatCard = ({ title, value, icon: Icon, color, loading, sub }) => (
  <motion.div
    className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300"
    whileHover={{ y: -4 }}
  >
    <div className="flex items-center">
      <div className={`p-3 rounded-full bg-gradient-to-br ${color} shrink-0`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div className="ml-4 min-w-0">
        <p className="text-sm text-gray-500 font-medium truncate">{title}</p>
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin text-gray-400 mt-1" />
        ) : (
          <>
            <p className="text-2xl font-semibold text-gray-800 truncate">{value}</p>
            {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
          </>
        )}
      </div>
    </div>
  </motion.div>
);

const DashboardStats = ({ stats, loading }) => {
  const avgOrderValue = stats?.avgOrderValue || 0;

  const statItems = [
    {
      title: 'Total Customers',
      value: (stats?.totalCustomers || 0).toLocaleString(),
      icon: Users,
      color: 'from-blue-500 to-blue-400',
    },
    {
      title: 'Total Orders',
      value: (stats?.totalOrders || 0).toLocaleString(),
      icon: ShoppingBag,
      color: 'from-green-500 to-green-400',
      sub: `${stats?.pendingOrders || 0} pending`,
    },
    {
      title: 'Total Sales',
      value: `$${(stats?.totalSales || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: DollarSign,
      color: 'from-emerald-500 to-emerald-400',
    },
    {
      title: 'Avg. Order Value',
      value: `$${avgOrderValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: TrendingUp,
      color: 'from-teal-500 to-teal-400',
    },
    {
      title: 'Pending Payments',
      value: (stats?.pendingPayments || 0).toLocaleString(),
      icon: CreditCard,
      color: 'from-orange-500 to-orange-400',
    },
    {
      title: 'Total Products',
      value: (stats?.totalProducts || 0).toLocaleString(),
      icon: Package,
      color: 'from-violet-500 to-violet-400',
      sub: 'active listings',
    },
    {
      title: 'Pending Orders',
      value: (stats?.pendingOrders || 0).toLocaleString(),
      icon: Clock,
      color: 'from-yellow-500 to-yellow-400',
    },
    {
      title: 'Newsletter Subscribers',
      value: (stats?.activeNewsletterSubscribers || 0).toLocaleString(),
      icon: Mail,
      color: 'from-purple-500 to-purple-400',
      sub: `${stats?.newNewsletterSubscribers || 0} new this period`,
    },
    {
      title: 'Total Visitors',
      value: (stats?.totalVisitors || 0).toLocaleString(),
      icon: Eye,
      color: 'from-indigo-500 to-indigo-400',
      sub: `${stats?.visitorsThisPeriod || 0} this period`,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {statItems.map((item, index) => (
        <StatCard key={index} {...item} loading={loading} />
      ))}
    </div>
  );
};

export default DashboardStats;
