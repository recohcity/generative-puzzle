const SPEED_TIER_I18N_KEYS: Record<string, string> = {
  '光速': 'score.speedBonus.tierSupreme',
  '极速': 'score.speedBonus.tierExcellent',
  '快速': 'score.speedBonus.tierFast',
  '良好': 'score.speedBonus.tierGood',
  '标准': 'score.speedBonus.tierNormal',
  '一般': 'score.speedBonus.tierSlow',
  '慢': 'score.speedBonus.tierTooSlow',
};

export const getSpeedTierLabel = (tierName: string, t: (key: string) => string): string => {
  const key = SPEED_TIER_I18N_KEYS[tierName];
  return key ? t(key) : tierName;
};
