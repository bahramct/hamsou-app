'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Share2, Copy, Check, Twitter, Linkedin, Download } from 'lucide-react';
import { authApiPost } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { toPersianNumber } from '@/lib/utils/persian';

interface ShareButtonProps {
  achievementType: 'commitment' | 'streak' | 'plan_completed';
  data: any;
  title?: string;
  description?: string;
  children?: React.ReactNode;
}

export function ShareButton({
  achievementType,
  data,
  title,
  description,
  children,
}: ShareButtonProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleShare = async () => {
    try {
      setLoading(true);
      const response = await authApiPost('/api/achievements/share', {
        achievementType,
        data,
        title,
        description,
      });

      if (response.success && response.shareUrl) {
        const fullUrl = `${window.location.origin}${response.shareUrl}`;
        const fullImageUrl = `${window.location.origin}${response.imageUrl}`;
        setShareUrl(fullUrl);
        setImageUrl(fullImageUrl);
        setOpen(true);
      }
    } catch (error: any) {
      toast({
        title: 'خطا',
        description: error.message || 'خطا در ایجاد لینک اشتراک‌گذاری',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast({
        title: 'کپی شد',
        description: 'لینک در کلیپ‌بورد کپی شد',
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleTwitterShare = () => {
    if (shareUrl) {
      const text = title || 'دستاورد من در همسو 🎉';
      const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`;
      window.open(twitterUrl, '_blank');
    }
  };

  const handleLinkedInShare = () => {
    if (shareUrl) {
      const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
      window.open(linkedInUrl, '_blank');
    }
  };

  const handleTelegramShare = () => {
    if (shareUrl) {
      const text = title || 'دستاورد من در همسو 🎉';
      const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(text)}`;
      window.open(telegramUrl, '_blank');
    }
  };

  const handleDownloadImage = async () => {
    if (!imageUrl) return;

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
        title: 'خطا',
        description: 'خطا در دانلود تصویر',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      setOpen(newOpen);
      if (newOpen && !shareUrl) {
        handleShare();
      }
    }}>
      <DialogTrigger asChild>
        {children || (
          <Button
            variant="outline"
            size="icon"
            onClick={handleShare}
            disabled={loading}
            title="اشتراک‌گذاری"
          >
            <Share2 className="w-4 h-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>اشتراک‌گذاری دستاورد</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              {/* Success Message */}
              {shareUrl && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-700">
                    لینک اشتراک‌گذاری با موفقیت ایجاد شد!
                  </p>
                </div>
              )}

              {/* Image Preview */}
              {imageUrl && (
                <div className="rounded-lg overflow-hidden border">
                  <img
                    src={imageUrl}
                    alt="Achievement Preview"
                    className="w-full"
                  />
                </div>
              )}

              {/* URL */}
              {shareUrl && (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={shareUrl}
                    readOnly
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg bg-gray-50"
                    dir="ltr"
                  />
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={handleCopy}
                  >
                    {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              )}

              {/* Share Buttons */}
              {shareUrl && (
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    onClick={handleTwitterShare}
                  >
                    <Twitter className="w-4 h-4 ml-2 text-blue-400" />
                    توییتر / X
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleLinkedInShare}
                  >
                    <Linkedin className="w-4 h-4 ml-2 text-blue-700" />
                    لینکدین
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleTelegramShare}
                  >
                    <svg
                      className="w-4 h-4 ml-2"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
                    </svg>
                    تلگرام
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleDownloadImage}
                  >
                    <Download className="w-4 h-4 ml-2" />
                    دانلود تصویر
                  </Button>
                </div>
              )}

              {/* Info */}
              {shareUrl && (
                <p className="text-xs text-gray-500 text-center">
                  این لینک تا ۳۰ روز فعال است. هر کسی که این لینک را داشته باشد می‌تواند دستاورد شما را ببیند.
                </p>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
