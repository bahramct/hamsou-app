/**
 * اسکریپت تست API
 * برای تست کردن تمام endpointهای اصلی
 */

const BASE_URL = 'http://localhost:3000';

async function testAPI() {
  console.log('🧪 شروع تست API...\n');

  // 1. تست ارسال OTP
  console.log('1️⃣ تست ارسال OTP...');
  try {
    const otpRes = await fetch(`${BASE_URL}/api/auth/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '09123456789' }),
    });

    const otpData = await otpRes.json();
    console.log(`   Status: ${otpRes.status}`);
    console.log(`   Response:`, otpData);

    if (!otpRes.ok) {
      throw new Error(otpData.error || 'Failed to send OTP');
    }

    const devCode = otpData.devCode || '1234';
    console.log(`   ✅ OTP ارسال شد (کد: ${devCode})\n`);

    // 2. تست تأیید OTP
    console.log('2️⃣ تست تأیید OTP...');
    const verifyRes = await fetch(`${BASE_URL}/api/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '09123456789', code: devCode }),
    });

    const verifyData = await verifyRes.json();
    console.log(`   Status: ${verifyRes.status}`);
    console.log(`   Response:`, verifyData);

    if (!verifyRes.ok) {
      throw new Error(verifyData.error || 'Failed to verify OTP');
    }

    const token = verifyData.token;
    console.log(`   ✅ ورود موفق\n`);

    // 3. تست دریافت تعهد امروز
    console.log('3️⃣ تست دریافت تعهد امروز...');
    const todayRes = await fetch(`${BASE_URL}/api/commitments/today`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const todayData = await todayRes.json();
    console.log(`   Status: ${todayRes.status}`);
    console.log(`   Response:`, todayData);
    console.log(`   ✅ دریافت تعهد امروز\n`);

    // 4. تست دریافت تاریخچه
    console.log('4️⃣ تست دریافت تاریخچه تعهدات...');
    const historyRes = await fetch(`${BASE_URL}/api/commitments?limit=7`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const historyData = await historyRes.json();
    console.log(`   Status: ${historyRes.status}`);
    console.log(`   Count: ${Array.isArray(historyData) ? historyData.length : 0} commitments`);
    console.log(`   ✅ دریافت تاریخچه\n`);

    // 5. تست دریافت گزارش هفتگی
    console.log('5️⃣ تست دریافت گزارش هفتگی...');
    const reportRes = await fetch(`${BASE_URL}/api/reports/weekly`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const reportData = await reportRes.json();
    console.log(`   Status: ${reportRes.status}`);
    console.log(`   Consistency Score: ${reportData.consistencyScore}`);
    console.log(`   Needs AI: ${reportData.needsAI}`);
    console.log(`   ✅ دریافت گزارش هفتگی\n`);

    // 6. تست تولید گزارش با AI (اگر نیاز باشد)
    if (reportData.needsAI && reportData.id) {
      console.log('6️⃣ تست تولید گزارش با AI...');
      const generateRes = await fetch(`${BASE_URL}/api/reports/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reportId: reportData.id }),
      });

      const generateData = await generateRes.json();
      console.log(`   Status: ${generateRes.status}`);
      console.log(`   Fallback: ${generateData.fallback || false}`);
      console.log(`   Weekly Summary:`, generateData.report?.weeklySummary);
      console.log(`   ✅ تولید گزارش\n`);
    }

    console.log('🎉 همه تست‌ها با موفقیت انجام شد!');
  } catch (error: any) {
    console.error(`\n❌ خطا: ${error.message}`);
    process.exit(1);
  }
}

// اجرای تست
testAPI().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
