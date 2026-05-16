'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Home, Crown, Zap, RefreshCw, CheckCircle2, XCircle, Bell, BellRing, Users, Trophy } from 'lucide-react';
import { getToken, getUser, setToken, authApiPost } from '@/lib/api';

type PlanType = 'free' | 'plus' | 'pro';

const PLAN_CONFIG = {
  free: {
    name: 'رایگان',
    icon: Zap,
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
  },
  plus: {
    name: 'پلاس',
    icon: Zap,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
  },
  pro: {
    name: 'پرو',
    icon: Crown,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
  },
};

export default function DevToolsPage() {
  const router = useRouter();
  const [currentPlan, setCurrentPlan] = useState<PlanType>('free');
  const [loading, setLoading] = useState(false);
  const [isDevMode, setIsDevMode] = useState(false);
  const [updateStatus, setUpdateStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [notificationLoading, setNotificationLoading] = useState(false);
  const [notificationStatus, setNotificationStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [leaderboardStatus, setLeaderboardStatus] = useState<'idle' | 'success' | 'error'>('idle');

  useEffect(() => {
    // Check if in development mode
    if (process.env.NODE_ENV === 'development') {
      setIsDevMode(true);
      loadCurrentPlan();
    } else {
      setIsDevMode(false);
    }
  }, []);

  const loadCurrentPlan = () => {
    try {
      const user = getUser();
      if (user?.subscriptionPlan) {
        setCurrentPlan(user.subscriptionPlan);
      }
    } catch (error) {
      console.error('Error loading current plan:', error);
    }
  };

  const handlePlanChange = async (plan: PlanType) => {
    try {
      setLoading(true);
      setUpdateStatus('idle');

      // Update subscription plan in localStorage (simulated)
      const user = getUser();
      if (user) {
        user.subscriptionPlan = plan;
        setToken(getToken() || ''); // Save updated user data
      }

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));

      setCurrentPlan(plan);
      setUpdateStatus('success');

      // Refresh current page or redirect
      setTimeout(() => {
        router.refresh();
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error('Error updating plan:', error);
      setUpdateStatus('error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTestNotification = async (type?: string) => {
    try {
      setNotificationLoading(true);
      setNotificationStatus('idle');

      const body = type ? { type } : {};
      await authApiPost('/api/dev/create-test-notification', body);

      setNotificationStatus('success');

      // Reset status after 3 seconds
      setTimeout(() => {
        setNotificationStatus('idle');
      }, 3000);
    } catch (error) {
      console.error('Error creating test notification:', error);
      setNotificationStatus('error');

      // Reset status after 3 seconds
      setTimeout(() => {
        setNotificationStatus('idle');
      }, 3000);
    } finally {
      setNotificationLoading(false);
    }
  };

  const handleRefresh = () => {
    loadCurrentPlan();
  };

  const handleCreateLeaderboardTestData = async () => {
    try {
      setLeaderboardLoading(true);
      setLeaderboardStatus('idle');

      const response = await fetch('/api/dev/create-leaderboard-test-data', {
        method: 'POST',
      });
      const result = await response.json();

      if (result.success) {
        setLeaderboardStatus('success');

        // Reset status after 3 seconds
        setTimeout(() => {
          setLeaderboardStatus('idle');
        }, 3000);
      } else {
        setLeaderboardStatus('error');

        // Reset status after 3 seconds
        setTimeout(() => {
          setLeaderboardStatus('idle');
        }, 3000);
      }
    } catch (error) {
      console.error('Error creating leaderboard test data:', error);
      setLeaderboardStatus('error');

      // Reset status after 3 seconds
      setTimeout(() => {
        setLeaderboardStatus('idle');
      }, 3000);
    } finally {
      setLeaderboardLoading(false);
    }
  };

  if (!isDevMode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-red-200">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-100 rounded-full">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <CardTitle className="text-red-900">دسترسی غیرمجاز</CardTitle>
                <CardDescription className="text-red-700">
                  این صفحه فقط در محیط توسعه در دسترس است
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => router.push('/')}
              className="w-full bg-red-600 hover:bg-red-700"
            >
              بازگشت به صفحه اصلی
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4 md:p-8" dir="rtl">
      {/* Header */}
      <header className="mb-8">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push('/')}
            >
              <Home className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">ابزارهای توسعه</h1>
              <p className="text-gray-600 text-sm">Dev Tools - فقط برای محیط توسعه</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ml-2 ${loading ? 'animate-spin' : ''}`} />
            بروزرسانی
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto space-y-6">
        {/* Warning Banner */}
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-amber-900 mb-1">
                هشدار: این ابزار فقط برای تست در محیط توسعه است
              </p>
              <p className="text-amber-700">
                تغییر پلن در این صفحه فقط روی localStorage شما اثر می‌گذارد و در محیط production کار نمی‌کند.
                این ابزار برای تست قابلیت‌های مختلف بر اساس پلن‌ها طراحی شده است.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Notification Testing Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BellRing className="w-5 h-5 text-blue-600" />
              تست نوتیفیکیشن‌ها
            </CardTitle>
            <CardDescription>
              ایجاد نوتیفیکیشن‌های تستی برای بررسی عملکرد سیستم اعلان‌ها
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={() => handleCreateTestNotification()}
                disabled={notificationLoading}
                className="justify-start h-auto py-3"
              >
                <Bell className="w-4 h-4 ml-2" />
                <div className="text-right">
                  <div className="font-medium">ایجاد نوتیفیکیشن تصادفی</div>
                  <div className="text-xs text-muted-foreground">یک نوتیفیکیشن تستی به صورت تصادفی</div>
                </div>
              </Button>
              <Button
                variant="outline"
                onClick={() => handleCreateTestNotification('commitment_reminder')}
                disabled={notificationLoading}
                className="justify-start h-auto py-3"
              >
                <Bell className="w-4 h-4 ml-2" />
                <div className="text-right">
                  <div className="font-medium">یادآوری تعهد روزانه</div>
                  <div className="text-xs text-muted-foreground">هشدار برای ثبت تعهد</div>
                </div>
              </Button>
              <Button
                variant="outline"
                onClick={() => handleCreateTestNotification('reflection_reminder')}
                disabled={notificationLoading}
                className="justify-start h-auto py-3"
              >
                <Bell className="w-4 h-4 ml-2" />
                <div className="text-right">
                  <div className="font-medium">یادآوری بازتاب</div>
                  <div className="text-xs text-muted-foreground">هشدار برای ثبت بازتاب</div>
                </div>
              </Button>
              <Button
                variant="outline"
                onClick={() => handleCreateTestNotification('plan_completed')}
                disabled={notificationLoading}
                className="justify-start h-auto py-3"
              >
                <Bell className="w-4 h-4 ml-2" />
                <div className="text-right">
                  <div className="font-medium">تکمیل برنامه</div>
                  <div className="text-xs text-muted-foreground">پایان یک برنامه</div>
                </div>
              </Button>
              <Button
                variant="outline"
                onClick={() => handleCreateTestNotification('weekly_report')}
                disabled={notificationLoading}
                className="justify-start h-auto py-3"
              >
                <Bell className="w-4 h-4 ml-2" />
                <div className="text-right">
                  <div className="font-medium">گزارش هفتگی</div>
                  <div className="text-xs text-muted-foreground">آماده‌سازی گزارش</div>
                </div>
              </Button>
              <Button
                variant="outline"
                onClick={() => handleCreateTestNotification('achievement')}
                disabled={notificationLoading}
                className="justify-start h-auto py-3"
              >
                <Bell className="w-4 h-4 ml-2" />
                <div className="text-right">
                  <div className="font-medium">موفقیت جدید</div>
                  <div className="text-xs text-muted-foreground">کسب یک موفقیت</div>
                </div>
              </Button>
            </div>

            {notificationStatus === 'success' && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700">
                <CheckCircle2 className="w-5 h-5" />
                <span className="text-sm">نوتیفیکیشن با موفقیت ایجاد شد!</span>
              </div>
            )}

            {notificationStatus === 'error' && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
                <XCircle className="w-5 h-5" />
                <span className="text-sm">خطا در ایجاد نوتیفیکیشن. لطفاً دوباره تلاش کنید.</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Community Testing Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-600" />
              تست جامعه
            </CardTitle>
            <CardDescription>
              ایجاد داده‌های تستی برای جامعه و لیدربورد
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              variant="outline"
              onClick={handleCreateLeaderboardTestData}
              disabled={leaderboardLoading}
              className="justify-start h-auto py-3 w-full"
            >
              <Trophy className="w-4 h-4 ml-2" />
              <div className="text-right flex-1">
                <div className="font-medium">ایجاد داده‌های تستی لیدربورد</div>
                <div className="text-xs text-muted-foreground">
                  ایجاد کاربران، پست‌ها، لایک‌ها، کامنت‌ها و فالووینگ‌ها برای تست لیدربورد
                </div>
              </div>
              {leaderboardLoading && <RefreshCw className="w-4 h-4 animate-spin" />}
            </Button>

            {leaderboardStatus === 'success' && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700">
                <CheckCircle2 className="w-5 h-5" />
                <span className="text-sm">داده‌های تستی لیدربورد با موفقیت ایجاد شد!</span>
              </div>
            )}

            {leaderboardStatus === 'error' && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
                <XCircle className="w-5 h-5" />
                <span className="text-sm">خطا در ایجاد داده‌های تستی. لطفاً دوباره تلاش کنید.</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Current Plan Display */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-purple-600" />
              پلن فعلی
            </CardTitle>
            <CardDescription>
              پلن کاربری شما در حال حاضر:
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className={`flex items-center gap-3 p-4 rounded-lg border-2 ${PLAN_CONFIG[currentPlan].bgColor} ${PLAN_CONFIG[currentPlan].borderColor}`}>
              {React.createElement(PLAN_CONFIG[currentPlan].icon, {
                className: `w-8 h-8 ${PLAN_CONFIG[currentPlan].color}`,
              })}
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {PLAN_CONFIG[currentPlan].name}
                </div>
                <div className="text-sm text-gray-600">شناسه: {currentPlan}</div>
              </div>
              <Badge
                className={`${PLAN_CONFIG[currentPlan].bgColor} ${PLAN_CONFIG[currentPlan].borderColor} ${PLAN_CONFIG[currentPlan].color} border mr-auto`}
              >
                فعال
              </Badge>
            </div>

            {updateStatus === 'success' && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700">
                <CheckCircle2 className="w-5 h-5" />
                <span className="text-sm">پلن با موفقیت تغییر کرد!</span>
              </div>
            )}

            {updateStatus === 'error' && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
                <XCircle className="w-5 h-5" />
                <span className="text-sm">خطا در تغییر پلن. لطفاً دوباره تلاش کنید.</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Plan Switcher */}
        <Card>
          <CardHeader>
            <CardTitle>تغییر پلن</CardTitle>
            <CardDescription>
              برای تست قابلیت‌های مختلف، پلن خود را تغییر دهید:
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <Button
                onClick={() => handlePlanChange('free')}
                disabled={loading || currentPlan === 'free'}
                variant={currentPlan === 'free' ? 'default' : 'outline'}
                className={`h-auto py-4 flex-col gap-2 ${
                  currentPlan === 'free'
                    ? 'bg-gray-600 hover:bg-gray-700 text-white'
                    : 'hover:bg-gray-50'
                }`}
              >
                <Zap className="w-8 h-8" />
                <div className="text-center">
                  <div className="font-bold text-lg">پلن رایگان</div>
                  <div className="text-xs">Free</div>
                </div>
              </Button>
              <Button
                onClick={() => handlePlanChange('plus')}
                disabled={loading || currentPlan === 'plus'}
                variant={currentPlan === 'plus' ? 'default' : 'outline'}
                className={`h-auto py-4 flex-col gap-2 ${
                  currentPlan === 'plus'
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'hover:bg-blue-50'
                }`}
              >
                <Zap className="w-8 h-8" />
                <div className="text-center">
                  <div className="font-bold text-lg">پلن پلاس</div>
                  <div className="text-xs">Plus</div>
                </div>
              </Button>
              <Button
                onClick={() => handlePlanChange('pro')}
                disabled={loading || currentPlan === 'pro'}
                variant={currentPlan === 'pro' ? 'default' : 'outline'}
                className={`h-auto py-4 flex-col gap-2 ${
                  currentPlan === 'pro'
                    ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                    : 'hover:bg-yellow-50'
                }`}
              >
                <Crown className="w-8 h-8" />
                <div className="text-center">
                  <div className="font-bold text-lg">پلن پرو</div>
                  <div className="text-xs">Pro</div>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick Links */}
        <Card>
          <CardHeader>
            <CardTitle>لینک‌های سریع برای تست</CardTitle>
            <CardDescription>
              صفحات مهم برای تست قابلیت‌های مختلف:
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <Button
                variant="outline"
                className="justify-start"
                onClick={() => router.push('/community')}
              >
                <Users className="w-4 h-4 ml-2" />
                جامعه و لیدربورد
              </Button>
              <Button
                variant="outline"
                className="justify-start"
                onClick={() => router.push('/analytics')}
              >
                <Zap className="w-4 h-4 ml-2" />
                داشبورد تحلیلی (تست خروجی PDF/Excel)
              </Button>
              <Button
                variant="outline"
                className="justify-start"
                onClick={() => router.push('/plans')}
              >
                <Crown className="w-4 h-4 ml-2" />
                صفحه پلن‌ها
              </Button>
              <Button
                variant="outline"
                className="justify-start"
                onClick={() => router.push('/reports')}
              >
                <RefreshCw className="w-4 h-4 ml-2" />
                گزارش‌های هفتگی
              </Button>
              <Button
                variant="outline"
                className="justify-start"
                onClick={() => router.push('/my-plans')}
              >
                <Zap className="w-4 h-4 ml-2" />
                برنامه‌های من
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
