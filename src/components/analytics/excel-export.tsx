'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileSpreadsheet, Loader2 } from 'lucide-react';
import { authApiGet } from '@/lib/api';

interface ExcelExportProps {
  timeRange: string;
}

export function ExcelExport({ timeRange }: ExcelExportProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateExcel = async () => {
    try {
      setLoading(true);
      setError(null);

      // دریافت داده‌ها از API
      const data = await authApiGet(`/api/analytics/export/excel?range=${timeRange}`);

      // ساخت محتوای Excel به صورت CSV (ساده‌ترین روش)
      let csvContent = '\uFEFF'; // BOM برای پشتیبانی از فارسی

      // اضافه کردن شیت تعهدات
      csvContent += `\n=== ${data.sheets.commitments.name} ===\n`;
      csvContent += data.sheets.commitments.headers.join(',') + '\n';
      data.sheets.commitments.data.forEach((row: string[]) => {
        csvContent += row.map((cell) => `"${cell}"`).join(',') + '\n';
      });

      // اضافه کردن شیت بازتاب‌ها
      csvContent += `\n=== ${data.sheets.reflections.name} ===\n`;
      csvContent += data.sheets.reflections.headers.join(',') + '\n';
      data.sheets.reflections.data.forEach((row: string[]) => {
        csvContent += row.map((cell) => `"${cell}"`).join(',') + '\n';
      });

      // اضافه کردن شیت برنامه‌ها
      csvContent += `\n=== ${data.sheets.plans.name} ===\n`;
      csvContent += data.sheets.plans.headers.join(',') + '\n';
      data.sheets.plans.data.forEach((row: string[]) => {
        csvContent += row.map((cell) => `"${cell}"`).join(',') + '\n';
      });

      // دانلود فایل
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `همسو_داده‌ها_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error: any) {
      console.error('Error generating Excel:', error);
      const errorMessage = error.message || 'خطا در تولید فایل Excel. لطفاً دوباره تلاش کنید.';
      setError(errorMessage);
      setTimeout(() => setError(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      <Button onClick={generateExcel} disabled={loading} variant="outline" size="sm">
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 ml-2 animate-spin" />
            در حال تولید...
          </>
        ) : (
          <>
            <FileSpreadsheet className="w-4 h-4 ml-2" />
            خروجی Excel
          </>
        )}
      </Button>
      {error && (
        <div className="absolute top-full mt-2 right-0 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm whitespace-nowrap z-50 shadow-lg">
          {error}
        </div>
      )}
    </div>
  );
}
