'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sparkles, Calendar, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { authApiPost } from '@/lib/api';
import { toPersianNumber } from '@/lib/utils/persian';

type ReportType = 'weekly' | 'monthly';

export function AIReportGenerator() {
  const [reportType, setReportType] = useState<ReportType>('weekly');
  const [date, setDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<string | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setReport(null);

    try {
      const body: any = { type: reportType };
      if (date) {
        body.date = date;
      }

      const response = await authApiPost('/api/ai/generate-report', body);

      if (response.success && response.report?.content) {
        setReport(response.report.content);
      } else {
        setError('خطا در تولید گزارش');
      }
    } catch (err: any) {
      console.error('Error generating report:', err);
      setError(err.message || 'خطا در تولید گزارش. لطفاً دوباره تلاش کنید.');
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDate(e.target.value);
  };

  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  return (
    <div className="space-y-6">
      {/* Input Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            تولید گزارش با AI
          </CardTitle>
          <CardDescription>
            گزارش هفتگی یا ماهانه شخصی‌سازی شده با تحلیل هوش مصنوعی
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Report Type Selection */}
          <div className="space-y-2">
            <Label htmlFor="reportType">نوع گزارش</Label>
            <Select value={reportType} onValueChange={(value: ReportType) => setReportType(value)}>
              <SelectTrigger id="reportType" dir="rtl">
                <Calendar className="w-4 h-4 ml-2 text-gray-500" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent dir="rtl">
                <SelectItem value="weekly">گزارش هفتگی</SelectItem>
                <SelectItem value="monthly">گزارش ماهانه</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date Selection */}
          <div className="space-y-2">
            <Label htmlFor="reportDate">
              تاریخ گزارش <span className="text-gray-400 text-sm">(اختیاری)</span>
            </Label>
            <Input
              id="reportDate"
              type="date"
              value={date}
              onChange={handleDateChange}
              dir="rtl"
              placeholder="انتخاب تاریخ (پیش‌فرض: امروز)"
              className="text-right"
            />
            <p className="text-xs text-gray-500">
              اگر تاریخی انتخاب نکنید، گزارش برای {reportType === 'weekly' ? 'هفته جاری' : 'ماه جاری'} تولید می‌شود
            </p>
          </div>

          {/* Generate Button */}
          <Button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                در حال تولید گزارش...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 ml-2" />
                تولید گزارش
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-red-900 mb-1">خطا</h4>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Report Display */}
      {report && (
        <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-purple-900">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                گزارش {reportType === 'weekly' ? 'هفتگی' : 'ماهانه'} شما
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setReport(null)}
              >
                بستن
              </Button>
            </div>
            <CardDescription>
              تولید شده با هوش مصنوعی بر اساس داده‌های شما
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="prose prose-purple max-w-none" dir="rtl">
              <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
                {report.split('\n').map((paragraph, index) => {
                  if (paragraph.trim() === '') {
                    return <br key={index} />;
                  }

                  // Check if it's a heading (starts with # or ** at start)
                  if (paragraph.startsWith('#')) {
                    const level = (paragraph.match(/^#+/) || [''])[0].length;
                    const text = paragraph.replace(/^#+\s*/, '').replace(/\*\*/g, '');
                    const headingClasses = {
                      1: 'text-2xl font-bold text-gray-900 mt-6 mb-3',
                      2: 'text-xl font-bold text-gray-800 mt-5 mb-2',
                      3: 'text-lg font-semibold text-gray-700 mt-4 mb-2',
                    };
                    return (
                      <h3 key={index} className={headingClasses[level as keyof typeof headingClasses] || 'text-base font-semibold text-gray-700 mt-3 mb-2'}>
                        {text}
                      </h3>
                    );
                  }

                  // Check if it's a bullet point (starts with - or *)
                  if (paragraph.trim().startsWith('-') || paragraph.trim().startsWith('*')) {
                    const text = paragraph.trim().replace(/^[-*]\s*/, '').replace(/\*\*/g, '');
                    return (
                      <li key={index} className="flex items-start gap-2 mb-2 text-gray-800">
                        <span className="text-purple-600 mt-1">•</span>
                        <span>{text}</span>
                      </li>
                    );
                  }

                  // Check if it's a numbered list (starts with number + .)
                  const numberedMatch = paragraph.trim().match(/^(\d+)\.\s*(.*)/);
                  if (numberedMatch) {
                    const number = numberedMatch[1];
                    const text = numberedMatch[2].replace(/\*\*/g, '');
                    return (
                      <li key={index} className="flex items-start gap-2 mb-2 text-gray-800">
                        <span className="text-purple-600 font-bold mt-1">{toPersianNumber(number)}.</span>
                        <span>{text}</span>
                      </li>
                    );
                  }

                  // Regular paragraph
                  const text = paragraph.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                  return (
                    <p key={index} className="mb-3 text-gray-800" dangerouslySetInnerHTML={{ __html: text }} />
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
