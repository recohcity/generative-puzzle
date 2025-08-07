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

  // iconOnly 变体 - 完全图标化的语言切换器（横向展开）
  if (variant === 'iconOnly') {
    // 使用与其他工具按钮一致的大小：26px
    const buttonWidth = 26;
    const buttonGap = 8;
    const languageCount = Object.keys(SUPPORTED_LOCALES).length;
    const totalWidth = isOpen ? (languageCount * buttonWidth + (languageCount - 1) * buttonGap) : buttonWidth;
    
    return (
      <div 
        className={`relative ${className}`} 
        style={{
          width: `${totalWidth}px`,
          height: `${buttonWidth}px`,
          transition: 'width 0.3s ease-in-out',
          display: 'flex',
          justifyContent: 'flex-end', // 确保从右侧开始布局
          alignItems: 'center',
        }}
        suppressHydrationWarning
      >
        {/* 展开状态：显示所有语言选项 */}
        {isOpen ? (
          <div 
            style={{
              display: 'flex',
              gap: `${buttonGap}px`,
              alignItems: 'center',
              width: '100%',
              justifyContent: 'flex-end', // 从右侧对齐
            }}
            suppressHydrationWarning
          >
            {Object.entries(SUPPORTED_LOCALES).reverse().map(([code, name]) => (
              <Button
                key={code}
                onClick={async (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  
                  // 播放按钮点击音效
                  try {
                    await playButtonClickSound();
                  } catch (error) {
                    console.error('Failed to play button click sound:', error);
                  }
                  
                  console.log('Language button clicked:', code, 'current locale:', locale);
                  if (code !== locale && !isLoading) {
                    console.log('Changing locale to:', code);
                    try {
                      await changeLocale(code as SupportedLocale);
                      console.log('Locale changed successfully');
                    } catch (error) {
                      console.error('Failed to change locale:', error);
                    }
                  }
                  setIsOpen(false);
                }}
                variant="ghost"
                size="icon"
                className={`rounded-full border-none shadow-none transition-all duration-200 cursor-pointer ${
                  code === locale 
                    ? 'bg-[#F68E5F] text-white' 
                    : 'bg-[#1E1A2A] text-[#F68E5F] hover:bg-[#463E50] active:bg-[#2A283E]'
                }`}
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
                  zIndex: 1001, // 确保在点击外部关闭层之上
                  position: 'relative',
                  cursor: 'pointer',
                }}
                data-testid={`language-option-${code}`}
                title={name}
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
                  {getLanguageIcon(code as SupportedLocale)}
                </span>
              </Button>
            ))}
          </div>
        ) : (
          /* 收起状态：只显示当前语言 */
          <Button
            onClick={async () => {
              // 播放按钮点击音效
              try {
                await playButtonClickSound();
              } catch (error) {
                console.error('Failed to play button click sound:', error);
              }
              setIsOpen(true);
            }}
            disabled={isLoading}
            variant="ghost"
            size="icon"
            className={`rounded-full text-[#F68E5F] bg-[#1E1A2A] hover:bg-[#141022] active:bg-[#2A283E] transition-colors border-none shadow-none`}
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
            }}
            data-testid="language-switcher-button"
            title={`当前语言: ${SUPPORTED_LOCALES[locale]}`}
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
        )}
        
        {/* 点击外部关闭展开状态 */}
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
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('Clicking outside, closing language switcher');
              setIsOpen(false);
            }}
          />
        )}
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