"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { SupportedLocale, DEFAULT_LOCALE } from '@/src/i18n/config';
import { TranslationMessages, loadMessages, interpolate, getNestedValue, getRandomCompletionMessage } from '@/src/i18n';

// 预加载默认翻译文件 - 使用静态导入确保可靠性
const defaultMessages = {
  "common": {
    "loading": "加载中...",
    "error": "错误",
    "success": "成功",
    "cancel": "取消",
    "confirm": "确认",
    "close": "关闭"
  },
  "game": {
    "title": "生成式拼图游戏",
    "description": "一个基于Next.js和React的生成式拼图游戏项目",
    "hints": {
      "selectShape": "请点击生成你喜欢的形状",
      "selectCutType": "请选择切割类型",
      "cutShape": "请切割形状",
      "scatterPuzzle": "请散开拼图，开始游戏",
      "gameInProgress": "请选择拼图拖到正确位置",
      "completed": "恭喜！拼图完成！",
      "progress": "{{completed}} / {{total}} 块拼图已完成",
      "completionMessages": [
        "你好犀利㖞 ！",
        "叻叻猪 ！",
        "完美晒 ！",
        "劲到飞起 ！",
        "高手 ！",
        "好嘢 ！",
        "超正 ！",
        "靓到爆 ！",
        "掂过碌蔗 ！",
        "冇得弹 ！",
        "识玩 ! ",
        "型到漏油 ！"
      ]
    },
    "shapes": {
      "title": "选择形状类型",
      "polygon": "多边形",
      "curve": "云朵形状",
      "irregular": "锯齿形状"
    },
    "cutType": {
      "title": "选择切割类型",
      "straight": "直线",
      "diagonal": "斜线"
    },
    "cutCount": {
      "title": "选择切割次数",
      "difficulty": {
        "easy": "简单",
        "hard": "困难"
      },
      "button": "切割形状",
      "hints": {
        "selectCutType": "请先选择切割类型",
        "selectCount": "请选择切割次数"
      }
    },
    "scatter": {
      "title": "散开拼图",
      "button": "散开拼图",
      "completed": "拼图已散开"
    },
    "controls": {
      "title": "游戏控制",
      "hint": "提示",
      "rotateLeft": "左转",
      "rotateRight": "右转",
      "restart": "重新开始",
      "restartConfirm": "确定要重新开始游戏吗？",
      "currentAngle": "当前角度: {{angle}}°",
      "rotateInstruction": "可以使用2只手指旋转拼图",
      "rotateInstructionDesktop": "(旋转角度需与目标角度匹配才能放置)",
      "angleHiddenHint": "点击提示按钮查看角度信息"
    },
    "tabs": {
      "shape": "形状",
      "puzzle": "类型",
      "cut": "次数",
      "scatter": "散开",
      "controls": "控制"
    },
    "audio": {
      "toggleOn": "开启背景音乐",
      "toggleOff": "关闭背景音乐"
    },
    "fullscreen": {
      "enter": "全屏",
      "exit": "退出全屏"
    },
    "score": {
      "label": "分数",
      "current": "当前分数",
      "updated": "分数更新",
      "newRecord": "新纪录",
      "status": {
        "completed": "已完成",
        "playing": "游戏中",
        "waiting": "等待中"
      },
      "breakdown": {
        "title": "分数详情",
        "base": "基础分数",
        "timeBonus": "时间奖励",
        "rotationScore": "旋转分数",
        "hintScore": "提示分数",
        "dragPenalty": "拖拽扣分",
        "multiplier": "难度倍数",
        "final": "最终分数",
        "subtotal": "小计"
      },
      "final": "最终分数",
      "timeBonus": "时间奖励",
      "gameComplete": "游戏完成",
      "finalScore": "最终得分",
      "rotationEfficiency": "旋转效率",
      "hintPenalty": "提示扣分"
    },
    "leaderboard": {
      "title": "排行榜",
      "show": "显示排行榜",
      "close": "关闭",
      "comingSoon": "排行榜功能即将推出",
      "all": "全部",
      "noRecords": "暂无记录",
      "button": "榜单",
      "back": "返回游戏",
      "top5": "Top 5 排行榜",
      "recent3": "最近3次游戏",
      "viewDetails": "查看详情",
      "gameDetails": "游戏详情",
      "backToLeaderboard": "返回榜单",
      "empty": "暂无个人最佳成绩记录",
      "emptyHint": "Top1 位置等你来挑战！"
    },
    "stats": {
      "title": "游戏统计",
      "noData": "暂无统计数据",
      "completed": "已完成",
      "duration": "游戏时长",
      "rotations": "旋转次数",
      "hints": "使用提示",
      "drags": "拖拽次数",
      "difficulty": "难度等级",
      "cutType": "切割类型",
      "pieces": "拼图块数",
      "piecesUnit": "片",
      "device": "设备类型",
      "scoreHistory": "最近一次游戏记录",
      "hide": "隐藏统计",
      "show": "显示统计",
      "viewDetails": "查看详情",
      "gameComplete": "游戏完成",
      "complete": "完成",
      "perfectHints": "完美提示",
      "perfectGame": "完美游戏",
      "zeroHintsBonus": "零提示奖励"
    },
    "difficulty": {
      "easy": "简单",
      "medium": "中等",
      "hard": "困难",
      "extreme": "极难",
      "levelLabel": "难度{level}"
    }
  },
  "leaderboard": {
    "title": "排行榜",
    "entries": "条记录",
    "filters": "筛选器",
    "sortBy": "排序方式",
    "empty": "暂无个人最佳成绩记录",
    "emptyHint": "Top1 位置等你来挑战！",
    "anonymous": "匿名玩家",
    "newRecord": "恭喜！您获得第 {{rank}} 名",
    "rank": "第{{rank}}名",
    "sort": {
      "score": "按分数",
      "time": "按时间",
      "efficiency": "按效率",
      "recent": "按时间"
    },
    "difficulty": {
      "label": "难度",
      "all": "全部"
    }
  },
  "stats": {
    "title": "游戏统计",
    "noData": "暂无统计数据",
    "completed": "已完成",
    "duration": "游戏时长",
    "rotations": "旋转次数",
    "hints": "使用提示",
    "drags": "拖拽次数",
    "difficulty": "难度等级",
    "cutType": "切割类型",
    "pieces": "拼图块数",
    "piecesUnit": "片",
    "device": "设备类型",
    "scoreHistory": "最近一次游戏记录",
    "hide": "隐藏统计",
    "show": "显示统计",
    "viewDetails": "查看详情",
    "gameComplete": "游戏完成",
    "complete": "完成",
    "perfectHints": "完美提示",
    "perfectGame": "完美游戏",
    "zeroHintsBonus": "零提示奖励"
  }
};

