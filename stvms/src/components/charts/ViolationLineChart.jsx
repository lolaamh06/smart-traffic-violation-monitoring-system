import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-surface-2 border border-border rounded-md px-3 py-2 shadow-card">
        <p className="text-xs text-text-secondary mb-1">{label}</p>
        <p className="text-sm font-bold text-accent">{payload[0].value} violations</p>
      </div>
    );
  }
  return null;
};

export const ViolationLineChart = ({ data = [] }) => {
  if (!data.length) {
    return <div className="h-40 flex items-center justify-center text-text-secondary text-xs">No data available</div>;
  }
  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
        <defs>
          <linearGradient id="violationGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3182CE" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#3182CE" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#1E3A5F" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fill: '#718096', fontSize: 10, fontFamily: 'DM Sans' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: '#718096', fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="count"
          stroke="#3182CE"
          strokeWidth={2.5}
          fill="url(#violationGrad)"
          dot={{ r: 3, fill: '#3182CE', strokeWidth: 0 }}
          activeDot={{ r: 5, fill: '#3182CE' }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};
export default ViolationLineChart;
