'use client';

import { useEffect, useState } from 'next';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Share2, Calendar, Award, Target, ArrowRight } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { toPersianNumber } from '@/lib/utils/persian';

interface AchievementData {
  id: string;
  shareToken: string;
  achievementType: string;
  title: string;
  description: string;
  data: any;
  userName: string;
  imageUrl: string;
  views: number;
  createdAt: string;
}

export default function ShareAchievementPage() {
  const params = useParams();
  const router = useRouter();
  const [achievement, setAchievement] = useState<AchievementData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (params.token) {
      fetchAchievement(params.token as string);
    }
  }, [params.token]);

  const fetchAchievement = async (token: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/achievements/share-info?token=${token}`);
      const result = await response.json();

      if (result.success) {
        setAchievement(result.achievement);
      } else {
        setError(result.error || 'خطا در دریافت اطلاعات');
      }
    } catch (err) {
      setError('خطا در ارتباط با سرور');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      toast({
        title: 'کپی شد',
        description: 'لینک در کلیپ‌بورد کپی شد',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'خطا',
        description: 'خطا در کپی لینک',
      });
    }
  };

  const renderAchievementDetails = () => {
    if (!achievement) return null;

    switch (achievement.achievementType) {
      case 'commitment':
        return (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-purple-600" />
              <span className="text-gray-600">تعداد روز:</span>
              <span className="font-bold text-lg">{toPersianNumber(achievement.data.days || 1)} روز</span>
            </div>
          </div>
        );

      case 'streak':
        return (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-pink-600" />
              <span className="text-gray-600">روزهای متوالی:</span>
              <span className="font-bold text-lg">{toPersianNumber(achievement.data.streakDays || 0)} روز</span>
            </div>
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-600" />
              <span className="text-gray-600">کل تعهدات:</span>
              <span className="font-bold">{toPersianNumber(achievement.data.totalCommitments || 0)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-green-600" />
              <span className="text-gray-600">انجام شده:</span>
              <span className="font-bold">{toPersianNumber(achievement.data.completedCommitments || 0)}</span>
            </div>
          </div>
        );

      case 'plan_completed':
        return (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-cyan-600" />
              <span className="text-gray-600">برنامه:</span>
              <span className="font-bold">{achievement.data.planTitle || 'برنامه'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-yellow-600" />
              <span className="text-gray-600">درصد پیشرفت:</span>
              <span className="font-bold text-lg">{toPersianNumber(achievement.data.percentage || 100)}%</span>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const getAchievementEmoji = () => {
    switch (achievement?.achievementType) {
      case 'commitment':
        return '✅';
      case 'streak':
        const streak = achievement.data?.streakDays || 0;
        return streak >= 30 ? '🔥' : streak >= 7 ? '⚡' : '✨';
      case 'plan_completed':
        return '🏆';
      default:
        return '🌟';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <Card className="p-8 max-w-md w-full mx-4 text-center">
          <div className="text-6xl mb-4">😔</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">خطا</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button onClick={() => router.push('/')}>
            بازگشت به صفحه اصلی
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100" dir="rtl">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center text-white font-bold">
              ه
            </div>
            <span className="font-bold text-gray-900">همسو</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleShare}
          >
            <Share2 className="w-4 h-4 ml-2" />
            اشتراک‌گذاری
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-8">
        <Card className="overflow-hidden">
          {/* Hero Image */}
          {achievement && (
            <div className="relative">
              <img
                src={achievement.imageUrl}
                alt="Achievement"
                className="w-full"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
              <div className="absolute bottom-4 right-4 text-white">
                <div className="text-6xl mb-2">{getAchievementEmoji()}</div>
              </div>
            </div>
          )}

          {/* Content */}
          <div className="p-6">
            {achievement && (
              <>
                {/* Title */}
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  {achievement.title || 'دستاورد من در همسو'}
                </h1>

                {/* Description */}
                {achievement.description && (
                  <p className="text-gray-600 mb-4">
                    {achievement.description}
                  </p>
                )}

                {/* User Name */}
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold">
                    {achievement.userName?.[0] || 'ک'}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{achievement.userName || 'کاربر همسو'}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(achievement.createdAt).toLocaleDateString('fa-IR')}
                    </p>
                  </div>
                </div>

                {/* Details */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  {renderAchievementDetails()}
                </div>

                {/* Stats */}
                <div className="flex items-center justify-between text-sm text-gray-500 border-t pt-4">
                  <span>
                    بازدید: {toPersianNumber(achievement.views)} بار
                  </span>
                  <span>همسو.app</span>
                </div>
              </>
            )}
          </div>
        </Card>

        {/* CTA Card */}
        <Card className="p-6 mt-6 bg-gradient-to-br from-purple-500 to-pink-500 text-white">
          <div className="text-center">
            <h3 className="text-xl font-bold mb-2">همسو - همراه رشد روزانه شما</h3>
            <p className="text-white/80 mb-4">
              اپلیکیشنی برای تعیین و پیگیری تعهدات روزانه، بازتاب و برنامه‌ریزی برای رشد فردی
            </p>
            <Button
              variant="secondary"
              onClick={() => router.push('/')}
              className="bg-white text-purple-600 hover:bg-gray-100"
            >
              شروع رایگان
              <ArrowRight className="w-4 h-4 mr-2" />
            </Button>
          </div>
        </Card>
      </main>
    </div>
  );
}
