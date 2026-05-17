'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Share2, Calendar, Award, Target, Flame, User, Copy, Check } from 'lucide-react';
import { toPersianNumber } from '@/lib/utils/persian';
import Link from 'next/link';

interface SharedAchievement {
  id: string;
  shareToken: string;
  achievementType: 'commitment' | 'streak' | 'plan_completed';
  data: any;
  title?: string;
  description?: string;
  user: {
    name: string | null;
    profileImage: string | null;
  };
  createdAt: string;
  views: number;
}

export default function SharedAchievementPage() {
  const params = useParams();
  const router = useRouter();
  const [achievement, setAchievement] = useState<SharedAchievement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchAchievement();
  }, [params.token]);

  const fetchAchievement = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/share/${params.token}`);
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'خطا در دریافت دستاورد');
        return;
      }

      setAchievement(data);
    } catch (err: any) {
      setError('خطا در دریافت دستاورد');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-gray-500">در حال بارگذاری...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <Card className="p-8 max-w-md">
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <span className="text-3xl">❌</span>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">خطا</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <Link href="/">
              <Button>بازگشت به صفحه اصلی</Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  const getAchievementIcon = () => {
    switch (achievement?.achievementType) {
      case 'commitment':
        return <Target className="w-12 h-12 text-purple-600" />;
      case 'streak':
        return <Flame className="w-12 h-12 text-orange-600" />;
      case 'plan_completed':
        return <Award className="w-12 h-12 text-green-600" />;
      default:
        return <Award className="w-12 h-12 text-gray-600" />;
    }
  };

  const getAchievementTitle = () => {
    if (achievement?.title) return achievement.title;

    switch (achievement?.achievementType) {
      case 'commitment':
        return 'تعهد انجام شده';
      case 'streak':
        return `${toPersianNumber(achievement.data.streak)} روز متوالی!`;
      case 'plan_completed':
        return 'برنامه تکمیل شد!';
      default:
        return 'دستاورد';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4" dir="rtl">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <Card className="p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <Link href="/">
              <h1 className="text-2xl font-bold text-gray-900">همسو</h1>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCopy}
              title="کپی لینک"
            >
              {copied ? <Check className="w-5 h-5 text-green-600" /> : <Copy className="w-5 h-5" />}
            </Button>
          </div>

          {/* User Info */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center overflow-hidden">
              {achievement?.user.profileImage ? (
                <img
                  src={achievement.user.profileImage}
                  alt="پروفایل"
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-6 h-6 text-white" />
              )}
            </div>
            <div>
              <p className="font-medium text-gray-900">
                {achievement?.user.name || 'کاربر همسو'}
              </p>
              <p className="text-sm text-gray-500">
                {new Date(achievement?.createdAt || '').toLocaleDateString('fa-IR')}
              </p>
            </div>
          </div>

          {/* Achievement */}
          <div className="flex items-center gap-4 p-6 bg-gray-50 rounded-lg">
            <div className="flex-shrink-0">
              {getAchievementIcon()}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                {getAchievementTitle()}
              </h2>
              {achievement?.description && (
                <p className="text-gray-600">{achievement.description}</p>
              )}
              {achievement?.achievementType === 'commitment' && achievement.data && (
                <p className="text-lg text-gray-900 mt-2">
                  "{achievement.data.text}"
                </p>
              )}
            </div>
          </div>
        </Card>

        {/* Stats */}
        {achievement?.achievementType === 'streak' && achievement.data && (
          <Card className="p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">آمار فعالیت</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <Flame className="w-6 h-6 text-orange-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900">
                  {toPersianNumber(achievement.data.streak)}
                </p>
                <p className="text-sm text-gray-600 mt-1">روز متوالی</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <Target className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900">
                  {toPersianNumber(achievement.data.totalCommitments)}
                </p>
                <p className="text-sm text-gray-600 mt-1">کل تعهدات</p>
              </div>
            </div>
          </Card>
        )}

        {/* Footer */}
        <div className="text-center text-sm text-gray-500">
          <p>{toPersianNumber(achievement?.views || 0)} بازدید</p>
          <p className="mt-2">
            <Link href="/" className="text-purple-600 hover:text-purple-700">
              به همسو بپیوندید
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
