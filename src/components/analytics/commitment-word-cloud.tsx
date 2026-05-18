'use client';

import { useEffect, useState } from 'react';
import { WordCloud } from './word-cloud';
import { authApiGet } from '@/lib/api';

export function CommitmentWordCloud({ timeRange }: { timeRange: string }) {
  const [words, setWords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCommitmentWords();
  }, [timeRange]);

  const loadCommitmentWords = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await authApiGet(
        `/api/analytics/wordcloud?range=${timeRange}&type=commitments`
      );

      if (data.words) {
        setWords(data.words);
      }
    } catch (err: any) {
      // Silently handle auth errors
      if (err.message && (err.message.includes('توکن نامعتبر') || err.message.includes('Unauthorized'))) {
        setLoading(false);
        return;
      }
      console.error('Error loading commitment word cloud:', err);
      setError('خطا در بارگذاری ابر کلمات');
    } finally {
      setLoading(false);
    }
  };

  if (error) {
    return (
      <div className="text-center py-8 text-red-500">
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  return (
    <WordCloud
      words={words}
      loading={loading}
      title="ابر کلمات تعهدات"
      description="کلمات پرتکرار در عناوین تعهدات شما"
    />
  );
}
