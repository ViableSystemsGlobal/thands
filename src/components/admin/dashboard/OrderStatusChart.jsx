import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Loader2 } from 'lucide-react';

const STATUS_COLORS = {
  pending:    { bg: 'rgba(251, 191, 36, 0.85)',  border: 'rgb(251, 191, 36)' },
  confirmed:  { bg: 'rgba(99, 102, 241, 0.85)',  border: 'rgb(99, 102, 241)' },
  processing: { bg: 'rgba(168, 85, 247, 0.85)',  border: 'rgb(168, 85, 247)' },
  shipped:    { bg: 'rgba(59, 130, 246, 0.85)',  border: 'rgb(59, 130, 246)' },
  delivered:  { bg: 'rgba(34, 197, 94, 0.85)',   border: 'rgb(34, 197, 94)' },
  cancelled:  { bg: 'rgba(239, 68, 68, 0.85)',   border: 'rgb(239, 68, 68)' },
};

const FALLBACK_COLOR = { bg: 'rgba(156, 163, 175, 0.85)', border: 'rgb(156, 163, 175)' };

const OrderStatusChart = ({ breakdown = [], loading }) => {
  const labels = breakdown.map(r => r.status.charAt(0).toUpperCase() + r.status.slice(1));
  const data   = breakdown.map(r => parseInt(r.count || 0));
  const total  = data.reduce((s, v) => s + v, 0);

  const chartData = {
    labels,
    datasets: [{
      data,
      backgroundColor: breakdown.map(r => (STATUS_COLORS[r.status] || FALLBACK_COLOR).bg),
      borderColor:     breakdown.map(r => (STATUS_COLORS[r.status] || FALLBACK_COLOR).border),
      borderWidth: 2,
      hoverOffset: 8,
    }],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '68%',
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const pct = total > 0 ? ((ctx.parsed / total) * 100).toFixed(1) : 0;
            return ` ${ctx.label}: ${ctx.parsed} (${pct}%)`;
          },
        },
      },
    },
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 h-full">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Order Status Breakdown</h3>

      {loading ? (
        <div className="flex justify-center items-center h-48">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        </div>
      ) : total === 0 ? (
        <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
          No orders for this period
        </div>
      ) : (
        <div className="flex items-center gap-6">
          {/* Donut */}
          <div className="relative" style={{ width: 160, height: 160, flexShrink: 0 }}>
            <Doughnut data={chartData} options={options} />
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-bold text-gray-800">{total}</span>
              <span className="text-xs text-gray-400">orders</span>
            </div>
          </div>

          {/* Legend */}
          <ul className="flex-1 space-y-2 min-w-0">
            {breakdown.map((r) => {
              const color = (STATUS_COLORS[r.status] || FALLBACK_COLOR).border;
              const count = parseInt(r.count || 0);
              const pct   = total > 0 ? ((count / total) * 100).toFixed(0) : 0;
              return (
                <li key={r.status} className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: color }} />
                  <span className="text-xs text-gray-600 flex-1 truncate capitalize">{r.status}</span>
                  <span className="text-xs font-semibold text-gray-800">{count}</span>
                  <span className="text-xs text-gray-400 w-8 text-right">{pct}%</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
};

export default OrderStatusChart;
