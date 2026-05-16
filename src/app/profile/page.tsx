'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Home, Save, CheckCircle2, Camera, Calendar, Target, Award, User } from 'lucide-react';
import { authApiGet, authApiPatch, isAuthenticated } from '@/lib/api';
import { toPersianNumber } from '@/lib/utils/persian';

interface UserProfile {
  id: string;
  phone: string;
  name: string | null;
  bio: string | null;
  profileImage: string | null;
  createdAt: string;
}

interface UserStats {
  totalCommitments: number;
  completedCommitments: number;
  streak: number;
  activePlans: number;
  completedPlans: number;
}

export default function ProfilePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }

    fetchProfile();
  }, [router]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const data = await authApiGet<UserProfile>('/api/profile');
      setUser(data);
      setName(data.name || '');
      setBio(data.bio || '');
      setProfileImage(data.profileImage);

      // Fetch stats
      const statsData = await authApiGet<UserStats>('/api/profile/stats');
      setStats(statsData);
    } catch (error: any) {
      console.error('Error fetching profile:', error);
      if (error.message?.includes('401') || error.message?.includes('توکن نامعتبر')) {
        localStorage.removeItem('token');
        router.push('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('لطفاً فقط فایل تصویر انتخاب کنید');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('حجم فایل نباید بیشتر از ۵ مگابایت باشد');
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/profile/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('خطا در آپلود تصویر');
      }

      const data = await response.json();
      setProfileImage(data.url);
    } catch (error: any) {
      alert(error.message || 'خطا در آپلود تصویر');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      const updatedUser = await authApiPatch<{ user: UserProfile }>('/api/profile', {
        name: name || null,
        bio: bio || null,
      });

      setUser(updatedUser.user);
      setSaveSuccess(true);

      // بعد از 3 ثانیه پیام موفقیت را مخفی می‌کنیم
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error: any) {
      alert(error.message || 'خطا در ذخیره پروفایل');
    } finally {
      setSaving(false);
    }
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
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push('/')}
            >
              <Home className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold text-gray-900">پروفایل من</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Success Message */}
        {saveSuccess && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
            <p className="text-green-700 text-sm">پروفایل با موفقیت ذخیره شد</p>
          </div>
        )}

        {/* Profile Image & Basic Info */}
        <Card className="p-6 mb-6">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            {/* Profile Image */}
            <div className="relative">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center overflow-hidden">
                {profileImage ? (
                  <img
                    src={profileImage}
                    alt="پروفایل"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-16 h-16 text-white" />
                )}
              </div>
              <Button
                size="icon"
                className="absolute bottom-0 left-0 w-10 h-10 rounded-full bg-gray-900 hover:bg-gray-800 text-white"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Camera className="w-4 h-4" />
                )}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />
            </div>

            {/* Name & Bio */}
            <div className="flex-1 w-full">
              <div className="mb-4">
                <Label htmlFor="name">نام نمایشی</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="نام خود را وارد کنید"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="bio">درباره من</Label>
                <Textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="چند جمله درباره خودت بنویس..."
                  className="mt-1.5 resize-none"
                  rows={3}
                  maxLength={200}
                />
                <p className="text-xs text-gray-500 mt-1">{bio.length} / 200</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Statistics */}
        <Card className="p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">آمار کلی</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <Target className="w-6 h-6 text-purple-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">
                {toPersianNumber(stats?.totalCommitments || 0)}
              </p>
              <p className="text-sm text-gray-600 mt-1">کل تعهدات</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <Award className="w-6 h-6 text-green-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">
                {toPersianNumber(stats?.completedCommitments || 0)}
              </p>
              <p className="text-sm text-gray-600 mt-1">انجام شده</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <Calendar className="w-6 h-6 text-blue-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">
                {toPersianNumber(stats?.streak || 0)}
              </p>
              <p className="text-sm text-gray-600 mt-1">روز متوالی</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <Target className="w-6 h-6 text-orange-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">
                {toPersianNumber(stats?.activePlans || 0)}
              </p>
              <p className="text-sm text-gray-600 mt-1">برنامه فعال</p>
            </div>
          </div>
        </Card>

        {/* Privacy Settings */}
        <Card className="p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">تنظیمات حریم خصوصی</h2>
          <p className="text-sm text-gray-600">
            تنظیمات حریم خصوصی به زودی اضافه خواهد شد.
          </p>
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
                ذخیره تغییرات
              </>
            )}
          </Button>
        </div>
      </main>
    </div>
  );
}
