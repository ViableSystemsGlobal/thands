import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";

const UserStatsCard = ({ 
  title, 
  value, 
  icon: Icon, 
  gradientFrom, 
  gradientTo, 
  textColor,
  iconColor,
  loading = false 
}) => {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <Card className={`border-0 shadow-sm bg-gradient-to-r from-${gradientFrom} to-${gradientTo} hover:shadow-md transition-shadow`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${textColor}`}>
                {title}
              </p>
              <p className={`text-2xl font-bold ${textColor.replace('600', '900')}`}>
                {loading ? (
                  <div className="h-8 w-16 bg-gray-200 rounded animate-pulse"></div>
                ) : (
                  value
                )}
              </p>
            </div>
            <Icon className={`h-8 w-8 ${iconColor}`} />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default UserStatsCard; 