interface I18nContextType {
  locale: SupportedLocale;
  messages: TranslationMessages | null;
  isLoading: boolean;
  changeLocale: (newLocale: SupportedLocale) => Promise<void>;
  t: (key: string, values?: Record<string, string | number>) => string;
  getRandomCompletionMessage: () => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

interface I18nProviderProps {
  children: ReactNode;
}

export function I18nProvider({ children }: I18nProviderProps) {
  // 始终从默认语言开始，避免水合错误
  const [locale, setLocale] = useState<SupportedLocale>(DEFAULT_LOCALE);
  // 立即使用预加载的默认翻译文件，避免显示翻译键
  const [messages, setMessages] = useState<TranslationMessages | null>(defaultMessages as TranslationMessages);
  const [isLoading, setIsLoading] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // 标记客户端已挂载
  useEffect(() => {
    setIsClient(true);
  }, []);

  // 初始化语言设置 - 页面刷新后保持默认中文
  useEffect(() => {
    if (!isClient) return;

    // 首次加载时立即加载完整的中文翻译文件，确保所有键值都能正确显示
    const loadInitialTranslations = async () => {
      try {
        const zhMessages = await loadMessages('zh-CN');
        if (zhMessages) {
          setMessages(zhMessages);
          console.log('I18n initialized with complete zh-CN translations');
        }
      } catch (error) {
        console.warn('Failed to load initial translations, using default:', error);
        // 保持使用默认翻译
      }
    };

    loadInitialTranslations();
  }, [isClient]);

  // 切换语言 - 不保存用户偏好，每次刷新回到默认中文
  const changeLocale = async (newLocale: SupportedLocale) => {
    if (newLocale === locale) return;

    setIsLoading(true);
    try {
      const newMessages = await loadMessages(newLocale);
      if (!newMessages) {
        throw new Error(`Failed to load messages for locale: ${newLocale}`);
      }
      setMessages(newMessages);
      setLocale(newLocale);
      console.log(`Language switched to: ${newLocale}`, newMessages);
    } catch (error) {
      console.error('Failed to change locale:', error);
      // 保持当前语言和翻译，不要设置为null
      console.log('Keeping current locale and messages due to error');
    } finally {
      setIsLoading(false);
    }
  };

  // 翻译函数
  const t = (key: string, values?: Record<string, string | number>): string => {
    // 现在我们总是有翻译文件（至少是默认的），所以可以简化逻辑
    if (!messages) {
      console.warn('Translation messages not available, returning key:', key);
      return key;
    }

    const translation = getNestedValue(messages, key);

    // 确保总是返回字符串
    if (typeof translation !== 'string') {
      console.warn('Translation not found or not a string for key:', key, 'returning key');
      return key;
    }

    if (values) {
      return interpolate(translation, values);
    }

    return translation;
  };

  // 获取随机完成消息
  const getRandomCompletionMessageFunc = (): string => {
    if (!messages) return 'Completed!';
    return getRandomCompletionMessage(messages);
  };

  const value: I18nContextType = {
    locale,
    messages,
    isLoading,
    changeLocale,
    t,
    getRandomCompletionMessage: getRandomCompletionMessageFunc,
  };

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nContextType {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}

// 便捷的翻译Hook
export function useTranslation() {
  const { t, locale, changeLocale, isLoading, getRandomCompletionMessage } = useI18n();
  return { t, locale, changeLocale, isLoading, getRandomCompletionMessage };
}