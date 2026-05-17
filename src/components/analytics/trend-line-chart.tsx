'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { toPersianNumber } from '@/lib/utils/persian';

interface TrendLineChartProps {
  data: {
    date: string;
    completionRate: number;
    total: number;
    completed: number;
  }[];
}

export function TrendLineChart({ data }: TrendLineChartProps) {
  // اگر داده‌ای وجود ندارد، پیام مناسب نمایش بده
  if (!data || data.length === 0) {
    return (
      <div className="w-full h-[400px] flex items-center justify-center text-gray-500">
        <p className="text-sm">داده‌ای برای نمایش نمودار وجود ندارد</p>
      </div>
    );
  }

  // تبدیل تاریخ‌ها به فرمت کوتاه فارسی
  const formattedData = data.map((item) => ({
    date: item.date || '',
    completionRate: typeof item.completionRate === 'number' ? item.completionRate : 0,
    total: typeof item.total === 'number' ? item.total : 0,
    completed: typeof item.completed === 'number' ? item.completed : 0,
    displayDate: item.date || '',
    completionRateDisplay: `${toPersianNumber((typeof item.completionRate === 'number' ? item.completionRate : 0).toFixed(0))}%`,
    totalDisplay: toPersianNumber(typeof item.total === 'number' ? item.total : 0),
    completedDisplay: toPersianNumber(typeof item.completed === 'number' ? item.completed : 0),
  }));

  return (
    <div className="w-full h-[400px]" dir="ltr">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={formattedData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="displayDate"
            tick={{ fill: '#6b7280', fontSize: 12 }}
            tickLine={{ stroke: '#e5e7eb' }}
            axisLine={{ stroke: '#e5e7eb' }}
          />
          <YAxis
            tick={{ fill: '#6b7280', fontSize: 12 }}
            tickLine={{ stroke: '#e5e7eb' }}
            axisLine={{ stroke: '#e5e7eb' }}
            domain={[0, 100]}
            tickFormatter={(value) => `${toPersianNumber(value)}%`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
            }}
            itemStyle={{ color: '#1f2937' }}
            labelStyle={{ color: '#6b7280', marginBottom: '4px' }}
            formatter={(value: number, name: string) => {
              if (name === 'نرخ تکمیل') {
                return [`${toPersianNumber(value.toFixed(0))}%`, 'نرخ تکمیل'];
              }
              return [toPersianNumber(value), name];
            }}
            labelFormatter={(label) => `تاریخ: ${label}`}
          />
          <Legend
            wrapperStyle={{ direction: 'rtl', textAlign: 'center', paddingTop: '20px' }}
            formatter={(value) => {
              if (value === 'completionRate') return 'نرخ تکمیل';
              return value;
            }}
          />
          <Line
            type="monotone"
            dataKey="completionRate"
            stroke="#3b82f6"
            strokeWidth={3}
            dot={{ fill: '#3b82f6', strokeWidth: 2, r: 5 }}
            activeDot={{ r: 7 }}
            name="completionRate"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
