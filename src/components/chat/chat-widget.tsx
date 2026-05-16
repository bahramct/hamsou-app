'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageSquare, X, Send, Loader2, Trash2, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

interface ChatWidgetProps {
  userId: string;
}

export function ChatWidget({ userId }: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [welcomeMessage, setWelcomeMessage] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // دریافت پیام خوش‌آمدگویی
  useEffect(() => {
    if (userId && isOpen) {
      fetchWelcomeMessage();
      fetchChatHistory();
    }
  }, [userId, isOpen]);

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

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {/* دکمه شناور */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 left-6 z-50 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 bg-primary hover:bg-primary/90"
        size="icon"
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <MessageSquare className="h-6 w-6" />
        )}
      </Button>

      {/* پنجره چت */}
      {isOpen && (
        <Card className="fixed bottom-24 left-6 right-6 md:left-6 md:right-auto md:w-96 h-[500px] z-50 shadow-2xl flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between pb-4 border-b">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">دستیار هوشمند همسو</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClearHistory}
              className="h-8 w-8"
              title="پاک کردن تاریخچه"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
              <div className="space-y-4">
                {welcomeMessage && messages.length === 0 && (
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <p className="text-sm whitespace-pre-line leading-relaxed">
                      {welcomeMessage}
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
                      className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-line leading-relaxed">
                        {message.content}
                      </p>
                      <p className="text-xs mt-2 opacity-70">
                        {new Date(message.timestamp).toLocaleTimeString('fa-IR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex justify-end">
                    <div className="bg-muted rounded-2xl px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm">در حال نوشتن...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Textarea
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="پیام خود را بنویسید..."
                  className="min-h-[60px] max-h-[120px] resize-none"
                  disabled={isLoading}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isLoading}
                  size="icon"
                  className="h-[60px] w-[60px] shrink-0"
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Send className="h-5 w-5" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Enter برای ارسال پیام
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}
