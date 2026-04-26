'use client'
import { useEffect } from 'react'

/**
 * FontScaleLock — 安卓微信/系统字体缩放终极防御组件
 * 
 * 原理：通过 MutationObserver 实时监听 <html> 的 style 属性变化，
 * 一旦检测到系统或微信偷偷修改了根字号，立即强制回滚为 16px。
 * 仅在页面初始化和屏幕旋转时执行重置，拖拽/输入期间不干预。
 */
export default function FontScaleLock({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const ua = navigator.userAgent
    const isMobile = /Mobile|Android|iPhone|iPad|iPod/i.test(ua)
    if (!isMobile) return

    let isResetting = false

    const resetFontScale = () => {
      if (isResetting) return
      const activeEl = document.activeElement
      if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) return
      if (document.querySelector('.dragging-active')) return

      isResetting = true
      
      // 检测真实的 textZoom 缩放比例
      const testEl = document.createElement('div')
      testEl.style.cssText = 'position:fixed;top:-9999px;left:-9999px;font-size:100px;line-height:1;margin:0;padding:0;visibility:hidden;'
      testEl.innerHTML = 'M'
      document.body.appendChild(testEl)
      
      const realSize = testEl.clientHeight
      document.body.removeChild(testEl)
      
      const html = document.documentElement
      
      // 如果真实字号被系统放大了（比如 100px 变成了 120px+）
      if (realSize > 105 || realSize < 95) {
        const scale = 100 / realSize
        
        // 方法 1：设置全局 CSS 变量供特定元素使用
        html.style.setProperty('--text-zoom-scale', scale.toString())
        
        // 方法 2：尝试使用 -webkit-text-size-adjust 覆盖
        html.style.setProperty('-webkit-text-size-adjust', '100%', 'important')
        html.style.setProperty('text-size-adjust', '100%', 'important')
        
        // 方法 3：强制计算反向 rem 根字号
        const currentStyleSize = parseFloat(html.style.fontSize) || 16
        html.style.setProperty('font-size', `${currentStyleSize * scale}px`, 'important')
      } else {
        html.style.setProperty('--text-zoom-scale', '1')
      }
      
      if (!html.style.lineHeight) {
        html.style.setProperty('line-height', '1.15')
      }
      requestAnimationFrame(() => { isResetting = false })
    }

    // 首次加载立即重置
    resetFontScale()

    // 仅在屏幕旋转时重置
    const handleOrientationChange = () => {
      setTimeout(resetFontScale, 100)
      setTimeout(resetFontScale, 300)
    }
    window.addEventListener('orientationchange', handleOrientationChange)

    // MutationObserver：安卓端拦截系统/微信偷改 html style
    let observer: MutationObserver | null = null
    if (/android/i.test(ua)) {
      observer = new MutationObserver(() => {
        if (isResetting) return
        const activeEl = document.activeElement
        if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) return
        if (document.querySelector('.dragging-active')) return
        resetFontScale()
      })
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['style']
      })
    }

    return () => {
      window.removeEventListener('orientationchange', handleOrientationChange)
      observer?.disconnect()
    }
  }, [])

  return <>{children}</>
}
