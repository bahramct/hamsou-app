/**
 * PDF Template Types and Definitions
 * Different report templates for various use cases
 */

import type { SummaryStats, WeeklyTrend, UserData } from './pdf-helpers';

/**
 * Available report templates
 */
export enum ReportTemplate {
  /** محبوب: پیش‌فرض و متعادل */
  DEFAULT = 'default',

  /** مینیمال: ساده و تمیز */
  MINIMALIST = 'minimalist',

  /** جزئی: با تمام اطلاعات */
  DETAILED = 'detailed',

  /** اجرایی: خلاصه و کلیدی */
  EXECUTIVE = 'executive',
}

/**
 * Template configuration
 */
export interface TemplateConfig {
  id: ReportTemplate;
  name: string;
  description: string;
  showHeader: boolean;
  showUserInfo: boolean;
  showSummaryTable: boolean;
  showWeeklyTrend: boolean;
  showFooter: boolean;
  colorTheme: ColorTheme;
}

/**
 * Color themes for templates
 */
export interface ColorTheme {
  primary: [number, number, number]; // RGB
  secondary: [number, number, number]; // RGB
  text: [number, number, number]; // RGB
  background: [number, number, number]; // RGB
}

/**
 * Template configurations
 */
export const TEMPLATE_CONFIGS: Record<ReportTemplate, TemplateConfig> = {
  [ReportTemplate.DEFAULT]: {
    id: ReportTemplate.DEFAULT,
    name: 'پیش‌فرض',
    description: 'گزارش کامل با همه بخش‌ها',
    showHeader: true,
    showUserInfo: true,
    showSummaryTable: true,
    showWeeklyTrend: true,
    showFooter: true,
    colorTheme: {
      primary: [99, 102, 241], // indigo-500
      secondary: [139, 92, 246], // violet-500
      text: [0, 0, 0],
      background: [255, 255, 255],
    },
  },

  [ReportTemplate.MINIMALIST]: {
    id: ReportTemplate.MINIMALIST,
    name: 'مینیمال',
    description: 'ساده و مناسب برای پرینت',
    showHeader: true,
    showUserInfo: false,
    showSummaryTable: true,
    showWeeklyTrend: true,
    showFooter: false,
    colorTheme: {
      primary: [0, 0, 0], // black
      secondary: [107, 114, 128], // gray-500
      text: [0, 0, 0],
      background: [255, 255, 255],
    },
  },

  [ReportTemplate.DETAILED]: {
    id: ReportTemplate.DETAILED,
    name: 'جزئی',
    description: 'با رنگبندی و تمام اطلاعات',
    showHeader: true,
    showUserInfo: true,
    showSummaryTable: true,
    showWeeklyTrend: true,
    showFooter: true,
    colorTheme: {
      primary: [16, 185, 129], // emerald-500
      secondary: [6, 182, 212], // cyan-500
      text: [0, 0, 0],
      background: [248, 250, 252], // slate-50
    },
  },

  [ReportTemplate.EXECUTIVE]: {
    id: ReportTemplate.EXECUTIVE,
    name: 'اجرایی',
    description: 'خلاصه KPIها و آمار کلیدی',
    showHeader: true,
    showUserInfo: true,
    showSummaryTable: true,
    showWeeklyTrend: false,
    showFooter: true,
    colorTheme: {
      primary: [239, 68, 68], // red-500
      secondary: [251, 146, 60], // orange-500
      text: [0, 0, 0],
      background: [255, 255, 255],
    },
  },
};

/**
 * Get template configuration
 */
export function getTemplateConfig(template: ReportTemplate): TemplateConfig {
  return TEMPLATE_CONFIGS[template] || TEMPLATE_CONFIGS[ReportTemplate.DEFAULT];
}

/**
 * Get all available templates
 */
export function getAvailableTemplates(): TemplateConfig[] {
  return Object.values(TEMPLATE_CONFIGS);
}
