'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bot, X, Send, Loader2, Trash2, Sparkles, Minimize2, BarChart3, Target, Lightbulb, FileText, Star, Mic, MicOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { toPersianText } from '@/lib/utils/persian';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

interface QuickPrompt {
  id: string;
  label: string;
  icon: React.ReactNode;
  message: string;
}

interface ChatWidgetProps {
  userId: string;
}

// لیست Quick Prompts
const quickPrompts: QuickPrompt[] = [
  {
    id: 'weekly-analysis',
    label: 'تحلیل هفته',
    icon: <BarChart3 className="h-3.5 w-3.5" />,
    message: 'لطفاً تحلیلی از پیشرفت من در هفته گذشته بده، شامل نقاط قوت و ضعف.',
  },
  {
    id: 'goal-suggestion',
    label: 'پیشنهاد هدف',
    icon: <Target className="h-3.5 w-3.5" />,
    message: 'بر اساس سابقه من، چند هدف مناسب و قابل‌دستیابی پیشنهاد بده.',
  },
  {
    id: 'improvement-guide',
    label: 'راهنمایی بهبود',
    icon: <Lightbulb className="h-3.5 w-3.5" />,
    message: 'چطور می‌تونم بهتر شدم و تعهدم رو بهتر انجام بدم؟',
  },
  {
    id: 'today-summary',
    label: 'خلاصه امروز',
    icon: <FileText className="h-3.5 w-3.5" />,
    message: 'خلاصه‌ای از تعهدات امروز و وضعیت اون‌ها بهم بده.',
  },
  {
    id: 'motivation',
    label: 'انگیزه',
    icon: <Star className="h-3.5 w-3.5" />,
    message: 'یه جمله انگیزشی برام بگو و راهکارهایی برای حفظ انگیزه.',
  },
];

