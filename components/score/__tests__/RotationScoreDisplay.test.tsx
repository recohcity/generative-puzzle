import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { RotationScoreDisplay, SimpleRotationScoreDisplay, RotationScoreCard } from '../RotationScoreDisplay';
import { I18nProvider } from '@/contexts/I18nContext';

// Mock 国际化上下文
const MockI18nProvider: React.FC<{ children: React.ReactNode; locale?: string }> = ({ 
  children, 
  locale = 'zh-CN' 
}) => {
  const mockTranslations = {
    'zh-CN': {
      'rotation.label': '旋转',
      'rotation.perfect': '完美',
      'rotation.excess': '超出{count}次',
      'rotation.score.perfect': '完美旋转，+500分',
      'rotation.score.excess': '超出{count}次，-{penalty}分',
      'common.error': '错误'
    },
    'en': {
      'rotation.label': 'Rotation',
      'rotation.perfect': 'Perfect',
      'rotation.excess': 'Excess {count}',
      'rotation.score.perfect': 'Perfect rotation, +500 points',
      'rotation.score.excess': 'Excess {count} times, -{penalty} points',
      'common.error': 'Error'
    }
  };

  const t = (key: string, params?: Record<string, any>) => {
    const translations = mockTranslations[locale as keyof typeof mockTranslations];
    let translation = translations[key as keyof typeof translations] || key;
    
    if (params) {
      Object.entries(params).forEach(([paramKey, value]) => {
        translation = translation.replace(`{${paramKey}}`, String(value));
      });
    }
    
    return translation;
  };

  // 创建模拟的上下文值
  const mockContextValue = {
    locale: locale as any,
    messages: mockTranslations[locale as keyof typeof mockTranslations] as any,
    isLoading: false,
    changeLocale: jest.fn(),
    t,
    getRandomCompletionMessage: () => '完成！'
  };

  return (
    <div data-testid="mock-i18n-provider">
      {children}
    </div>
  );
};

// 包装组件以提供国际化上下文
const renderWithI18n = (component: React.ReactElement, locale = 'zh-CN') => {
  return render(
    <MockI18nProvider locale={locale}>
      {component}
    </MockI18nProvider>
  );
};

// 模拟 useTranslation hook
jest.mock('@/contexts/I18nContext', () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, any>) => {
      const translations: Record<string, string> = {
        'rotation.label': '旋转',
        'rotation.perfect': '完美',
        'rotation.excess': '超出{count}次',
        'rotation.score.perfect': '完美旋转，+500分',
        'rotation.score.excess': '超出{count}次，-{penalty}分',
        'common.error': '错误'
      };
      
      let translation = translations[key] || key;
      
      if (params) {
        Object.entries(params).forEach(([paramKey, value]) => {
          translation = translation.replace(`{${paramKey}}`, String(value));
        });
      }
      
      return translation;
    },
    locale: 'zh-CN',
    changeLocale: jest.fn(),
    isLoading: false,
    getRandomCompletionMessage: () => '完成！'
  })
}));

