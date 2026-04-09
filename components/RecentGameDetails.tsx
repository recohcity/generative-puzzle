"use client";

import { useTranslation } from '@/contexts/I18nContext';
import GameRecordDetails from './GameRecordDetails';

// 使用GameDataManager内部的数据结构
interface StoredGameRecord {
  timestamp: number;
  finalScore: number;
  totalDuration: number;
  difficulty: any;
  deviceInfo: any;
  totalRotations: number;
  hintUsageCount: number;
  dragOperations: number;
  rotationEfficiency: number;
  scoreBreakdown: any;
  gameStartTime?: number;
  id?: string;
}

interface RecentGameDetailsProps {
  record: StoredGameRecord;
  onBack: () => void;
}

/**
 * 最近游戏详情 - 统一使用 GameRecordDetails 组件
 */
const RecentGameDetails: React.FC<RecentGameDetailsProps> = ({
  record,
  onBack
}) => {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <GameRecordDetails 
        record={record as any} 
        onBack={onBack} 
      />
    </div>
  );
};

export default RecentGameDetails;