'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getToken, authApiGet, clearToken, isAuthenticated } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart3, TrendingUp, Calendar, Target, Award, Zap, Brain, Home, LogOut, PieChart as PieChartIcon, Activity } from 'lucide-react';
import { toPersianNumber } from '@/lib/utils/persian';
import { TrendLineChart } from '@/components/analytics/trend-line-chart';
import { DistributionPieChart } from '@/components/analytics/pie-chart';
import { ActivityHeatmap } from '@/components/analytics/activity-heatmap';
import { PeriodComparison } from '@/components/analytics/period-comparison';
import { CommitmentWordCloud } from '@/components/analytics/commitment-word-cloud';
import { ReflectionWordCloud } from '@/components/analytics/reflection-word-cloud';
import { TemplateSelector } from '@/components/analytics/template-selector';
import { ShareButton } from '@/components/analytics/share-button';
import { AIReportGenerator } from '@/components/analytics/ai-report-generator';
import { useTestDataChange } from '@/hooks/useTestDataSync';

interface OverviewStats {
  totalCommitments: number;
  completedCommitments: number;
  completionRate: number;
  totalReflections: number;
  totalPlans: number;
  completedPlans: number;
  currentStreak: number;
}

interface CommitmentAnalytics {
  totalCommitments: number;
  completedCommitments: number;
  notCompletedCommitments: number;
  noReflection: number;
  completionRate: number;
  weeklyTrend: {
    week: string;
    completed: number;
    notCompleted: number;
    noReflection: number;
    total: number;
  }[];
}

interface ReflectionAnalytics {
  totalReflections: number;
  completedReflections: number;
  completionRate: number;
  dailyTrends: {
    date: string;
    completed: boolean;
  }[];
  mostCommonReason: string | null;
}

interface PlanAnalytics {
  activePlans: number;
  completedPlans: number;
  averageProgress: number;
  byStatus: {
    status: string;
    count: number;
  }[];
}

type TimeRange = '7d' | '30d' | '90d' | 'all';

