/**
 * AI Types and Interfaces for Hamsou
 * 
 * این فایل شامل تمام TypeScript Types و Interfaces مورد نیاز سیستم AI است.
 */

// ============================================================
// Message Types
// ============================================================

export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

// ============================================================
// Chat Parameters & Response
// ============================================================

export interface ChatParams {
  messages: Message[];
  systemPrompt: string;
  temperature?: number;
  maxTokens?: number;
  context?: Record<string, any>;
}

export interface ChatResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model?: string;
}

// ============================================================
// Sentiment Analysis
// ============================================================

export interface SentimentAnalysis {
  sentiment: 'positive' | 'neutral' | 'negative';
  score: number; // 0-1
  keywords?: string[];
  confidence?: number;
}

// ============================================================
// AI Provider Interface
// ============================================================

export interface AIProvider {
  /**
   * ارسال درخواست چت به AI
   */
  chat(params: ChatParams): Promise<ChatResponse>;
  
  /**
   * تحلیل احساسی متن
   */
  analyzeSentiment(text: string): Promise<SentimentAnalysis>;
  
  /**
   * نام Provider
   */
  getProviderName(): string;
}

// ============================================================
// Provider Types
// ============================================================

export type AIProviderType = 'zai' | 'openai' | 'anthropic';

// ============================================================
// AI Service Types
// ============================================================

export interface ChatHistory {
  id: string;
  userId: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

export interface AnalysisResult {
  summary: string;
  insights: string[];
  recommendations: string[];
  strengths: string[];
  weaknesses: string[];
}

export interface CommitmentSuggestion {
  title: string;
  category: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  estimatedDuration?: string;
}
