/**
 * PDF Templates for Hamsou Reports
 * Clean, reusable templates for different report types with Persian support
 */

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { loadVazirmatnFont } from './pdf-font-loader';
import {
  toPersianNumber,
  getPersianDate,
  RANGE_LABELS,
  getSummaryRows,
  getWeeklyTrendRows,
  getFileName,
  type SummaryStats,
  type WeeklyTrend,
  type UserData,
} from './pdf-helpers';
import {
  ReportTemplate,
  getTemplateConfig,
  type TemplateConfig,
  type ColorTheme,
} from './pdf-template-types';

// Extend jsPDF type
declare module 'jspdf' {
  interface jsPDF {
    lastAutoTable?: { finalY: number };
  }
}

/**
 * PDF Template for Analytics Report
 * Supports multiple templates with different layouts and themes
 */
export class AnalyticsReportTemplate {
  private doc: jsPDF;
  private pageWidth: number;
  private pageHeight: number;
  private margin: number;
  private templateConfig: TemplateConfig;

  constructor(template: ReportTemplate = ReportTemplate.DEFAULT) {
    this.doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    this.pageWidth = 210; // A4 width in mm
    this.pageHeight = 297; // A4 height in mm
    this.margin = 15;
    this.templateConfig = getTemplateConfig(template);

    // Load Persian font
    loadVazirmatnFont(this.doc);
  }

  /**
   * Add header to the PDF
   */
  private addHeader(title: string, subtitle: string): void {
    if (!this.templateConfig.showHeader) return;

    // Ensure Vazirmatn font is set
    this.doc.setFont('Vazirmatn');

    // Background
    this.doc.setFillColor(...this.templateConfig.colorTheme.primary);
    this.doc.rect(0, 0, this.pageWidth, 35, 'F');

    // Title
    this.doc.setTextColor(255, 255, 255);
    this.doc.setFontSize(20);
    this.doc.text(title, this.pageWidth / 2, 15, { align: 'center' });

    // Subtitle
    this.doc.setFontSize(11);
    this.doc.text(subtitle, this.pageWidth / 2, 27, { align: 'center' });
  }

  /**
   * Add user info section
   */
  private addUserInfo(userData: UserData): number {
    if (!this.templateConfig.showUserInfo) return 45;

    this.doc.setFont('Vazirmatn');
    this.doc.setTextColor(...this.templateConfig.colorTheme.text);
    let yPos = 45;

    // Section title
    this.doc.setFontSize(12);
    this.doc.setTextColor(...this.templateConfig.colorTheme.primary);
    this.doc.text('اطلاعات گزارش', this.margin, yPos);
    yPos += 8;

    // User info
    this.doc.setFontSize(10);
    this.doc.setTextColor(...this.templateConfig.colorTheme.text);
    this.doc.text(`نام کاربر: ${userData.name || 'نامشخص'}`, this.margin, yPos);
    yPos += 5;
    this.doc.text(`شماره تماس: ${userData.phone || '-'}`, this.margin, yPos);
    yPos += 5;
    this.doc.text(`تاریخ گزارش: ${getPersianDate()}`, this.margin, yPos);
    yPos += 5;
    this.doc.text(`نوع پلن: ${userData.subscriptionPlan}`, this.margin, yPos);

    return yPos + 10;
  }

  /**
   * Add summary statistics table
   */
  private addSummaryTable(stats: SummaryStats, startY: number): number {
    if (!this.templateConfig.showSummaryTable) return startY;

    const summaryRows = getSummaryRows(stats);

    autoTable(this.doc, {
      startY,
      head: [['آیتم', 'مقدار']],
      body: summaryRows,
      theme: 'grid',
      styles: {
        font: 'Vazirmatn',
        fontSize: 10,
      },
      headStyles: {
        fillColor: this.templateConfig.colorTheme.primary,
        textColor: [255, 255, 255],
        halign: 'center',
        valign: 'middle',
        fontSize: 11,
        fontStyle: 'bold',
      },
      bodyStyles: {
        halign: 'center',
        valign: 'middle',
        fontSize: 10,
      },
      columnStyles: {
        0: { halign: 'right', cellWidth: 90 },
        1: { halign: 'center', cellWidth: 60 },
      },
      margin: { top: 5, right: this.margin, bottom: 5, left: this.margin },
    });

    return (this.doc as any).lastAutoTable?.finalY || startY + 100;
  }

  /**
   * Add weekly trend table
   */
  private addWeeklyTrendTable(trends: WeeklyTrend[], startY: number): number {
    if (!this.templateConfig.showWeeklyTrend) return startY;

    const weeklyRows = getWeeklyTrendRows(trends);

    // Add section title
    this.doc.setFont('Vazirmatn');
    this.doc.setFontSize(12);
    this.doc.setTextColor(...this.templateConfig.colorTheme.primary);
    this.doc.text('روند هفتگی تعهدات', this.margin, startY);

    autoTable(this.doc, {
      startY: startY + 6,
      head: [['هفته', 'کل', 'تکمیل', 'درصد']],
      body: weeklyRows,
      theme: 'grid',
      styles: {
        font: 'Vazirmatn',
        fontSize: 9,
      },
      headStyles: {
        fillColor: this.templateConfig.colorTheme.secondary,
        textColor: [255, 255, 255],
        halign: 'center',
        valign: 'middle',
        fontSize: 10,
        fontStyle: 'bold',
      },
      bodyStyles: {
        halign: 'center',
        valign: 'middle',
        fontSize: 9,
      },
      columnStyles: {
        0: { halign: 'right', cellWidth: 60 },
        1: { halign: 'center', cellWidth: 35 },
        2: { halign: 'center', cellWidth: 35 },
        3: { halign: 'center', cellWidth: 35 },
      },
      margin: { top: 5, right: this.margin, bottom: 5, left: this.margin },
    });

    return (this.doc as any).lastAutoTable?.finalY || startY + 80;
  }

