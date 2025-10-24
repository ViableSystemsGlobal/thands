
import React from 'react';
import { motion } from 'framer-motion';

const SettingsSection = ({ title, description, children }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
    className="bg-white rounded-xl shadow-lg border border-slate-200 p-6 md:p-8 hover:shadow-xl transition-shadow duration-300"
  >
    <div className="border-b border-slate-200 pb-4 mb-6">
      <h2 className="text-xl font-semibold text-slate-800">{title}</h2>
      {description && <p className="text-sm text-slate-500 mt-1">{description}</p>}
    </div>
    <div className="space-y-6">
     {children}
    </div>
  </motion.div>
);

export default SettingsSection;
