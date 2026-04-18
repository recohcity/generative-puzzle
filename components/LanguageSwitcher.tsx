"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Globe, ChevronDown } from "lucide-react";
import { useTranslation } from '@/contexts/I18nContext';
import { SUPPORTED_LOCALES, SupportedLocale } from '@/src/i18n/config';
import { playButtonClickSound } from '@/utils/rendering/soundEffects';
import { cn } from "@/lib/utils";

interface LanguageSwitcherProps {
  variant?: 'icon' | 'text' | 'full' | 'iconOnly';
  size?: 'small' | 'default';
  className?: string;
}

// 语言图标映射
const getLanguageIcon = (locale: SupportedLocale) => {
  switch (locale) {
    case 'zh-CN':
      return '中';
    case 'en':
      return 'EN';
    default:
      return 'EN';
  }
};

const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  variant = 'icon',
  size = 'default',
  className = ''
}) => {
  const { locale, changeLocale, isLoading } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const handleLocaleChange = async (newLocale: SupportedLocale) => {
    if (newLocale !== locale && !isLoading) {
      await changeLocale(newLocale);
      setIsOpen(false);
    }
  };

  const buttonSize = size === 'small' ? 'w-6 h-6' : 'w-8 h-8';
  const iconSize = size === 'small' ? 12 : 16;
  const fontSize = size === 'small' ? '12px' : '14px';

  const buttonDim = size === 'small' ? 26 : 32;
  const buttonStyle = {
    width: `calc(var(--panel-scale, 1) * ${buttonDim}px)`,
    height: `calc(var(--panel-scale, 1) * ${buttonDim}px)`,
    borderRadius: `calc(var(--panel-scale, 1) * 16px)`,
    minWidth: `calc(var(--panel-scale, 1) * ${buttonDim}px)`,
    minHeight: `calc(var(--panel-scale, 1) * ${buttonDim}px)`,
    padding: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: 'none',
    border: 'none',
    opacity: isLoading ? 0.5 : 1,
    position: 'relative' as const,
    transition: 'all 0.3s ease',
  };

  const dropdownStyle = {
    position: 'absolute' as const,
    top: '120%',
    right: 0,
    background: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(16px)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '12px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
    zIndex: 1000,
    minWidth: variant === 'iconOnly' ? '80px' : '120px',
    overflow: 'hidden',
  };

  const optionStyle = {
    padding: variant === 'iconOnly' ? '8px' : '8px 16px',
    fontSize: '13px',
    color: '#FFD5AB',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: variant === 'iconOnly' ? 'center' : 'flex-start',
    fontWeight: 500,
  };

  const activeOptionStyle = {
    ...optionStyle,
    background: 'linear-gradient(135deg, #FFD5AB 0%, #F68E5F 100%)',
    color: '#232035',
    fontWeight: 700,
  };

  // iconOnly 变体 - 直接切换模式（优化后）
  if (variant === 'iconOnly') {
    const nextLocale = (() => {
      const locales = Object.keys(SUPPORTED_LOCALES) as SupportedLocale[];
      const currentIndex = locales.indexOf(locale);
      const nextIndex = (currentIndex + 1) % locales.length;
      return locales[nextIndex];
    })();

    const buttonSizePx = `calc(var(--panel-scale, 1) * 26px)`;

    return (
      <div
        className={`relative ${className}`}
        style={{
          width: buttonSizePx,
          height: buttonSizePx,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        suppressHydrationWarning
      >
        <Button
          onClick={async (e) => {
            e.preventDefault();
            e.stopPropagation();

            // 播放按钮点击音效
            try {
              await playButtonClickSound();
            } catch (error) {
              console.error('Failed to play button click sound:', error);
            }

            // console.log('Direct language switch clicked, current:', locale, 'switching to:', nextLocale);

            if (!isLoading) {
              try {
                await changeLocale(nextLocale);
                // console.log('Language switched successfully to:', nextLocale);
              } catch (error) {
                console.error('Failed to switch language:', error);
              }
            }
          }}
          disabled={isLoading}
          variant="ghost"
          size="icon"
          className={cn("rounded-full border-none shadow-none cursor-pointer language-button-fixed glass-btn-inactive")}
            style={{
              width: buttonSizePx,
              height: buttonSizePx,
              borderRadius: '50%',
              minWidth: buttonSizePx,
              minHeight: buttonSizePx,
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'none',
              border: 'none',
              opacity: isLoading ? 0.5 : 1,
              transition: 'all 0.3s ease',
              WebkitTapHighlightColor: 'transparent',
              WebkitTouchCallout: 'none',
              WebkitUserSelect: 'none',
              userSelect: 'none',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              color: '#FFB17A',
            }}
          data-testid="language-switcher-button"
          title={`当前: ${SUPPORTED_LOCALES[locale]} → 点击切换到: ${SUPPORTED_LOCALES[nextLocale]}`}
          suppressHydrationWarning
        >
          <span
            style={{
              fontSize: '11px',
              fontWeight: 'bold',
              fontFamily: 'system-ui, sans-serif',
              color: 'inherit',
              pointerEvents: 'none',
            }}
            suppressHydrationWarning
          >
            {getLanguageIcon(locale)}
          </span>
        </Button>
      </div>
    );
  }

  if (variant === 'text') {
    return (
      <div className={`relative ${className}`}>
        <Button
          onClick={() => setIsOpen(!isOpen)}
          disabled={isLoading}
          variant="ghost"
          className="text-[#FFB17A] glass-btn-inactive transition-all border-none shadow-none"
          style={{
            fontSize,
            padding: '4px 12px',
            height: 'auto',
            borderRadius: '12px',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
          }}
          data-testid="language-switcher-button"
        >
          <span>{SUPPORTED_LOCALES[locale]}</span>
          <ChevronDown
            width={12}
            height={12}
            style={{ marginLeft: '4px', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
          />
        </Button>

        {isOpen && (
          <div style={dropdownStyle}>
            {Object.entries(SUPPORTED_LOCALES).map(([code, name]) => (
              <div
                key={code}
                style={code === locale ? activeOptionStyle : optionStyle}
                onClick={() => handleLocaleChange(code as SupportedLocale)}
                onMouseEnter={(e) => {
                  if (code !== locale) {
                    (e.target as HTMLElement).style.backgroundColor = '#463E50';
                  }
                }}
                onMouseLeave={(e) => {
                  if (code !== locale) {
                    (e.target as HTMLElement).style.backgroundColor = 'transparent';
                  }
                }}
                data-testid={`language-option-${code}`}
              >
                {name}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <Button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
        variant="ghost"
        size="icon"
        className={cn(`rounded-full ${buttonSize} glass-btn-inactive transition-all border-none shadow-none`)}
        style={{
            ...buttonStyle,
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            color: '#FFB17A',
        }}
        data-testid="language-switcher-button"
        title={`当前语言: ${SUPPORTED_LOCALES[locale]}`}
      >
        <Globe width={iconSize} height={iconSize} strokeWidth={2} />
      </Button>

      {isOpen && (
        <div style={dropdownStyle}>
          {Object.entries(SUPPORTED_LOCALES).map(([code, name]) => (
            <div
              key={code}
              style={code === locale ? activeOptionStyle : optionStyle}
              onClick={() => handleLocaleChange(code as SupportedLocale)}
              onMouseEnter={(e) => {
                if (code !== locale) {
                  (e.target as HTMLElement).style.backgroundColor = '#463E50';
                }
              }}
              onMouseLeave={(e) => {
                if (code !== locale) {
                  (e.target as HTMLElement).style.backgroundColor = 'transparent';
                }
              }}
              data-testid={`language-option-${code}`}
            >
              {name}
            </div>
          ))}
        </div>
      )}

      {/* 点击外部关闭下拉菜单 */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 999,
          }}
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default LanguageSwitcher;