/**
 * AI Client - Factory & Singleton Pattern
 * 
 * این کلاس به عنوان Factory برای ایجاد Providerها عمل می‌کند
 * و مطمئن می‌شود فقط یک instance از AI Client وجود دارد (Singleton).
 */

import { AIProvider, AIProviderType } from './types';
import { ZAIProvider } from './providers/zai-provider';

// OpenAI Provider را بعداً اضافه می‌کنیم
// import { OpenAIProvider } from './providers/openai-provider';

// Anthropic Provider را بعداً اضافه می‌کنیم
// import { AnthropicProvider } from './providers/anthropic-provider';

class AIClient {
  private static instance: AIClient | null = null;
  private provider: AIProvider;
  private providerType: AIProviderType;
  
  private constructor() {
    // Provider را از environment variable می‌خوانیم
    this.providerType = (process.env.AI_PROVIDER as AIProviderType) || 'zai';
    this.provider = this.createProvider(this.providerType);
    
    console.log(`[AIClient] Initialized with provider: ${this.providerType}`);
  }
  
  /**
   * Get singleton instance
   */
  static getInstance(): AIClient {
    if (!AIClient.instance) {
      AIClient.instance = new AIClient();
    }
    return AIClient.instance;
  }
  
  /**
   * Create provider based on type
   */
  private createProvider(type: AIProviderType): AIProvider {
    switch (type) {
      case 'zai':
        return new ZAIProvider();
      
      case 'openai':
        // TODO: بعداً اضافه شود
        // if (!process.env.OPENAI_API_KEY) {
        //   throw new Error('OPENAI_API_KEY is required for OpenAI provider');
        // }
        // return new OpenAIProvider(process.env.OPENAI_API_KEY);
        throw new Error('OpenAI provider is not implemented yet. Please use "zai" provider.');
      
      case 'anthropic':
        // TODO: بعداً اضافه شود
        // if (!process.env.ANTHROPIC_API_KEY) {
        //   throw new Error('ANTHROPIC_API_KEY is required for Anthropic provider');
        // }
        // return new AnthropicProvider(process.env.ANTHROPIC_API_KEY);
        throw new Error('Anthropic provider is not implemented yet. Please use "zai" provider.');
      
      default:
        throw new Error(`Unknown AI provider: ${type}. Available providers: zai, openai, anthropic`);
    }
  }
  
  /**
   * Get current provider
   */
  getProvider(): AIProvider {
    return this.provider;
  }
  
  /**
   * Get current provider type
   */
  getProviderType(): AIProviderType {
    return this.providerType;
  }
  
  /**
   * Get provider name
   */
  getProviderName(): string {
    return this.provider.getProviderName();
  }
  
  /**
   * Reset instance (useful for testing)
   */
  static reset(): void {
    AIClient.instance = null;
  }
}

// Export singleton instance
export const aiClient = AIClient.getInstance();

// Export class for testing
export { AIClient };
