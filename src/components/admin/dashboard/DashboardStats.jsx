
import React from 'react';
import { motion } from 'framer-motion';
import { Users, ShoppingBag, DollarSign, Clock, Mail, Eye, Loader2 } from 'lucide-react';

const StatCard = ({ title, value, icon: Icon, color, loading }) => {
  return (
    <motion.div 
      className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300"
      whileHover={{ y: -5 }}
    >
      <div className="flex items-center">
        <div className={`p-3 rounded-full bg-gradient-to-br ${color}`}>
          <Icon className="w-7 h-7 text-white" />
        </div>
        <div className="ml-4">
          <p className="text-sm text-gray-500 font-medium">{title}</p>
          {loading ? (
            <Loader2 className="w-6 h-6 animate-spin text-gray-700 mt-1" />
          ) : (
            <p className="text-2xl font-semibold text-gray-800">{value}</p>
          )}
        </div>
      </div>
    </motion.div>
  );
};

const DashboardStats = ({ stats, loading }) => {
  const statItems = [
    { title: "Total Customers", value: stats?.totalCustomers || 0, icon: Users, color: "from-blue-500 to-blue-400" },
    { title: "Total Orders", value: stats?.totalOrders || 0, icon: ShoppingBag, color: "from-green-500 to-green-400" },
    { title: "Total Sales", value: `$${(stats?.totalSales || 0).toLocaleString()}`, icon: DollarSign, color: "from-emerald-500 to-emerald-400" },
    { title: "Pending Orders", value: stats?.pendingOrders || 0, icon: Clock, color: "from-yellow-500 to-yellow-400" },
    { title: "Newsletter Subscribers", value: stats?.activeNewsletterSubscribers || 0, icon: Mail, color: "from-purple-500 to-purple-400" },
    { title: "Total Visitors", value: stats?.totalVisitors || 0, icon: Eye, color: "from-indigo-500 to-indigo-400" },
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
