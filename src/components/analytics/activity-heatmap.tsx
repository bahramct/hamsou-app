'use client';

import { toPersianNumber } from '@/lib/utils/persian';

interface ActivityHeatmapProps {
  data: {
    date: string;
    count: number;
    level: 0 | 1 | 2 | 3 | 4;
  }[];
}

export function ActivityHeatmap({ data }: ActivityHeatmapProps) {
  // رنگ‌های برای سطوح مختلف فعالیت
  const levelColors = {
    0: 'bg-gray-100',
    1: 'bg-green-200',
    2: 'bg-green-300',
    3: 'bg-green-400',
    4: 'bg-green-500',
  };

  // گروه‌بندی داده‌ها بر اساس هفته
  const weeks: typeof data[][] = [];
  let currentWeek: typeof data = [];

  data.forEach((day, index) => {
    if (index % 7 === 0 && index > 0) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
    currentWeek.push(day);
  });
  if (currentWeek.length > 0) {
    weeks.push(currentWeek);
  }

  // محاسبه حداکثر تعداد
  const maxCount = Math.max(...data.map((d) => d.count));

  return (
    <div className="w-full" dir="rtl">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-gray-600">حرکت موس روی هر خانه برای مشاهده جزئیات</p>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span>کم</span>
          {[0, 1, 2, 3, 4].map((level) => (
            <div
              key={level}
              className={`w-3 h-3 rounded ${levelColors[level as keyof typeof levelColors]}`}
            />
          ))}
          <span>زیاد</span>
        </div>
      </div>
      <div className="flex gap-1 overflow-x-auto pb-2">
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="flex gap-1">
            {week.map((day, dayIndex) => (
              <div
                key={`${weekIndex}-${dayIndex}`}
                className={`w-3 h-3 rounded ${levelColors[day.level]} cursor-pointer transition-all hover:scale-125`}
                title={`${day.date}: ${toPersianNumber(day.count)} تعهد`}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="mt-2 text-xs text-gray-500">
        <p>کل روزها: {toPersianNumber(data.length)} | بیشترین فعالیت: {toPersianNumber(maxCount)} تعهد در یک روز</p>
      </div>
    </div>
  );
}
