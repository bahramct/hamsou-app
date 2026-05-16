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

interface ChallengesListProps {
  currentUserId: string;
}

export function ChallengesList({ currentUserId }: ChallengesListProps) {
  const [challenges, setChallenges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
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
      const response = await fetch('/api/community/challenges');
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
      const response = await fetch(
        `/api/community/challenges/${challengeId}/join`,
        {
          method: 'POST',
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
      const response = await fetch(
        `/api/community/challenges/${challengeId}/join`,
        {
          method: 'DELETE',
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
    try {
      const response = await fetch('/api/community/challenges', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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
                    <Label htmlFor="title">عنوان</Label>
                    <Input
                      id="title"
                      value={newChallenge.title}
                      onChange={(e) =>
                        setNewChallenge({ ...newChallenge, title: e.target.value })
                      }
                      placeholder="عنوان چالش"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">توضیحات</Label>
                    <Textarea
                      id="description"
                      value={newChallenge.description}
                      onChange={(e) =>
                        setNewChallenge({
                          ...newChallenge,
                          description: e.target.value,
                        })
                      }
                      placeholder="توضیحات چالش"
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
                          تعهد روزانه
                        </SelectItem>
                        <SelectItem value="weekly_streak">استریک هفتگی</SelectItem>
                        <SelectItem value="monthly_goal">هدف ماهانه</SelectItem>
                        </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="category">دسته‌بندی</Label>
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
                        <SelectItem value="fitness">تناسب اندام</SelectItem>
                        <SelectItem value="learning">یادگیری</SelectItem>
                        <SelectItem value="productivity">بهره‌وری</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="startDate">تاریخ شروع</Label>
                      <Input
                        id="startDate"
                        type="date"
                        value={newChallenge.startDate}
                        onChange={(e) =>
                          setNewChallenge({
                            ...newChallenge,
                            startDate: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="endDate">تاریخ پایان</Label>
                      <Input
                        id="endDate"
                        type="date"
                        value={newChallenge.endDate}
                        onChange={(e) =>
                          setNewChallenge({
                            ...newChallenge,
                            endDate: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="targetValue">مقدار هدف (اختیاری)</Label>
                    <Input
                      id="targetValue"
                      type="number"
                      value={newChallenge.targetValue}
                      onChange={(e) =>
                        setNewChallenge({
                          ...newChallenge,
                          targetValue: e.target.value,
                        })
                      }
                      placeholder="مثلاً 30 روز"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setShowCreateDialog(false)}
                    >
                      انصراف
                    </Button>
                    <Button onClick={handleCreateChallenge}>ایجاد</Button>
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
                        <span>{challenge._count.participants} شرکت‌کننده</span>
                      </div>
                      {challenge.targetValue && (
                        <div className="flex items-center gap-1">
                          <Target className="h-4 w-4" />
                          <span>هدف: {challenge.targetValue}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>
                      {formatDistanceToNow(new Date(challenge.endDate), {
                        addSuffix: true,
                        locale: faIR,
                      })}
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
