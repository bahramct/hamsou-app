'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { LogOut, Home, Check, Lock, Crown, Zap, Calendar, BarChart3, FileDown, Download } from 'lucide-react';
import { getUser, clearToken, isAuthenticated } from '@/lib/api';

interface Plan {
  id: 'free' | 'plus' | 'pro';
  name: string;
  description: string;
  price: string;
  period: string;
  features: string[];
  highlighted?: boolean;
  locked?: boolean;
}

export default function PlansPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [currentPlan, setCurrentPlan] = useState<'free' | 'plus' | 'pro'>('free');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }

    try {
      const userData = getUser();
      setUser(userData);
      setCurrentPlan(userData?.subscriptionPlan || 'free');
    } catch (error) {
      router.push('/login');
    } finally {
      setLoading(false);
    }
  }, [router]);

  const handleLogout = () => {
    clearToken();
    router.push('/login');
  };

  const handleUpgrade = (planId: string) => {
    // در نسخه MVP، فقط پیام نمایش می‌دهیم
    alert(`ارتقا به پلن ${planId.toUpperCase()} به زودی فعال می‌شود.`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-gray-500">در حال بارگذاری...</div>
      </div>
    );
  }

  const plans: Plan[] = [
    {
      id: 'free',
      name: 'رایگان',
      description: 'برای شروع مسیر خودآگاهی',
      price: '۰',
      period: 'برای همیشه',
      features: [
        'ثبت تعهد روزانه',
        'بازتاب روزانه',
        'گزارش هفتگی AI (محدود)',
        'حفظ داده: ۳۰ روز',
        'نوتیفیکیشن روزانه',
      ],
    },
    {
      id: 'plus',
      name: 'پلاس',
      description: 'برای تعهد طولانی‌تر',
      price: '۴۹,۰۰۰',
      period: 'ماهانه',
      highlighted: true,
      locked: true,
      features: [
        'همه ویژگی‌های رایگان',
        'گزارش هفتگی AI (کامل)',
        'حفظ داده: ۹۰ روز',
        'تحلیل‌های پیشرفته',
        'خروجی PDF از گزارش‌ها',
        'خروجی Excel از داده‌ها',
        'پشتیبانی اولویت‌دار',
      ],
    },
    {
      id: 'pro',
      name: 'پرو',
      description: 'برای رشد عمیق و پایدار',
      price: '۱۴۹,۰۰۰',
      period: 'ماهانه',
      locked: true,
      features: [
        'همه ویژگی‌های پلاس',
        'گزارش‌های ماهانه AI',
        'حفظ داده: ۳۶۵ روز',
        'تحلیل‌های پیشرفته',
        'Insightهای اختصاصی',
        'خروجی PDF و Excel نامحدود',
        'پشتیبانی VIP',
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100" dir="rtl">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push('/')}
            >
              <Home className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold text-gray-900">پلن‌های اشتراک</h1>
          </div>
          <Button variant="ghost" size="icon" onClick={handleLogout}>
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-12">
        {/* Header Section */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            انتخاب پلن مناسب برای مسیر خودآگاهی شما
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            هر پلن برای مرحله‌ای از مسیر طراحی شده است. می‌توانید در هر زمان پلن خود را تغییر دهید.
          </p>
        </div>

        {/* Current Plan Badge */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm">
            <Calendar className="w-4 h-4" />
            <span>
              پلن فعلی شما: <strong>{currentPlan === 'free' ? 'رایگان' : currentPlan === 'plus' ? 'پلاس' : 'پرو'}</strong>
            </span>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {plans.map((plan) => (
            <Card
              key={plan.id}
              className={`relative p-6 ${
                plan.highlighted
                  ? 'border-2 border-blue-500 shadow-lg'
                  : 'border border-gray-200'
              } ${currentPlan === plan.id ? 'ring-2 ring-green-500' : ''}`}
            >
              {/* Lock Overlay */}
              {plan.locked && (
                <div className="absolute top-4 left-4">
                  <div className="flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                    <Lock className="w-3 h-3" />
                    <span>قفل</span>
                  </div>
                </div>
              )}

              {/* Popular Badge */}
              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <div className="flex items-center gap-1 px-4 py-1 bg-blue-500 text-white rounded-full text-xs font-medium">
                    <Zap className="w-3 h-3" />
                    <span>محبوب‌ترین</span>
                  </div>
                </div>
              )}

              {/* Current Plan Badge */}
              {currentPlan === plan.id && (
                <div className="absolute top-4 right-4">
                  <div className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                    <Check className="w-3 h-3" />
                    <span>فعال</span>
                  </div>
                </div>
              )}

              {/* Plan Header */}
              <div className="text-center mb-6">
                {plan.id === 'pro' && (
                  <Crown className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                )}
                {plan.id === 'plus' && (
                  <Zap className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                )}
                {plan.id === 'free' && (
                  <div className="w-8 h-8 bg-gray-200 rounded-full mx-auto mb-2" />
                )}
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <p className="text-gray-600 text-sm mb-4">{plan.description}</p>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                  <span className="text-gray-500">تومان</span>
                </div>
                <p className="text-sm text-gray-500 mt-1">/{plan.period}</p>
              </div>

              {/* Features */}
              <div className="space-y-3 mb-6">
                {plan.features.map((feature, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 text-sm">{feature}</span>
                  </div>
                ))}
              </div>

              {/* CTA Button */}
              <Button
                className={`w-full ${
                  currentPlan === plan.id
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : plan.highlighted
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-gray-900 hover:bg-gray-800 text-white'
                }`}
                onClick={() => {
                  if (currentPlan !== plan.id) {
                    handleUpgrade(plan.id);
                  }
                }}
                disabled={plan.locked || currentPlan === plan.id}
              >
                {currentPlan === plan.id ? 'پلن فعلی شما' : 'انتخاب پلن'}
              </Button>
            </Card>
          ))}
        </div>

        {/* Feature Comparison */}
        <Card className="p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <BarChart3 className="w-6 h-6" />
            مقایسه ویژگی‌ها
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">
                    ویژگی
                  </th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-700">
                    رایگان
                  </th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-blue-600">
                    پلاس
                  </th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-yellow-600">
                    پرو
                  </th>
                </tr>
              </thead>
              <tbody>
                {[
                  { feature: 'ثبت تعهد روزانه', free: true, plus: true, pro: true },
                  { feature: 'بازتاب روزانه', free: true, plus: true, pro: true },
                  { feature: 'گزارش هفتگی AI', free: 'محدود', plus: 'کامل', pro: 'کامل' },
                  { feature: 'حفظ داده', free: '۳۰ روز', plus: '۹۰ روز', pro: '۳۶۵ روز' },
                  { feature: 'گزارش ماهانه AI', free: false, plus: false, pro: true },
                  { feature: 'تحلیل‌های پیشرفته', free: false, plus: true, pro: true },
                  { feature: 'خروجی PDF از گزارش‌ها', free: false, plus: true, pro: true },
                  { feature: 'خروجی Excel از داده‌ها', free: false, plus: true, pro: true },
                  { feature: 'پشتیبانی', free: 'ایمیل', plus: 'اولویت‌دار', pro: 'VIP' },
                ].map((item, index) => (
                  <tr key={index} className="border-b border-gray-100">
                    <td className="py-3 px-4 text-sm text-gray-700">{item.feature}</td>
                    <td className="py-3 px-4 text-center text-sm text-gray-600">
                      {item.free === true ? (
                        <Check className="w-5 h-5 text-green-500 mx-auto" />
                      ) : item.free === false ? (
                        <Lock className="w-5 h-5 text-gray-400 mx-auto" />
                      ) : (
                        item.free
                      )}
                    </td>
                    <td className="py-3 px-4 text-center text-sm text-blue-600">
                      {item.plus === true ? (
                        <Check className="w-5 h-5 text-green-500 mx-auto" />
                      ) : item.plus === false ? (
                        <Lock className="w-5 h-5 text-gray-400 mx-auto" />
                      ) : (
                        item.plus
                      )}
                    </td>
                    <td className="py-3 px-4 text-center text-sm text-yellow-600">
                      {item.pro === true ? (
                        <Check className="w-5 h-5 text-green-500 mx-auto" />
                      ) : item.pro === false ? (
                        <Lock className="w-5 h-5 text-gray-400 mx-auto" />
                      ) : (
                        item.pro
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* FAQ Section */}
        <div className="mt-12 text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">سوالات متداول</h3>
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <Card className="p-6 text-right">
              <h4 className="font-semibold text-gray-900 mb-2">آیا می‌توانم پلن را تغییر دهم؟</h4>
              <p className="text-sm text-gray-600">
                بله، می‌توانید در هر زمان پلن خود را ارتقا دهید یا تغییر دهید.
              </p>
            </Card>
            <Card className="p-6 text-right">
              <h4 className="font-semibold text-gray-900 mb-2">داده‌های من چه می‌شود؟</h4>
              <p className="text-sm text-gray-600">
                داده‌های شما تا مدت مشخص در پلن شما نگهداری می‌شود. با ارتقا، مدت نگهداری افزایش می‌یابد.
              </p>
            </Card>
            <Card className="p-6 text-right">
              <h4 className="font-semibold text-gray-900 mb-2">آیا لغو اشتراک امکان‌پذیر است؟</h4>
              <p className="text-sm text-gray-600">
                بله، می‌توانید در هر زمان اشتراک را لغو کنید و به پلن رایگان برگردید.
              </p>
            </Card>
            <Card className="p-6 text-right">
              <h4 className="font-semibold text-gray-900 mb-2">تفاوت پلن‌ها چیست؟</h4>
              <p className="text-sm text-gray-600">
                پلن‌ها در مدت نگهداری داده، قابلیت‌های AI و سطح پشتیبانی تفاوت دارند.
              </p>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
