'use client';

/* eslint-disable react-hooks/set-state-in-effect */

import { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Cloud, Loader2 } from 'lucide-react';
import { toPersianNumber } from '@/lib/utils/persian';

interface WordData {
  text: string;
  value: number;
}

interface WordCloudProps {
  words: WordData[];
  loading?: boolean;
  title?: string;
  description?: string;
}

interface PositionedWord extends WordData {
  x: number;
  y: number;
  size: number;
  color: string;
  rotation: number;
}

export function WordCloud({ words, loading, title, description }: WordCloudProps) {
  const [mounted, setMounted] = useState(true);
  const [positionedWords, setPositionedWords] = useState<PositionedWord[]>([]);

  // پالت رنگی زیبا برای کلمات
  const colors = useMemo(() => [
    '#3b82f6', // blue-500
    '#10b981', // emerald-500
    '#8b5cf6', // violet-500
    '#f59e0b', // amber-500
    '#ec4899', // pink-500
    '#06b6d4', // cyan-500
    '#84cc16', // lime-500
    '#f97316', // orange-500
  ], []);

  // تابع بررسی برخورد دو مستطیل
  function rectsOverlap(rect1: any, rect2: any, padding: number) {
    return !(
      rect1.x + rect1.width + padding < rect2.x ||
      rect2.x + rect2.width + padding < rect1.x ||
      rect1.y + rect1.height + padding < rect2.y ||
      rect2.y + rect2.height + padding < rect1.y
    );
  }

  // محاسبه موقعیت کلمات
  useEffect(() => {
    if (!mounted || !words || words.length === 0) {
      setPositionedWords([]);
      return;
    }

    const containerWidth = 600;
    const containerHeight = 400;
    const centerX = containerWidth / 2;
    const centerY = containerHeight / 2;

    const maxValue = Math.max(...words.map((w) => w.value));
    const minValue = Math.min(...words.map((w) => w.value));
    const valueRange = maxValue - minValue || 1;

    // مرتب‌سازی کلمات بر اساس ارزش (کلمات بزرگتر اول)
    const sortedWords = [...words].sort((a, b) => b.value - a.value);

    const positioned: PositionedWord[] = [];
    const placedRects: { x: number; y: number; width: number; height: number }[] = [];

    sortedWords.forEach((word, index) => {
      // محاسبه سایز فونت (بین 18 تا 72)
      const normalizedValue = (word.value - minValue) / valueRange;
      const fontSize = 18 + normalizedValue * 54;

      // تخمین ابعاد کلمه
      const textWidth = word.text.length * fontSize * 0.7;
      const textHeight = fontSize * 1.2;

      // پیدا کردن موقعیت مناسب (spiral placement)
      let x = centerX;
      let y = centerY;
      let angle = 0;
      let radius = 0;
      let placed = false;
      const maxRadius = Math.min(containerWidth, containerHeight) / 2 - 20;

      while (radius < maxRadius && !placed) {
        // چک کردن برخورد با کلمات قبلی
        const currentRect = {
          x: x - textWidth / 2,
          y: y - textHeight / 2,
          width: textWidth,
          height: textHeight,
        };

        let collision = false;
        for (const rect of placedRects) {
          if (rectsOverlap(currentRect, rect, 5)) {
            collision = true;
            break;
          }
        }

        if (!collision) {
          placed = true;
          placedRects.push(currentRect);
          positioned.push({
            ...word,
            x,
            y,
            size: fontSize,
            color: colors[index % colors.length],
            rotation: Math.random() > 0.7 ? 90 : 0, // 30% احتمال چرخش 90 درجه
          });
        } else {
          // حرکت در مسیر مارپیچ
          angle += 0.5;
          radius += 1;
          x = centerX + radius * Math.cos(angle);
          y = centerY + radius * Math.sin(angle);
        }
      }
    });

    setPositionedWords(positioned);
  }, [words, colors, mounted]);

  if (loading || !mounted) {
    return (
      <Card dir="rtl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cloud className="w-5 h-5 text-purple-600" />
            {title || 'ابر کلمات'}
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[400px]">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!words || words.length === 0) {
    return (
      <Card dir="rtl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cloud className="w-5 h-5 text-purple-600" />
            {title || 'ابر کلمات'}
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-[400px] text-gray-500">
            <Cloud className="w-16 h-16 mb-4 text-gray-300" />
            <p className="text-sm">هنوز داده‌ای برای نمایش وجود ندارد</p>
            <p className="text-xs mt-2">با ثبت تعهدات بیشتر، ابر کلمات پر می‌شود</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card dir="rtl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Cloud className="w-5 h-5 text-purple-600" />
          {title || 'ابر کلمات'}
        </CardTitle>
        <CardDescription>
          {description} ({toPersianNumber(words.length)} کلمه)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="w-full h-[400px] flex items-center justify-center overflow-hidden">
          <svg
            width="100%"
            height="100%"
            viewBox="0 0 600 400"
            className="max-w-full"
            style={{ direction: 'ltr' }}
          >
            {positionedWords.map((word, index) => (
              <g
                key={`${word.text}-${index}`}
                transform={`translate(${word.x}, ${word.y}) rotate(${word.rotation})`}
                style={{ cursor: 'pointer' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = '0.6';
                  e.currentTarget.style.transform = `translate(${word.x}px, ${word.y}px) rotate(${word.rotation}deg) scale(1.1)`;
                  e.currentTarget.style.transition = 'all 0.2s ease';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = '1';
                  e.currentTarget.style.transform = `translate(${word.x}px, ${word.y}px) rotate(${word.rotation}deg) scale(1)`;
                }}
              >
                <text
                  x={0}
                  y={0}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill={word.color}
                  fontSize={word.size}
                  fontWeight="bold"
                  fontFamily="system-ui, -apple-system, sans-serif"
                  style={{
                    textShadow: '1px 1px 2px rgba(0,0,0,0.1)',
                    userSelect: 'none',
                  }}
                >
                  {word.text}
                </text>
                <title>
                  {word.text}: {toPersianNumber(word.value)} بار
                </title>
              </g>
            ))}
          </svg>
        </div>
      </CardContent>
    </Card>
  );
}
