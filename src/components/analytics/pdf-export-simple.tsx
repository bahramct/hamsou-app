'use client';

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { FileDown, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import html2pdf from 'html2pdf.js';
import { getToken, authApiGet } from '@/lib/api';

export function PDFExportSimple({ timeRange }: { timeRange: string }) {
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const fetchReportData = async () => {
    const token = getToken();
    if (!token) return null;

    try {
      const [overview, trends] = await Promise.all([
        authApiGet(`/api/analytics/overview?range=${timeRange}`),
        authApiGet(`/api/analytics/trends?range=${timeRange}`),
      ]);

      return {
        userData: { name: overview.name, phone: overview.phone },
        stats: overview,
        trends: trends || [],
      };
    } catch (error) {
      console.error('Error fetching report data:', error);
      return null;
    }
  };

  const generatePDF = async () => {
    try {
      setLoading(true);

      // Fetch data first
      const data = await fetchReportData();
      if (!data) {
        throw new Error('خطا در دریافت داده‌های گزارش');
      }

      setReportData(data);

      // Wait for DOM to update
      await new Promise(resolve => setTimeout(resolve, 100));

      if (!printRef.current) {
        throw new Error('محتوای PDF یافت نشد');
      }

      const element = printRef.current;
      const opt = {
        margin: [10, 10, 10, 10],
        filename: `hamsou-report-${new Date().toISOString().split('T')[0]}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
      };

      await html2pdf().set(opt).from(element).save();

      toast.success('گزارش PDF با موفقیت دانلود شد');
    } catch (error: any) {
      console.error('Error generating PDF:', error);
      toast.error(error.message || 'خطا در تولید PDF');
    } finally {
      setLoading(false);
    }
  };

  const rangeLabel: Record<string, string> = {
    '7d': '۷ روز اخیر',
    '30d': '۳۰ روز اخیر',
    '90d': '۹۰ روز اخیر',
    'all': 'همه زمان',
  };

  const persianDate = new Date().toLocaleDateString('fa-IR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div>
      {/* Hidden template for PDF generation */}
      {reportData && (
        <div ref={printRef} className="hidden">
          <div dir="rtl" style={{ fontFamily: 'Vazirmatn, Tahoma, Arial, sans-serif', padding: '40px', direction: 'rtl' }}>
            {/* Header */}
            <div style={{
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              color: 'white',
              padding: '30px',
              borderRadius: '10px',
              marginBottom: '30px',
              textAlign: 'center'
            }}>
              <h1 style={{ fontSize: '28px', margin: '0 0 10px 0' }}>گزارش تحلیلی همسو</h1>
              <p style={{ fontSize: '16px', margin: '0', opacity: 0.9 }}>
                گزارش پیشرفت شما در {rangeLabel[timeRange]}
              </p>
            </div>

            {/* User Info */}
            <div style={{
              background: '#f8fafc',
              padding: '20px',
              borderRadius: '8px',
              marginBottom: '30px',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '15px'
            }}>
              <div>
                <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '5px' }}>کاربر</div>
                <div style={{ fontSize: '16px', fontWeight: '600' }}>{reportData.userData?.name || 'نامشخص'}</div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '5px' }}>تاریخ گزارش</div>
                <div style={{ fontSize: '16px', fontWeight: '600' }}>{persianDate}</div>
              </div>
            </div>

            {/* Stats Grid */}
            <div style={{ marginBottom: '30px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '15px', color: '#1e293b' }}>
                خلاصه آمار
              </h2>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: '15px'
              }}>
                <div style={{
                  background: 'linear-gradient(135deg, #f1f5f9, #e2e8f0)',
                  padding: '20px',
                  borderRadius: '8px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '32px', fontWeight: '700', color: '#1e293b', marginBottom: '5px' }}>
                    {reportData.stats.totalCommitments}
                  </div>
                  <div style={{ fontSize: '14px', color: '#64748b' }}>کل تعهدات</div>
                </div>
                <div style={{
                  background: 'linear-gradient(135deg, #f1f5f9, #e2e8f0)',
                  padding: '20px',
                  borderRadius: '8px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '32px', fontWeight: '700', color: '#1e293b', marginBottom: '5px' }}>
                    {reportData.stats.completedCommitments}
                  </div>
                  <div style={{ fontSize: '14px', color: '#64748b' }}>تکمیل شده</div>
                </div>
                <div style={{
                  background: 'linear-gradient(135deg, #f1f5f9, #e2e8f0)',
                  padding: '20px',
                  borderRadius: '8px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '32px', fontWeight: '700', color: '#1e293b', marginBottom: '5px' }}>
                    {Math.round(reportData.stats.completionRate)}%
                  </div>
                  <div style={{ fontSize: '14px', color: '#64748b' }}>نرخ تکمیل</div>
                </div>
                <div style={{
                  background: 'linear-gradient(135deg, #f1f5f9, #e2e8f0)',
                  padding: '20px',
                  borderRadius: '8px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '32px', fontWeight: '700', color: '#1e293b', marginBottom: '5px' }}>
                    {reportData.stats.currentStreak}
                  </div>
                  <div style={{ fontSize: '14px', color: '#64748b' }}>روزهای متوالی</div>
                </div>
              </div>
            </div>

            {/* Trends Table */}
            {reportData.trends && reportData.trends.length > 0 && (
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '15px', color: '#1e293b' }}>
                  روند هفتگی
                </h2>
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
                  <thead>
                    <tr>
                      <th style={{
                        padding: '12px 15px',
                        background: '#f1f5f9',
                        fontWeight: '600',
                        color: '#1e293b',
                        border: '1px solid #e2e8f0'
                      }}>هفته</th>
                      <th style={{
                        padding: '12px 15px',
                        background: '#f1f5f9',
                        fontWeight: '600',
                        color: '#1e293b',
                        border: '1px solid #e2e8f0'
                      }}>کل</th>
                      <th style={{
                        padding: '12px 15px',
                        background: '#f1f5f9',
                        fontWeight: '600',
                        color: '#1e293b',
                        border: '1px solid #e2e8f0'
                      }}>تکمیل</th>
                      <th style={{
                        padding: '12px 15px',
                        background: '#f1f5f9',
                        fontWeight: '600',
                        color: '#1e293b',
                        border: '1px solid #e2e8f0'
                      }}>درصد</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.trends.map((trend: any, index: number) => (
                      <tr key={index} style={{
                        background: index % 2 === 0 ? '#f8fafc' : 'white'
                      }}>
                        <td style={{ padding: '12px 15px', border: '1px solid #e2e8f0' }}>{trend.week}</td>
                        <td style={{ padding: '12px 15px', border: '1px solid #e2e8f0' }}>{trend.total}</td>
                        <td style={{ padding: '12px 15px', border: '1px solid #e2e8f0' }}>{trend.completed}</td>
                        <td style={{ padding: '12px 15px', border: '1px solid #e2e8f0' }}>{trend.rate}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Footer */}
            <div style={{
              textAlign: 'center',
              padding: '20px',
              marginTop: '40px',
              color: '#94a3b8',
              fontSize: '14px',
              borderTop: '1px solid #e2e8f0'
            }}>
              <p>تولید شده توسط همسو - پلتفرم رشد شخصی شما</p>
            </div>
          </div>
        </div>
      )}

      {/* PDF Export Button */}
      <Button onClick={generatePDF} disabled={loading} variant="outline" size="sm">
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 ml-2 animate-spin" />
            در حال تولید...
          </>
        ) : (
          <>
            <FileDown className="w-4 h-4 ml-2" />
            دانلود PDF
          </>
        )}
      </Button>
    </div>
  );
}