describe('RotationScoreDisplay', () => {
  describe('完美旋转场景', () => {
    it('应该正确显示完美旋转（桌面端模式）', () => {
      render(
        <RotationScoreDisplay
          actualRotations={10}
          minRotations={10}
          displayMode="desktop"
        />
      );

      // 检查是否显示完美旋转文本
      expect(screen.getByText(/旋转: 10\/10（完美）/)).toBeInTheDocument();
      
      // 检查是否显示+500分
      expect(screen.getByText('+500')).toBeInTheDocument();
      
      // 检查是否有Trophy图标（通过data-testid或角色查找）
      expect(screen.getByTestId('rotation-score-display')).toBeInTheDocument();
    });

    it('应该正确显示完美旋转（移动端模式）', () => {
      render(
        <RotationScoreDisplay
          actualRotations={5}
          minRotations={5}
          displayMode="mobile"
        />
      );

      // 移动端应该显示简化的标签
      expect(screen.getByText(/🔄 5\/5（完美）/)).toBeInTheDocument();
      expect(screen.getByText('+500')).toBeInTheDocument();
    });

    it('应该正确显示完美旋转（紧凑模式）', () => {
      render(
        <RotationScoreDisplay
          actualRotations={3}
          minRotations={3}
          displayMode="compact"
        />
      );

      // 紧凑模式应该只显示基本信息
      expect(screen.getByText('3/3（完美）')).toBeInTheDocument();
      expect(screen.getByText('+500')).toBeInTheDocument();
    });
  });

  describe('超出旋转场景', () => {
    it('应该正确显示超出旋转（桌面端模式）', () => {
      render(
        <RotationScoreDisplay
          actualRotations={15}
          minRotations={10}
          displayMode="desktop"
        />
      );

      // 检查是否显示超出旋转文本
      expect(screen.getByText(/旋转: 15\/10（超出5次）/)).toBeInTheDocument();
      
      // 检查是否显示-50分（5次超出 × 10分）
      expect(screen.getByText('-50')).toBeInTheDocument();
      
      // 检查详细信息
      expect(screen.getByText(/超出5次，-50分/)).toBeInTheDocument();
    });

    it('应该正确显示超出旋转（移动端模式）', () => {
      render(
        <RotationScoreDisplay
          actualRotations={12}
          minRotations={8}
          displayMode="mobile"
        />
      );

      expect(screen.getByText(/🔄 12\/8（超出4次）/)).toBeInTheDocument();
      expect(screen.getByText('-40')).toBeInTheDocument();
    });

    it('应该正确显示超出旋转（紧凑模式）', () => {
      render(
        <RotationScoreDisplay
          actualRotations={7}
          minRotations={5}
          displayMode="compact"
        />
      );

      expect(screen.getByText('7/5（超出2次）')).toBeInTheDocument();
      expect(screen.getByText('-20')).toBeInTheDocument();
    });
  });

  describe('边界条件', () => {
    it('应该正确处理0次旋转的完美情况', () => {
      render(
        <RotationScoreDisplay
          actualRotations={0}
          minRotations={0}
          displayMode="desktop"
        />
      );

      expect(screen.getByText(/0\/0（完美）/)).toBeInTheDocument();
      expect(screen.getByText('+500')).toBeInTheDocument();
    });

    it('应该正确处理不需要旋转但进行了旋转的情况', () => {
      render(
        <RotationScoreDisplay
          actualRotations={3}
          minRotations={0}
          displayMode="desktop"
        />
      );

      expect(screen.getByText(/3\/0（超出3次）/)).toBeInTheDocument();
      expect(screen.getByText('-30')).toBeInTheDocument();
    });

    it('应该正确处理大数值', () => {
      render(
        <RotationScoreDisplay
          actualRotations={50}
          minRotations={30}
          displayMode="desktop"
        />
      );

      expect(screen.getByText(/50\/30（超出20次）/)).toBeInTheDocument();
      expect(screen.getByText('-200')).toBeInTheDocument();
    });
  });

  describe('显示选项', () => {
    it('应该支持隐藏图标', () => {
      render(
        <RotationScoreDisplay
          actualRotations={10}
          minRotations={10}
          displayMode="desktop"
          showIcon={false}
        />
      );

      // 图标应该被隐藏，但文本应该存在
      expect(screen.getByText(/旋转: 10\/10（完美）/)).toBeInTheDocument();
    });

    it('应该支持隐藏分数', () => {
      render(
        <RotationScoreDisplay
          actualRotations={10}
          minRotations={10}
          displayMode="desktop"
          showScore={false}
        />
      );

      // 分数应该被隐藏
      expect(screen.queryByText('+500')).not.toBeInTheDocument();
      // 但旋转信息应该存在
      expect(screen.getByText(/旋转: 10\/10（完美）/)).toBeInTheDocument();
    });

    it('应该支持自定义CSS类名', () => {
      render(
        <RotationScoreDisplay
          actualRotations={10}
          minRotations={10}
          displayMode="desktop"
          className="custom-class"
        />
      );

      const element = screen.getByTestId('rotation-score-display');
      expect(element).toHaveClass('custom-class');
    });
  });

  describe('颜色方案', () => {
    it('完美旋转应该使用金色主题', () => {
      render(
        <RotationScoreDisplay
          actualRotations={10}
          minRotations={10}
          displayMode="desktop"
        />
      );

      const container = screen.getByTestId('rotation-score-display');
      expect(container).toHaveClass('border-yellow-200', 'bg-yellow-50/90');
    });

    it('超出旋转应该使用红色主题', () => {
      render(
        <RotationScoreDisplay
          actualRotations={15}
          minRotations={10}
          displayMode="desktop"
        />
      );

      const container = screen.getByTestId('rotation-score-display');
      expect(container).toHaveClass('border-red-200', 'bg-red-50/90');
    });
  });

  describe('无障碍性', () => {
    it('应该提供正确的ARIA标签', () => {
      render(
        <RotationScoreDisplay
          actualRotations={10}
          minRotations={10}
          displayMode="desktop"
        />
      );

      const element = screen.getByTestId('rotation-score-display');
      expect(element).toHaveAttribute('role', 'status');
      expect(element).toHaveAttribute('aria-label', '旋转: 10/10（完美）');
    });
  });
});

