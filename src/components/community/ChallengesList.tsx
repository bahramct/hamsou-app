'use client';

import { useState, useEffect } from 'react';
import { Trophy, Users, Clock, Target, Plus, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatDistanceToNow } from 'date-fns';
import { faIR } from 'date-fns/locale';
import { getToken } from '@/lib/api';
import { formatPersianNumber, toPersianText } from '@/lib/utils/persian';
import { PersianDatePicker } from '@/components/ui/persian-date-picker';

interface ChallengesListProps {
  currentUserId: string;
}

export function ChallengesList({ currentUserId }: ChallengesListProps) {
  const [challenges, setChallenges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [targetValueError, setTargetValueError] = useState('');
  const [newChallenge, setNewChallenge] = useState({
    title: '',
    description: '',
    type: 'daily_commitment',
    category: 'general',
    startDate: '',
    endDate: '',
    targetValue: '',
  });

  const fetchChallenges = async () => {
    setLoading(true);
    try {
      const token = getToken();
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('/api/community/challenges', { headers });
      const result = await response.json();

      if (result.success) {
        setChallenges(result.data);
      }
    } catch (error) {
      console.error('Error fetching challenges:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChallenges();
  }, []);

  const handleJoinChallenge = async (challengeId: string) => {
    try {
      const token = getToken();
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(
        `/api/community/challenges/${challengeId}/join`,
        {
          method: 'POST',
          headers,
        }
      );

      if (response.ok) {
        setChallenges(
          challenges.map((challenge) =>
            challenge.id === challengeId
              ? { ...challenge, isJoined: true }
              : challenge
          )
        );
      }
    } catch (error) {
      console.error('Error joining challenge:', error);
    }
  };

  const handleLeaveChallenge = async (challengeId: string) => {
    try {
      const token = getToken();
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(
        `/api/community/challenges/${challengeId}/join`,
        {
          method: 'DELETE',
          headers,
        }
      );

      if (response.ok) {
        setChallenges(
          challenges.map((challenge) =>
            challenge.id === challengeId
              ? { ...challenge, isJoined: false }
              : challenge
          )
        );
      }
    } catch (error) {
      console.error('Error leaving challenge:', error);
    }
  };

  const handleCreateChallenge = async () => {
    // Validate target value (must be a positive number if provided)
    if (newChallenge.targetValue) {
      const numValue = parseInt(newChallenge.targetValue, 10);
      if (isNaN(numValue) || numValue <= 0) {
        setTargetValueError('مقدار هدف باید یک عدد مثبت باشد');
        return;
      }
    }
    setTargetValueError('');

    try {
      const token = getToken();
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('/api/community/challenges', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          ...newChallenge,
          targetValue: newChallenge.targetValue
            ? parseInt(newChallenge.targetValue)
            : undefined,
        }),
      });

      if (response.ok) {
        setShowCreateDialog(false);
        setNewChallenge({
          title: '',
          description: '',
          type: 'daily_commitment',
          category: 'general',
          startDate: '',
          endDate: '',
          targetValue: '',
        });
        setTargetValueError('');
        fetchChallenges();
      }
    } catch (error) {
      console.error('Error creating challenge:', error);
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      fitness: 'bg-green-500',
      learning: 'bg-blue-500',
      productivity: 'bg-purple-500',
      general: 'bg-gray-500',
    };
    return colors[category] || 'bg-gray-500';
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      daily_commitment: 'تعهد روزانه',
      weekly_streak: 'استریک هفتگی',
      monthly_goal: 'هدف ماهانه',
    };
    return labels[type] || type;
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      fitness: 'تناسب اندام',
      learning: 'یادگیری',
      productivity: 'بهره‌وری',
      general: 'عمومی',
    };
    return labels[category] || category;
  };

  return (
    <div className="space-y-4" dir="rtl">
      {/* هدر */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              چالش‌های گروهی
            </CardTitle>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 ml-2" />
                  ایجاد چالش
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>ایجاد چالش جدید</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">عنوان چالش</Label>
                    <Input
                      id="title"
                      value={newChallenge.title}
                      onChange={(e) =>
                        setNewChallenge({ ...newChallenge, title: e.target.value })
                      }
                      placeholder="مثال: ۳۰ روز تمرین روزانه"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">توضیحات چالش</Label>
                    <Textarea
                      id="description"
                      value={newChallenge.description}
                      onChange={(e) =>
                        setNewChallenge({
                          ...newChallenge,
                          description: e.target.value,
                        })
                      }
                      placeholder="توضیحات کامل چالش و هدف آن"
                      className="min-h-[80px]"
                    />
                  </div>
                  <div>
                    <Label htmlFor="type">نوع چالش</Label>
                    <Select
                      value={newChallenge.type}
                      onValueChange={(value) =>
                        setNewChallenge({ ...newChallenge, type: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily_commitment">
                          تعهد روزانه (انجام یک کار هر روز)
                        </SelectItem>
                        <SelectItem value="weekly_streak">
                          استریک هفتگی (انجام مداوم در طول هفته)
                        </SelectItem>
                        <SelectItem value="monthly_goal">
                          هدف ماهانه (دستیابی به یک هدف در یک ماه)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="category">دسته‌بندی چالش</Label>
                    <Select
                      value={newChallenge.category}
                      onValueChange={(value) =>
                        setNewChallenge({ ...newChallenge, category: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">عمومی</SelectItem>
                        <SelectItem value="fitness">تناسب اندام و ورزش</SelectItem>
                        <SelectItem value="learning">یادگیری و مطالعه</SelectItem>
                        <SelectItem value="productivity">بهره‌وری و کار</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <PersianDatePicker
                      label="تاریخ شروع"
                      value={newChallenge.startDate}
                      onChange={(value) =>
                        setNewChallenge({ ...newChallenge, startDate: value })
                      }
                      placeholder="روز/ماه/سال"
                      required
                    />
                    <PersianDatePicker
                      label="تاریخ پایان"
                      value={newChallenge.endDate}
                      onChange={(value) =>
                        setNewChallenge({ ...newChallenge, endDate: value })
                      }
                      placeholder="روز/ماه/سال"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="targetValue">
                      تعداد روز / مقدار هدف (اختیاری)
                    </Label>
                    <Input
                      id="targetValue"
                      type="text"
                      value={newChallenge.targetValue}
                      onChange={(e) => {
                        const value = e.target.value;
                        // Only allow numbers
                        if (value === '' || /^\d+$/.test(value)) {
                          setNewChallenge({
                            ...newChallenge,
                            targetValue: value,
                          });
                          setTargetValueError('');
                        }
                      }}
                      placeholder="مثال: ۳۰"
                      inputMode="numeric"
                      dir="ltr"
                    />
                    {targetValueError && (
                      <p className="text-sm text-destructive mt-1">
                        {targetValueError}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      تعداد روزی که می‌خواهید این چالش را ادامه دهید (مثال: ۳۰)
                    </p>
                  </div>
                  <div className="flex justify-end gap-2 pt-4 border-t">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowCreateDialog(false);
                        setTargetValueError('');
                      }}
                    >
                      انصراف
                    </Button>
                    <Button
                      onClick={handleCreateChallenge}
                      disabled={
                        !newChallenge.title ||
                        !newChallenge.startDate ||
                        !newChallenge.endDate
                      }
                    >
                      ایجاد چالش
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
      </Card>

      {/* لیست چالش‌ها */}
      {loading ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            در حال بارگذاری...
          </CardContent>
        </Card>
      ) : challenges.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Trophy className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">
              هنوز چالشی وجود ندارد
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              اولین چالش را ایجاد کنید
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {challenges.map((challenge) => (
            <Card key={challenge.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold">
                        {challenge.title}
                      </h3>
                      <Badge className={getCategoryColor(challenge.category)}>
                        {getCategoryLabel(challenge.category)}
                      </Badge>
                      <Badge variant="outline">
                        {getTypeLabel(challenge.type)}
                      </Badge>
                    </div>
                    {challenge.description && (
                      <p className="text-sm text-muted-foreground mb-3">
                        {challenge.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Avatar className="h-5 w-5">
                          <AvatarImage
                            src={challenge.creator.profileImage || undefined}
                          />
                          <AvatarFallback>
                            {challenge.creator.name?.[0] || '؟'}
                          </AvatarFallback>
                        </Avatar>
                        <span>{challenge.creator.name || 'کاربر'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        <span>{formatPersianNumber(challenge._count.participants)} شرکت‌کننده</span>
                      </div>
                      {challenge.targetValue && (
                        <div className="flex items-center gap-1">
                          <Target className="h-4 w-4" />
                          <span>هدف: {formatPersianNumber(challenge.targetValue)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>
                      {toPersianText(
                        formatDistanceToNow(new Date(challenge.endDate), {
                          addSuffix: true,
                          locale: faIR,
                        })
                      )}
                    </span>
                  </div>
                  {challenge.isJoined ? (
                    <Button
                      variant="outline"
                      onClick={() => handleLeaveChallenge(challenge.id)}
                    >
                      <Check className="h-4 w-4 ml-2" />
                      شرکت‌کرده
                    </Button>
                  ) : (
                    <Button
                      onClick={() => handleJoinChallenge(challenge.id)}
                    >
                      <Users className="h-4 w-4 ml-2" />
                      پیوستن
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
