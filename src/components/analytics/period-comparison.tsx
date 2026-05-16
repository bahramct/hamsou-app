'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toPersianNumber } from '@/lib/utils/persian';
import { TrendLineChart } from './trend-line-chart';
import { Compare } from 'lucide-react';

interface ComparisonData {
  period1: any[];
  period2: any[];
  period1Label: string;
  period2Label: string;
  comparison: {
    completionRateChange: number;
    totalCommitmentsChange: number;
    completedCommitmentsChange: number;
  };
}

interface PeriodComparisonProps {
  data: ComparisonData;
}

export function PeriodComparison({ data }: PeriodComparisonProps) {
  return (
    <Card dir="rtl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Compare className="w-5 h-5" />
          مقایسه دوره‌ها
        </CardTitle>
        <CardDescription>
          مقایسه {data.period1Label} با {data.period2Label}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">تغییر نرخ تکمیل</p>
            <p className={`text-2xl font-bold ${data.comparison.completionRateChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {data.comparison.completionRateChange >= 0 ? '+' : ''}
              {toPersianNumber(data.comparison.completionRateChange.toFixed(1))}%
            </p>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">تغییر کل تعهدات</p>
            <p className={`text-2xl font-bold ${data.comparison.totalCommitmentsChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {data.comparison.totalCommitmentsChange >= 0 ? '+' : ''}
              {toPersianNumber(data.comparison.totalCommitmentsChange)}
            </p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">تغییر تعهدات انجام شده</p>
            <p className={`text-2xl font-bold ${data.comparison.completedCommitmentsChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {data.comparison.completedCommitmentsChange >= 0 ? '+' : ''}
              {toPersianNumber(data.comparison.completedCommitmentsChange)}
            </p>
          </div>
        </div>

        {/* Period 1 Chart */}
        <div>
          <h3 className="text-lg font-semibold mb-4 text-blue-700">{data.period1Label}</h3>
          {data.period1.length > 0 ? (
            <TrendLineChart data={data.period1} />
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p className="text-sm">داده‌ای برای نمایش وجود ندارد</p>
            </div>
          )}
        </div>

        {/* Period 2 Chart */}
        <div>
          <h3 className="text-lg font-semibold mb-4 text-purple-700">{data.period2Label}</h3>
          {data.period2.length > 0 ? (
            <TrendLineChart data={data.period2} />
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p className="text-sm">داده‌ای برای نمایش وجود ندارد</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