export function ChatWidget({ userId }: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [welcomeMessage, setWelcomeMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // دریافت پیام خوش‌آمدگویی
  useEffect(() => {
    if (userId && isOpen && !isMinimized) {
      fetchWelcomeMessage();
      fetchChatHistory();
    }
  }, [userId, isOpen, isMinimized]);

  // اسکرول به پایین وقتی پیام جدید اضافه می‌شود
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, welcomeMessage]);

  const fetchWelcomeMessage = async () => {
    try {
      const response = await fetch(`/api/chat/welcome?userId=${userId}`);
      const data = await response.json();
      if (data.success) {
        setWelcomeMessage(data.welcomeMessage);
      }
    } catch (error) {
      console.error('Error fetching welcome message:', error);
    }
  };

  const fetchChatHistory = async () => {
    try {
      const response = await fetch(`/api/chat/history?userId=${userId}&limit=20`);
      const data = await response.json();
      if (data.success) {
        const formattedMessages = data.messages.map((msg: any) => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          timestamp: new Date(msg.timestamp),
        }));
        setMessages(formattedMessages);
      }
    } catch (error) {
      console.error('Error fetching chat history:', error);
    }
  };

  const handleSendMessage = async (messageContent?: string) => {
    const messageToSend = messageContent || inputValue;

    if (!messageToSend.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageToSend,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!messageContent) {
      setInputValue('');
    }
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.content,
          userId,
          chatType: 'general',
        }),
      });

      const data = await response.json();

      if (data.success) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.response,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        toast({
          title: 'خطا',
          description: data.error || 'خطا در ارسال پیام',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'خطا',
        description: 'خطا در برقراری ارتباط با سرور',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = async () => {
    try {
      const response = await fetch('/api/chat/clear', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          chatType: 'general',
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessages([]);
        setWelcomeMessage('');
        fetchWelcomeMessage();
        toast({
          title: 'موفق',
          description: 'تاریخچه چت پاک شد',
        });
      } else {
        toast({
          title: 'خطا',
          description: data.error || 'خطا در پاک کردن تاریخچه',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error clearing chat history:', error);
      toast({
        title: 'خطا',
        description: 'خطا در پاک کردن تاریخچه',
        variant: 'destructive',
      });
    }
  };

  // Voice Input handler
  const handleVoiceInput = () => {
    if (typeof window === 'undefined') return;

    // چک کردن پشتیبانی مرورگر
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      toast({
        title: 'مرورگر پشتیبانی نمی‌کند',
        description: 'مرورگر شما از ورودی صوتی پشتیبانی نمی‌کند. لطفاً از Chrome یا Edge استفاده کنید.',
        variant: 'destructive',
      });
      return;
    }

    if (isRecording) {
      // اگر در حال ضبط هست، متوقف می‌کنیم
      setIsRecording(false);
      return;
    }

    // شروع ضبط
    const recognition = new SpeechRecognition();
    recognition.lang = 'fa-IR';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsRecording(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInputValue(prev => prev + (prev ? ' ' : '') + transcript);
      setIsRecording(false);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsRecording(false);
      toast({
        title: 'خطا در تشخیص صدا',
        description: 'متاسفانه در تشخیص صدای شما مشکلی پیش آمد. لطفاً دوباره تلاش کنید.',
        variant: 'destructive',
      });
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognition.start();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleChat = () => {
    if (isOpen) {
      setIsOpen(false);
      setIsMinimized(false);
    } else {
      setIsOpen(true);
      setIsMinimized(false);
    }
  };

  return (
    <div dir="rtl">
      {/* دکمه شناور */}
      <Button
        onClick={toggleChat}
        className="fixed bottom-6 left-6 z-50 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 bg-primary hover:bg-primary/90"
        size="icon"
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <Bot className="h-6 w-6" />
        )}
      </Button>

      {/* پنجره چت - با انیمیشن iPhone style */}
      {isOpen && (
        <div
          className="fixed bottom-24 left-6 right-6 md:left-6 md:right-auto md:w-[340px] z-50"
          style={{
            animation: 'chatOpen 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}
        >
          <style jsx>{`
            @keyframes chatOpen {
              0% {
                opacity: 0;
                transform: scale(0.8) translateY(20px);
              }
              100% {
                opacity: 1;
                transform: scale(1) translateY(0);
              }
            }
            @keyframes chatClose {
              0% {
                opacity: 1;
                transform: scale(1) translateY(0);
              }
              100% {
                opacity: 0;
                transform: scale(0.8) translateY(20px);
              }
            }
          `}</style>

          <Card className="shadow-2xl flex flex-col overflow-hidden" dir="rtl">
            {/* Header */}
            <CardHeader className="flex flex-row items-center justify-between pb-2 border-b bg-gradient-to-l from-primary/10 to-transparent">
              <div className="flex items-center gap-2">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                <CardTitle className="text-sm font-semibold">دستیار هوشمند همسو</CardTitle>
              </div>
              <div className="flex items-center gap-0.5">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleClearHistory}
                  className="h-6 w-6"
                  title="پاک کردن تاریخچه"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                  className="h-6 w-6"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="flex flex-col p-0 overflow-hidden">
              {/* Messages Area */}
              {!isMinimized && (
                <ScrollArea className="h-[200px] p-2" ref={scrollRef} dir="rtl">
                  <div className="space-y-2" dir="rtl">
                    {welcomeMessage && messages.length === 0 && (
                      <div className="bg-muted/50 p-2 rounded-lg border border-border/50 text-right">
                        <p className="text-xs whitespace-pre-line leading-relaxed text-foreground">
                          {toPersianText(welcomeMessage)}
                        </p>
                      </div>
                    )}

                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${
                          message.role === 'user' ? 'justify-start' : 'justify-end'
                        }`}
                      >
                        <div
                          className={`max-w-[85%] rounded-xl px-2.5 py-2 text-right ${
                            message.role === 'user'
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                          }`}
                        >
                          <p className="text-xs whitespace-pre-line leading-relaxed">
                            {message.content}
                          </p>
                          <p className="text-[10px] mt-1 opacity-70">
                            {toPersianText(
                              new Date(message.timestamp).toLocaleTimeString('fa-IR', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            )}
                          </p>
                        </div>
                      </div>
                    ))}

                    {isLoading && (
                      <div className="flex justify-end">
                        <div className="bg-muted rounded-xl px-2.5 py-2 text-right">
                          <div className="flex items-center gap-1.5">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            <span className="text-[10px]">در حال نوشتن...</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              )}

              {/* Quick Prompts - فقط در شروع چت نمایش داده می‌شود */}
              {messages.length === 0 && !isLoading && (
                <div className="px-2.5 py-1.5 border-b bg-muted/30" dir="rtl">
                  <p className="text-[10px] text-muted-foreground mb-1.5 font-medium">
                    سوالات سریع:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {quickPrompts.map((prompt) => (
                      <button
                        key={prompt.id}
                        onClick={() => handleSendMessage(prompt.message)}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-background border border-border hover:border-primary/50 hover:bg-primary/5 rounded-full text-[10px] font-medium transition-all duration-200 text-foreground hover:text-primary"
                        disabled={isLoading}
                      >
                        {prompt.icon}
                        <span>{prompt.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Input Area - همیشه نمایش داده می‌شود */}
              <div className="p-2 border-t bg-background" dir="rtl">
                <div className="flex gap-1.5">
                  <Button
                    onClick={handleVoiceInput}
                    variant={isRecording ? "default" : "ghost"}
                    size="icon"
                    className={`h-9 w-9 shrink-0 ${isRecording ? 'bg-red-500 hover:bg-red-600' : ''}`}
                    disabled={isLoading}
                    title={isRecording ? 'توقف ضبط' : 'ورودی صوتی'}
                  >
                    {isRecording ? (
                      <MicOff className="h-3.5 w-3.5" />
                    ) : (
                      <Mic className="h-3.5 w-3.5" />
                    )}
                  </Button>
                  <Textarea
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={isRecording ? 'در حال ضبط...' : 'پیام خود را بنویسید...'}
                    className="min-h-[36px] max-h-[70px] resize-none text-xs text-right"
                    disabled={isLoading}
                    rows={1}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim() || isLoading}
                    size="icon"
                    className="h-9 w-9 shrink-0"
                  >
                    {isLoading ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Send className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
