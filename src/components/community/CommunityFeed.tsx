'use client';

import { useState, useEffect } from 'react';
import { Plus, Users, Trophy, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { PostCard } from './PostCard';
import { Leaderboard } from './Leaderboard';
import { ChallengesList } from './ChallengesList';
import { getToken } from '@/lib/api';

export function CommunityFeed({ currentUserId }: { currentUserId: string }) {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPostContent, setNewPostContent] = useState('');
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [creatingPost, setCreatingPost] = useState(false);
  const [createPostError, setCreatePostError] = useState('');
  const [filter, setFilter] = useState<'all' | 'following' | 'achievements'>('all');

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (filter === 'following') {
        queryParams.append('following', 'true');
      } else if (filter === 'achievements') {
        queryParams.append('type', 'achievement');
      }

      const token = getToken();
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(
        `/api/community/feed?${queryParams.toString()}`,
        { headers }
      );
      const result = await response.json();

      if (result.success) {
        setPosts(result.data);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [filter]);

  const handleCreatePost = async () => {
    if (!newPostContent.trim()) return;

    setCreatingPost(true);
    setCreatePostError('');

    try {
      const token = getToken();
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('/api/community/posts', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          content: newPostContent,
          postType: 'achievement',
          visibility: 'public',
        }),
      });

      const result = await response.json();

      if (result.success) {
        setPosts([result.data, ...posts]);
        setNewPostContent('');
        setShowCreatePost(false);
      } else {
        setCreatePostError(result.error || 'خطا در ایجاد پست');
      }
    } catch (error) {
      console.error('Error creating post:', error);
      setCreatePostError('خطا در ارتباط با سرور');
    } finally {
      setCreatingPost(false);
    }
  };

  const handleLike = async (postId: string) => {
    try {
      const token = getToken();
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      await fetch(`/api/community/posts/${postId}/like`, {
        method: 'POST',
        headers,
      });
      setPosts(
        posts.map((post) =>
          post.id === postId
            ? {
                ...post,
                isLiked: true,
                _count: {
                  ...post._count,
                  likes: post._count.likes + 1,
                },
              }
            : post
        )
      );
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const handleUnlike = async (postId: string) => {
    try {
      const token = getToken();
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      await fetch(`/api/community/posts/${postId}/like`, {
        method: 'DELETE',
        headers,
      });
      setPosts(
        posts.map((post) =>
          post.id === postId
            ? {
                ...post,
                isLiked: false,
                _count: {
                  ...post._count,
                  likes: post._count.likes - 1,
                },
              }
            : post
        )
      );
    } catch (error) {
      console.error('Error unliking post:', error);
    }
  };

  const handleDeletePost = async (postId: string) => {
    try {
      const token = getToken();
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`/api/community/posts/${postId}`, {
        method: 'DELETE',
        headers,
      });

      if (response.ok) {
        setPosts(posts.filter((post) => post.id !== postId));
      }
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  const handleCommentAdded = (postId: string) => {
    setPosts(
      posts.map((post) =>
        post.id === postId
          ? {
              ...post,
              _count: {
                ...post._count,
                comments: post._count.comments + 1,
              },
            }
          : post
      )
    );
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6" dir="rtl">
      {/* هدر */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl">جامعه همسو</CardTitle>
            <Dialog open={showCreatePost} onOpenChange={setShowCreatePost}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  پست جدید
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>اشتراک‌گذاری دستاورد</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Textarea
                    placeholder="دستاورد خود را با جامعه به اشتراک بگذارید..."
                    value={newPostContent}
                    onChange={(e) => {
                      setNewPostContent(e.target.value);
                      setCreatePostError('');
                    }}
                    className="min-h-[120px]"
                    disabled={creatingPost}
                  />
                  {createPostError && (
                    <p className="text-sm text-destructive">{createPostError}</p>
                  )}
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowCreatePost(false);
                        setCreatePostError('');
                      }}
                      disabled={creatingPost}
                    >
                      انصراف
                    </Button>
                    <Button 
                      onClick={handleCreatePost}
                      disabled={creatingPost || !newPostContent.trim()}
                    >
                      {creatingPost ? 'در حال انتشار...' : 'انتشار'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
      </Card>

      {/* تب‌ها */}
      <Tabs defaultValue="feed" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="leaderboard">
            <Trophy className="h-4 w-4 mr-2" />
            لیدربورد
          </TabsTrigger>
          <TabsTrigger value="challenges">
            <Trophy className="h-4 w-4 mr-2" />
            چالش‌ها
          </TabsTrigger>
          <TabsTrigger value="feed">
            <Users className="h-4 w-4 mr-2" />
            فید
          </TabsTrigger>
        </TabsList>

        {/* فید */}
        <TabsContent value="feed" className="space-y-4">
          {/* فیلتر */}
          <div className="flex items-center gap-2" dir="rtl">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('all')}
            >
              همه
            </Button>
            <Button
              variant={filter === 'following' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('following')}
            >
              دنبال‌شده‌ها
            </Button>
            <Button
              variant={filter === 'achievements' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('achievements')}
            >
              دستاوردها
            </Button>
            <Filter className="h-4 w-4 text-muted-foreground" />
          </div>

          {/* لیست پست‌ها */}
          {loading ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                در حال بارگذاری...
              </CardContent>
            </Card>
          ) : posts.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground mb-4">
                  هنوز پستی وجود ندارد
                </p>
                <Button onClick={() => setShowCreatePost(true)}>
                  اولین پست را شما ارسال کنید
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  currentUserId={currentUserId}
                  onLike={handleLike}
                  onUnlike={handleUnlike}
                  onDelete={handleDeletePost}
                  onCommentAdded={handleCommentAdded}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* چالش‌ها */}
        <TabsContent value="challenges">
          <ChallengesList currentUserId={currentUserId} />
        </TabsContent>

        {/* لیدربورد */}
        <TabsContent value="leaderboard">
          <Leaderboard currentUserId={currentUserId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
