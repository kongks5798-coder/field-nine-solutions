/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 62: FEATURE MANAGEMENT DASHBOARD
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Admin UI for managing feature flags and A/B tests
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Types
interface FeatureFlag {
  key: string;
  name: string;
  description?: string;
  enabled: boolean;
  rolloutPercentage: number;
  createdAt: string;
  updatedAt: string;
}

interface FeatureFlagStats {
  evaluations: number;
  enabled: number;
  disabled: number;
}

interface ExperimentVariant {
  id: string;
  name: string;
  weight: number;
  isControl: boolean;
}

interface Experiment {
  id: string;
  name: string;
  description?: string;
  status: 'draft' | 'running' | 'paused' | 'completed';
  variants: ExperimentVariant[];
  trafficAllocation: number;
  startDate?: string;
  createdAt: string;
  results?: ExperimentResults;
}

interface VariantResults {
  variantId: string;
  variantName: string;
  participants: number;
  conversions: number;
  conversionRate: number;
  improvement?: number;
  confidence?: number;
  isWinner?: boolean;
}

interface ExperimentResults {
  experimentId: string;
  totalParticipants: number;
  variants: VariantResults[];
  statisticalSignificance: boolean;
  recommendedWinner?: string;
  runningDays: number;
}

export default function FeatureManagement() {
  const [activeTab, setActiveTab] = useState<'flags' | 'experiments'>('flags');
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [flagStats, setFlagStats] = useState<Record<string, FeatureFlagStats>>({});
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedExperiment, setSelectedExperiment] = useState<string | null>(null);

  // Fetch feature flags
  const fetchFlags = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/features?stats=true');
      if (response.ok) {
        const data = await response.json();
        setFlags(data.flags || []);
        setFlagStats(data.stats || {});
      }
    } catch (error) {
      console.error('Failed to fetch flags:', error);
    }
  }, []);

  // Fetch experiments
  const fetchExperiments = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/experiments?results=true');
      if (response.ok) {
        const data = await response.json();
        setExperiments(data.experiments || []);
      }
    } catch (error) {
      console.error('Failed to fetch experiments:', error);
    }
  }, []);

  // Initial load
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchFlags(), fetchExperiments()]);
      setLoading(false);
    };
    loadData();
  }, [fetchFlags, fetchExperiments]);

  // Toggle feature flag
  const toggleFlag = async (key: string) => {
    try {
      const response = await fetch('/api/admin/features', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle', key }),
      });
      if (response.ok) {
        await fetchFlags();
      }
    } catch (error) {
      console.error('Failed to toggle flag:', error);
    }
  };

  // Update rollout percentage
  const updateRollout = async (key: string, percentage: number) => {
    try {
      const response = await fetch('/api/admin/features', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'rollout', key, percentage }),
      });
      if (response.ok) {
        await fetchFlags();
      }
    } catch (error) {
      console.error('Failed to update rollout:', error);
    }
  };

  // Update experiment status
  const updateExperimentStatus = async (id: string, action: 'start' | 'pause' | 'complete') => {
    try {
      const response = await fetch('/api/admin/experiments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, id }),
      });
      if (response.ok) {
        await fetchExperiments();
      }
    } catch (error) {
      console.error('Failed to update experiment:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'paused':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'completed':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'draft':
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="text-white text-xl">Loading feature management...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6">
        <h1 className="text-3xl font-bold">Feature Management</h1>
        <p className="text-gray-400 mt-1">PHASE 62 - Feature Flags & A/B Testing</p>
      </div>

      {/* Tab Navigation */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex gap-2 border-b border-gray-800">
          <button
            onClick={() => setActiveTab('flags')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'flags'
                ? 'text-white border-b-2 border-blue-500'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Feature Flags ({flags.length})
          </button>
          <button
            onClick={() => setActiveTab('experiments')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'experiments'
                ? 'text-white border-b-2 border-blue-500'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            A/B Experiments ({experiments.length})
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        <AnimatePresence mode="wait">
          {/* Feature Flags Tab */}
          {activeTab === 'flags' && (
            <motion.div
              key="flags"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {flags.map((flag) => {
                const stats = flagStats[flag.key];
                return (
                  <div
                    key={flag.key}
                    className="bg-[#1A1A1A] border border-gray-800 rounded-xl p-5"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold text-lg">{flag.name}</h3>
                          <code className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded">
                            {flag.key}
                          </code>
                        </div>
                        {flag.description && (
                          <p className="text-gray-400 text-sm mt-1">{flag.description}</p>
                        )}

                        {/* Stats */}
                        {stats && (
                          <div className="flex gap-4 mt-3 text-sm">
                            <span className="text-gray-500">
                              Evaluations: <span className="text-white">{stats.evaluations}</span>
                            </span>
                            <span className="text-gray-500">
                              Enabled: <span className="text-green-400">{stats.enabled}</span>
                            </span>
                            <span className="text-gray-500">
                              Disabled: <span className="text-red-400">{stats.disabled}</span>
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-4">
                        {/* Rollout Slider */}
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-400">Rollout:</span>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={flag.rolloutPercentage}
                            onChange={(e) => updateRollout(flag.key, parseInt(e.target.value))}
                            className="w-24 accent-blue-500"
                            disabled={!flag.enabled}
                          />
                          <span className="text-sm w-10 text-right">{flag.rolloutPercentage}%</span>
                        </div>

                        {/* Toggle */}
                        <button
                          onClick={() => toggleFlag(flag.key)}
                          className={`relative w-14 h-7 rounded-full transition-colors ${
                            flag.enabled ? 'bg-green-500' : 'bg-gray-600'
                          }`}
                        >
                          <div
                            className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${
                              flag.enabled ? 'translate-x-8' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </motion.div>
          )}

          {/* A/B Experiments Tab */}
          {activeTab === 'experiments' && (
            <motion.div
              key="experiments"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {experiments.map((experiment) => (
                <div
                  key={experiment.id}
                  className="bg-[#1A1A1A] border border-gray-800 rounded-xl overflow-hidden"
                >
                  {/* Experiment Header */}
                  <div
                    className="p-5 cursor-pointer hover:bg-gray-800/30"
                    onClick={() =>
                      setSelectedExperiment(
                        selectedExperiment === experiment.id ? null : experiment.id
                      )
                    }
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold text-lg">{experiment.name}</h3>
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-medium border ${getStatusColor(
                              experiment.status
                            )}`}
                          >
                            {experiment.status}
                          </span>
                        </div>
                        {experiment.description && (
                          <p className="text-gray-400 text-sm mt-1">{experiment.description}</p>
                        )}
                        <div className="flex gap-4 mt-2 text-sm text-gray-500">
                          <span>Traffic: {experiment.trafficAllocation}%</span>
                          <span>Variants: {experiment.variants.length}</span>
                          {experiment.results && (
                            <span>
                              Participants: {experiment.results.totalParticipants}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2">
                        {experiment.status === 'draft' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              updateExperimentStatus(experiment.id, 'start');
                            }}
                            className="px-3 py-1.5 bg-green-500/20 text-green-400 rounded-lg text-sm hover:bg-green-500/30"
                          >
                            Start
                          </button>
                        )}
                        {experiment.status === 'running' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              updateExperimentStatus(experiment.id, 'pause');
                            }}
                            className="px-3 py-1.5 bg-yellow-500/20 text-yellow-400 rounded-lg text-sm hover:bg-yellow-500/30"
                          >
                            Pause
                          </button>
                        )}
                        {experiment.status === 'paused' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              updateExperimentStatus(experiment.id, 'start');
                            }}
                            className="px-3 py-1.5 bg-green-500/20 text-green-400 rounded-lg text-sm hover:bg-green-500/30"
                          >
                            Resume
                          </button>
                        )}
                        {(experiment.status === 'running' || experiment.status === 'paused') && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              updateExperimentStatus(experiment.id, 'complete');
                            }}
                            className="px-3 py-1.5 bg-blue-500/20 text-blue-400 rounded-lg text-sm hover:bg-blue-500/30"
                          >
                            Complete
                          </button>
                        )}
                        <span className="text-gray-500 text-sm">
                          {selectedExperiment === experiment.id ? '▲' : '▼'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Results */}
                  <AnimatePresence>
                    {selectedExperiment === experiment.id && experiment.results && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-gray-800"
                      >
                        <div className="p-5">
                          <h4 className="text-sm font-semibold text-gray-400 mb-3">
                            EXPERIMENT RESULTS
                            {experiment.results.statisticalSignificance && (
                              <span className="ml-2 px-2 py-0.5 bg-green-500/20 text-green-400 rounded text-xs">
                                Statistically Significant
                              </span>
                            )}
                          </h4>

                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {experiment.results.variants.map((variant) => (
                              <div
                                key={variant.variantId}
                                className={`p-4 rounded-lg border ${
                                  variant.isWinner
                                    ? 'bg-green-500/10 border-green-500/30'
                                    : 'bg-gray-800/50 border-gray-700'
                                }`}
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <span className="font-medium">{variant.variantName}</span>
                                  {variant.isWinner && (
                                    <span className="text-xs text-green-400">WINNER</span>
                                  )}
                                </div>
                                <div className="space-y-1 text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-gray-400">Participants</span>
                                    <span>{variant.participants}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-400">Conversions</span>
                                    <span>{variant.conversions}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-400">Rate</span>
                                    <span className="font-medium">
                                      {(variant.conversionRate * 100).toFixed(2)}%
                                    </span>
                                  </div>
                                  {variant.improvement !== undefined && (
                                    <div className="flex justify-between">
                                      <span className="text-gray-400">vs Control</span>
                                      <span
                                        className={
                                          variant.improvement > 0
                                            ? 'text-green-400'
                                            : 'text-red-400'
                                        }
                                      >
                                        {variant.improvement > 0 ? '+' : ''}
                                        {variant.improvement.toFixed(1)}%
                                      </span>
                                    </div>
                                  )}
                                  {variant.confidence !== undefined && (
                                    <div className="flex justify-between">
                                      <span className="text-gray-400">Confidence</span>
                                      <span>{variant.confidence}%</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="mt-4 text-sm text-gray-500">
                            Running for {experiment.results.runningDays} days
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
