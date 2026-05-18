'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Sparkles, Loader2, Check, Clock, Target, TrendingUp, AlertCircle, Lightbulb, X, Calendar, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CommitmentSuggestion {
  title: string;
  description: string;
  estimatedTime: string;
  category: string;
  priority: string;
  reason: string;
}

interface Insights {
  strengths: string[];
  areasForImprovement: string[];
  recommendations: string[];
}

interface AIDecisionPanelProps {
  userId: string;
  onAcceptSuggestion: (suggestion: CommitmentSuggestion) => Promise<void>;
  hasCommitmentToday?: boolean;
  userStartDate?: Date; // تاریخ ثبت‌نام کاربر یا اولین تعهد
}

const CATEGORY_OPTIONS = [
  { value: 'all', label: 'همه دسته‌بندی‌ها' },
  { value: 'work', label: 'کار' },
  { value: 'health', label: 'سلامتی' },
  { value: 'learning', label: 'یادگیری' },
  { value: 'personal', label: 'شخصی' },
  { value: 'social', label: 'اجتماعی' },
];

const TIME_OPTIONS = [
  { value: 'any', label: 'هر زمانی' },
  { value: 'morning', label: 'صبح' },
  { value: 'afternoon', label: 'بعدازظهر' },
  { value: 'evening', label: 'شب' },
];

const COUNT_OPTIONS = [1, 2, 3, 4, 5];

const PRIORITY_COLORS = {
  high: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20',
  medium: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20',
  low: 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20',
};

const PRIORITY_LABELS = {
  high: 'بالا',
  medium: 'متوسط',
  low: 'پایین',
};