  /**
   * Add insights section
   */
  private addInsights(stats: SummaryStats, startY: number): number {
    this.doc.setFont('Vazirmatn');
    this.doc.setFontSize(12);
    this.doc.setTextColor(...this.templateConfig.colorTheme.primary);
    this.doc.text('بینش‌های کلیدی', this.margin, startY);

    startY += 8;
    this.doc.setFontSize(10);
    this.doc.setTextColor(...this.templateConfig.colorTheme.text);

    const insights: string[] = [];

    // Insight 1: Completion rate
    if (stats.completionRate >= 80) {
      insights.push(`✓ عملکرد عالی: ${toPersianNumber(Math.round(stats.completionRate))}% از تعهدات تکمیل شده است`);
    } else if (stats.completionRate >= 60) {
      insights.push(`✓ عملکرد خوب: ${toPersianNumber(Math.round(stats.completionRate))}% از تعهدات تکمیل شده است`);
    } else {
      insights.push(`✓ توجه: فقط ${toPersianNumber(Math.round(stats.completionRate))}% از تعهدات تکمیل شده است`);
    }

    // Insight 2: Streak
    if (stats.currentStreak > 7) {
      insights.push(`✓ روز‌های فوق‌العاده: ${toPersianNumber(stats.currentStreak)} روز متوالی فعالیت`);
    } else if (stats.currentStreak > 0) {
      insights.push(`✓ در حال پیشرفت: ${toPersianNumber(stats.currentStreak)} روز متوالی فعالیت`);
    }

    // Insight 3: Plans
    if (stats.totalPlans > 0) {
      const planRate = (stats.completedPlans / stats.totalPlans) * 100;
      insights.push(`✓ برنامه‌ریزی: ${toPersianNumber(stats.completedPlans)} از ${toPersianNumber(stats.totalPlans)} برنامه تکمیل شده`);
    }

    // Insight 4: Reflections
    if (stats.totalReflections > 0) {
      insights.push(`✓ تأمل: ${toPersianNumber(stats.totalReflections)} بازتاب در این دوره`);
    }

    // Draw insights
    let yOffset = startY;
    insights.forEach((insight) => {
      const lines = this.doc.splitTextToSize(insight, this.pageWidth - this.margin * 2);
      this.doc.text(lines, this.margin, yOffset);
      yOffset += lines.length * 5 + 3;
    });

    return yOffset + 5;
  }

  /**
   * Add footer to the PDF
   */
  private addFooter(): void {
    if (!this.templateConfig.showFooter) return;

    this.doc.setFont('Vazirmatn');
    const footerY = this.pageHeight - 8;
    this.doc.setFontSize(8);
    this.doc.setTextColor(107, 114, 128); // gray-500

    // Footer line
    this.doc.setDrawColor(200, 200, 200);
    this.doc.line(this.margin, footerY - 5, this.pageWidth - this.margin, footerY - 5);

    // Footer text
    this.doc.text('تولید شده توسط همسو | پلتفرم رشد شخصی شما', this.pageWidth / 2, footerY, { align: 'center' });
  }

  /**
   * Check if new page is needed
   */
  private checkNewPage(currentY: number, spaceNeeded: number = 40): number {
    if (currentY + spaceNeeded > this.pageHeight - 20) {
      this.doc.addPage();
      return 20; // Top margin for new page
    }
    return currentY;
  }

  /**
   * Generate complete analytics report
   */
  public generateReport(params: {
    userData: UserData;
    stats: SummaryStats;
    trends: WeeklyTrend[];
    range: string;
  }): Buffer {
    const { userData, stats, trends, range } = params;

    // Add sections based on template config
    this.addHeader('گزارش تحلیلی همسو', `گزارش پیشرفت شما در ${RANGE_LABELS[range]}`);
    let yPos = this.addUserInfo(userData);

    // Check for new page
    yPos = this.checkNewPage(yPos, 80);
    yPos = this.addSummaryTable(stats, yPos);

    // Add page break if needed
    yPos = this.checkNewPage(yPos, 100);
    yPos = this.addWeeklyTrendTable(trends, yPos);

    // Add insights if template supports it
    if (this.templateConfig.showWeeklyTrend) {
      yPos = this.checkNewPage(yPos, 60);
      yPos = this.addInsights(stats, yPos);
    }

    // Add footer on all pages
    const pageCount = (this.doc as any).getNumberOfPages?.() || 1;
    for (let i = 1; i <= pageCount; i++) {
      this.doc.setPage(i);
      this.addFooter();
    }

    // Return buffer
    return Buffer.from(this.doc.output('arraybuffer'));
  }

  /**
   * Get default filename
   */
  public static getFileName(): string {
    return getFileName('hamsou-report');
  }

  /**
   * Get current template config
   */
  public getTemplateConfig(): TemplateConfig {
    return this.templateConfig;
  }
}
