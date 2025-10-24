
import React from 'react';
import { Line } from 'react-chartjs-2';
import { TrendingUp, Loader2 } from 'lucide-react';

const calculateGrowth = (data) => {
  if (!data || data.length < 2) return 0;
  const oldValue = data[0];
  const newValue = data[data.length - 1];
  if (oldValue === 0 && newValue > 0) return 100;
  if (oldValue === 0 && newValue === 0) return 0;
  return (((newValue - oldValue) / oldValue) * 100).toFixed(1);
};

const SalesChart = ({ chartData, chartOptions, loading }) => {
  const growth = calculateGrowth(chartData?.datasets?.[0]?.data);

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-800">Sales Overview</h2>
        {!loading && chartData?.datasets?.[0]?.data?.length > 1 && (
          <div className={`flex items-center text-sm ${growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            <TrendingUp className="w-4 h-4 mr-1" />
            <span>{growth}% vs previous period</span>
          </div>
        )}
      </div>
      <div className="flex-grow relative min-h-[300px] md:min-h-[350px]">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-10">
            <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
          </div>
        ) : (
          <Line options={chartOptions} data={chartData} />
        )}
      </div>
    </div>
  );
};

export default SalesChart;
