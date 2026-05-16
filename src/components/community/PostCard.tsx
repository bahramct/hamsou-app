'use client';

import { useState } from 'react';
import { Heart, MessageCircle, Share2, MoreVertical, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Textarea } from '@/components/ui/textarea';
import { formatDistanceToNow } from 'date-fns';
import { faIR } from 'date-fns/locale';

interface PostCardProps {
  post: {
    id: string;
    content: string;
    createdAt: string;
    isLiked: boolean;
    _count: {
      likes: number;
      comments: number;
    };
    user: {
      id: string;
      name: string | null;
      profileImage: string | null;
    };
  };
  currentUserId: string;
  onLike: (postId: string) => void;
  onUnlike: (postId: string) => void;
  onDelete?: (postId: string) => void;
}

export function PostCard({
  post,
  currentUserId,
  onLike,
  onUnlike,
  onDelete,
}: PostCardProps) {
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [comments, setComments] = useState<any[]>([]);
  const [loadingLike, setLoadingLike] = useState(false);
  const [loadingComment, setLoadingComment] = useState(false);

  const handleLike = async () => {
    setLoadingLike(true);
    try {
      if (post.isLiked) {
        await onUnlike(post.id);
      } else {
        await onLike(post.id);
      }
    } finally {
      setLoadingLike(false);
    }
  };

  const handleDelete = async () => {
    if (onDelete && confirm('آیا از حذف این پست مطمئن هستید؟')) {
      await onDelete(post.id);
    }
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;

    setLoadingComment(true);
    try {
      const response = await fetch(
        `/api/community/posts/${post.id}/comments`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ content: newComment }),
        }
      );

      const result = await response.json();

      if (result.success) {
        setComments([result.data, ...comments]);
        setNewComment('');
      }
    } finally {
      setLoadingComment(false);
    }
  };

  const isOwner = post.user.id === currentUserId;

  return (
    <Card className="w-full" dir="rtl">
      <CardContent className="p-4">
        {/* هدر پست */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src={post.user.profileImage || undefined} />
              <AvatarFallback>
                {post.user.name?.[0] || '؟'}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-sm">{post.user.name || 'کاربر'}</p>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(post.createdAt), {
                  addSuffix: true,
                  locale: faIR,
                })}
              </p>
            </div>
          </div>

          {isOwner && onDelete && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={handleDelete}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4 ml-2" />
                  حذف پست
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* محتوای پست */}
        <p className="text-sm mb-4 whitespace-pre-wrap">{post.content}</p>

        {/* دکمه‌های اکشن */}
        <div className="flex items-center gap-2 border-t pt-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLike}
            disabled={loadingLike}
            className={post.isLiked ? 'text-red-500' : ''}
          >
            <Heart
              className={`h-4 w-4 ml-1 ${
                post.isLiked ? 'fill-current' : ''
              }`}
            />
            {post._count.likes}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowComments(!showComments)}
          >
            <MessageCircle className="h-4 w-4 ml-1" />
            {post._count.comments}
          </Button>

          <Button variant="ghost" size="sm">
            <Share2 className="h-4 w-4 ml-1" />
            اشتراک
          </Button>
        </div>

        {/* کامنت‌ها */}
        {showComments && (
          <div className="mt-4 pt-4 border-t">
            {/* فرم ارسال کامنت */}
            <div className="flex gap-2 mb-4">
              <Textarea
                placeholder="نوشتن نظر..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="min-h-[60px]"
              />
              <Button
                onClick={handleSubmitComment}
                disabled={loadingComment || !newComment.trim()}
                className="self-end"
              >
                ارسال
              </Button>
            </div>

            {/* لیست کامنت‌ها */}
            <div className="space-y-3">
              {comments.length === 0 && (
                <p className="text-sm text-muted-foreground text-center">
                  هنوز نظری ثبت نشده است
                </p>
              )}
              {comments.map((comment) => (
                <div key={comment.id} className="flex gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={comment.user.profileImage || undefined}
                    />
                    <AvatarFallback>
                      {comment.user.name?.[0] || '؟'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 bg-muted rounded-lg p-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium">
                        {comment.user.name || 'کاربر'}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(comment.createdAt), {
                          addSuffix: true,
                          locale: faIR,
                        })}
                      </span>
                    </div>
                    <p className="text-sm">{comment.content}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
