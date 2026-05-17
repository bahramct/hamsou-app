'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { DevToolsPanel } from '@/components/dev/dev-tools-panel';
import { NotificationsDropdown } from '@/components/notifications/notifications-dropdown';
import { ChatWidget } from '@/components/chat/chat-widget';
import { AIDecisionPanel } from '@/components/commitments/ai-suggestion-panel';
import { Settings, LogOut, Target, BarChart3, User, Users } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { authApiPost, authApiGet, setToken, setUser, getToken, clearToken, getUser } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { toPersianNumber } from '@/lib/utils/persian';
import { useTestDataChange } from '@/hooks/useTestDataSync';

interface Plan {
  id: string;
  title: string;
  description: string | null;
  type: string;
  category: string;
  startDate: string;
  endDate: string | null;
  targetDays: number | null;
  currentDays: number;
  status: string;
  priority: string;
}

interface Commitment {
  id: string;
  text: string;
  date: Date;
  plan?: Plan;
  reflection?: {
    id: string;
    completed: boolean;
    reason?: string;
    reflectedAt: Date;
  };
}

export default function Dashboard() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [commitment, setCommitment] = useState<Commitment | null>(null);
  const [yesterdayCommitment, setYesterdayCommitment] = useState<Commitment | null>(null);
  const [cardState, setCardState] = useState<'yesterday-reflection' | 'today-creation' | 'today-fresh' | 'today-result'>('today-creation');
  const [newCommitmentText, setNewCommitmentText] = useState('');
  const [showReflectionForm, setShowReflectionForm] = useState(false);
  const [reflectionCompleted, setReflectionCompleted] = useState(false);
  const [reflectionReason, setReflectionReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [history, setHistory] = useState<Commitment[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('none');
  const [userStartDate, setUserStartDate] = useState<Date | undefined>(undefined);

  // لود کردن داده‌ها
  const loadData = async () => {
    try {
      setLoading(true);
      const [todayData, historyData, plansData] = await Promise.all([
        authApiGet('/api/commitments/today'),
        authApiGet('/api/commitments?limit=100'),
        authApiGet('/api/plans?status=active')
      ]);

      // بررسی تعهد دیروز که بازتاب ندارد
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      if (historyData && Array.isArray(historyData)) {
        const yesterdayData = historyData.find((c: Commitment) => {
          const commitmentDate = new Date(c.date).toISOString().split('T')[0];
          return commitmentDate === yesterdayStr && !c.reflection;
        });
        setYesterdayCommitment(yesterdayData || null);

        // تعیین وضعیت کارت - منطق تقویم‌محور
        // اولویت اول: بازتاب دیروز
        if (yesterdayData) {
          setCardState('yesterday-reflection');
          setCommitment(yesterdayData);
          setShowReflectionForm(true);
        } else if (todayData) {
          // تعهد امروز وجود دارد
          setCommitment(todayData);
          if (todayData.reflection) {
            setCardState('today-result');
            setShowReflectionForm(false);
          } else {
            // تعهد امروز بدون بازتاب - همیشه حالت fresh (نه reflection)
            setCardState('today-fresh');
            setShowReflectionForm(false);
          }
        } else {
          // هیچ تعهدی برای امروز وجود ندارد
          setCardState('today-creation');
          setShowReflectionForm(false);
        }
      }

      // بررسی ساختار پاسخ - ممکن است مستقیم آرایه باشد یا در items باشد
      const commitmentsArray = (historyData?.items && Array.isArray(historyData.items))
        ? historyData.items
        : (Array.isArray(historyData) ? historyData : []);

      if (commitmentsArray.length > 0) {
        setHistory(commitmentsArray.slice(0, 7));
        const oldestCommitment = commitmentsArray[commitmentsArray.length - 1];
        setUserStartDate(new Date(oldestCommitment.date));
      } else {
        // اگر هیچ تعهدی وجود نداره، تاریخ شروع و تاریخچه رو null می‌کنیم
        setUserStartDate(undefined);
        setHistory([]);
      }

      if (Array.isArray(plansData)) {
        setPlans(plansData);
      }
    } catch (error: any) {
      console.error('Error loading data:', error);
      // اگر تعهد امروز وجود نداشت، فرم جدید نمایش می‌دهیم
      setCommitment(null);
      setShowReflectionForm(false);
      setCardState('today-creation');
    } finally {
      setLoading(false);
    }
  };

  // چک کردن احراز هویت و لود کردن داده‌ها
  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push('/login');
      return;
    }

    // لود کردن داده‌ها
    loadData();
  }, [router]);

  // Sync with DevToolsPanel - refresh data when test data changes
  useTestDataChange(() => {
    console.log('📢 Test data changed, refreshing...');
    refreshData();
  });

  // رفرش داده‌ها
  const refreshData = async () => {
    console.log('Refreshing data...');
    try {
      const [todayData, historyData, plansData] = await Promise.all([
        authApiGet('/api/commitments/today'),
        authApiGet('/api/commitments?limit=100'),
        authApiGet('/api/plans?status=active')
      ]);

      console.log('todayData:', todayData);
      console.log('historyData:', historyData);
      console.log('historyData type:', typeof historyData, 'isArray:', Array.isArray(historyData));

      // بررسی تعهد دیروز که بازتاب ندارد
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      if (historyData && Array.isArray(historyData)) {
        const yesterdayData = historyData.find((c: Commitment) => {
          const commitmentDate = new Date(c.date).toISOString().split('T')[0];
          return commitmentDate === yesterdayStr && !c.reflection;
        });
        setYesterdayCommitment(yesterdayData || null);

        // تعیین وضعیت کارت - منطق تقویم‌محور
        // اولویت اول: بازتاب دیروز
        if (yesterdayData) {
          setCardState('yesterday-reflection');
          setCommitment(yesterdayData);
          setShowReflectionForm(true);
        } else if (todayData) {
          // تعهد امروز وجود دارد
          setCommitment(todayData);
          if (todayData.reflection) {
            setCardState('today-result');
            setShowReflectionForm(false);
          } else {
            // تعهد امروز بدون بازتاب - همیشه حالت fresh (نه reflection)
            setCardState('today-fresh');
            setShowReflectionForm(false);
          }
        } else {
          // هیچ تعهدی برای امروز وجود ندارد
          setCardState('today-creation');
          setShowReflectionForm(false);
        }
      }

      // بررسی ساختار پاسخ - ممکن است مستقیم آرایه باشد یا در items باشد
      const commitmentsArray = (historyData?.items && Array.isArray(historyData.items))
        ? historyData.items
        : (Array.isArray(historyData) ? historyData : []);

      if (commitmentsArray.length > 0) {
        setHistory(commitmentsArray.slice(0, 7));
        const oldestCommitment = commitmentsArray[commitmentsArray.length - 1];
        setUserStartDate(new Date(oldestCommitment.date));
      } else {
        // اگر هیچ تعهدی وجود نداره، تاریخ شروع و تاریخچه رو null می‌کنیم
        console.log('No history data, clearing history and userStartDate');
        setUserStartDate(undefined);
        setHistory([]);
      }

      if (Array.isArray(plansData)) {
        setPlans(plansData);
      }
    } catch (error: any) {
      console.error('Error refreshing data:', error);
    }
  };

  // ثبت تعهد جدید
  const handleCreateCommitment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommitmentText.trim()) return;

    setSubmitting(true);
    try {
      const data = await authApiPost('/api/commitments', {
        text: newCommitmentText,
        planId: selectedPlanId !== 'none' ? selectedPlanId : undefined
      });
      setCommitment(data);
      setCardState('today-fresh');
      setNewCommitmentText('');
      setSelectedPlanId('none');
      toast({
        title: 'موفق',
        description: 'تعهد با موفقیت ثبت شد',
      });
    } catch (error: any) {
      console.error('Error creating commitment:', error);
      toast({
        title: 'خطا',
        description: error.message || 'خطا در ثبت تعهد',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // ثبت بازتاب
  const handleReflection = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!commitment) return;

    setSubmitting(true);
    try {
      const response = await authApiPost('/api/reflections', {
        commitmentId: commitment.id,
        completed: reflectionCompleted,
        reason: reflectionCompleted ? undefined : reflectionReason
      });

      // اگر در حالت بازتاب دیروز بودیم، بعد از ثبت به فرم ایجاد تعهد امروز برویم
      if (cardState === 'yesterday-reflection') {
        setCardState('today-creation');
        setCommitment(null);
        setShowReflectionForm(false);
        toast({
          title: 'بازتاب دیروز ثبت شد! ✅',
          description: 'حالا تعهد امروز رو ثبت کن',
        });
      } else {
        // رفرش داده‌ها
        await refreshData();

        // اگر برنامه آپدیت شد، پیام مناسب نمایش دهید
        if (response.planUpdated) {
          const progress = response.planUpdated.targetDays
            ? Math.round((response.planUpdated.currentDays / response.planUpdated.targetDays) * 100)
            : null;

          if (response.planUpdated.status === 'completed') {
            toast({
              title: '🎉 تبریک! برنامه تکمیل شد!',
              description: `${response.planUpdated.title} با موفقیت تکمیل شد!`,
            });
          } else {
            toast({
              title: reflectionCompleted ? 'آفرین! 🎉' : 'موفق',
              description: reflectionCompleted
                ? `تعهدت رو انجام دادی${progress !== null ? ` (پیشرفت: ${toPersianNumber(progress)}٪)` : ''}`
                : 'بازتاب با موفقیت ثبت شد',
            });
          }
        } else {
          toast({
            title: reflectionCompleted ? 'آفرین! 🎉' : 'موفق',
            description: reflectionCompleted ? 'تعهدت رو انجام دادی' : 'بازتاب با موفقیت ثبت شد',
          });
        }
      }

      setReflectionReason('');
      setReflectionCompleted(false);
    } catch (error: any) {
      console.error('Error creating reflection:', error);
      toast({
        title: 'خطا',
        description: error.message || 'خطا در ثبت بازتاب',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // خروج
  const handleLogout = () => {
    clearToken();
    setUser(null);
    router.push('/login');
  };

  // قبول کردن پیشنهاد هوشمند
  const handleAcceptSuggestion = async (suggestion: any) => {
    try {
      await authApiPost('/api/commitments', {
        text: suggestion.title,
      });
      setCardState('today-fresh');
      await refreshData();
    } catch (error: any) {
      console.error('Error accepting suggestion:', error);
      throw error;
    }
  };

  // فرمت تاریخ
  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return new Intl.DateTimeFormat('fa-IR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(d);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col" dir="rtl">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">همسو</h1>
            <p className="text-xs text-gray-500 mt-1">مسیر همسویی با خودت</p>
          </div>
          <div className="flex items-center gap-2">
            <NotificationsDropdown />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push('/analytics')}
              title="داشبورد تحلیلی"
            >
              <BarChart3 className="w-5 h-5 text-gray-600" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push('/my-plans')}
              title="برنامه‌ریزی‌ها"
            >
              <Target className="w-5 h-5 text-gray-600" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push('/profile')}
              title="پروفایل من"
            >
              <User className="w-5 h-5 text-gray-600" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push('/community')}
              title="جامعه همسو"
            >
              <Users className="w-5 h-5 text-gray-600" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push('/settings')}
            >
              <Settings className="w-5 h-5 text-gray-600" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
            >
              <LogOut className="w-5 h-5 text-gray-600" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-2xl mx-auto px-4 py-8 w-full">
        {/* Commitment Card - با انیمیشن و ترنزیشن زیبا */}
        <Card className="mb-6 shadow-lg border-0 overflow-hidden bg-white transition-all duration-500 ease-in-out">
          {/* Header با gradient */}
          <div className={`bg-gradient-to-r ${cardState === 'yesterday-reflection' ? 'from-orange-500 to-amber-500' : 'from-gray-900 to-gray-800'} px-6 py-4`}>
            <h2 className="text-xl font-semibold text-white">
              {cardState === 'yesterday-reflection' ? 'بازتاب دیروز' : 'تعهد امروز'}
            </h2>
            <p className="text-sm text-white/70 mt-1">
              {cardState === 'yesterday-reflection'
                ? `${getUser()?.name ? `${getUser().name} عزیز، ` : ''}دیروز چطور پیش رفت؟`
                : 'مسیر همسویی با خودت'}
            </p>
          </div>

          <div className="p-6">
            {cardState === 'yesterday-reflection' ? (
              // حالت 1: بازتاب دیروز
              <form onSubmit={handleReflection} className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg mb-4 border-r-4 border-orange-400">
                  <p className="text-lg font-medium text-gray-900">
                    {commitment?.text}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">تعهد دیروز</p>
                </div>

                <div className="space-y-3">
                  <Button
                    type="button"
                    variant={reflectionCompleted ? "default" : "outline"}
                    className={`w-full py-6 text-lg transition-all duration-300 ${
                      reflectionCompleted
                        ? 'bg-green-600 hover:bg-green-700 shadow-lg shadow-green-200'
                        : 'hover:bg-green-50 hover:border-green-300'
                    }`}
                    onClick={() => setReflectionCompleted(true)}
                  >
                    <span className="flex items-center justify-center gap-2">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      انجام دادم
                    </span>
                  </Button>

                  <Button
                    type="button"
                    variant={!reflectionCompleted ? "default" : "outline"}
                    className={`w-full py-6 text-lg transition-all duration-300 ${
                      !reflectionCompleted
                        ? 'bg-red-600 hover:bg-red-700 shadow-lg shadow-red-200'
                        : 'hover:bg-red-50 hover:border-red-300'
                    }`}
                    onClick={() => setReflectionCompleted(false)}
                  >
                    <span className="flex items-center justify-center gap-2">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      انجام ندادم
                    </span>
                  </Button>
                </div>

                {!reflectionCompleted && (
                  <div className="mt-4 transition-all duration-300">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      چرا انجام ندادی؟ (اختیاری)
                    </label>
                    <textarea
                      className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                      placeholder="دلیلش رو بنویس..."
                      value={reflectionReason}
                      onChange={(e) => setReflectionReason(e.target.value)}
                      rows={2}
                      maxLength={200}
                    />
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-gray-900 to-gray-800 hover:from-gray-800 hover:to-gray-700 text-white py-4 text-lg mt-4 transition-all duration-300 shadow-lg hover:shadow-xl"
                  disabled={submitting}
                >
                  {submitting ? 'در حال ثبت...' : 'ثبت و ادامه به امروز'}
                </Button>
              </form>
            ) : cardState === 'today-creation' ? (
              // حالت 2: ایجاد تعهد امروز
              <form onSubmit={handleCreateCommitment} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    امروز چه تعهدی برای خودت داری؟
                  </label>
                  <textarea
                    className="w-full p-4 border border-gray-300 rounded-lg resize-none text-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent min-h-[100px] transition-all duration-200"
                    placeholder="تعهد خودت رو اینجا بنویس..."
                    value={newCommitmentText}
                    onChange={(e) => setNewCommitmentText(e.target.value)}
                    rows={3}
                    maxLength={180}
                  />
                  <p className="text-xs text-gray-500 mt-1 text-left">
                    {toPersianNumber(newCommitmentText.length)} / ۱۸۰ کاراکتر
                  </p>
                </div>

                {/* انتخاب برنامه (اختیاری) */}
                {plans.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      متصل به برنامه (اختیاری)
                    </label>
                    <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
                      <SelectTrigger>
                        <SelectValue placeholder="یک برنامه انتخاب کنید" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">بدون برنامه</SelectItem>
                        {plans.map((plan) => (
                          <SelectItem key={plan.id} value={plan.id}>
                            {plan.title} {plan.targetDays && `(${toPersianNumber(plan.currentDays)}/${toPersianNumber(plan.targetDays)})`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-gray-900 to-gray-800 hover:from-gray-800 hover:to-gray-700 text-white py-4 text-lg transition-all duration-300 shadow-lg hover:shadow-xl"
                  disabled={submitting || !newCommitmentText.trim()}
                >
                  {submitting ? 'در حال ثبت...' : 'ثبت تعهد امروز'}
                </Button>
              </form>
            ) : cardState === 'today-fresh' ? (
              // حالت 3: تعهد امروز بدون بازتاب
              <div className="text-center py-8">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-4 bg-green-100">
                  <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-xl font-semibold text-gray-900 mb-3">
                  {commitment?.text}
                </p>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-green-100 text-green-800">
                  ✅ تعهد امروز ثبت شد!
                </div>
                <p className="text-sm text-gray-500 mt-4">فردا برای ثبت بازتاب برگردید</p>
              </div>
            ) : (
              // حالت 4: نتیجه امروز (بازتاب ثبت شده)
              <div className="text-center py-8">
                <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-4 transition-all duration-500 ${
                  commitment?.reflection?.completed ? 'bg-green-100' : 'bg-red-100'
                }`}>
                  {commitment?.reflection?.completed ? (
                    <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                </div>
                <p className="text-xl font-semibold text-gray-900 mb-3">
                  {commitment?.text}
                </p>
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${
                  commitment?.reflection?.completed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {commitment?.reflection?.completed ? '✅ انجام شد!' : '❌ انجام نشد'}
                </div>
                {!commitment?.reflection?.completed && commitment?.reflection?.reason && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg text-sm text-gray-600 max-w-md mx-auto">
                    <span className="font-semibold">دلیل:</span> {commitment.reflection.reason}
                  </div>
                )}
                <p className="text-xs text-gray-400 mt-6">تا فردا منتظر می‌مونیم!</p>
              </div>
            )}
          </div>
        </Card>

        {/* AI Decision Panel - پیشنهاد هوشمند تعهدات */}
        <div className="mb-6">
          <AIDecisionPanel
            userId={getUser().id}
            onAcceptSuggestion={handleAcceptSuggestion}
            hasCommitmentToday={!!commitment}
            userStartDate={userStartDate}
          />
        </div>

        {/* Weekly Report Card */}
        <Card className="p-6 mb-6 shadow-sm border-0 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => router.push('/reports')}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">گزارش هفتگی</h2>
                <p className="text-sm text-gray-500">برای مشاهده insightها کلیک کنید</p>
              </div>
            </div>
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </div>
        </Card>

        {/* History Card */}
        {history.length > 0 && (
          <Card className="p-6 mb-6 shadow-sm border-0">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">تاریخچه اخیر</h2>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {history.map((item) => (
                <div
                  key={item.id}
                  className={`flex items-start gap-3 p-4 rounded-lg ${
                    item.reflection?.completed ? 'bg-green-50' : 'bg-red-50'
                  }`}
                >
                  {item.reflection?.completed ? (
                    <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                  <div className="flex-1">
                    <p className="text-gray-900 text-sm">{item.text}</p>
                    <p className="text-xs text-gray-400 mt-1">{formatDate(item.date)}</p>
                    {!item.reflection?.completed && item.reflection?.reason && (
                      <p className="text-xs text-gray-500 mt-2">دلیل: {item.reflection.reason}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Dev Tools Panel - فقط در محیط توسعه */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-8">
            <DevToolsPanel />
          </div>
        )}
      </main>

      {/* Chat Widget - دستیار هوشمند */}
      {getUser() && <ChatWidget userId={getUser().id} />}
    </div>
  );
}
