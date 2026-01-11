'use client';

import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ChartData {
  date: string;
  profit: number;
  missions: number;
}

interface StatsChartProps {
  data: ChartData[];
}

export default function StatsChart({ data }: StatsChartProps) {
  const maxProfit = Math.max(...data.map(d => d.profit), 1);
  const maxMissions = Math.max(...data.map(d => d.missions), 1);

  return (
    <Card className="border-border bg-card shadow-lg rounded-xl overflow-hidden">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-foreground flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          수익 추이
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Chart Bars */}
          <div className="flex items-end justify-between gap-2 h-48">
            {data.map((item, index) => (
              <div key={index} className="flex-1 flex flex-col items-center gap-2">
                <div className="relative w-full h-full flex items-end">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${(item.profit / maxProfit) * 100}%` }}
                    transition={{ delay: index * 0.1, duration: 0.5 }}
                    className="w-full bg-gradient-to-t from-primary to-primary/60 rounded-t-lg"
                  />
                </div>
                <span className="text-xs text-muted-foreground">{item.date}</span>
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-6 pt-4 border-t border-border">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-primary" />
              <span className="text-xs text-muted-foreground">일일 수익</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
