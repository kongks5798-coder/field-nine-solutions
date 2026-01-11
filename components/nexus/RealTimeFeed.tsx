'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, CheckCircle2, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface FoundItem {
  id: string;
  item: string;
  brand: string;
  foundPrice: number;
  targetPrice: number;
  profitMargin: number;
  status: 'found' | 'negotiating' | 'approved';
  timestamp: Date;
}

interface RealTimeFeedProps {
  items: FoundItem[];
}

/**
 * Real-time Feed Component
 * 2026 Agentic Workflow: Displays items found by AI Agent with profit margins
 * Updates in real-time as AI discovers new opportunities
 */
export default function RealTimeFeed({ items }: RealTimeFeedProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Card className="border-border bg-card shadow-lg rounded-xl overflow-hidden">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-bold text-foreground flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          Real-time Feed
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-[600px] overflow-y-auto">
          <AnimatePresence>
            {items.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.05 }}
                className={cn(
                  'p-4 rounded-xl border transition-all',
                  item.status === 'approved'
                    ? 'bg-primary/5 border-primary'
                    : 'bg-secondary/30 border-border hover:border-primary/50'
                )}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-foreground">{item.item}</h4>
                      {item.status === 'approved' && (
                        <CheckCircle2 className="w-4 h-4 text-primary" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{item.brand}</p>
                  </div>
                  <Badge
                    variant={item.profitMargin > 20 ? 'default' : 'secondary'}
                    className={cn(
                      'font-bold',
                      item.profitMargin > 20 && 'bg-primary text-primary-foreground'
                    )}
                  >
                    +{item.profitMargin}%
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Found Price</p>
                    <p className="text-sm font-semibold text-foreground">
                      {formatCurrency(item.foundPrice)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Target Price</p>
                    <p className="text-sm font-semibold text-foreground">
                      {formatCurrency(item.targetPrice)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    {item.timestamp.toLocaleTimeString('ko-KR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                  <div className="flex items-center gap-2">
                    {item.status === 'negotiating' && (
                      <motion.div
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="text-xs text-primary font-medium"
                      >
                        Negotiating...
                      </motion.div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  );
}
