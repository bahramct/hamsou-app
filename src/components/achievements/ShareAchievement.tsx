'use client';

import { useState } from 'react';
import { Share2, Twitter, Linkedin, Link2, Download, Copy, Check } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';

interface ShareAchievementProps {
  achievementType: 'commitment' | 'streak' | 'plan_completed';
  data: any;
  title?: string;
  description?: string;
  trigger?: React.ReactNode;
}

export function ShareAchievement({
  achievementType,
  data,
  title,
  description,
  trigger,
}: ShareAchievementProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/achievements/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          achievementType,
          data,
          title,
          description,
        }),
      });

      const result = await response.json();

      if (result.success) {
        const baseUrl = window.location.origin;
        setShareUrl(`${baseUrl}${result.shareUrl}`);
        setImageUrl(`${baseUrl}${result.imageUrl}`);
      } else {
        toast({
          variant: 'destructive',
          title: 'خطا',
          description: result.error || 'خطا در ایجاد لینک اشتراک‌گذاری',
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'خطا',
        description: 'خطا در ارتباط با سرور',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast({
        title: 'کپی شد',
        description: 'لینک در کلیپ‌بورد کپی شد',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'خطا',
        description: 'خطا در کپی لینک',
      });
    }
  };

  const shareToTwitter = () => {
    const text = title ? `${title} - ${description || ''}` : 'دستاورد من در همسو! 🌟';
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(url, '_blank', 'width=600,height=400');
  };

  const shareToLinkedin = () => {
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
    window.open(url, '_blank', 'width=600,height=400');
  };

  const shareToTelegram = () => {
    const text = title ? `${title} - ${description || ''}` : 'دستاورد من در همسو! 🌟';
    const url = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'width=600,height=400');
  };

  const downloadImage = async () => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `achievement-${Date.now()}.svg`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast({
        title: 'دانلود شد',
        description: 'تصویر با موفقیت دانلود شد',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'خطا',
        description: 'خطا در دانلود تصویر',
      });
    }
  };

  const getDefaultTrigger = () => (
    <Button variant="ghost" size="sm">
      <Share2 className="h-4 w-4 ml-2" />
      اشتراک‌گذاری
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      setOpen(newOpen);
      if (newOpen && !shareUrl) {
        handleShare();
      }
    }}>
      <DialogTrigger asChild>
        {trigger || getDefaultTrigger()}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>اشتراک‌گذاری دستاورد</DialogTitle>
          <DialogDescription>
            دستاورد خود را با دوستان به اشتراک بگذارید
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : shareUrl ? (
          <Tabs defaultValue="social" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="social">شبکه‌های اجتماعی</TabsTrigger>
              <TabsTrigger value="link">لینک مستقیم</TabsTrigger>
            </TabsList>

            <TabsContent value="social" className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={shareToTwitter}
                  variant="outline"
                  className="w-full h-auto py-4 flex-col gap-2"
                >
                  <Twitter className="h-6 w-6" />
                  <span className="text-sm">توییتر / X</span>
                </Button>

                <Button
                  onClick={shareToLinkedin}
                  variant="outline"
                  className="w-full h-auto py-4 flex-col gap-2"
                >
                  <Linkedin className="h-6 w-6" />
                  <span className="text-sm">لینکدین</span>
                </Button>

                <Button
                  onClick={shareToTelegram}
                  variant="outline"
                  className="w-full h-auto py-4 flex-col gap-2"
                >
                  <svg
                    className="h-6 w-6"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"
                      fill="currentColor"
                    />
                  </svg>
                  <span className="text-sm">تلگرام</span>
                </Button>

                <Button
                  onClick={downloadImage}
                  variant="outline"
                  className="w-full h-auto py-4 flex-col gap-2"
                >
                  <Download className="h-6 w-6" />
                  <span className="text-sm">دانلود تصویر</span>
                </Button>
              </div>

              {/* Preview Image */}
              {imageUrl && (
                <div className="mt-4 rounded-lg overflow-hidden border">
                  <img
                    src={imageUrl}
                    alt="Achievement Preview"
                    className="w-full"
                  />
                </div>
              )}
            </TabsContent>

            <TabsContent value="link" className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">لینک اشتراک‌گذاری</label>
                <div className="flex gap-2">
                  <Input
                    value={shareUrl}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button
                    onClick={handleCopyLink}
                    variant="outline"
                    size="icon"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="bg-muted p-3 rounded-lg text-sm text-muted-foreground">
                <p className="flex items-start gap-2">
                  <Link2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  این لینک تا ۳۰ روز فعال است و می‌توانید آن را با هرکس به اشتراک بگذارید.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        ) : null}

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            بستن
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
