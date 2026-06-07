import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const COLORS = ['#E53E3E', '#3182CE', '#D69E2E', '#38A169', '#805AD5', '#DD6B20'];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-surface-2 border border-border rounded-md px-3 py-2 shadow-card">
        <p className="text-xs font-semibold text-text-primary mb-1">{label}</p>
        <p className="text-sm font-bold text-primary">{payload[0].value} violations</p>
      </div>
    );
  }
  return null;
};

export const ViolationBarChart = ({ data = [] }) => {
  if (!data.length) {
    return <div className="h-40 flex items-center justify-center text-text-secondary text-xs">No data available</div>;
  }
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1E3A5F" vertical={false} />
        <XAxis
          dataKey="name"
          tick={{ fill: '#718096', fontSize: 10, fontFamily: 'DM Sans' }}
          axisLine={false}
          tickLine={false}
          interval={0}
          angle={-30}
          textAnchor="end"
          height={50}
        />
        <YAxis
          tick={{ fill: '#718096', fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(49,130,206,0.08)' }} />
        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};
export default ViolationBarChart;
