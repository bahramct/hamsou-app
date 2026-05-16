'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowRight, Calendar, TrendingUp, AlertCircle, CheckCircle2, LogOut, Home } from 'lucide-react';
import { authApiPost, authApiGet, getUser, clearToken, isAuthenticated } from '@/lib/api';
import { toPersianNumber } from '@/lib/utils/persian';

interface WeeklyReport {
  id: string;
  weekStart: string;
  weekEnd: string;
  consistencyScore: number;
  completionPattern: {
    totalCommitments: number;
    completedCount: number;
    notCompletedCount: number;
    completionRate: number;
    mostCommonReason?: Record<string, number>;
  };
  weeklySummary?: string;
  behavioralInsight?: string;
  suggestedDirection?: string;
  needsAI?: boolean;
}

export default function ReportsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [report, setReport] = useState<WeeklyReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }

    try {
      setUser(getUser());
      fetchReport();
    } catch (error) {
      router.push('/login');
    }
  }, [router]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const data = await authApiGet<WeeklyReport>('/api/reports/weekly');
      setReport(data);
    } catch (err: any) {
      setError(err.message);
      // اگر token منقضی شده، به صفحه login برویم
      if (err.message?.includes('401') || err.message?.includes('توکن نامعتبر')) {
        clearToken();
        router.push('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async () => {
    if (!report) return;

    try {
      setGenerating(true);
      const data = await authApiPost<{ report: WeeklyReport }>('/api/reports/generate', {
        reportId: report.id,
      });
      setReport(data.report);
    } catch (err: any) {
      setError(err.message);
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100" dir="rtl">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push('/')}
            >
              <Home className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold text-gray-900">گزارش هفتگی</h1>
          </div>
          <Button variant="ghost" size="icon" onClick={handleLogout}>
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-8">
        {error && (
          <Card className="p-6 mb-6 border-l-4 border-l-red-500 bg-red-50">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <p className="text-red-700">{error}</p>
            </div>
          </Card>
        )}

        {report && (
          <>
            {/* Week Info */}
            <Card className="p-6 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <Calendar className="w-6 h-6 text-gray-700" />
                <h2 className="text-xl font-semibold text-gray-900">هفته جاری</h2>
              </div>
              <div className="flex items-center justify-between text-gray-600">
                <span>{formatDate(report.weekStart)}</span>
                <ArrowRight className="w-4 h-4 rotate-180" />
                <span>{formatDate(report.weekEnd)}</span>
              </div>
            </Card>

            {/* Consistency Score */}
            <Card className="p-6 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <TrendingUp className="w-6 h-6 text-gray-700" />
                <h2 className="text-xl font-semibold text-gray-900">نمره ثبات</h2>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 transition-all duration-500"
                      style={{ width: `${(report.consistencyScore || 0) * 100}%` }}
                    />
                  </div>
                </div>
                <span className="text-2xl font-bold text-gray-900">
                  {toPersianNumber(((report.consistencyScore || 0) * 100).toFixed(0))}٪
                </span>
              </div>
            </Card>

            {/* Completion Pattern */}
            <Card className="p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">آمار تعهدات</h2>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900">
                    {toPersianNumber(report.completionPattern?.totalCommitments || 0)}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">کل تعهدات</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">
                    {toPersianNumber(report.completionPattern?.completedCount || 0)}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">انجام شده</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-red-600">
                    {toPersianNumber(report.completionPattern?.notCompletedCount || 0)}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">انجام نشده</div>
                </div>
              </div>

              {report.completionPattern?.mostCommonReason &&
                Object.keys(report.completionPattern.mostCommonReason).length > 0 && (
                  <div className="pt-4 border-t border-gray-200">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">دلایل تکراری عدم انجام:</h3>
                    <div className="space-y-2">
                      {Object.entries(report.completionPattern.mostCommonReason)
                        .sort((a, b) => b[1] - a[1])
                        .map(([reason, count]) => (
                          <div key={reason} className="flex items-center gap-2 text-sm text-gray-600">
                            <span className="w-2 h-2 bg-red-400 rounded-full flex-shrink-0" />
                            <span>{reason}</span>
                            <span className="text-gray-400">({toPersianNumber(count)} بار)</span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
            </Card>

            {/* AI Generated Content */}
            {report.needsAI && (
              <Card className="p-6 mb-6 border-l-4 border-l-blue-500 bg-blue-50">
                <div className="text-center">
                  <p className="text-gray-700 mb-4">
                    گزارش هفتگی آماده است. برای دریافت insightها و تحلیل‌های AI، دکمه زیر را بزنید.
                  </p>
                  <Button
                    onClick={generateReport}
                    disabled={generating}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {generating ? 'در حال تولید...' : 'تولید گزارش با AI'}
                  </Button>
                </div>
              </Card>
            )}

            {!report.needsAI && (
              <>
                {/* Weekly Summary */}
                {report.weeklySummary && (
                  <Card className="p-6 mb-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">خلاصه هفته</h2>
                    <p className="text-gray-700 leading-relaxed">{report.weeklySummary}</p>
                  </Card>
                )}

                {/* Behavioral Insight */}
                {report.behavioralInsight && (
                  <Card className="p-6 mb-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                      Insight رفتاری
                    </h2>
                    <p className="text-gray-700 leading-relaxed">{report.behavioralInsight}</p>
                  </Card>
                )}

                {/* Suggested Direction */}
                {report.suggestedDirection && (
                  <Card className="p-6 mb-6 border-l-4 border-l-purple-500">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">جهت آگاهی</h2>
                    <p className="text-gray-700 leading-relaxed">{report.suggestedDirection}</p>
                  </Card>
                )}
              </>
            )}
          </>
        )}

        {!report && !loading && (
          <Card className="p-12 text-center">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">گزارشی یافت نشد</h2>
            <p className="text-gray-600 mb-6">
              هنوز داده‌ای برای تولید گزارش هفتگی وجود ندارد.
            </p>
            <Button onClick={() => router.push('/')}>
              بازگشت به داشبورد
            </Button>
          </Card>
        )}
      </main>
    </div>
  );
}
