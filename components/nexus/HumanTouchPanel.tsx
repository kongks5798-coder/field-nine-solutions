'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Heart, MessageSquare, TrendingUp, Lightbulb, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface SentimentData {
  score: number;
  level: 'excellent' | 'good' | 'fair' | 'poor';
  tips: string[];
  message: string;
}

export default function HumanTouchPanel() {
  const [sentimentData, setSentimentData] = useState<SentimentData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSentiment = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/ai/human-touch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'sentiment-score',
            context: {
              reviews: [
                { rating: 5, sentiment: 'positive' },
                { rating: 4, sentiment: 'positive' },
                { rating: 3, sentiment: 'neutral' },
                { rating: 5, sentiment: 'positive' },
                { rating: 4, sentiment: 'positive' },
              ],
              inquiries: [
                { sentiment: 'happy' },
                { sentiment: 'neutral' },
                { sentiment: 'happy' },
              ],
            },
          }),
        });

        const data = await response.json();
        if (data.success) {
          setSentimentData(data);
        }
      } catch (error) {
        console.error('Sentiment fetch error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSentiment();
    const interval = setInterval(fetchSentiment, 60000); // 1분마다 업데이트
    return () => clearInterval(interval);
  }, []);

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'excellent':
        return 'bg-green-50 border-green-200 text-green-700';
      case 'good':
        return 'bg-blue-50 border-blue-200 text-blue-700';
      case 'fair':
        return 'bg-amber-50 border-amber-200 text-amber-700';
      case 'poor':
        return 'bg-red-50 border-red-200 text-red-700';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-700';
    }
  };

  const getLevelLabel = (level: string) => {
    switch (level) {
      case 'excellent':
        return '우수';
      case 'good':
        return '양호';
      case 'fair':
        return '보통';
      case 'poor':
        return '개선 필요';
      default:
        return '';
    }
  };

  if (loading) {
    return (
      <Card className="border-border bg-card shadow-lg rounded-xl">
        <CardContent className="p-12 text-center">
          <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-sm text-muted-foreground">감성 점수를 계산하는 중...</p>
        </CardContent>
      </Card>
    );
  }

  if (!sentimentData) return null;

  return (
    <Card className="border-border bg-card shadow-lg rounded-xl overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-pink-50">
            <Heart className="w-5 h-5 text-pink-600" />
          </div>
          <CardTitle className="text-xl font-bold text-foreground">
            고객 감성 점수
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 감성 점수 카드 */}
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          className={`p-6 rounded-xl border-2 ${getLevelColor(sentimentData.level)}`}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium mb-2">이번 주 고객 감성 점수</p>
              <p className="text-4xl font-bold">{sentimentData.score}점</p>
            </div>
            <Badge
              variant={sentimentData.level === 'excellent' ? 'default' : 'secondary'}
              className="text-lg px-4 py-2"
            >
              {getLevelLabel(sentimentData.level)}
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Sparkles className="w-4 h-4" />
            <span>AI가 실시간으로 고객 리뷰와 문의를 분석 중</span>
          </div>
        </motion.div>

        {/* 개선 팁 */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-amber-500" />
            <h4 className="font-semibold text-foreground">개선 팁</h4>
          </div>
          <div className="space-y-2">
            {sentimentData.tips.map((tip, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-3 bg-muted/30 rounded-lg flex items-start gap-3"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                <p className="text-sm text-foreground">{tip}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* 서사 스토리텔링 예시 */}
        <div className="pt-4 border-t border-border">
          <div className="flex items-center gap-2 mb-3">
            <MessageSquare className="w-4 h-4 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">서사 스토리텔링 예시</p>
          </div>
          <div className="p-4 bg-muted/20 rounded-lg">
            <p className="text-sm text-foreground italic">
              "이 옷 입으면 연말 데이트 분위기 UP! 나다운 따뜻함 느껴보세요 ❄️✨"
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              AI가 상품과 계절에 맞는 감성 메시지를 자동 생성합니다.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
