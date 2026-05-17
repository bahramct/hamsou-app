'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Share2, Loader2, Check, Copy } from 'lucide-react';
import { toast } from 'sonner';

interface ShareButtonProps {
  timeRange: string;
  template?: string;
}

export function ShareButton({ timeRange, template = 'default' }: ShareButtonProps) {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [expiresInDays, setExpiresInDays] = useState('');

  const handleShare = async () => {
    try {
      setLoading(true);

      const token = localStorage.getItem('token');
      const response = await fetch('/api/analytics/share', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          range: timeRange,
          template,
          title: title || undefined,
          description: description || undefined,
          expiresInDays: expiresInDays ? parseInt(expiresInDays) : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'خطا در ایجاد لینک اشتراک‌گذاری');
      }

      setShareUrl(data.shareUrl);
      toast.success('لینک اشتراک‌گذاری ایجاد شد');
    } catch (error: any) {
      console.error('Error sharing report:', error);
      toast.error(error.message || 'خطا در اشتراک‌گذاری');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('لینک کپی شد');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('خطا در کپی لینک');
    }
  };

  const resetForm = () => {
    setShareUrl('');
    setTitle('');
    setDescription('');
    setExpiresInDays('');
    setCopied(false);
  };

  const handleClose = () => {
    setOpen(false);
    setTimeout(resetForm, 300);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Share2 className="w-4 h-4 ml-2" />
          اشتراک‌گذاری
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>اشتراک‌گذاری گزارش</DialogTitle>
          <DialogDescription>
            لینک اشتراک‌گذاری برای گزارش خود ایجاد کنید
          </DialogDescription>
        </DialogHeader>

        {!shareUrl ? (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">عنوان (اختیاری)</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="گزارش تحلیلی ۳۰ روز اخیر"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">توضیحات (اختیاری)</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="گزارش پیشرفت و تحلیل داده‌ها"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expires">اعتبار لینک (روز)</Label>
              <Input
                id="expires"
                type="number"
                value={expiresInDays}
                onChange={(e) => setExpiresInDays(e.target.value)}
                placeholder="7"
                min="1"
                max="365"
              />
              <p className="text-xs text-muted-foreground">
                اگر خالی بگذارید، لینک منقضی نمی‌شود
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>لینک اشتراک‌گذاری</Label>
              <div className="flex gap-2">
                <Input
                  value={shareUrl}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  onClick={copyToClipboard}
                  size="icon"
                  variant="outline"
                >
                  {copied ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="bg-muted p-3 rounded-lg text-sm">
              <p className="font-medium mb-1">نکات:</p>
              <ul className="space-y-1 text-muted-foreground list-disc list-inside">
                <li>هر کسی که این لینک را داشته باشد می‌تواند گزارش را ببیند</li>
                <li>می‌توانید لینک را در شبکه‌های اجتماعی به اشتراک بگذارید</li>
                <li>لینک در زمانی که مشخص کردید منقضی می‌شود</li>
              </ul>
            </div>
          </div>
        )}

        <DialogFooter>
          {!shareUrl ? (
            <Button onClick={handleShare} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  در حال ایجاد...
                </>
              ) : (
                'ایجاد لینک'
              )}
            </Button>
          ) : (
            <Button onClick={handleClose}>بستن</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
