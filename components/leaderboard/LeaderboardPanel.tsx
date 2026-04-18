import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Trophy, Medal, Award, Star, ShieldCheck, Globe, User, Loader2, History, RotateCw } from "lucide-react";
import { useTranslation } from '@/contexts/I18nContext';
import { playButtonClickSound } from "@/utils/rendering/soundEffects";
import { useAuth } from "@/contexts/AuthContext";
import VirtualAuthWidget from "@/components/auth/VirtualAuthWidget";
import { motion, AnimatePresence } from "motion/react";

import GameRecordDetails from '@/components/GameRecordDetails';

import { GameRecord, DifficultyLevel } from '@generative-puzzle/game-core';
import { CloudGameRepository } from "@/utils/cloud/CloudGameRepository";
import { cn } from '@/lib/utils';

interface LeaderboardPanelProps {
  leaderboard: GameRecord[];
  history?: GameRecord[];
  onClose: () => void;
  panelScale?: number;
  isMusicPlaying?: boolean;
  isFullscreen?: boolean;
  onToggleMusic?: () => void;
  onToggleFullscreen?: () => void;
  onShowLeaderboard?: () => void;
  onViewRecentGame?: (record: GameRecord) => void;
}

const LeaderboardPanel: React.FC<LeaderboardPanelProps> = ({
  leaderboard,
  history = [],
  onClose,
  panelScale = 1.0,
  isMusicPlaying = true,
  isFullscreen = false,
  onToggleMusic,
  onToggleFullscreen,
  onShowLeaderboard,
  onViewRecentGame
}) => {
  const { t, locale, isLoading } = useTranslation();
  const { user, isLoading: authLoading } = useAuth();

  const [selectedRecord, setSelectedRecord] = useState<GameRecord | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const [activeTab, setActiveTab] = useState<'personal' | 'global'>('personal');
  const [globalLeaderboard, setGlobalLeaderboard] = useState<GameRecord[]>([]);
  const [isGlobalLoading, setIsGlobalLoading] = useState(false);

  const fetchGlobalData = useCallback(async () => {
    try {
      setIsGlobalLoading(true);
      const data = await CloudGameRepository.fetchPublicLeaderboard("all");
      setGlobalLeaderboard(data);
    } catch (error) {
      console.error("[LeaderboardPanel] Failed to fetch global leaderboard:", error);
    } finally {
      setIsGlobalLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'global' && globalLeaderboard.length === 0) {
      fetchGlobalData();
    }
  }, [activeTab, globalLeaderboard.length, fetchGlobalData]);

  const handleRefreshGlobal = () => {
    playButtonClickSound();
    fetchGlobalData();
  };

  const getDifficultyText = (difficulty: { cutCount?: number } | undefined): string => {
    const level = difficulty?.cutCount || 1;
    return t('difficulty.levelLabel', { level });
  };

  const getShapeDisplayName = (shapeType?: string): string => {
    if (!shapeType) return '';
    try {
      return t(`game.shapes.names.${shapeType}`);
    } catch {
      return shapeType;
    }
  };

  const getCutTypeDisplayName = (cutType?: string): string => {
    if (!cutType) return '';
    try {
      return t(`cutType.${cutType}`);
    } catch {
      return cutType;
    }
  };

  const getDifficultyWithShape = (difficulty: any): string => {
    const shapeName = getShapeDisplayName(difficulty?.shapeType);
    const cutTypeName = getCutTypeDisplayName(difficulty?.cutType);
    const difficultyLevel = getDifficultyText(difficulty);

    const parts = [difficultyLevel];
    if (shapeName) parts.push(shapeName);
    if (cutTypeName) parts.push(cutTypeName);

    return parts.join(' · ');
  };

  const filteredLeaderboard = useMemo(() => {
    // 个人最佳 UI 层暴力去重：防止历史同步产生的脏数据回流
    const uniqueMap = new Map<string, GameRecord>();
    
    leaderboard.forEach(record => {
      // 生成强指纹：分数 + 时长 + 步数 + 块数（与 GameDataManager 保持绝对一致，使用 Math.round 防止浮点误差）
      const fingerprint = `${Math.round(record.finalScore || 0)}-${Math.round(record.totalDuration || 0)}-${Math.round(record.totalRotations || 0)}-${record.difficulty?.cutCount || 1}`;
      const existing = uniqueMap.get(fingerprint);
      
      // 只有当前记录比已存记录包含更多精度信息（比如非直线、非多边形）时才覆盖，或者已存为空
      const isHighPrecision = record.difficulty?.cutType !== 'straight' || record.difficulty?.shapeType !== 'polygon';
      
      if (!existing || isHighPrecision) {
        uniqueMap.set(fingerprint, record);
      }
    });

    return Array.from(uniqueMap.values())
      .sort((a, b) => (b.finalScore || 0) - (a.finalScore || 0))
      .slice(0, 5);
  }, [leaderboard]);

  const sortedHistory = useMemo(() => {
    const historyData = history.length > 0 ? history : leaderboard;
    return historyData
      .slice()
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 1);
  }, [history, leaderboard]);

  // 处理全球榜单的去重，确保每个玩家只显示其最高的一项
  const uniqueGlobalData = useMemo(() => {
    if (!globalLeaderboard.length) return [];
    
    return Array.from(
      globalLeaderboard.reduce((map, record) => {
        const key = record.id || (record as any).nickname || (record as any).userId;
        const existing = map.get(key);
        if (!existing || record.finalScore > existing.finalScore) {
          map.set(key, record);
        }
        return map;
      }, new Map<string, GameRecord>()).values()
    ).sort((a, b) => (b.finalScore || 0) - (a.finalScore || 0));
  }, [globalLeaderboard]);

  const showRecentGameDetails = (record: GameRecord) => {
    if (onViewRecentGame) {
      onViewRecentGame(record);
    } else {
      setSelectedRecord(record);
      setShowDetails(true);
    }
  };

  const closeDetails = () => {
    setShowDetails(false);
    setSelectedRecord(null);
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      case 4: return '4';
      case 5: return '5';
      default: return rank.toString();
    }
  };

  const formatTime = (duration: number) => {
    const minutes = Math.floor(duration / 60);
    const seconds = Math.floor(duration % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatScore = (score: number) => {
    return score.toString();
  };

  const baseFontSize = panelScale <= 0.5 ? 12 : Math.max(12, 14 * panelScale);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-[#FFD5AB]">Loading...</div>
      </div>
    );
  }

  return (
    <div
      key={`leaderboard-${locale}`}
      className="flex flex-col h-full relative"
    >
      <AnimatePresence mode="wait">
        {!user && !authLoading ? (
          /* ============================================================
             GUEST VIEW - UNIFIED SINGLE CARD
             ============================================================ */
          <motion.div
            key="guest-unified-view"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="flex-1 flex flex-col overflow-y-hidden custom-scrollbar"
          >
            {/* Unified Content Card */}
            <div className="flex-1 flex flex-col items-center justify-start pt-1 relative">
              <div className="w-full flex-1 relative flex flex-col justify-center py-4">
                <VirtualAuthWidget onAuthSuccess={() => console.log('Auth success in panel')} />
              </div>
            </div>
          </motion.div>
        ) : (
          /* ============================================================
             AUTHENTICATED VIEW - UNIFIED SINGLE CARD
             ============================================================ */
          <motion.div
            key="ranking-full-view"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="flex-1 flex flex-col items-center justify-start pt-1 relative h-full overflow-hidden"
          >
            <div className="w-full flex-1 relative flex flex-col items-stretch overflow-hidden max-h-full p-0.5">
              <div className="flex items-center justify-between pb-3 gap-2 shrink-0">
                <div className="flex gap-1.5">
                  <button
                    onClick={() => {
                      playButtonClickSound();
                      setActiveTab('personal');
                    }}
                    className={cn(
                      "flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-medium transition-all duration-300",
                      activeTab === 'personal' ? "glass-btn-active" : "glass-btn-inactive"
                    )}
                  >
                    <User className={cn("w-3.5 h-3.5", activeTab === 'personal' ? "text-[#232035]" : "text-current")} />
                    <span>{t('game.leaderboard.tabs.personal')}</span>
                  </button>
                  <button
                    onClick={() => {
                      playButtonClickSound();
                      setActiveTab('global');
                    }}
                    className={cn(
                      "flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-medium transition-all duration-300",
                      activeTab === 'global' ? "glass-btn-active" : "glass-btn-inactive"
                    )}
                  >
                    <Globe className={cn("w-3.5 h-3.5", activeTab === 'global' ? "text-[#232035]" : "text-current")} />
                    <span>{t('game.leaderboard.tabs.global')}</span>
                  </button>
                </div>

                <div className="flex items-center gap-1">
                  {activeTab === 'global' && (
                    <Button
                      onClick={handleRefreshGlobal}
                      disabled={isGlobalLoading}
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 text-[#FFD5AB] hover:text-white/90 glass-btn-inactive rounded-lg flex items-center gap-1.5"
                    >
                      {isGlobalLoading ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : null}
                      <span className="text-xs font-medium">{t('game.leaderboard.refresh')}</span>
                    </Button>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-y-hidden overflow-x-hidden no-scrollbar -mx-0.5 px-0.5 min-h-0">
                <AnimatePresence mode="wait">
                  {activeTab === 'personal' ? (
                    <motion.div
                      key="personal-tab"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      className="space-y-3"
                    >
                      {/* Top 5 个人最佳成绩 */}
                      <div className="rounded-2xl p-3 bg-white/[0.04]">
                        <h2 className="text-[#FFD5AB]/60 mb-4 text-sm flex items-center gap-2 uppercase tracking-wider font-medium">
                          <Trophy className="w-4 h-4 opacity-40" />
                          {t('leaderboard.title')}
                        </h2>
                        {filteredLeaderboard.length === 0 ? (
                          <div className="text-center text-[#FFD5AB] opacity-40 py-8">
                            <Trophy className="w-8 h-8 mx-auto mb-2 opacity-20" />
                            <div style={{ fontSize: baseFontSize }}>{t('game.leaderboard.empty')}</div>
                          </div>
                        ) : (
                          <div className="space-y-2.5">
                            {filteredLeaderboard.map((record, index) => (
                              <motion.div
                                key={`${record.timestamp}-${index}`}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-white/[0.06] border border-white/10 hover:border-[#FFD5AB]/50 hover:bg-white/[0.10] transition-all cursor-pointer group"
                                onClick={() => showRecentGameDetails(record)}
                              >
                                <div className={cn(
                                  "shrink-0 font-medium flex items-center justify-center",
                                  index < 3 ? "text-2xl w-8 h-8" : "w-7 h-7 rounded-full bg-white/10 text-[#FFD5AB]/70 text-base"
                                )}>
                                  {getRankIcon(index + 1)}
                                </div>
                                {/* Time */}
                                <span className="text-[#FFD5AB]/80 text-xs font-medium shrink-0 tabular-nums">{formatTime(record.totalDuration)}</span>
                                {/* Difficulty — flex-1, truncate */}
                                <span className="text-[#FFD5AB]/50 text-[10px] flex-1 min-w-0 truncate">{getDifficultyWithShape(record.difficulty)}</span>
                                {/* Score */}
                                <div className="text-base font-medium tracking-tight shrink-0 group-hover:scale-105 transition-transform tabular-nums" style={{ color: '#FFD5AB' }}>
                                  {formatScore(record.finalScore)}
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        )}
                      </div>
                      {/* 最近游戏历史 */}
                      <div className="rounded-2xl p-3 bg-white/[0.04]">
                        <h2 className="text-[#FFD5AB]/60 mb-4 text-sm flex items-center gap-2 uppercase tracking-wider font-medium">
                          <History className="w-4 h-4 opacity-40" />
                          {t('stats.scoreHistory')}
                        </h2>
                        {sortedHistory.length === 0 ? (
                          <div className="text-center text-[#FFD5AB] opacity-40 py-6">
                            <div style={{ fontSize: baseFontSize }}>{t('stats.noData')}</div>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {sortedHistory.map((record, index) => (
                              <div
                                key={`recent-${record.timestamp}-${index}`}
                                className="group flex items-center justify-between px-3.5 py-2 rounded-xl bg-white/[0.06] border border-white/10 hover:border-[#FFD5AB]/50 hover:bg-white/[0.10] cursor-pointer transition-all text-xs"
                                onClick={() => showRecentGameDetails(record)}
                              >
                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                  <div className="text-white/40 group-hover:text-[#FFD5AB] transition-colors shrink-0">
                                    <History className="w-3.5 h-3.5" />
                                  </div>
                                  <div className="flex items-center gap-2 overflow-hidden flex-1">
                                    <div className="text-base font-medium shrink-0 drop-shadow-md" style={{ color: '#FFD5AB' }}>{formatScore(record.finalScore)}</div>
                                    <div className="text-[#FFD5AB]/30 flex items-center gap-2 text-[10px] whitespace-nowrap">
                                      <span className="flex items-center gap-1 font-medium"><Trophy className="w-2.5 h-2.5" /> {formatTime(record.totalDuration)}</span>
                                      <span className="flex items-center gap-1 font-medium"><RotateCw className="w-2.5 h-2.5" /> {record.totalRotations}</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="text-[#FFD5AB]/20 text-[10px] shrink-0 ml-1.5 font-mono">
                                  {new Date(record.timestamp).toLocaleDateString()}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="global-tab"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="min-h-[300px] flex flex-col"
                    >
                      <div className="rounded-2xl p-3 bg-white/[0.04] flex-1 flex flex-col no-scrollbar">
                        <h2 className="text-[#FFD5AB]/60 font-bold mb-4 text-sm flex items-center gap-2 uppercase tracking-wider font-medium">
                          <Globe className="w-4 h-4 opacity-40" />
                          {t('game.leaderboard.tabs.global')}
                        </h2>

                        {isGlobalLoading ? (
                          <div className="flex-1 flex flex-col items-center justify-center py-20 gap-3">
                            <div className="relative">
                              <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full" />
                              <Loader2 className="w-8 h-8 text-blue-400 animate-spin relative" />
                            </div>
                            <span className="text-white/40 text-xs animate-pulse">{t('game.leaderboard.loadingGlobal')}</span>
                          </div>
                        ) : globalLeaderboard.length === 0 ? (
                          <div className="flex-1 flex flex-col items-center justify-center py-20 text-center text-white/30">
                            <Globe className="w-10 h-10 mb-3 opacity-10" />
                            <div style={{ fontSize: baseFontSize }}>{t('game.leaderboard.empty')}</div>
                          </div>
                        ) : (
                          <div className="space-y-2.5">
                            {uniqueGlobalData.slice(0, 5).map((record, index) => {
                              const r = record as any;
                              const difficultyKey = record.difficulty?.difficultyLevel;
                              const difficultyLabel = difficultyKey ? t(`difficulty.${difficultyKey}`) : '';
                              const playerName = r.nickname || r.displayName || t('game.leaderboard.anonymous');
                              const sessions = r.sessionsCount ?? 0;
                              return (
                                <div
                                  key={`global-${record.id || index}`}
                                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-white/[0.06] border border-white/10 hover:border-[#FFD5AB]/50 hover:bg-white/[0.10] transition-all cursor-pointer group"
                                >
                                  {/* Rank — same size as personal best */}
                                  <div className={cn(
                                    "shrink-0 font-medium flex items-center justify-center",
                                    index < 3 ? "text-2xl w-8 h-8" : "w-7 h-7 rounded-full bg-white/10 text-[#FFD5AB]/70 text-base"
                                  )}>
                                    {index < 3 ? getRankIcon(index + 1) : index + 1}
                                  </div>
                                  {/* Info Area — Single line optimized */}
                                  <div className="flex-1 min-w-0 flex items-center justify-between gap-1.5 overflow-hidden">
                                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                      <span className="text-[#FFD5AB]/90 text-[13px] font-medium truncate shrink-0 max-w-[100px]">
                                        {playerName}
                                      </span>
                                      {difficultyLabel && (
                                        <span className="text-[10px] text-[#FFD5AB]/30 font-medium truncate opacity-80 hidden md:inline">
                                          · {difficultyLabel}
                                        </span>
                                      )}
                                    </div>
                                    
                                    <div className="flex items-center gap-2.5 shrink-0">
                                      <div className={cn(
                                        "text-base font-medium tabular-nums tracking-tighter",
                                        index < 3 ? "" : "opacity-80"
                                      )} style={{ color: '#FFD5AB' }}>
                                        {formatScore(record.finalScore)}
                                      </div>
                                      <div className="px-1.5 py-0.5 rounded-full bg-white/5 border border-white/5 text-[#FFD5AB]/20 text-[9px] font-medium shrink-0 tabular-nums">
                                        {sessions} {t('game.leaderboard.sessionsUnit')}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 详情显示 */}
      {showDetails && selectedRecord && (
        <div className="absolute inset-0 bg-[#2A2A2A]/95 backdrop-blur-2xl z-[100] animate-in fade-in slide-in-from-right-4 duration-300 rounded-[1.5rem] overflow-hidden">
          <GameRecordDetails
            record={selectedRecord}
            onBack={closeDetails}
          />
        </div>
      )}
    </div>
  );
};

export default LeaderboardPanel;