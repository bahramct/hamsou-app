/**
 * Base AI Provider (Abstract Class)
 * 
 * تمام Providerها باید این کلاس را extend کنند و متدهای abstract را پیاده‌سازی کنند.
 */

import { AIProvider, ChatParams, ChatResponse, SentimentAnalysis, Message } from '../types';

export abstract class BaseAIProvider implements AIProvider {
  protected initialized: boolean = false;
  
  /**
   * Initialize the provider (if needed)
   */
  protected async init(): Promise<void> {
    if (!this.initialized) {
      await this.initProvider();
      this.initialized = true;
    }
  }
  
  /**
   * Provider-specific initialization (to be implemented by subclasses)
   */
  protected abstract initProvider(): Promise<void>;
  
  /**
   * Send chat request to AI (to be implemented by subclasses)
   */
  abstract chat(params: ChatParams): Promise<ChatResponse>;
  
  /**
   * Analyze sentiment of text (to be implemented by subclasses)
   */
  abstract analyzeSentiment(text: string): Promise<SentimentAnalysis>;
  
  /**
   * Get provider name (to be implemented by subclasses)
   */
  abstract getProviderName(): string;
  
  /**
   * Format messages with system prompt
   * Helper method used by all providers
   */
  protected formatMessages(messages: Message[], systemPrompt: string): Message[] {
    return [
      { role: 'system', content: systemPrompt },
      ...messages,
    ];
  }
  
  /**
   * Validate chat parameters
   * Helper method to ensure required parameters are present
   */
  protected validateChatParams(params: ChatParams): void {
    if (!params.messages || !Array.isArray(params.messages)) {
      throw new Error('messages must be an array');
    }
    
    if (!params.systemPrompt || typeof params.systemPrompt !== 'string') {
      throw new Error('systemPrompt must be a non-empty string');
    }
    
    if (params.messages.length === 0) {
      throw new Error('messages array cannot be empty');
    }
  }
  
  /**
   * Default temperature fallback
   */
  protected getTemperature(params: ChatParams): number {
    return params.temperature ?? 0.7;
  }
  
  /**
   * Extract content from AI response (provider-specific override)
   */
  protected extractContent(response: any): string {
    return response.choices?.[0]?.message?.content || '';
  }
  
  /**
   * Extract usage from AI response (provider-specific override)
   */
  protected extractUsage(response: any): ChatResponse['usage'] {
    return response.usage || undefined;
  }
}
