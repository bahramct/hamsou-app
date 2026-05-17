/**
 * ZAI Provider Implementation
 * 
 * Implementation using z-ai-web-dev-sdk
 */

import ZAI from 'z-ai-web-dev-sdk';
import { BaseAIProvider } from './base';
import { ChatParams, ChatResponse, SentimentAnalysis } from '../types';

export class ZAIProvider extends BaseAIProvider {
  private zai: any;
  private instance: any = null;
  
  /**
   * Initialize ZAI SDK
   */
  protected async initProvider(): Promise<void> {
    if (!this.instance) {
      this.instance = await ZAI.create();
      this.zai = this.instance;
    }
  }
  
  /**
   * Send chat request to ZAI
   */
  async chat(params: ChatParams): Promise<ChatResponse> {
    await this.init();
    
    // Validate parameters
    this.validateChatParams(params);
    
    // Format messages with system prompt
    const messages = this.formatMessages(params.messages, params.systemPrompt);
    
    try {
      // Call ZAI chat completions
      const completion = await this.zai.chat.completions.create({
        messages,
        thinking: { type: 'disabled' },
        temperature: this.getTemperature(params),
        maxTokens: params.maxTokens,
      });
      
      // Extract content and usage
      const content = this.extractContent(completion);
      const usage = this.extractUsage(completion);
      
      return {
        content,
        usage,
        model: 'zai-chat',
      };
    } catch (error: any) {
      console.error('ZAI Chat Error:', error);
      throw new Error(`ZAI chat failed: ${error.message || 'Unknown error'}`);
    }
  }
  
  /**
   * Analyze sentiment using ZAI
   */
  async analyzeSentiment(text: string): Promise<SentimentAnalysis> {
    await this.init();
    
    const systemPrompt = `تو یک تحلیل‌گر احساسی حرفه‌ای هستی.
تحلیل احساسی متن زیر رو انجام بده و فقط JSON خروجی بده.

فرمت خروجی:
{
  "sentiment": "positive" یا "neutral" یا "negative",
  "score": عدد بین 0 تا 1 (امتیاز اطمینان),
  "keywords": ["کلمه1", "کلمه2", ...],
  "confidence": عدد بین 0 تا 1
}

متن:
${text}`;
    
    try {
      const response = await this.chat({
        messages: [{ role: 'user', content: 'تحلیل احساسی انجام بده' }],
        systemPrompt,
        temperature: 0.3, // Low temperature for consistent analysis
      });
      
      // Try to parse JSON from response
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      // Fallback: analyze based on content
      return this.fallbackSentimentAnalysis(text, response.content);
    } catch (error: any) {
      console.error('ZAI Sentiment Analysis Error:', error);
      // Return neutral on error
      return {
        sentiment: 'neutral',
        score: 0.5,
        keywords: [],
        confidence: 0.3,
      };
    }
  }
  
  /**
   * Fallback sentiment analysis if JSON parsing fails
   */
  private fallbackSentimentAnalysis(text: string, aiResponse: string): SentimentAnalysis {
    const lowerText = text.toLowerCase();
    const positiveWords = ['خوشحال', 'عالی', 'موفقیت', 'خوب', 'عالی', 'راضی', 'موفق'];
    const negativeWords = ['غمگین', 'ناراحت', 'ناامید', 'خسته', 'مشکل', 'شکست', 'سخت'];
    
    let positiveCount = 0;
    let negativeCount = 0;
    
    positiveWords.forEach(word => {
      if (lowerText.includes(word)) positiveCount++;
    });
    
    negativeWords.forEach(word => {
      if (lowerText.includes(word)) negativeCount++;
    });
    
    if (positiveCount > negativeCount) {
      return {
        sentiment: 'positive',
        score: Math.min(0.5 + (positiveCount - negativeCount) * 0.1, 1),
        keywords: positiveWords.filter(w => lowerText.includes(w)),
        confidence: 0.6,
      };
    } else if (negativeCount > positiveCount) {
      return {
        sentiment: 'negative',
        score: Math.min(0.5 + (negativeCount - positiveCount) * 0.1, 1),
        keywords: negativeWords.filter(w => lowerText.includes(w)),
        confidence: 0.6,
      };
    } else {
      return {
        sentiment: 'neutral',
        score: 0.5,
        keywords: [],
        confidence: 0.5,
      };
    }
  }
  
  /**
   * Get provider name
   */
  getProviderName(): string {
    return 'ZAI (z-ai-web-dev-sdk)';
  }
  
  /**
   * Extract content from ZAI response
   */
  protected extractContent(response: any): string {
    return response.choices?.[0]?.message?.content || response.content || '';
  }
  
  /**
   * Extract usage from ZAI response
   */
  protected extractUsage(response: any): ChatResponse['usage'] {
    if (response.usage) {
      return {
        promptTokens: response.usage.prompt_tokens || 0,
        completionTokens: response.usage.completion_tokens || 0,
        totalTokens: response.usage.total_tokens || 0,
      };
    }
    return undefined;
  }
}
