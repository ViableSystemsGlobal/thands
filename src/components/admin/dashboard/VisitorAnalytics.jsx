import React from 'react';
import { motion } from 'framer-motion';
import { Line } from 'react-chartjs-2';
import { Eye, TrendingUp, Loader2 } from 'lucide-react';

const VisitorAnalytics = ({ stats, loading }) => {
  // Process real visitor data from backend
  const processVisitorData = () => {
    const labels = [];
    const visitorData = [];
    const today = new Date();
    
    // Create a map of existing data
    const dataMap = new Map();
    if (stats?.dailyVisitors) {
      stats.dailyVisitors.forEach(item => {
        const date = new Date(item.visit_date);
        dataMap.set(date.toDateString(), parseInt(item.daily_visitors));
      });
    }
    
    // Generate last 7 days of data
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      labels.push(date.toLocaleDateString('en-US', { weekday: 'short' }));
      
      // Use real data if available, otherwise 0
      const dateKey = date.toDateString();
      visitorData.push(dataMap.get(dateKey) || 0);
    }
    
    return { labels, visitorData };
  };

  const { labels, visitorData } = processVisitorData();

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Daily Visitors',
        data: visitorData,
        borderColor: 'rgb(99, 102, 241)',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
  };

  return (
    <motion.div 
      className="bg-white p-6 rounded-xl shadow-lg"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Eye className="w-6 h-6 text-indigo-500 mr-3" />
          <h2 className="text-xl font-semibold text-gray-800">Visitor Analytics</h2>
        </div>
        <div className="flex items-center text-sm text-gray-500">
          <TrendingUp className="w-4 h-4 mr-1" />
          <span>Last 7 days</span>
        </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-indigo-600">{stats?.totalVisitors || 0}</p>
              <p className="text-sm text-gray-500">Total Visitors</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{stats?.visitorsThisPeriod || 0}</p>
              <p className="text-sm text-gray-500">This Period</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">{stats?.uniqueVisitDays || 0}</p>
              <p className="text-sm text-gray-500">Active Days</p>
            </div>
          </div>
          
          <div className="h-64">
            <Line data={chartData} options={chartOptions} />
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default VisitorAnalytics;