describe('SimpleRotationScoreDisplay', () => {
  it('应该渲染简化的旋转分数显示', () => {
    render(
      <SimpleRotationScoreDisplay
        actualRotations={10}
        minRotations={8}
      />
    );

    // 简化版本应该使用紧凑模式，不显示图标
    expect(screen.getByText('10/8（超出2次）')).toBeInTheDocument();
    expect(screen.getByText('-20')).toBeInTheDocument();
  });

  it('应该支持自定义类名', () => {
    render(
      <SimpleRotationScoreDisplay
        actualRotations={5}
        minRotations={5}
        className="simple-custom"
      />
    );

    const element = screen.getByTestId('rotation-score-display');
    expect(element).toHaveClass('simple-custom');
  });
});

describe('RotationScoreCard', () => {
  it('应该渲染完整的旋转分数卡片', () => {
    render(
      <RotationScoreCard
        actualRotations={10}
        minRotations={10}
      />
    );

    // 检查卡片标题
    expect(screen.getByText('旋转')).toBeInTheDocument();
    
    // 检查旋转信息
    expect(screen.getByText('10/10（完美）')).toBeInTheDocument();
    
    // 检查分数
    expect(screen.getByText('+500 分')).toBeInTheDocument();
    
    // 检查详细说明
    expect(screen.getByText('完美旋转，+500分')).toBeInTheDocument();
  });

  it('应该为超出旋转显示正确的卡片样式', () => {
    render(
      <RotationScoreCard
        actualRotations={12}
        minRotations={8}
      />
    );

    expect(screen.getByText('12/8（超出4次）')).toBeInTheDocument();
    expect(screen.getByText('-40 分')).toBeInTheDocument();
    expect(screen.getByText('超出4次，-40分')).toBeInTheDocument();
  });

  it('应该支持自定义类名', () => {
    const { container } = render(
      <RotationScoreCard
        actualRotations={5}
        minRotations={5}
        className="card-custom"
      />
    );

    const cardElement = container.querySelector('.card-custom');
    expect(cardElement).toBeInTheDocument();
  });
});

describe('错误处理', () => {
  it('应该处理无效的旋转数据', () => {
    // 模拟控制台错误以避免测试输出中的错误信息
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <RotationScoreDisplay
        actualRotations={-1}
        minRotations={5}
        displayMode="desktop"
      />
    );

    // 应该显示错误状态
    expect(screen.getByText('错误')).toBeInTheDocument();

    consoleSpy.mockRestore();
  });

  it('应该处理极大的数值', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <RotationScoreDisplay
        actualRotations={2000}
        minRotations={5}
        displayMode="desktop"
      />
    );

    // 应该显示错误状态或处理大数值
    expect(screen.getByText('错误')).toBeInTheDocument();

    consoleSpy.mockRestore();
  });
});

