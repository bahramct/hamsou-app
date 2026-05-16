'use client';

import { useState, useEffect } from 'react';
import { Trophy, Medal, Crown, Award } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface LeaderboardProps {
  currentUserId: string;
}

export function Leaderboard({ currentUserId }: LeaderboardProps) {
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [currentUserRank, setCurrentUserRank] = useState<number | null>(null);
  const [period, setPeriod] = useState<'weekly' | 'monthly' | 'all_time'>('weekly');
  const [loading, setLoading] = useState(true);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/community/leaderboard?period=${period}`
      );
      const result = await response.json();

      if (result.success) {
        setLeaderboard(result.data);
        setCurrentUserRank(result.currentUserRank);
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [period]);

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="h-6 w-6 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-6 w-6 text-gray-400" />;
    if (rank === 3) return <Medal className="h-6 w-6 text-amber-600" />;
    return <span className="font-bold text-lg">#{rank}</span>;
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return 'bg-yellow-500';
    if (rank === 2) return 'bg-gray-400';
    if (rank === 3) return 'bg-amber-600';
    return 'bg-muted';
  };

  return (
    <div className="space-y-4">
      {/* هدر */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              لیدربورد
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant={period === 'weekly' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPeriod('weekly')}
              >
                هفتگی
              </Button>
              <Button
                variant={period === 'monthly' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPeriod('monthly')}
              >
                ماهانه
              </Button>
              <Button
                variant={period === 'all_time' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPeriod('all_time')}
              >
                همیشه
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* لیست کاربران برتر */}
      <Card>
        <CardContent className="p-6">
          {loading ? (
            <p className="text-center text-muted-foreground">در حال بارگذاری...</p>
          ) : (
            <div className="space-y-3">
              {/* 3 نفر اول با نمایش بزرگ */}
              {leaderboard.slice(0, 3).map((user) => (
                <div
                  key={user.id}
                  className={`flex items-center gap-4 p-4 rounded-lg ${
                    user.id === currentUserId
                      ? 'bg-primary/10 border-2 border-primary'
                      : 'bg-muted'
                  }`}
                >
                  <div
                    className={`flex items-center justify-center w-10 h-10 rounded-full ${getRankBadge(
                      user.rank
                    )} text-white font-bold`}
                  >
                    {getRankIcon(user.rank)}
                  </div>
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={user.profileImage || undefined} />
                    <AvatarFallback>
                      {user.name?.[0] || '؟'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium">{user.name || 'کاربر'}</p>
                    <p className="text-sm text-muted-foreground">
                      {user.followersCount} دنبال‌کننده • {user.postsCount} پست
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary">
                      {user.score}
                    </p>
                    <p className="text-xs text-muted-foreground">امتیاز</p>
                  </div>
                </div>
              ))}

              {/* بقیه کاربران */}
              {leaderboard.slice(3).map((user) => (
                <div
                  key={user.id}
                  className={`flex items-center gap-4 p-3 rounded-lg ${
                    user.id === currentUserId
                      ? 'bg-primary/10 border-2 border-primary'
                      : 'hover:bg-muted/50'
                  }`}
                >
                  <div className="w-8 text-center font-bold text-muted-foreground">
                    #{user.rank}
                  </div>
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.profileImage || undefined} />
                    <AvatarFallback>
                      {user.name?.[0] || '؟'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{user.name || 'کاربر'}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{user.score}</p>
                    <p className="text-xs text-muted-foreground">امتیاز</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* رتبه کاربر جاری */}
          {currentUserRank && currentUserRank > 10 && (
            <div className="mt-6 pt-6 border-t">
              <div className="flex items-center gap-4 p-4 rounded-lg bg-primary/10 border-2 border-primary">
                <Award className="h-6 w-6 text-primary" />
                <div className="flex-1">
                  <p className="font-medium">رتبه شما</p>
                  <p className="text-sm text-muted-foreground">
                    کاربر شماره {currentUserRank} در لیدربورد
                  </p>
                </div>
                <div className="text-2xl font-bold text-primary">
                  #{currentUserRank}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
