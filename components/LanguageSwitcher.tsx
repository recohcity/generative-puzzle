"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Globe, ChevronDown, Languages } from "lucide-react";
import { useTranslation } from '@/contexts/I18nContext';
import { SUPPORTED_LOCALES, SupportedLocale } from '@/src/i18n/config';
import { playButtonClickSound } from '@/utils/rendering/soundEffects';

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

  const buttonStyle = {
    width: size === 'small' ? '26px' : '32px',
    height: size === 'small' ? '26px' : '32px',
    borderRadius: '16px',
    minWidth: size === 'small' ? '26px' : '32px',
    minHeight: size === 'small' ? '26px' : '32px',
    padding: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#1E1A2A',
    boxShadow: 'none',
    border: 'none',
    color: '#F68E5F',
    opacity: isLoading ? 0.5 : 1,
    position: 'relative' as const,
  };

  const dropdownStyle = {
    position: 'absolute' as const,
    top: '100%',
    right: 0,
    marginTop: '4px',
    background: '#1E1A2A',
    border: '1px solid #463E50',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
    zIndex: 1000,
    minWidth: variant === 'iconOnly' ? '80px' : '120px',
  };

  const optionStyle = {
    padding: variant === 'iconOnly' ? '8px' : '8px 12px',
    fontSize: '14px',
    color: '#FFD5AB',
    cursor: 'pointer',
    borderBottom: '1px solid #463E50',
    transition: 'background-color 0.2s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: variant === 'iconOnly' ? 'center' : 'flex-start',
  };

  const activeOptionStyle = {
    ...optionStyle,
    background: '#F68E5F',
    color: 'white',
  };

  // iconOnly 变体 - 直接切换模式（优化后）
  if (variant === 'iconOnly') {
    const buttonWidth = 26;
    
    // 获取下一个语言
    const getNextLocale = (currentLocale: SupportedLocale): SupportedLocale => {
      const locales = Object.keys(SUPPORTED_LOCALES) as SupportedLocale[];
      const currentIndex = locales.indexOf(currentLocale);
      const nextIndex = (currentIndex + 1) % locales.length;
      return locales[nextIndex];
    };
    
    const nextLocale = getNextLocale(locale);
    
    return (
      <div 
        className={`relative ${className}`} 
        style={{
          width: `${buttonWidth}px`,
          height: `${buttonWidth}px`,
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
            
            console.log('Direct language switch clicked, current:', locale, 'switching to:', nextLocale);
            
            if (!isLoading) {
              try {
                await changeLocale(nextLocale);
                console.log('Language switched successfully to:', nextLocale);
              } catch (error) {
                console.error('Failed to switch language:', error);
              }
            }
          }}
          disabled={isLoading}
          variant="ghost"
          size="icon"
          className="rounded-full text-[#F68E5F] bg-[#1E1A2A] hover:bg-[#141022] active:bg-[#2A283E] transition-all duration-200 border-none shadow-none cursor-pointer"
          style={{
            width: `${buttonWidth}px`,
            height: `${buttonWidth}px`,
            borderRadius: '50%',
            minWidth: `${buttonWidth}px`,
            minHeight: `${buttonWidth}px`,
            padding: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'none',
            border: 'none',
            opacity: isLoading ? 0.5 : 1,
          }}
          data-testid="language-switcher-button"
          title={`当前: ${SUPPORTED_LOCALES[locale]} → 点击切换到: ${SUPPORTED_LOCALES[nextLocale]}`}
          suppressHydrationWarning
        >
          <span 
            style={{ 
              fontSize: '10px', 
              fontWeight: 'bold',
              fontFamily: 'monospace'
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
          className="text-[#F68E5F] bg-[#1E1A2A] hover:bg-[#141022] active:bg-[#2A283E] transition-colors border-none shadow-none"
          style={{
            fontSize,
            padding: '4px 8px',
            height: 'auto',
            borderRadius: '8px',
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
        className={`rounded-full ${buttonSize} text-[#F68E5F] bg-[#1E1A2A] hover:bg-[#141022] active:bg-[#2A283E] transition-colors border-none shadow-none`}
        style={buttonStyle}
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