describe('性能测试', () => {
  it('应该能够快速渲染多个组件', () => {
    const startTime = performance.now();

    // 渲染100个组件
    for (let i = 0; i < 100; i++) {
      const { unmount } = render(
        <RotationScoreDisplay
          actualRotations={i % 20}
          minRotations={i % 15}
          displayMode="compact"
        />
      );
      unmount();
    }

    const endTime = performance.now();
    const duration = endTime - startTime;

    // 渲染100个组件应该在合理时间内完成（比如500ms）
    expect(duration).toBeLessThan(500);
  });
});

describe('RotationEfficiencyCalculator 覆盖率优化', () => {
  // 这些测试用例专门用于提高 RotationEfficiencyCalculator 的覆盖率
  // 通过组件测试触发更多的代码路径

  it('应该处理翻译函数异常情况', () => {
    // 模拟翻译函数抛出异常的情况
    const originalUseTranslation = require('@/contexts/I18nContext').useTranslation;
    
    // 临时替换 useTranslation 来模拟翻译异常
    require('@/contexts/I18nContext').useTranslation = jest.fn(() => ({
      t: (key: string) => {
        if (key === 'rotation.perfect') {
          throw new Error('Translation error');
        }
        return key;
      },
      locale: 'zh-CN',
      changeLocale: jest.fn(),
      isLoading: false,
      getRandomCompletionMessage: () => '完成！'
    }));

    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    render(
      <RotationScoreDisplay
        actualRotations={10}
        minRotations={10}
        displayMode="desktop"
      />
    );

    // 应该回退到默认显示
    expect(screen.getByText(/10\/10/)).toBeInTheDocument();

    consoleSpy.mockRestore();
    // 恢复原始的 useTranslation
    require('@/contexts/I18nContext').useTranslation = originalUseTranslation;
  });

  it('应该处理数据验证边界情况', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    // 测试非整数值 - 这会触发数据验证失败的路径
    render(
      <RotationScoreDisplay
        actualRotations={10.5}
        minRotations={8.3}
        displayMode="desktop"
      />
    );

    // 应该显示错误状态，因为数据验证失败
    expect(screen.getByText('错误')).toBeInTheDocument();

    consoleSpy.mockRestore();
  });

  it('应该处理极端数值情况', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    // 测试超出范围的大数值 - 触发数据验证的边界检查
    render(
      <RotationScoreDisplay
        actualRotations={1001}
        minRotations={101}
        displayMode="desktop"
      />
    );

    // 应该显示错误状态，因为数值超出范围
    expect(screen.getByText('错误')).toBeInTheDocument();

    consoleSpy.mockRestore();
  });

  it('应该处理负数输入情况', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    // 测试负数输入 - 触发数据验证失败
    render(
      <RotationScoreDisplay
        actualRotations={-5}
        minRotations={-2}
        displayMode="desktop"
      />
    );

    // 应该显示错误状态，因为负数无效
    expect(screen.getByText('错误')).toBeInTheDocument();

    consoleSpy.mockRestore();
  });

  it('应该测试翻译函数返回非字符串值的情况', () => {
    // 模拟翻译函数返回非字符串值
    const originalUseTranslation = require('@/contexts/I18nContext').useTranslation;
    
    require('@/contexts/I18nContext').useTranslation = jest.fn(() => ({
      t: (key: string) => {
        if (key === 'rotation.perfect') {
          return null; // 返回非字符串值
        }
        return '完美';
      },
      locale: 'zh-CN',
      changeLocale: jest.fn(),
      isLoading: false,
      getRandomCompletionMessage: () => '完成！'
    }));

    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    render(
      <RotationScoreDisplay
        actualRotations={5}
        minRotations={5}
        displayMode="desktop"
      />
    );

    // 应该回退到默认显示
    expect(screen.getByText(/5\/5/)).toBeInTheDocument();

    consoleSpy.mockRestore();
    require('@/contexts/I18nContext').useTranslation = originalUseTranslation;
  });

  it('应该测试翻译函数返回空字符串的情况', () => {
    // 模拟翻译函数返回空字符串
    const originalUseTranslation = require('@/contexts/I18nContext').useTranslation;
    
    require('@/contexts/I18nContext').useTranslation = jest.fn(() => ({
      t: (key: string) => {
        if (key === 'rotation.perfect') {
          return ''; // 返回空字符串
        }
        return '完美';
      },
      locale: 'zh-CN',
      changeLocale: jest.fn(),
      isLoading: false,
      getRandomCompletionMessage: () => '完成！'
    }));

    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    render(
      <RotationScoreDisplay
        actualRotations={8}
        minRotations={8}
        displayMode="desktop"
      />
    );

    // 应该回退到默认显示
    expect(screen.getByText(/8\/8/)).toBeInTheDocument();

    consoleSpy.mockRestore();
    require('@/contexts/I18nContext').useTranslation = originalUseTranslation;
  });

  it('应该测试特殊边界条件组合', () => {
    // 测试 minRotations === 0 && actualRotations === 0 的特殊情况
    render(
      <RotationScoreDisplay
        actualRotations={0}
        minRotations={0}
        displayMode="desktop"
      />
    );

    expect(screen.getByText(/0\/0/)).toBeInTheDocument();
    expect(screen.getAllByText(/完美/)[0]).toBeInTheDocument(); // 使用getAllByText避免多个匹配的问题
  });

  it('应该测试minRotations为0但actualRotations大于0的情况', () => {
    // 测试 minRotations === 0 && actualRotations > 0 的情况
    render(
      <RotationScoreDisplay
        actualRotations={3}
        minRotations={0}
        displayMode="desktop"
      />
    );

    expect(screen.getByText(/3\/0/)).toBeInTheDocument();
    expect(screen.getAllByText(/超出3/)[0]).toBeInTheDocument(); // 使用getAllByText避免多个匹配的问题
  });

  it('应该测试formatDisplayTextWithI18n的异常处理', () => {
    // 模拟翻译函数在格式化时抛出异常
    const originalUseTranslation = require('@/contexts/I18nContext').useTranslation;
    
    require('@/contexts/I18nContext').useTranslation = jest.fn(() => ({
      t: (key: string, params?: Record<string, any>) => {
        if (key === 'rotation.perfect') {
          return '完美'; // 验证时返回有效值
        }
        if (key === 'rotation.excess') {
          throw new Error('Formatting error'); // 格式化时抛出异常
        }
        return key;
      },
      locale: 'zh-CN',
      changeLocale: jest.fn(),
      isLoading: false,
      getRandomCompletionMessage: () => '完成！'
    }));

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <RotationScoreDisplay
        actualRotations={12}
        minRotations={8}
        displayMode="desktop"
      />
    );

    // 应该回退到基本格式
    expect(screen.getByText(/12\/8/)).toBeInTheDocument();

    consoleSpy.mockRestore();
    require('@/contexts/I18nContext').useTranslation = originalUseTranslation;
  });

  it('应该测试翻译键值直接返回的情况', () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    // 通过多种异常情况触发不同的错误处理器方法
    const originalUseTranslation = require('@/contexts/I18nContext').useTranslation;
    
    // 测试翻译函数返回键值本身的情况
    require('@/contexts/I18nContext').useTranslation = jest.fn(() => ({
      t: (key: string) => {
        if (key === 'rotation.perfect') {
          return '完美'; // 验证时返回有效值
        }
        return key; // 其他情况返回key本身
      },
      locale: 'zh-CN',
      changeLocale: jest.fn(),
      isLoading: false,
      getRandomCompletionMessage: () => '完成！'
    }));

    render(
      <RotationScoreDisplay
        actualRotations={15}
        minRotations={10}
        displayMode="desktop"
      />
    );

    // 应该显示翻译键值
    expect(screen.getByText(/15\/10/)).toBeInTheDocument();
    expect(screen.getByText(/rotation\.excess/)).toBeInTheDocument();

    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    require('@/contexts/I18nContext').useTranslation = originalUseTranslation;
  });
});