'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Target, Zap, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface Mission {
  id: string;
  item: string;
  quantity: number;
  status: 'hunting' | 'found' | 'negotiating';
  progress?: number;
}

interface ActiveMissionsCardProps {
  missions: Mission[];
}

/**
 * Active Missions Card
 * 2026 Agentic Workflow: Shows what the AI Agent is currently hunting
 * Uses pulsing animation to indicate 'AI thinking' state
 */
export default function ActiveMissionsCard({ missions }: ActiveMissionsCardProps) {
  const activeMissions = missions.filter(m => m.status === 'hunting');

  return (
    <Card className="border-border bg-card shadow-lg rounded-xl overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold text-foreground flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            Active Missions
          </CardTitle>
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-3 h-3 rounded-full bg-primary"
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {activeMissions.length > 0 ? (
          activeMissions.map((mission, index) => (
            <motion.div
              key={mission.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-4 rounded-xl bg-secondary/50 border border-border"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center"
                  >
                    <Loader2 className="w-4 h-4 text-primary" />
                  </motion.div>
                  <div>
                    <p className="font-semibold text-foreground">Hunting</p>
                    <p className="text-sm text-muted-foreground">
                      {mission.item} × {mission.quantity}
                    </p>
                  </div>
                </div>
                <Zap className="w-5 h-5 text-primary" />
              </div>
              <div className="mt-3 h-1.5 bg-muted rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  className="h-full bg-primary rounded-full"
                />
              </div>
            </motion.div>
          ))
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p>No active missions</p>
            <p className="text-xs mt-2">AI Agent is idle</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
