'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FileDown, Loader2, AlertCircle, Check } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface PDFExportProps {
  timeRange: string;
}

export function PDFExport({ timeRange }: PDFExportProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [template, setTemplate] = useState('default');

  const generatePDF = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(false);

      // دریافت token
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('توکن احراز هویت یافت نشد');
      }

      console.log('[PDF Export] Requesting PDF with range:', timeRange, 'template:', template);

      // دریافت فایل PDF از API
      const response = await fetch(`/api/analytics/export/pdf?range=${timeRange}&template=${template}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        let errorMessage = 'خطا در دانلود PDF';

        if (contentType?.includes('application/json')) {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
          if (errorData.details) {
            console.error('[PDF Export] Error details:', errorData.details);
          }
        } else if (response.status === 403) {
          errorMessage = 'برای دانلود PDF به یک پلن پرو یا پلاس نیاز دارید';
        } else if (response.status === 401) {
          errorMessage = 'نشست شما منقضی شده است. لطفاً دوباره وارد شوید';
        }

        throw new Error(errorMessage);
      }

      // دریافت باینری PDF
      const blob = await response.blob();
      console.log('[PDF Export] PDF received, size:', blob.size, 'bytes');

      if (blob.size === 0) {
        throw new Error('فایل PDF خالی است');
      }

      // ایجاد لینک دانلود
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;

      // نام فایل فارسی
      const persianDate = new Date().toLocaleDateString('fa-IR').replace(/\//g, '-');
      a.download = `گزارش-همسو-${persianDate}.pdf`;
      
      document.body.appendChild(a);
      a.click();

      // پاکسازی
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      // نمایش پیام موفقیت
      setSuccess(true);
      setTimeout(() => setSuccess(false), 5000);

      console.log('[PDF Export] PDF downloaded successfully');
    } catch (error: any) {
      console.error('[PDF Export] Error:', error);
      const errorMessage = error.message || 'خطا در تولید PDF. لطفاً دوباره تلاش کنید.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const templates = [
    { value: 'default', label: 'پیش‌فرض (کامل)' },
    { value: 'minimalist', label: 'مینیمال' },
    { value: 'detailed', label: 'جزئی' },
    { value: 'executive', label: 'اجرایی' },
  ];

  return (
    <div className="space-y-3">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-200 bg-green-50">
          <Check className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-700">
            گزارش با موفقیت دانلود شد
          </AlertDescription>
        </Alert>
      )}

      <div className="flex items-end gap-2 flex-wrap">
        <div className="flex-1 min-w-[150px]">
          <label className="text-sm font-medium text-gray-700 block mb-1">
            قالب گزارش
          </label>
          <Select value={template} onValueChange={setTemplate} disabled={loading}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {templates.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button 
          onClick={generatePDF} 
          disabled={loading}
          variant="default"
          size="sm"
          className="gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              در حال تولید...
            </>
          ) : (
            <>
              <FileDown className="w-4 h-4" />
              دانلود PDF
            </>
          )}
        </Button>
      </div>

      <p className="text-xs text-gray-500">
        برای دانلود گزارش به‌صورت PDF نیاز به اشتراک Pro یا Plus دارید
      </p>
    </div>
  );
}
