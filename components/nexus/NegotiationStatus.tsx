'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare, TrendingDown, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
// Using custom progress bar instead of Progress component for better control

interface Negotiation {
  id: string;
  item: string;
  currentDiscount: number;
  targetDiscount: number;
  status: 'in-progress' | 'completed' | 'failed';
  messages: number;
}

interface NegotiationStatusProps {
  negotiations: Negotiation[];
}

/**
 * Negotiation Status Component
 * 2026 Agentic Workflow: Visual progress bar showing AI negotiating prices
 * Displays real-time discount achievements and negotiation progress
 */
export default function NegotiationStatus({ negotiations }: NegotiationStatusProps) {
  const activeNegotiations = negotiations.filter(n => n.status === 'in-progress');

  const getProgress = (negotiation: Negotiation) => {
    return Math.min((negotiation.currentDiscount / negotiation.targetDiscount) * 100, 100);
  };

  return (
    <Card className="border-border bg-card shadow-lg rounded-xl overflow-hidden">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-bold text-foreground flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-primary" />
          Negotiation Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {activeNegotiations.length > 0 ? (
          activeNegotiations.map((negotiation, index) => (
            <motion.div
              key={negotiation.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="space-y-3"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-foreground mb-1">{negotiation.item}</p>
                  <p className="text-xs text-muted-foreground">
                    {negotiation.messages} messages exchanged
                  </p>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-primary">
                    <TrendingDown className="w-4 h-4" />
                    <span className="font-bold text-lg">
                      -{negotiation.currentDiscount}%
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Target: -{negotiation.targetDiscount}%
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium text-foreground">
                    {Math.round(getProgress(negotiation))}%
                  </span>
                </div>
                <div className="relative h-3 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${getProgress(negotiation)}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    className="h-full bg-gradient-to-r from-primary to-primary/80 rounded-full"
                  />
                </div>
              </div>

              {negotiation.status === 'in-progress' && (
                <motion.div
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="flex items-center gap-2 text-xs text-primary"
                >
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <span>Negotiating... -{negotiation.currentDiscount}% achieved</span>
                </motion.div>
              )}
            </motion.div>
          ))
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <CheckCircle2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No active negotiations</p>
            <p className="text-xs mt-2">All deals completed or pending approval</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
