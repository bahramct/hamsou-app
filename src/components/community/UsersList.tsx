'use client';

import { useState, useEffect } from 'react';
import { Search, UserPlus, UserMinus, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { formatPersianNumber } from '@/lib/utils/persian';
import { getToken } from '@/lib/api';

interface User {
  id: string;
  name: string | null;
  bio: string | null;
  profileImage: string | null;
  _count: {
    followers: number;
    following: number;
    posts: number;
  };
  isFollowing: boolean;
}

interface UsersListProps {
  currentUserId: string;
}

export function UsersList({ currentUserId }: UsersListProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = getToken();
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const queryParams = searchTerm ? `?search=${encodeURIComponent(searchTerm)}` : '';
      const response = await fetch(`/api/community/users${queryParams}`, {
        headers,
      });
      const result = await response.json();

      if (result.success) {
        setUsers(result.data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers();
    }, 300); // Debounce search

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleFollow = async (userId: string) => {
    try {
      const token = getToken();
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`/api/community/users/${userId}/follow`, {
        method: 'POST',
        headers,
      });
      const result = await response.json();

      if (result.success) {
        setUsers(
          users.map((user) =>
            user.id === userId
              ? {
                  ...user,
                  isFollowing: true,
                  _count: {
                    ...user._count,
                    followers: user._count.followers + 1,
                  },
                }
              : user
          )
        );
      }
    } catch (error) {
      console.error('Error following user:', error);
    }
  };

  const handleUnfollow = async (userId: string) => {
    if (!confirm('آیا مطمئن هستید که می‌خواهید این کاربر را آنفالو کنید؟')) {
      return;
    }

    try {
      const token = getToken();
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`/api/community/users/${userId}/follow`, {
        method: 'DELETE',
        headers,
      });
      const result = await response.json();

      if (result.success) {
        setUsers(
          users.map((user) =>
            user.id === userId
              ? {
                  ...user,
                  isFollowing: false,
                  _count: {
                    ...user._count,
                    followers: user._count.followers - 1,
                  },
                }
              : user
          )
        );
      }
    } catch (error) {
      console.error('Error unfollowing user:', error);
    }
  };

  return (
    <div className="space-y-4" dir="rtl">
      {/* هدر */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <CardTitle>کاربران جامعه</CardTitle>
          </div>
        </CardHeader>
      </Card>

      {/* جستجو */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="جستجوی کاربر..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* لیست کاربران */}
      {loading ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            در حال بارگذاری...
          </CardContent>
        </Card>
      ) : users.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4" />
            <p>
              {searchTerm
                ? 'کاربری با این مشخصات یافت نشد'
                : 'هنوز کاربری در جامعه وجود ندارد'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {users.map((user) => (
            <Card
              key={user.id}
              className="hover:shadow-md transition-shadow"
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={user.profileImage || undefined} />
                    <AvatarFallback>
                      {user.name?.[0] || '؟'}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate">{user.name || 'کاربر'}</h3>
                    {user.bio && (
                      <p className="text-sm text-muted-foreground truncate">
                        {user.bio}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span>{formatPersianNumber(user._count.followers)} دنبال‌کننده</span>
                      <span>{formatPersianNumber(user._count.following)} دنبال‌شده</span>
                      <span>{formatPersianNumber(user._count.posts)} پست</span>
                    </div>
                  </div>

                  {user.isFollowing ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleUnfollow(user.id)}
                      className="whitespace-nowrap"
                    >
                      <UserMinus className="h-4 w-4 ml-2" />
                      آنفالو
                    </Button>
                  ) : (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleFollow(user.id)}
                      className="whitespace-nowrap"
                    >
                      <UserPlus className="h-4 w-4 ml-2" />
                      فالو
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
