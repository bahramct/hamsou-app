'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { toPersianNumber } from '@/lib/utils/persian';

interface PieChartProps {
  data: {
    name: string;
    value: number;
    color: string;
  }[];
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export function DistributionPieChart({ data }: PieChartProps) {
  // اگر داده‌ای وجود ندارد، پیام مناسب نمایش بده
  if (!data || data.length === 0) {
    return (
      <div className="w-full h-[400px] flex items-center justify-center text-gray-500">
        <p className="text-sm">داده‌ای برای نمایش نمودار وجود ندارد</p>
      </div>
    );
  }

  // اعمال رنگ‌های ثابت
  const chartData = data.map((item, index) => ({
    name: item.name || '',
    value: typeof item.value === 'number' ? item.value : 0,
    color: item.color || COLORS[index % COLORS.length],
  }));

  return (
    <div className="w-full h-[400px]" dir="ltr">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => {
              const percentage = (percent * 100).toFixed(0);
              return `${name}: ${toPersianNumber(percentage)}%`;
            }}
            outerRadius={120}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
            }}
            itemStyle={{ color: '#1f2937' }}
            formatter={(value: number) => toPersianNumber(value)}
          />
          <Legend
            wrapperStyle={{ direction: 'rtl', textAlign: 'center', paddingTop: '20px' }}
            verticalAlign="bottom"
            height={36}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
