'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { LogOut, Home, Bell, Clock, User, Save, CheckCircle2 } from 'lucide-react';
import { authApiGet, authApiPatch, getUser, clearToken, isAuthenticated } from '@/lib/api';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toPersianNumber } from '@/lib/utils/persian';

interface UserSettings {
  id: string;
  phone: string;
  name: string | null;
  notificationTime: string;
  notificationEnabled: boolean;
  subscriptionPlan: string;
}

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notificationEnabled, setNotificationEnabled] = useState(true);
  const [notificationTime, setNotificationTime] = useState('09:00');
  const [name, setName] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }

    fetchSettings();
  }, [router]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const data = await authApiGet<UserSettings>('/api/user/settings');
      setUser(data);
      setNotificationEnabled(data.notificationEnabled);
      setNotificationTime(data.notificationTime);
      setName(data.name || '');
    } catch (error: any) {
      console.error('Error fetching settings:', error);
      if (error.message?.includes('401') || error.message?.includes('توکن نامعتبر')) {
        clearToken();
        router.push('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      const updatedUser = await authApiPatch<{ user: UserSettings }>('/api/user/settings', {
        name: name || null,
        notificationEnabled,
        notificationTime,
      });

      setUser(updatedUser.user);
      setSaveSuccess(true);

      // بعد از 3 ثانیه پیام موفقیت را مخفی می‌کنیم
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error: any) {
      alert(error.message || 'خطا در ذخیره تنظیمات');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    clearToken();
    router.push('/login');
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
            <h1 className="text-xl font-bold text-gray-900">تنظیمات</h1>
          </div>
          <Button variant="ghost" size="icon" onClick={handleLogout}>
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Success Message */}
        {saveSuccess && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
            <p className="text-green-700 text-sm">تنظیمات با موفقیت ذخیره شد</p>
          </div>
        )}

        {/* Profile Settings */}
        <Card className="p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <User className="w-6 h-6 text-gray-700" />
            <h2 className="text-xl font-semibold text-gray-900">اطلاعات پروفایل</h2>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="phone">شماره موبایل</Label>
              <Input
                id="phone"
                value={user?.phone || ''}
                disabled
                className="mt-1.5 bg-gray-50"
                dir="ltr"
              />
              <p className="text-xs text-gray-500 mt-1">شماره موبایل قابل تغییر نیست</p>
            </div>

            <div>
              <Label htmlFor="name">نام (اختیاری)</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="نام خود را وارد کنید"
                className="mt-1.5"
              />
            </div>

            <div>
              <Label>پلن فعلی</Label>
              <div className="mt-1.5 p-3 bg-gray-50 rounded-lg">
                <span className="font-medium text-gray-900">
                  {user?.subscriptionPlan === 'free' ? 'رایگان' : user?.subscriptionPlan === 'plus' ? 'پلاس' : 'پرو'}
                </span>
                {user?.subscriptionPlan === 'free' && (
                  <button
                    onClick={() => router.push('/plans')}
                    className="mr-3 text-sm text-blue-600 hover:text-blue-700"
                  >
                    ارتقا به پلن پولی
                  </button>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Notification Settings */}
        <Card className="p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <Bell className="w-6 h-6 text-gray-700" />
            <h2 className="text-xl font-semibold text-gray-900">تنظیمات نوتیفیکیشن</h2>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="notification-toggle" className="text-base">
                  نوتیفیکیشن روزانه
                </Label>
                <p className="text-sm text-gray-600 mt-1">
                  یادآوری برای ثبت تعهد روزانه
                </p>
              </div>
              <div dir="ltr">
                <Switch
                  id="notification-toggle"
                  checked={notificationEnabled}
                  onCheckedChange={setNotificationEnabled}
                />
              </div>
            </div>

            {notificationEnabled && (
              <div className="overflow-hidden transition-all duration-300 ease-in-out">
                <Label htmlFor="notification-time" className="text-base">
                  زمان یادآوری
                </Label>
                <div className="flex items-center gap-3 mt-1.5">
                  <Clock className="w-5 h-5 text-gray-400" />
                  <div className="flex items-center gap-2">
                    {/* Hour Select */}
                    <Select
                      value={notificationTime.split(':')[0]}
                      onValueChange={(value) => {
                        const minute = notificationTime.split(':')[1];
                        setNotificationTime(`${value}:${minute}`);
                      }}
                    >
                      <SelectTrigger className="w-[100px]" dir="ltr">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent dir="rtl">
                        {Array.from({ length: 24 }, (_, i) => {
                          const hour = i.toString().padStart(2, '0');
                          return (
                            <SelectItem key={hour} value={hour}>
                              {toPersianNumber(hour)}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>

                    <span className="text-gray-500">:</span>

                    {/* Minute Select */}
                    <Select
                      value={notificationTime.split(':')[1]}
                      onValueChange={(value) => {
                        const hour = notificationTime.split(':')[0];
                        setNotificationTime(`${hour}:${value}`);
                      }}
                    >
                      <SelectTrigger className="w-[100px]" dir="ltr">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent dir="rtl">
                        {['00', '15', '30', '45'].map((minute) => (
                          <SelectItem key={minute} value={minute}>
                            {toPersianNumber(minute)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  یادآوری در این زمان هر روز ارسال می‌شود
                </p>
              </div>
            )}
          </div>
        </Card>

        {/* Account Info */}
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">اطلاعات حساب</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">شماره موبایل:</span>
              <span className="text-gray-900 font-medium" dir="ltr">{toPersianNumber(user?.phone || '')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">تاریخ عضویت:</span>
              <span className="text-gray-900 font-medium">
                {user?.id && new Date().toLocaleDateString('fa-IR')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">پلن:</span>
              <span className="text-gray-900 font-medium">
                {user?.subscriptionPlan === 'free' ? 'رایگان' : user?.subscriptionPlan === 'plus' ? 'پلاس' : 'پرو'}
              </span>
            </div>
          </div>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-gray-900 hover:bg-gray-800 text-white px-8"
          >
            {saving ? (
              <>
                <span className="ml-2">در حال ذخیره...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4 ml-2" />
                ذخیره تنظیمات
              </>
            )}
          </Button>
        </div>

        {/* Danger Zone */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <h3 className="text-lg font-semibold text-red-600 mb-4">خطرناک</h3>
          <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
            <div>
              <p className="font-medium text-red-900">حذف حساب کاربری</p>
              <p className="text-sm text-red-700 mt-1">
                این عمل قابل بازگشت نیست و همه داده‌های شما پاک می‌شود.
              </p>
            </div>
            <Button
              variant="destructive"
              onClick={() => {
                if (confirm('آیا مطمئن هستید که می‌خواهید حساب خود را حذف کنید؟ این عمل قابل بازگشت نیست.')) {
                  alert('در نسخه MVP، حذف حساب غیرفعال است.');
                }
              }}
            >
              حذف حساب
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
