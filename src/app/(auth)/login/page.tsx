'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { apiPost, setToken, setUser } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [devCode, setDevCode] = useState('');

  // ارسال OTP
  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await apiPost('/api/auth/send-otp', { phone });

      // در محیط توسعه، کد را نمایش می‌دهیم
      if (data.devCode) {
        setDevCode(data.devCode);
      }

      setStep('otp');
    } catch (err: any) {
      console.error('Send OTP Error:', err);

      // پیام خطای بهتر
      if (err.message.includes('fetch') || err.message.includes('Failed to fetch')) {
        setError('خطا در ارتباط با سرور. لطفاً دوباره تلاش کنید.');
      } else if (err.message.includes('500')) {
        setError('خطای داخلی سرور. لطفاً کمی صبر کنید و دوباره تلاش کنید.');
      } else {
        setError(err.message || 'خطا در ارسال کد تأیید');
      }
    } finally {
      setLoading(false);
    }
  };

  // تأیید OTP
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await apiPost('/api/auth/verify-otp', { phone, code: otp });

      // ذخیره token و user
      setToken(data.token);
      setUser(data.user);

      // انتقال به صفحه اصلی
      router.push('/');
    } catch (err: any) {
      console.error('Verify OTP Error:', err);

      if (err.message.includes('fetch') || err.message.includes('Failed to fetch')) {
        setError('خطا در ارتباط با سرور. لطفاً دوباره تلاش کنید.');
      } else if (err.message.includes('500')) {
        setError('خطای داخلی سرور. لطفاً کمی صبر کنید و دوباره تلاش کنید.');
      } else {
        setError(err.message || 'کد نامعتبر است');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4" dir="rtl">
      <Card className="w-full max-w-md p-8 shadow-xl border-0">
        {/* Logo / Title */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">همسو</h1>
          <p className="text-gray-600 text-lg">
            {step === 'phone' ? 'برای شروع، شماره موبایل خود را وارد کنید' : 'کد تأیید را وارد کنید'}
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Dev Code (فقط در محیط توسعه) */}
        {devCode && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-sm">
            <p className="font-bold mb-1">کد تست (محیط توسعه):</p>
            <p className="text-2xl font-mono text-center">{devCode}</p>
          </div>
        )}

        {/* فرم شماره موبایل */}
        {step === 'phone' && (
          <form onSubmit={handleSendOTP} className="space-y-6">
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                شماره موبایل
              </label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="09123456789"
                className="text-lg text-center tracking-wider"
                maxLength={11}
                minLength={11}
                required
                dir="ltr"
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-gray-900 hover:bg-gray-800 text-white py-3 text-lg"
              disabled={loading || phone.length !== 11}
            >
              {loading ? 'در حال ارسال...' : 'ارسال کد تأیید'}
            </Button>
          </form>
        )}

        {/* فرم OTP */}
        {step === 'otp' && (
          <form onSubmit={handleVerifyOTP} className="space-y-6">
            <div>
              <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-2">
                کد تأیید 4 رقمی
              </label>
              <Input
                id="otp"
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="1234"
                className="text-3xl text-center tracking-[0.5em]"
                maxLength={4}
                minLength={4}
                required
                dir="ltr"
                autoFocus
              />
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1 py-3"
                onClick={() => {
                  setStep('phone');
                  setDevCode('');
                }}
                disabled={loading}
              >
                <ArrowLeft className="w-4 h-4 ml-2" />
                بازگشت
              </Button>

              <Button
                type="submit"
                className="flex-1 bg-gray-900 hover:bg-gray-800 text-white py-3 text-lg"
                disabled={loading || otp.length !== 4}
              >
                {loading ? 'در حال تأیید...' : 'ورود'}
              </Button>
            </div>
          </form>
        )}

        {/* Footer Text */}
        <p className="text-center text-sm text-gray-500 mt-8">
          با ورود به همسو، شرایط استفاده و حریم خصوصی را می‌پذیرید.
        </p>
      </Card>
    </div>
  );
}
