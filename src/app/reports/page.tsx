'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowRight, Calendar, TrendingUp, AlertCircle, FileText, LogOut, Home, Sparkles, Info } from 'lucide-react';
import { authApiPost, authApiGet, getUser, clearToken, isAuthenticated } from '@/lib/api';
import { toPersianNumber } from '@/lib/utils/persian';
import { useTestDataChange } from '@/hooks/useTestDataSync';
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

export default function ReportsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [report, setReport] = useState<AIReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [daysWithData, setDaysWithData] = useState<number>(0);
  const [canGenerate, setCanGenerate] = useState(false);

  const checkDataAvailability = async () => {
    try {
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
      console.error('Error checking data:', err);
    }
  };

  const fetchReport = async () => {
    try {
      setLoading(true);
      const data = await authApiGet<AIReport>('/api/reports/weekly');
      // اگر گزارش هفتگی قدیمی وجود داره، نادیده بگیر و از AI استفاده کن
    } catch (err: any) {
      // خطا رو نادیده بگیر چون ممکن است گزارش هفتگی قدیمی وجود نداشته باشه
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }

    try {
      setUser(getUser());
      fetchReport();
      checkDataAvailability();
    } catch (error) {
      router.push('/login');
    }
  }, [router]);

  // Sync with DevToolsPanel - reload report when test data changes
  useTestDataChange(() => {
    checkDataAvailability();
    setReport(null);
  });

  const generateReport = async () => {
    try {
      setGenerating(true);
      setError('');
      const data = await authApiPost<{ success: boolean; report: AIReport }>('/api/ai/generate-report', {});
      setReport(data.report);
    } catch (err: any) {
      setError(err.message || 'خطا در تولید گزارش');
    } finally {
      setGenerating(false);
    }
  };

  const handleLogout = () => {
    clearToken();
    router.push('/login');
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-gray-500">در حال بارگذاری...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col" dir="rtl">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push('/')}
            >
              <Home className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">گزارش هوشمند</h1>
              <p className="text-xs text-gray-500">تحلیل با AI</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={handleLogout}>
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-2xl mx-auto px-4 py-8 w-full">
        {error && (
          <Card className="p-6 mb-6 border-l-4 border-l-red-500 bg-red-50">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <p className="text-red-700">{error}</p>
            </div>
          </Card>
        )}

        {/* Data Availability Info */}
        <Card className="p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calendar className="w-6 h-6 text-gray-700" />
              <div>
                <h2 className="text-lg font-semibold text-gray-900">اطلاعات شما</h2>
                <p className="text-sm text-gray-500">
                  {toPersianNumber(daysWithData)} روز داده ثبت شده
                </p>
              </div>
            </div>
            {daysWithData >= 90 && (
              <div className="flex items-center gap-2 text-xs text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full">
                <Info className="w-3.5 h-3.5" />
                <span>از ۳۰ روز آخر استفاده می‌شود</span>
              </div>
            )}
          </div>
        </Card>

        {/* Generate Report Button */}
        {!report && (
          <Card className="p-8 mb-6 text-center">
            {!canGenerate ? (
              <div className="py-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                  <FileText className="w-8 h-8 text-gray-400" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  داده کافی برای تولید گزارش ندارید
                </h2>
                <p className="text-gray-600 mb-4">
                  حداقل به {toPersianNumber(3)} روز داده نیاز دارید
                </p>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 text-gray-700">
                  <span>داده فعلی:</span>
                  <span className="font-bold">{toPersianNumber(daysWithData)} روز</span>
                </div>
              </div>
            ) : (
              <div className="py-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 mb-4">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  گزارش هوشمند پیشرفت شما
                </h2>
                <p className="text-gray-600 mb-6">
                  AI یک تحلیل جامع از پیشرفت شما تولید می‌کند
                </p>
                <Button
                  onClick={generateReport}
                  disabled={generating}
                  size="lg"
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-6 text-lg shadow-lg"
                >
                  {generating ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white ml-2" />
                      در حال تولید گزارش...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 ml-2" />
                      تولید گزارش با AI
                    </>
                  )}
                </Button>
              </div>
            )}
          </Card>
        )}

        {/* Generated Report */}
        {report && (
          <>
            {/* Date Range Info */}
            <Card className="p-6 mb-6">
              <div className="flex items-center gap-3 mb-3">
                <Calendar className="w-5 h-5 text-gray-700" />
                <h2 className="text-lg font-semibold text-gray-900">بازه زمانی گزارش</h2>
              </div>
              <div className="flex items-center justify-between text-gray-600">
                <span>{formatDate(report.dateRange.start)}</span>
                <ArrowRight className="w-4 h-4 rotate-180" />
                <span>{formatDate(report.dateRange.end)}</span>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-200 flex items-center justify-between text-sm text-gray-500">
                <span>روزهای استفاده شده: {toPersianNumber(report.daysUsed)}</span>
                {report.daysUsed !== report.totalDaysWithData && (
                  <span>کل داده‌ها: {toPersianNumber(report.totalDaysWithData)} روز</span>
                )}
              </div>
            </Card>

            {/* Report Content */}
            <Card className="p-6 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <TrendingUp className="w-5 h-5 text-purple-600" />
                <h2 className="text-lg font-semibold text-gray-900">تحلیل پیشرفت شما</h2>
              </div>
              <div className="prose prose-gray max-w-none">
                <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                  {report.content}
                </div>
              </div>
            </Card>

            {/* Regenerate Button */}
            <Card className="p-6">
              <div className="text-center">
                <p className="text-gray-600 mb-4">
                  می‌خواهید گزارش جدیدی تولید کنید؟
                </p>
                <Button
                  onClick={generateReport}
                  disabled={generating}
                  variant="outline"
                  className="w-full"
                >
                  {generating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 ml-2" />
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
            </Card>
          </>
        )}
      </main>
    </div>
  );
}
