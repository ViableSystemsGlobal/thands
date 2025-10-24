import React from "react";
import { ShoppingBag, Clock, TrendingUp, DollarSign } from "lucide-react";
import { useCurrency } from "@/context/CurrencyContext";

const OrderMetrics = ({ metrics }) => {
  const { formatPrice } = useCurrency();

  const metricItems = [
    {
      label: "Total Orders",
      value: metrics.totalOrders,
      icon: ShoppingBag,
      color: "text-blue-500",
    },
    {
      label: "Pending Orders",
      value: metrics.pendingOrders,
      icon: Clock,
      color: "text-yellow-500",
    },
    {
      label: "Total Order Value (USD)",
      value: formatPrice(metrics.totalOrderValueUSD || 0, true, "USD"),
      icon: DollarSign,
      color: "text-green-500",
    },
     {
      label: "Total Order Value (GHS)",
      value: formatPrice(metrics.totalOrderValueGHS || 0, true, "GHS", true),
      icon: DollarSign,
      color: "text-purple-500",
    },
    {
      label: "Avg Order Value (USD)",
      value: formatPrice(metrics.averageOrderValueUSD || 0, true, "USD"),
      icon: TrendingUp,
      color: "text-indigo-500",
    },
     {
      label: "Avg Order Value (GHS)",
      value: formatPrice(metrics.averageOrderValueGHS || 0, true, "GHS", true),
      icon: TrendingUp,
      color: "text-pink-500",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      {metricItems.map((item) => (
        <div key={item.label} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <item.icon className={`w-8 h-8 ${item.color}`} />
            <div className="ml-4">
              <p className="text-gray-500 text-sm">{item.label}</p>
              <p className="text-2xl font-semibold text-gray-900">{item.value}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default OrderMetrics;
