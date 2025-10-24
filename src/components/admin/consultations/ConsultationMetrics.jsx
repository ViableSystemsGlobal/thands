
import React from 'react';
import { motion } from 'framer-motion';
import { Users, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

const MetricCard = ({ title, value, icon: Icon, color, loading }) => {
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

const ConsultationMetrics = ({ metrics, loading }) => {
  const metricItems = [
    { title: "Total Consultations", value: metrics.totalConsultations, icon: Users, color: "from-purple-500 to-purple-400" },
    { title: "Pending", value: metrics.pendingConsultations, icon: AlertCircle, color: "from-yellow-500 to-yellow-400" },
    { title: "Confirmed", value: metrics.confirmedConsultations, icon: CheckCircle, color: "from-blue-500 to-blue-400" },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      {metricItems.map((item, index) => (
        <MetricCard key={index} {...item} loading={loading} />
      ))}
    </div>
  );
};

export default ConsultationMetrics;
