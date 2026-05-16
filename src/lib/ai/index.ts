/**
 * AI Module - Main Exports
 * 
 * این فایل تمام exportهای مهم AI module را در یک جا جمع می‌کند.
 */

// Types
export * from './types';

// Providers
export { BaseAIProvider } from './providers/base';
export { ZAIProvider } from './providers/zai-provider';

// Client & Service
export { aiClient, AIClient } from './ai-client';
export { aiService, AIService } from './ai-service';

// System Prompts
export { SYSTEM_PROMPTS, getSystemPrompt, addContextToPrompt, addUserNameToPrompt } from './system-prompts';

// Context Builders
export {
  buildChatContext,
  buildAnalyticsContext,
  buildCommitmentContext,
  buildSentimentContext,
  buildWeeklyReportContext,
  buildMonthlyReportContext,
} from './context-builders';
