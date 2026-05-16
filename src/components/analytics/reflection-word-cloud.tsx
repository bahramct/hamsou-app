'use client';

import { useEffect, useState } from 'react';
import { WordCloud } from './word-cloud';
import { authApiGet } from '@/lib/api';

export function ReflectionWordCloud({ timeRange }: { timeRange: string }) {
  const [words, setWords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadReflectionWords();
  }, [timeRange]);

  const loadReflectionWords = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await authApiGet(
        `/api/analytics/wordcloud?range=${timeRange}&type=reflections`
      );

      if (data.words) {
        setWords(data.words);
      }
    } catch (err: any) {
      console.error('Error loading reflection word cloud:', err);
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
      title="ابر کلمات دلایل عدم انجام"
      description="کلمات پرتکرار در دلایل عدم انجام تعهدات"
    />
  );
}
