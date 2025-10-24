
import React from 'react';
import { ListChecks, Loader2 } from 'lucide-react';

const RecentActivity = ({ activities, loading }) => {
  return (
    <div className="bg-white p-6 rounded-xl shadow-lg">
      <div className="flex items-center mb-6">
        <ListChecks className="w-6 h-6 text-pink-500 mr-3" />
        <h2 className="text-xl font-semibold text-gray-800">Recent Activity</h2>
      </div>
      {loading ? (
         <div className="flex justify-center items-center h-40">
          <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
        </div>
      ) : activities.length === 0 ? (
        <p className="text-gray-500 text-center py-4">No recent activity.</p>
      ) : (
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {activities.map((item, index) => (
            <div key={index} className="flex items-start text-sm p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
              <div className={`w-2.5 h-2.5 rounded-full mt-1.5 mr-3 flex-shrink-0 ${
                item.type === 'consultation' ? 'bg-purple-500' : 'bg-green-500'
              }`} />
              <div>
                <p className="text-gray-700">
                  {item.type === 'consultation'
                    ? `New consultation: ${item.name} (${item.type})`
                    : `Order #${item.order_number} by ${item.customers?.first_name || 'Guest'} ${item.customers?.last_name || ''}`}
                </p>
                <p className="text-gray-500 text-xs">
                  {new Date(item.created_at).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RecentActivity;
