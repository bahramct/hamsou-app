'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Code2, Database, RefreshCw, CheckCircle2, AlertTriangle, Calendar, Trash2, Bell, Crown, Zap, Users, Trophy } from 'lucide-react';
import { authApiPost, authApiGet, authApiDelete, getUser, setToken, getToken } from '@/lib/api';

/**
 * DEV ONLY COMPONENT
 * This component provides development tools for testing
 * It is only visible in development mode
 */

interface WeekData {
  weekStart: string;
  weekEnd: string;
  daysCount: number;
  completedCount: number;
  completionRate: string;
}

interface TestDataResponse {
  totalDays: number;
  totalWeeks: number;
  generatedCommitments: number;
  generatedReflections: number;
  completionRate: string;
  clearedOldData: {
    commitments: number;
    reflections: number;
  };
  weeks: WeekData[];
}

export function DevToolsPanel() {
  const [testDataExists, setTestDataExists] = useState(false);
  const [loading, setLoading] = useState(false);
  const [creatingNotification, setCreatingNotification] = useState(false);
  const [notificationTypes, setNotificationTypes] = useState<any[]>([]);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [dataInfo, setDataInfo] = useState<any>(null);
  const [weeks, setWeeks] = useState<WeekData[]>([]);
  const [currentPlan, setCurrentPlan] = useState<'FREE' | 'PLUS' | 'PRO'>('FREE');
  const [changingPlan, setChangingPlan] = useState(false);
  const [creatingLeaderboardData, setCreatingLeaderboardData] = useState(false);
  const [clearingLeaderboardData, setClearingLeaderboardData] = useState(false);
  const [hasLeaderboardTestData, setHasLeaderboardTestData] = useState(false);
  const [creatingYesterdayCommitment, setCreatingYesterdayCommitment] = useState(false);
  const [deletingYesterdayCommitment, setDeletingYesterdayCommitment] = useState(false);

  // Check if test data exists on mount
  useEffect(() => {
    checkTestData();
    loadNotificationTypes();
    loadCurrentPlan();
    checkLeaderboardTestData();
  }, []);

  const loadCurrentPlan = () => {
    try {
      const user = getUser();
      if (user?.subscriptionPlan) {
        setCurrentPlan(user.subscriptionPlan.toUpperCase() as 'FREE' | 'PLUS' | 'PRO');
      }
    } catch (error) {
      console.error('Error loading current plan:', error);
    }
  };

  const handlePlanChange = async (plan: 'FREE' | 'PLUS' | 'PRO') => {
    try {
      setChangingPlan(true);
      setMessage(null);

      // First, update the database via API
      await authApiPost('/api/dev/set-plan', { plan });

      // Then, update localStorage to stay in sync
      const user = getUser();
      if (user) {
        user.subscriptionPlan = plan;
        setToken(getToken() || '');
      }

      setMessage({
        type: 'success',
        text: `پلن به ${plan === 'FREE' ? 'رایگان' : plan === 'PLUS' ? 'پلاس' : 'پرو'} تغییر کرد.`,
      });

      setCurrentPlan(plan);

      // Auto-hide message after 5 seconds
      setTimeout(() => setMessage(null), 5000);
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.message || 'خطا در تغییر پلن',
      });
    } finally {
      setChangingPlan(false);
    }
  };

  const checkTestData = async () => {
    try {
      const data = await authApiGet('/api/dev/generate-test-data');
      setTestDataExists(data.exists);
      setDataInfo(data);
      setWeeks([]); // Clear weeks on manual refresh
    } catch (error) {
      // API might not exist, ignore
      console.log('Dev tools not available:', error);
    }
  };

  const loadNotificationTypes = async () => {
    try {
      const data = await authApiGet('/api/dev/create-test-notification');
      setNotificationTypes(data.availableTypes || []);
    } catch (error) {
      console.log('Notification test not available:', error);
    }
  };

  const generateTestData = async (days: number = 14) => {
    try {
      setLoading(true);
      setMessage(null);

      // Always clear old data and generate new
      const result = await authApiPost<TestDataResponse>('/api/dev/generate-test-data', {
        days,
        clearBefore: true,
      });

      const clearedText = result.data.clearedOldData.commitments > 0
        ? ` (${result.data.clearedOldData.commitments} تعهد قبلی حذف شد)`
        : '';

      setMessage({
        type: 'success',
        text: `${result.data.totalWeeks} هفته کامل (${result.data.totalDays} روز) با نرخ تکمیل ${result.data.completionRate} تولید شد${clearedText}`,
      });

      setWeeks(result.data.weeks);

      // Refresh data info
      await checkTestData();

      // Dispatch event to notify all components that test data was generated
      window.dispatchEvent(new CustomEvent('testDataGenerated', {
        detail: { days: result.data.totalDays, weeks: result.data.totalWeeks }
      }));

      // Auto-hide message after 6 seconds
      setTimeout(() => setMessage(null), 6000);
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.message || 'خطا در تولید داده',
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteTestData = async () => {
    if (!confirm('آیا مطمئن هستید که می‌خواهید همه داده‌های تستی را حذف کنید؟')) {
      return;
    }

    try {
      setLoading(true);
      setMessage(null);

      const result = await authApiDelete('/api/dev/generate-test-data');

      console.log('✅ Data deleted successfully:', result);
      console.log('📢 Dispatching testDataCleared event...');

      setMessage({
        type: 'success',
        text: `${result.deleted.commitments} تعهد و ${result.deleted.reflections} بازتاب حذف شد`,
      });

      setWeeks([]);

      // Refresh data info
      await checkTestData();

      // Dispatch event to notify all components that test data was cleared
      window.dispatchEvent(new CustomEvent('testDataCleared', {
        detail: { deleted: result.deleted }
      }));

      console.log('✅ testDataCleared event dispatched!');

      // Auto-hide message after 5 seconds
      setTimeout(() => setMessage(null), 5000);
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.message || 'خطا در حذف داده',
      });
    } finally {
      setLoading(false);
    }
  };

  const createTestNotification = async (type: string) => {
    try {
      setCreatingNotification(true);
      setMessage(null);

      await authApiPost('/api/dev/create-test-notification', { type });

      setMessage({
        type: 'success',
        text: 'نوتیفیکیشن تستی ایجاد شد. زنگوله را چک کنید!',
      });

      // Auto-hide message after 4 seconds
      setTimeout(() => setMessage(null), 4000);
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.message || 'خطا در ایجاد نوتیفیکیشن',
      });
    } finally {
      setCreatingNotification(false);
    }
  };

  const createLeaderboardTestData = async () => {
    try {
      setCreatingLeaderboardData(true);
      setMessage(null);

      const response = await fetch('/api/dev/create-leaderboard-test-data', {
        method: 'POST',
      });
      const result = await response.json();
      console.log('createLeaderboardTestData result:', result);

      if (result.success) {
        setMessage({
          type: 'success',
          text: result.message || 'داده‌های تستی لیدربورد با موفقیت ایجاد شد!',
        });

        // Immediately update state to avoid UI lag
        setHasLeaderboardTestData(true);
        console.log('Set hasLeaderboardTestData to true');

        // Refresh leaderboard test data status (async, for verification)
        checkLeaderboardTestData();

        // Auto-hide message after 4 seconds
        setTimeout(() => setMessage(null), 4000);
      } else {
        setMessage({
          type: 'error',
          text: result.error || 'خطا در ایجاد داده‌های تستی لیدربورد',
        });
      }
    } catch (error: any) {
      console.error('Error in createLeaderboardTestData:', error);
      setMessage({
        type: 'error',
        text: error.message || 'خطا در ایجاد داده‌های تستی لیدربورد',
      });
    } finally {
      setCreatingLeaderboardData(false);
    }
  };

  const checkLeaderboardTestData = async () => {
    try {
      const response = await fetch('/api/dev/check-leaderboard-test-data');
      const result = await response.json();
      console.log('checkLeaderboardTestData result:', result);
      setHasLeaderboardTestData(result.hasTestData || false);
    } catch (error) {
      console.log('Leaderboard test data check not available:', error);
    }
  };

  const clearLeaderboardTestData = async () => {
    if (!confirm('آیا مطمئن هستید که می‌خواهید همه داده‌های تستی جامعه را حذف کنید؟')) {
      return;
    }

    try {
      setClearingLeaderboardData(true);
      setMessage(null);

      const response = await fetch('/api/dev/clear-leaderboard-test-data', {
        method: 'DELETE',
      });
      const result = await response.json();
      console.log('clearLeaderboardTestData result:', result);

      if (result.success) {
        setMessage({
          type: 'success',
          text: result.message || 'داده‌های تستی جامعه با موفقیت حذف شد!',
        });

        // Immediately update state to avoid UI lag
        setHasLeaderboardTestData(false);
        console.log('Set hasLeaderboardTestData to false');

        // Refresh leaderboard test data status (async, for verification)
        checkLeaderboardTestData();

        // Auto-hide message after 4 seconds
        setTimeout(() => setMessage(null), 4000);
      } else {
        setMessage({
          type: 'error',
          text: result.error || 'خطا در حذف داده‌های تستی جامعه',
        });
      }
    } catch (error: any) {
      console.error('Error in clearLeaderboardTestData:', error);
      setMessage({
        type: 'error',
        text: error.message || 'خطا در حذف داده‌های تستی جامعه',
      });
    } finally {
      setClearingLeaderboardData(false);
    }
  };

  const createYesterdayCommitment = async () => {
    try {
      setCreatingYesterdayCommitment(true);
      setMessage(null);

      const response = await authApiPost('/api/dev/create-yesterday-commitment', {});

      if (response.success) {
        setMessage({
          type: 'success',
          text: response.message || 'تعهد دیروز با موفقیت ایجاد شد!',
        });

        // Dispatch event to notify all components that data changed
        window.dispatchEvent(new CustomEvent('testDataGenerated', {
          detail: { action: 'yesterday-commitment-created' }
        }));
      } else {
        setMessage({
          type: 'error',
          text: response.message || 'خطا در ایجاد تعهد دیروز',
        });
      }

      // Auto-hide message after 4 seconds
      setTimeout(() => setMessage(null), 4000);
    } catch (error: any) {
      console.error('Error creating yesterday commitment:', error);
      setMessage({
        type: 'error',
        text: error.message || 'خطا در ایجاد تعهد دیروز',
      });
    } finally {
      setCreatingYesterdayCommitment(false);
    }
  };

  const deleteYesterdayCommitment = async () => {
    if (!confirm('آیا مطمئن هستید که می‌خواهید تعهد دیروز را حذف کنید؟')) {
      return;
    }

    try {
      setDeletingYesterdayCommitment(true);
      setMessage(null);

      const response = await authApiDelete('/api/dev/create-yesterday-commitment');

      if (response.success) {
        setMessage({
          type: 'success',
          text: response.message || 'تعهد دیروز با موفقیت حذف شد!',
        });

        // Dispatch event to notify all components that data changed
        window.dispatchEvent(new CustomEvent('testDataCleared', {
          detail: { action: 'yesterday-commitment-deleted' }
        }));
      } else {
        setMessage({
          type: 'error',
          text: response.message || 'خطا در حذف تعهد دیروز',
        });
      }

      // Auto-hide message after 4 seconds
      setTimeout(() => setMessage(null), 4000);
    } catch (error: any) {
      console.error('Error deleting yesterday commitment:', error);
      setMessage({
        type: 'error',
        text: error.message || 'خطا در حذف تعهد دیروز',
      });
    } finally {
      setDeletingYesterdayCommitment(false);
    }
  };

  // Don't render in production
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  return (
    <Card className="p-6 border-2 border-dashed border-gray-300 bg-gray-50/50">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Code2 className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">ابزارهای توسعه</h3>
          <Badge variant="outline" className="text-xs">
            DEV ONLY
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          {testDataExists && (
            <Button
              variant="outline"
              size="sm"
              onClick={deleteTestData}
              disabled={loading}
              className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
            >
              <Trash2 className="w-4 h-4 ml-2" />
              پاک کردن
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={checkTestData}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`mb-4 p-3 rounded-lg flex items-start gap-2 ${
            message.type === 'success'
              ? 'bg-green-50 border border-green-200 text-green-800'
              : message.type === 'error'
              ? 'bg-red-50 border border-red-200 text-red-800'
              : 'bg-blue-50 border border-blue-200 text-blue-800'
          }`}
        >
          {message.type === 'success' && <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />}
          {message.type === 'error' && <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />}
          <p className="text-sm">{message.text}</p>
        </div>
      )}

      {/* Data Info */}
      {dataInfo && testDataExists && (
        <div className="mb-4 p-3 bg-white rounded-lg border border-gray-200">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500 mb-1">تعداد تعهدات</p>
              <p className="font-semibold text-gray-900">{dataInfo.commitmentsCount}</p>
            </div>
            <div>
              <p className="text-gray-500 mb-1">تعداد بازتاب‌ها</p>
              <p className="font-semibold text-gray-900">{dataInfo.reflectionsCount}</p>
            </div>
            <div>
              <p className="text-gray-500 mb-1">نرخ تکمیل</p>
              <p className="font-semibold text-gray-900">{dataInfo.completionRate}</p>
            </div>
            <div>
              <p className="text-gray-500 mb-1">بازه زمانی</p>
              <p className="font-semibold text-gray-900">
                {dataInfo.dateRange ? `${dataInfo.dateRange.days} روز` : '-'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Weeks Data */}
      {weeks.length > 0 && (
        <div className="mb-4 p-3 bg-white rounded-lg border border-gray-200 max-h-48 overflow-y-auto">
          <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            هفته‌های تولید شده
          </h4>
          <div className="space-y-2">
            {weeks.map((week, index) => (
              <div key={index} className="flex items-center justify-between text-xs p-2 bg-gray-50 rounded">
                <div>
                  <span className="font-medium text-gray-700">
                    هفته {index + 1}
                  </span>
                  <span className="text-gray-500 mr-2">
                    ({week.daysCount} روز)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-600">
                    {week.completedCount}/{week.daysCount}
                  </span>
                  <Badge variant={parseInt(week.completionRate) >= 70 ? 'default' : parseInt(week.completionRate) >= 50 ? 'secondary' : 'destructive'} className="text-xs">
                    {week.completionRate}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-4">
        {/* Plan Switcher Section */}
        <div>
          <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Crown className="w-4 h-4" />
            تغییر پلن
          </h4>
          <p className="text-xs text-gray-600 mb-3">
            پلن فعلی: <Badge className="mr-1">{currentPlan === 'FREE' ? 'رایگان' : currentPlan === 'PLUS' ? 'پلاس' : 'پرو'}</Badge>
          </p>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={currentPlan === 'FREE' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handlePlanChange('FREE')}
              disabled={changingPlan}
              className={currentPlan === 'FREE' ? 'bg-gray-600 hover:bg-gray-700' : ''}
            >
              <Zap className="w-4 h-4 ml-2" />
              پلن رایگان
            </Button>
            <Button
              variant={currentPlan === 'PLUS' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handlePlanChange('PLUS')}
              disabled={changingPlan}
              className={currentPlan === 'PLUS' ? 'bg-blue-600 hover:bg-blue-700' : ''}
            >
              <Zap className="w-4 h-4 ml-2" />
              پلن پلاس
            </Button>
            <Button
              variant={currentPlan === 'PRO' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handlePlanChange('PRO')}
              disabled={changingPlan}
              className={currentPlan === 'PRO' ? 'bg-yellow-600 hover:bg-yellow-700' : ''}
            >
              <Crown className="w-4 h-4 ml-2" />
              پلن پرو
            </Button>
          </div>
        </div>

        {/* Test Data Generation Section */}
        <div className="pt-4 border-t border-gray-200">
          <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Database className="w-4 h-4" />
            ایجاد داده‌های تستی
          </h4>
          {!testDataExists ? (
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                داده تستی ندارید. برای تست گزارش هفتگی و تحلیل AI، داده‌های تستی تولید کنید:
              </p>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => generateTestData(3)}
                  disabled={loading}
                  className="border-orange-300 text-orange-700 hover:bg-orange-50 hover:border-orange-400"
                >
                  <Database className="w-4 h-4 ml-2" />
                  3 روز (کاربر جدید)
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => generateTestData(7)}
                  disabled={loading}
                >
                  <Database className="w-4 h-4 ml-2" />
                  7 روز (1 هفته)
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => generateTestData(14)}
                  disabled={loading}
                >
                  <Database className="w-4 h-4 ml-2" />
                  14 روز (2 هفته)
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => generateTestData(28)}
                  disabled={loading}
                >
                  <Database className="w-4 h-4 ml-2" />
                  28 روز (4 هفته)
                </Button>
              </div>
              <p className="text-xs text-orange-600 mt-2">
                💡 گزینه "3 روز (کاربر جدید)" برای تست قابلیت پیشنهاد هوشمند تعهدات مناسب است (نیاز به 7 روز داده دارد).
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                داده تستی موجود است. برای تولید داده جدید، دکمه زیر را بزنید:
              </p>
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => generateTestData(3)}
                  disabled={loading}
                  className="border-orange-300 text-orange-700 hover:bg-orange-50 hover:border-orange-400"
                >
                  <Database className="w-4 h-4 ml-2" />
                  3 روز (کاربر جدید)
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => generateTestData(7)}
                  disabled={loading}
                >
                  <Database className="w-4 h-4 ml-2" />
                  1 هفته جدید
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => generateTestData(14)}
                  disabled={loading}
                >
                  <Database className="w-4 h-4 ml-2" />
                  2 هفته جدید
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => generateTestData(28)}
                  disabled={loading}
                >
                  <Database className="w-4 h-4 ml-2" />
                  4 هفته جدید
                </Button>
              </div>
              <p className="text-xs text-orange-600">
                💡 گزینه "3 روز (کاربر جدید)" برای تست قابلیت پیشنهاد هوشمند تعهدات مناسب است (نیاز به 7 روز داده دارد).
              </p>
            </div>
          )}
        </div>

        {/* Yesterday Reflection Testing Section */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            تست بازتاب دیروز
          </h4>
          <p className="text-xs text-gray-600 mb-3">
            برای تست قابلیت بازتاب دیروز، یک تعهد برای دیروز بدون بازتاب ایجاد کنید:
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={createYesterdayCommitment}
              disabled={creatingYesterdayCommitment || deletingYesterdayCommitment}
              className="flex-1 border-orange-300 text-orange-700 hover:bg-orange-50 hover:border-orange-400"
            >
              <Calendar className="w-4 h-4 ml-2" />
              {creatingYesterdayCommitment ? 'در حال ایجاد...' : 'ایجاد تعهد دیروز'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={deleteYesterdayCommitment}
              disabled={deletingYesterdayCommitment || creatingYesterdayCommitment}
              className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
            >
              <Trash2 className="w-4 h-4 ml-2" />
              {deletingYesterdayCommitment ? 'در حال حذف...' : 'حذف'}
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            💡 بعد از زدن دکمه "ایجاد"، صفحه را رفرش کنید تا کارت بازتاب دیروز نمایش داده شود.
          </p>
        </div>
      </div>

      {/* Warning */}
      <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
        <p className="text-xs text-amber-800">
          <strong>توجه:</strong> این ابزار فقط برای توسعه است. در production غیرفعال خواهد شد.
          <br />
          • داده‌ها به صورت هفته‌های کامل (از شنبه تا جمعه) تولید می‌شوند
          <br />
          • با هر بار تولید، داده‌های قبلی پاک می‌شوند
          <br />
          • تغییر پلن فقط روی localStorage شما اثر می‌گذارد، برای تست قابلیت‌های مختلف استفاده می‌شود
          <br />
          • برای پاک کردن داده‌های تستی از دکمه‌های "پاک کردن" در بالای پنل و بخش "تست بازتاب دیروز" استفاده کنید
        </p>
      </div>

      {/* Notification Testing Section */}
      {notificationTypes.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Bell className="w-4 h-4" />
            تست نوتیفیکیشن‌ها
          </h4>
          <p className="text-xs text-gray-600 mb-3">
            برای تست سیستم نوتیفیکیشن، روی یکی از دکمه‌های زیر کلیک کنید:
          </p>
          <div className="flex gap-2 flex-wrap">
            {notificationTypes.map((nt) => (
              <Button
                key={nt.type}
                variant="outline"
                size="sm"
                onClick={() => createTestNotification(nt.type)}
                disabled={creatingNotification}
                className="text-xs"
              >
                {nt.title}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Community Testing Section */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Users className="w-4 h-4" />
          تست جامعه
        </h4>
        <p className="text-xs text-gray-600 mb-3">
          برای تست لیدربورد و جامعه، داده‌های تستی ایجاد کنید:
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={createLeaderboardTestData}
            disabled={creatingLeaderboardData || clearingLeaderboardData || hasLeaderboardTestData}
            className="flex-1"
          >
            <Trophy className="w-4 h-4 ml-2" />
            {creatingLeaderboardData ? 'در حال ایجاد...' : 'ایجاد داده‌های تستی'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={clearLeaderboardTestData}
            disabled={clearingLeaderboardData || creatingLeaderboardData || !hasLeaderboardTestData}
            className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
          >
            <Trash2 className="w-4 h-4 ml-2" />
            {clearingLeaderboardData ? 'در حال حذف...' : 'حذف داده‌های تستی'}
          </Button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          کاربران، پست‌ها، لایک‌ها، کامنت‌ها و فالووینگ‌ها ایجاد می‌شوند
          {!hasLeaderboardTestData && ' - ابتدا داده تستی ایجاد کنید تا بتوانید حذف کنید'}
          {hasLeaderboardTestData && ' - داده‌های تستی قبلاً ایجاد شده‌اند'}
        </p>
      </div>
    </Card>
  );
}