export function AIDecisionPanel({ userId, onAcceptSuggestion, hasCommitmentToday = false, userStartDate }: AIDecisionPanelProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<CommitmentSuggestion[]>([]);
  const [insights, setInsights] = useState<Insights | null>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTime, setSelectedTime] = useState('any');
  const [selectedCount, setSelectedCount] = useState(3);
  const [context, setContext] = useState('');
  const [showInsights, setShowInsights] = useState(false);
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showInsufficientDataDialog, setShowInsufficientDataDialog] = useState(false);
  const [daysRemaining, setDaysRemaining] = useState(0);
  const { toast } = useToast();

  // بررسی اینکه آیا کاربر حداقل یک هفته داده دارد یا نه
  const hasEnoughData = userStartDate
    ? (Date.now() - new Date(userStartDate).getTime()) >= 7 * 24 * 60 * 60 * 1000
    : false;

  // محاسبه روزهای باقی‌مانده تا یک هفته کامل
  const calculateDaysRemaining = () => {
    if (!userStartDate) return 7;
    const daysPassed = Math.floor((Date.now() - new Date(userStartDate).getTime()) / (24 * 60 * 60 * 1000));
    return Math.max(0, 7 - daysPassed);
  };

  const handleExpandCard = () => {
    // بررسی اینکه آیا کاربر دیتای کافی دارد
    if (!hasEnoughData) {
      setDaysRemaining(calculateDaysRemaining());
      setShowInsufficientDataDialog(true);
      return;
    }

    // فقط باز کردن کارت - بدون تولید پیشنهاد
    setIsExpanded(true);
  };

  const handleGetSuggestions = async () => {
    // اگر کارت بسته است، فقط باز کن
    if (!isExpanded) {
      setIsExpanded(true);
      return;
    }

    // شروع تولید پیشنهاد
    setIsLoading(true);
    setSuggestions([]);
    setInsights(null);
    setShowInsights(false);

    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch('/api/ai/suggest-commitments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          userId,
          count: selectedCount,
          category: selectedCategory !== 'all' ? selectedCategory : undefined,
          timeOfDay: selectedTime !== 'any' ? selectedTime : undefined,
          context: context || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'خطا در ارتباط با سرور' }));
        throw new Error(errorData.error || 'خطا در دریافت پیشنهادات');
      }

      const data = await response.json();

      if (data.success) {
        setSuggestions(data.suggestions);
        setInsights(data.insights);
        setAnalysis(data.analysis);
        toast({
          title: 'پیشنهادات آماده!',
          description: `${data.suggestions.length} تعهد هوشمند برای شما پیشنهاد شد.`,
        });
      } else {
        toast({
          title: 'خطا',
          description: data.error || 'خطا در دریافت پیشنهادات',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      toast({
        title: 'خطا',
        description: 'خطا در برقراری ارتباط با سرور',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptSuggestion = async (suggestion: CommitmentSuggestion) => {
    try {
      await onAcceptSuggestion(suggestion);
      toast({
        title: 'تعهد اضافه شد',
        description: `"${suggestion.title}" به لیست تعهدات شما اضافه شد.`,
      });
    } catch (error) {
      toast({
        title: 'خطا',
        description: 'خطا در اضافه کردن تعهد',
        variant: 'destructive',
      });
    }
  };

  const handleRejectSuggestion = (index: number, suggestion: CommitmentSuggestion) => {
    setRejectingId(index);

    // انیمیشن خروج و سپس حذف
    setTimeout(() => {
      setSuggestions((prev) => prev.filter((_, i) => i !== index));
      setRejectingId(null);
      toast({
        title: 'پیشنهاد رد شد',
        description: `"${suggestion.title}" حذف شد.`,
      });
    }, 300);
  };

  return (
    <>
      <Card className={`w-full ${hasCommitmentToday ? 'opacity-70' : ''} transition-all duration-300`}>
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-lg ${hasCommitmentToday ? 'bg-muted' : 'bg-primary/10'}`}>
            <Sparkles className={`h-5 w-5 ${hasCommitmentToday ? 'text-muted-foreground' : 'text-primary'}`} />
          </div>
          <div className="flex-1">
            <CardTitle className={`text-lg ${hasCommitmentToday ? 'text-muted-foreground' : ''}`}>پیشنهاد هوشمند تعهدات</CardTitle>
            <CardDescription className="text-xs">
              {hasCommitmentToday ? 'شما امروز تعهد دارید' : hasEnoughData ? 'بر اساس تاریخچه و الگوهای شما' : 'داده کافی ندارید'}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* حالت بسته - فقط دکمه باز کردن */}
        {!isExpanded && !hasCommitmentToday && (
          <Button
            onClick={handleExpandCard}
            disabled={!hasEnoughData}
            className="w-full"
            size="default"
          >
            <Sparkles className="ml-2 h-4 w-4" />
            تنظیم پیشنهاد هوشمند
          </Button>
        )}

        {/* حالت باز - تنظیمات و پیشنهادات */}
        {isExpanded && (
          <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
            {/* پیام وضعیت */}
            {hasCommitmentToday && (
              <div className="p-4 bg-muted/50 rounded-lg border border-muted-200 text-center">
                <p className="text-sm text-muted-foreground">
                  شما امروز تعهد ثبت کرده‌اید. این قابلیت فردا فعال می‌شود. 🎯
                </p>
              </div>
            )}

            {/* تنظیمات */}
            {!hasCommitmentToday && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 transition-opacity duration-200">
                <div className="space-y-1.5">
                  <Label className="text-xs">تعداد پیشنهادات</Label>
                  <Select value={selectedCount.toString()} onValueChange={(v) => setSelectedCount(parseInt(v))}>
                    <SelectTrigger className="text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {COUNT_OPTIONS.map((count) => (
                        <SelectItem key={count} value={count.toString()}>
                          {count} تعهد
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">زمان روز</Label>
                  <Select value={selectedTime} onValueChange={setSelectedTime}>
                    <SelectTrigger className="text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <Label className="text-xs">دسته‌بندی</Label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORY_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {!hasCommitmentToday && (
              <div className="space-y-1.5">
                <Label className="text-xs">توضیحات اضافی (اختیاری)</Label>
                <Textarea
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  placeholder="مثلاً: می‌خوام بیشتر ورزش کنم یا می‌خوام یادگیری زبان رو شروع کنم..."
                  className="text-xs min-h-[60px]"
                  rows={2}
                />
              </div>
            )}

            {/* دکمه دریافت پیشنهادات در حالت باز */}
            {!hasCommitmentToday && (
              <Button
                onClick={handleGetSuggestions}
                disabled={isLoading}
                className="w-full"
                size="default"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                    در حال تحلیل...
                  </>
                ) : (
                  <>
                    <Sparkles className="ml-2 h-4 w-4" />
                    دریافت پیشنهادات هوشمند
                  </>
                )}
              </Button>
            )}

            {/* نمایش آمار تحلیل */}
            {analysis && !hasCommitmentToday && (
              <div className="p-3 bg-muted/50 rounded-lg border animate-in fade-in duration-300">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <span className="text-xs font-medium">آمار شما</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-lg font-bold text-primary">{analysis.completionRate}%</p>
                    <p className="text-[10px] text-muted-foreground">نرخ تکمیل</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold">{analysis.totalCommitments}</p>
                    <p className="text-[10px] text-muted-foreground">کل تعهدات</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-green-600">{analysis.completedCommitments}</p>
                    <p className="text-[10px] text-muted-foreground">انجام شده</p>
                  </div>
                </div>
              </div>
            )}

            {/* نمایش پیشنهادات */}
            {suggestions.length > 0 && !hasCommitmentToday && (
              <div className="space-y-3 animate-in fade-in duration-300">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold">پیشنهادات ({suggestions.length})</h4>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowInsights(!showInsights)}
                      className="text-xs"
                    >
                      <Lightbulb className="ml-1 h-3 w-3" />
                      {showInsights ? 'مخفی کردن' : 'مشاهده بینش‌ها'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setIsExpanded(false);
                        setSuggestions([]);
                        setInsights(null);
                        setAnalysis(null);
                      }}
                      className="text-xs"
                    >
                      <X className="ml-1 h-3 w-3" />
                      بستن
                    </Button>
                  </div>
                </div>

                {showInsights && insights && (
                  <div className="p-3 bg-primary/5 rounded-lg border border-primary/10 space-y-2">
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-green-700 dark:text-green-400 flex items-center gap-1">
                        <Check className="h-3 w-3" />
                        نقاط قوت:
                      </p>
                      <ul className="text-xs text-muted-foreground pr-4 space-y-0.5">
                        {insights.strengths.map((s, i) => (
                          <li key={i} className="list-disc">{s}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-amber-700 dark:text-amber-400 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        نقاط قابل بهبود:
                      </p>
                      <ul className="text-xs text-muted-foreground pr-4 space-y-0.5">
                        {insights.areasForImprovement.map((a, i) => (
                          <li key={i} className="list-disc">{a}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  {suggestions.map((suggestion, index) => (
                    <Card
                      key={index}
                      className={`border hover:border-primary/50 transition-all duration-300 ${
                        rejectingId === index
                          ? 'opacity-0 scale-95 translate-x-4'
                          : 'opacity-100 scale-100 translate-x-0'
                      }`}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Target className="h-3.5 w-3.5 text-primary" />
                              <h5 className="text-sm font-semibold">{suggestion.title}</h5>
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {suggestion.description}
                            </p>
                          </div>
                          <Badge
                            variant="outline"
                            className={`${PRIORITY_COLORS[suggestion.priority as keyof typeof PRIORITY_COLORS]} shrink-0`}
                          >
                            {PRIORITY_LABELS[suggestion.priority as keyof typeof PRIORITY_LABELS]}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-3 mb-2">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>{suggestion.estimatedTime}</span>
                          </div>
                          <Badge variant="secondary" className="text-xs">
                            {suggestion.category}
                          </Badge>
                        </div>

                        <p className="text-xs text-muted-foreground mb-3 italic">
                          💡 {suggestion.reason}
                        </p>

                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleAcceptSuggestion(suggestion)}
                            size="sm"
                            className="flex-1"
                            variant="outline"
                          >
                            <Check className="ml-1 h-3.5 w-3.5" />
                            قبول
                          </Button>
                          <Button
                            onClick={() => handleRejectSuggestion(index, suggestion)}
                            size="sm"
                            className="flex-1"
                            variant="outline"
                          >
                            <X className="ml-1 h-3.5 w-3.5" />
                            رد
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>

    {/* Dialog for insufficient data */}
    <Dialog open={showInsufficientDataDialog} onOpenChange={setShowInsufficientDataDialog}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-100 rounded-full">
              <Info className="h-6 w-6 text-amber-600" />
            </div>
            <DialogTitle className="text-xl">اطلاعیه مهم</DialogTitle>
          </div>
        </DialogHeader>
        <DialogDescription className="text-base text-foreground pt-4">
          <div className="space-y-4">
            <p className="text-gray-700">
              برای ارائه <strong className="text-gray-900">پیشنهادات هوشمند و دقیق</strong>، سیستم به حداقل <strong className="text-primary">7 روز داده</strong> از تعهدات شما نیاز دارد.
            </p>

            <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-lg border border-amber-200">
              <Calendar className="h-5 w-5 text-amber-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-amber-900">
                  {daysRemaining > 0 
                    ? `${daysRemaining} روز دیگر تا فعال‌سازی این ویژگی باقی مانده است`
                    : 'لطفاً چند روز دیگر تعهدات خود را ثبت کنید'
                  }
                </p>
                <p className="text-xs text-amber-700 mt-1">
                  شما می‌توانید از هفته دوم از این ویژگی استفاده کنید
                </p>
              </div>
            </div>

            <p className="text-sm text-gray-600">
              💡 <strong>نکته:</strong> با ثبت روزانه تعهدات و بازتاب‌ها، سیستم بهتر الگوهای شما را یاد می‌گیرد و پیشنهادات دقیق‌تری ارائه می‌دهد.
            </p>
          </div>
        </DialogDescription>
        <DialogFooter>
          <Button
            onClick={() => setShowInsufficientDataDialog(false)}
            className="w-full"
          >
            متوجه شدم
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </>
  );
}
