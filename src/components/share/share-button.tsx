'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Share2, Copy, Check, Twitter, Linkedin } from 'lucide-react';
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
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleShare = async () => {
    try {
      setLoading(true);
      const response = await authApiPost('/api/share', {
        achievementType,
        data,
        title,
        description,
      });

      if (response.shareUrl) {
        const fullUrl = `${window.location.origin}${response.shareUrl}`;
        setShareUrl(fullUrl);
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
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
          {/* Success Message */}
          {shareUrl && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-700">
                لینک اشتراک‌گذاری با موفقیت ایجاد شد!
              </p>
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
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleTwitterShare}
              >
                <Twitter className="w-4 h-4 ml-2 text-blue-400" />
                توییتر
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleLinkedInShare}
              >
                <Linkedin className="w-4 h-4 ml-2 text-blue-700" />
                لینکدین
              </Button>
            </div>
          )}

          {/* Info */}
          {shareUrl && (
            <p className="text-xs text-gray-500 text-center">
              هر کسی که این لینک رو داشته باشه می‌تونه دستاورد شما رو ببینه
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