export default function AnalyticsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const [activeTab, setActiveTab] = useState('commitments');
  const [overview, setOverview] = useState<OverviewStats | null>(null);
  const [commitmentAnalytics, setCommitmentAnalytics] = useState<CommitmentAnalytics | null>(null);
  const [reflectionAnalytics, setReflectionAnalytics] = useState<ReflectionAnalytics | null>(null);
  const [planAnalytics, setPlanAnalytics] = useState<PlanAnalytics | null>(null);
  const [userPlan, setUserPlan] = useState<string>('free');

  // داده‌های نمودارهای پیشرفته
  const [trendData, setTrendData] = useState<any[]>([]);
  const [distributionData, setDistributionData] = useState<any[]>([]);
  const [heatmapData, setHeatmapData] = useState<any[]>([]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const [overviewRes, commitmentsRes, reflectionsRes, plansRes, trendsRes] = await Promise.all([
        authApiGet(`/api/analytics/overview?range=${timeRange}`),
        authApiGet(`/api/analytics/commitments?range=${timeRange}`),
        authApiGet(`/api/analytics/reflections?range=${timeRange}`),
        authApiGet(`/api/analytics/plans?range=${timeRange}`),
        authApiGet(`/api/analytics/trends?range=${timeRange}`),
      ]);

      setOverview(overviewRes);
      // Set subscription plan from overview response
      setUserPlan(overviewRes?.subscriptionPlan || 'free');
      setCommitmentAnalytics(commitmentsRes);
      setReflectionAnalytics(reflectionsRes);
      setPlanAnalytics(plansRes);
      setTrendData(Array.isArray(trendsRes) ? trendsRes : []);

      // تولید داده‌های توزیع تعهدات
      if (commitmentsRes && typeof commitmentsRes === 'object') {
        const distribution = [
          { name: 'انجام شده', value: commitmentsRes.completedCommitments || 0, color: '#10b981' },
          { name: 'انجام نشده', value: commitmentsRes.notCompletedCommitments || 0, color: '#ef4444' },
          { name: 'بدون بازتاب', value: commitmentsRes.noReflection || 0, color: '#f59e0b' },
        ];
        setDistributionData(distribution);
      } else {
        setDistributionData([]);
      }

      // تولید داده‌های heatmap
      if (Array.isArray(trendsRes) && trendsRes.length > 0) {
        const heatmap = trendsRes.map((item: any) => {
          let level: 0 | 1 | 2 | 3 | 4 = 0;
          const total = typeof item.total === 'number' ? item.total : 0;
          if (total >= 1) level = 1;
          if (total >= 2) level = 2;
          if (total >= 3) level = 3;
          if (total >= 4) level = 4;
          return {
            date: item.date || '',
            count: total,
            level,
          };
        });
        setHeatmapData(heatmap);
      } else {
        setHeatmapData([]);
      }
    } catch (error: any) {
      // Silently handle auth errors - user will be redirected by main page
      if (error.message && (error.message.includes('توکن نامعتبر') || error.message.includes('Unauthorized'))) {
        setLoading(false);
        // Set empty data to prevent crashes
        setTrendData([]);
        setDistributionData([]);
        setHeatmapData([]);
        return;
      }
      console.error('Error loading analytics:', error);
      // Set empty data on error to prevent crashes
      setTrendData([]);
      setDistributionData([]);
      setHeatmapData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push('/login');
      return;
    }

    // Check for tab in URL
    const urlParams = new URLSearchParams(window.location.search);
    const tab = urlParams.get('tab');
    if (tab && ['commitments', 'reflections', 'plans', 'insights'].includes(tab)) {
      setActiveTab(tab);
    }

    loadAnalytics();
  }, [router, timeRange]);

  // Sync with DevToolsPanel - reload analytics when test data changes
  useTestDataChange(loadAnalytics);

  const handleLogout = () => {
    clearToken();
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <Skeleton className="h-10 w-64 mb-2" />
            <Skeleton className="h-6 w-96" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-24 mb-2" />
                  <Skeleton className="h-10 w-16" />
                </CardHeader>
              </Card>
            ))}
          </div>
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100" dir="rtl">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push('/demo')}
              title="بازگشت به داشبورد"
            >
              <Home className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold text-gray-900">داشبورد تحلیلی</h1>
          </div>
          <div className="flex items-center gap-3">
            <Select value={timeRange} onValueChange={(value: TimeRange) => setTimeRange(value)}>
              <SelectTrigger className="w-[180px]" dir="rtl">
                <Calendar className="w-4 h-4 ml-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent dir="rtl">
                <SelectItem value="7d">آخرین ۷ روز</SelectItem>
                <SelectItem value="30d">آخرین ۳۰ روز</SelectItem>
                <SelectItem value="90d">آخرین ۹۰ روز</SelectItem>
                <SelectItem value="all">همه زمان</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Page Description */}
      <div className="max-w-7xl mx-auto px-4 md:p-8 pt-6">
        <p className="text-gray-600 mb-6">تحلیل و بررسی پیشرفت شما در مسیر همسویی</p>

        {/* Overview Cards */}
        {overview && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">نرخ تکمیل تعهدات</CardTitle>
                <Target className="w-5 h-5 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900 mb-1">
                  {toPersianNumber(overview.completionRate.toFixed(0))}%
                </div>
                <p className="text-xs text-gray-500">
                  {toPersianNumber(overview.completedCommitments)} از {toPersianNumber(overview.totalCommitments)} تعهد
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">روزهای متوالی</CardTitle>
                <Zap className="w-5 h-5 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900 mb-1">{toPersianNumber(overview.currentStreak)}</div>
                <p className="text-xs text-gray-500">روز فعالیت متوالی</p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">بازتاب‌ها</CardTitle>
                <Brain className="w-5 h-5 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900 mb-1">{toPersianNumber(overview.totalReflections)}</div>
                <p className="text-xs text-gray-500">بازتاب ثبت شده</p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">برنامه‌ها</CardTitle>
                <Award className="w-5 h-5 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900 mb-1">
                  {toPersianNumber(overview.completedPlans)}/{toPersianNumber(overview.totalPlans)}
                </div>
                <p className="text-xs text-gray-500">برنامه تکمیل شده</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6" dir="rtl">
          <TabsList className="w-full !inline-flex !w-full">
            <TabsTrigger value="commitments" className="flex-1">تعهدات</TabsTrigger>
            <TabsTrigger value="reflections" className="flex-1">بازتاب‌ها</TabsTrigger>
            <TabsTrigger value="plans" className="flex-1">برنامه‌ها</TabsTrigger>
            <TabsTrigger value="insights" className="flex-1">بینش‌ها</TabsTrigger>
          </TabsList>

          {/* Commitments Tab */}
          <TabsContent value="commitments" className="space-y-6" dir="rtl">
            {commitmentAnalytics && (
              <>
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-gray-600">کل تعهدات</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-gray-900">{toPersianNumber(commitmentAnalytics.totalCommitments)}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-gray-600">انجام شده</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-green-600">{toPersianNumber(commitmentAnalytics.completedCommitments)}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-gray-600">انجام نشده</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-red-600">{toPersianNumber(commitmentAnalytics.notCompletedCommitments)}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-gray-600">بدون بازتاب</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-gray-600">{toPersianNumber(commitmentAnalytics.noReflection)}</div>
                    </CardContent>
                  </Card>
                </div>

                {/* Completion Rate */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5" />
                      نرخ تکمیل تعهدات
                    </CardTitle>
                    <CardDescription>درصد تعهداتی که انجام شده‌اند</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8">
                      <div className="text-6xl font-bold text-gray-900 mb-2">
                        {toPersianNumber(commitmentAnalytics.completionRate.toFixed(0))}%
                      </div>
                      <p className="text-sm text-gray-500">
                        {toPersianNumber(commitmentAnalytics.completedCommitments)} از {toPersianNumber(commitmentAnalytics.totalCommitments)} تعهد
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Weekly Trend */}
                <Card>
                  <CardHeader>
                    <CardTitle>روند هفتگی</CardTitle>
                    <CardDescription>پیشرفت تعهدات در هفته‌های اخیر</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {commitmentAnalytics.weeklyTrend.map((week) => (
                        <div key={week.week} className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">{week.week}</span>
                            <span className="text-gray-500">
                              {toPersianNumber(week.completed)}/{toPersianNumber(week.total)} انجام شده
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-4">
                            <div
                              className="bg-gradient-to-r from-green-500 to-green-600 h-4 rounded-full transition-all duration-500"
                              style={{ width: `${week.total > 0 ? (week.completed / week.total) * 100 : 0}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Advanced Visualizations */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5" />
                      نمودار پیشرفت زمانی
                    </CardTitle>
                    <CardDescription>نرخ تکمیل تعهدات در طول زمان</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {trendData.length > 0 ? (
                      <TrendLineChart data={trendData} />
                    ) : (
                      <div className="text-center py-12 text-gray-500">
                        <p className="text-sm">داده‌ای برای نمایش وجود ندارد</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <PieChartIcon className="w-5 h-5" />
                      توزیع تعهدات
                    </CardTitle>
                    <CardDescription>نسبت تعهدات انجام شده، انجام نشده و بدون بازتاب</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {distributionData.length > 0 ? (
                      <DistributionPieChart data={distributionData} />
                    ) : (
                      <div className="text-center py-12 text-gray-500">
                        <p className="text-sm">داده‌ای برای نمایش وجود ندارد</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="w-5 h-5" />
                      نقشه فعالیت
                    </CardTitle>
                    <CardDescription>شدت فعالیت شما در روزهای مختلف</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {heatmapData.length > 0 ? (
                      <ActivityHeatmap data={heatmapData} />
                    ) : (
                      <div className="text-center py-12 text-gray-500">
                        <p className="text-sm">داده‌ای برای نمایش وجود ندارد</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Period Comparison */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="w-5 h-5" />
                      مقایسه دوره‌های زمانی
                    </CardTitle>
                    <CardDescription>مقایسه عملکرد خود در دو بازه زمانی مختلف</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {trendData.length > 10 ? (
                      <div className="text-center py-12 text-gray-500">
                        <p className="text-sm mb-4">برای مقایسه دو دوره، حداقل ۳۰ روز فعالیت نیاز است</p>
                        <p className="text-xs text-gray-400">این قابلیت به زودی اضافه خواهد شد</p>
                      </div>
                    ) : (
                      <div className="text-center py-12 text-gray-500">
                        <p className="text-sm">برای فعال‌سازی مقایسه دوره‌ها، نیاز به داده‌های بیشتر دارید</p>
                        <p className="text-xs text-gray-400 mt-2">حداقل ۱۰ روز فعالیت ثبت کنید</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Word Cloud */}
                <CommitmentWordCloud timeRange={timeRange} />
              </>
            )}
          </TabsContent>

          {/* Reflections Tab */}
          <TabsContent value="reflections" className="space-y-6" dir="rtl">
            {reflectionAnalytics && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>خلاصه بازتاب‌ها</CardTitle>
                    <CardDescription>آمار کلی بازتاب‌های شما</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="text-center p-6 bg-gray-50 rounded-lg">
                        <div className="text-4xl font-bold text-gray-900 mb-2">
                          {toPersianNumber(reflectionAnalytics.totalReflections)}
                        </div>
                        <div className="text-sm text-gray-600">کل بازتاب‌ها</div>
                      </div>
                      <div className="text-center p-6 bg-green-50 rounded-lg">
                        <div className="text-4xl font-bold text-green-600 mb-2">
                          {toPersianNumber(reflectionAnalytics.completedReflections)}
                        </div>
                        <div className="text-sm text-gray-600">انجام شده</div>
                      </div>
                      <div className="text-center p-6 bg-blue-50 rounded-lg">
                        <div className="text-4xl font-bold text-blue-600 mb-2">
                          {toPersianNumber(reflectionAnalytics.completionRate.toFixed(0))}%
                        </div>
                        <div className="text-sm text-gray-600">نرخ تکمیل</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>روند روزانه</CardTitle>
                    <CardDescription>تاریخچه بازتاب‌های اخیر شما</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {reflectionAnalytics.dailyTrends.map((trend, index) => (
                        <div key={index} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
                          <div className="flex items-center gap-3">
                            <span className={`text-2xl ${trend.completed ? '✅' : '❌'}`} />
                            <div>
                              <div className="text-sm font-medium text-gray-700">{trend.date}</div>
                              <div className="text-xs text-gray-500">
                                {trend.completed ? 'انجام شده' : 'انجام نشده'}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      {reflectionAnalytics.dailyTrends.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          هنوز بازتابی ثبت نکرده‌اید
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {reflectionAnalytics.mostCommonReason && (
                  <Card>
                    <CardHeader>
                      <CardTitle>رایج‌ترین دلیل عدم انجام</CardTitle>
                      <CardDescription>دلایل پرتکرار برای عدم انجام تعهدات</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                        <p className="text-gray-900 font-medium">{reflectionAnalytics.mostCommonReason}</p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Word Cloud */}
                <ReflectionWordCloud timeRange={timeRange} />
              </>
            )}
          </TabsContent>

          {/* Plans Tab */}
          <TabsContent value="plans" className="space-y-6" dir="rtl">
            {planAnalytics && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm font-medium text-gray-600">برنامه‌های فعال</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-4xl font-bold text-blue-600">{toPersianNumber(planAnalytics.activePlans)}</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm font-medium text-gray-600">برنامه‌های تکمیل شده</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-4xl font-bold text-green-600">{toPersianNumber(planAnalytics.completedPlans)}</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm font-medium text-gray-600">میانگین پیشرفت</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-4xl font-bold text-purple-600">
                        {toPersianNumber(planAnalytics.averageProgress.toFixed(0))}%
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>وضعیت برنامه‌ها</CardTitle>
                    <CardDescription>تعداد برنامه‌ها در هر وضعیت</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {planAnalytics.byStatus.map((status) => (
                        <div key={status.status} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <Badge
                              variant={
                                status.status === 'completed'
                                  ? 'default'
                                  : status.status === 'active'
                                  ? 'secondary'
                                  : 'outline'
                              }
                            >
                              {status.status === 'active' && 'فعال'}
                              {status.status === 'completed' && 'تکمیل شده'}
                              {status.status === 'paused' && 'متوقف شده'}
                            </Badge>
                          </div>
                          <div className="text-2xl font-bold text-gray-900">{toPersianNumber(status.count)}</div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          {/* Insights Tab */}
          <TabsContent value="insights" className="space-y-6" dir="rtl">
            {/* AI Report Generator */}
            <AIReportGenerator />

            {userPlan === 'pro' || userPlan === 'plus' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="w-5 h-5 text-purple-600" />
                    اشتراک‌گذاری گزارش
                  </CardTitle>
                  <CardDescription>گزارش کامل پیشرفت خود را به اشتراک بگذارید</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-end">
                    <ShareButton timeRange={timeRange} />
                  </div>
                </CardContent>
              </Card>
            )}

            {userPlan !== 'pro' && userPlan !== 'plus' && (
              <Card>
                <CardContent className="py-8">
                  <div className="text-center">
                    <p className="text-sm text-gray-600">
                      برای اشتراک‌گذاری گزارش‌ها به پلن Pro یا Plus ارتقا دهید
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
