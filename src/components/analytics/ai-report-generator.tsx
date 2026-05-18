'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, Calendar, Loader2, CheckCircle2, AlertCircle, FileText, Info } from 'lucide-react';
import { authApiPost, authApiGet } from '@/lib/api';
import { toPersianNumber } from '@/lib/utils/persian';
import { format } from 'date-fns';

interface AIReport {
  content: string;
  dateRange: {
    start: string;
    end: string;
  };
  daysUsed: number;
  totalDaysWithData: number;
  model: string;
}

export function AIReportGenerator() {
  const [loading, setLoading] = useState(false);
  const [checkingData, setCheckingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<AIReport | null>(null);
  const [daysWithData, setDaysWithData] = useState<number>(0);
  const [canGenerate, setCanGenerate] = useState(false);

  const checkDataAvailability = async () => {
    try {
      setCheckingData(true);
      const commitments = await authApiGet('/api/commitments?limit=365');

      // استخراج روزهای منحصر به فرد
      const commitmentsArray = (commitments?.items && Array.isArray(commitments.items))
        ? commitments.items
        : (Array.isArray(commitments) ? commitments : []);

      const uniqueDates = new Set(
        commitmentsArray.map((c: any) => {
          const date = new Date(c.date);
          return format(date, 'yyyy-MM-dd');
        })
      );

      const daysCount = uniqueDates.size;
      setDaysWithData(daysCount);
      setCanGenerate(daysCount >= 3);

    } catch (err: any) {
      // Silently handle auth errors
      if (err.message && (err.message.includes('توکن نامعتبر') || err.message.includes('Unauthorized'))) {
        setCheckingData(false);
        return;
      }
      console.error('Error checking data:', err);
    } finally {
      setCheckingData(false);
    }
  };

  useEffect(() => {
    checkDataAvailability();
  }, []);

  const handleGenerate = async () => {
    if (!canGenerate) return;

    setLoading(true);
    setError(null);
    setReport(null);

    try {
      const response = await authApiPost<{ success: boolean; report: AIReport }>('/api/ai/generate-report', {});

      if (response.success && response.report) {
        setReport(response.report);
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

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Info Banner - اگر بیشتر از ۹۰ روز داده داره */}
      {!checkingData && daysWithData >= 90 && (
        <div className="flex items-center justify-center gap-2 text-xs text-blue-600 bg-blue-50 px-4 py-2 rounded-full">
          <Info className="w-3.5 h-3.5" />
          <span>از ۳۰ روز آخر استفاده می‌شود</span>
        </div>
      )}

      {/* Generate Button Card */}
      {!report && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              گزارش هوشمند پیشرفت شما
            </CardTitle>
            <CardDescription>
              AI یک تحلیل جامع از پیشرفت شما تولید می‌کند
            </CardDescription>
          </CardHeader>
          <CardContent>
            {checkingData ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
              </div>
            ) : !canGenerate ? (
              <div className="text-center py-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                  <FileText className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  داده کافی برای تولید گزارش ندارید
                </h3>
                <p className="text-gray-600 mb-4">
                  حداقل به {toPersianNumber(3)} روز داده نیاز دارید
                </p>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 text-gray-700">
                  <span>داده فعلی:</span>
                  <span className="font-bold">{toPersianNumber(daysWithData)} روز</span>
                </div>
              </div>
            ) : (
              <Button
                onClick={handleGenerate}
                disabled={loading}
                size="lg"
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-6 text-lg shadow-lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 ml-2 animate-spin" />
                    در حال تولید گزارش...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 ml-2" />
                    تولید گزارش با AI
                  </>
                )}
              </Button>
            )}
          </CardContent>
        </Card>
      )}

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
        <>
          {/* Date Range Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-gray-700" />
                بازه زمانی گزارش
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center gap-4 text-gray-700">
                <span className="text-lg font-medium">{formatDate(report.dateRange.start)}</span>
                <span className="text-gray-400">تا</span>
                <span className="text-lg font-medium">{formatDate(report.dateRange.end)}</span>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-center gap-6 text-sm text-gray-500">
                <span>روزهای استفاده شده: {toPersianNumber(report.daysUsed)}</span>
                {report.daysUsed !== report.totalDaysWithData && (
                  <span>کل داده‌ها: {toPersianNumber(report.totalDaysWithData)} روز</span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Report Content */}
          <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-purple-900">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  تحلیل پیشرفت شما
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
                  {report.content.split('\n').map((paragraph, index) => {
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

          {/* Regenerate Button */}
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-gray-600 mb-4">
                  می‌خواهید گزارش جدیدی تولید کنید؟
                </p>
                <Button
                  onClick={handleGenerate}
                  disabled={loading}
                  variant="outline"
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                      در حال تولید...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 ml-2" />
                      تولید مجدد گزارش
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
