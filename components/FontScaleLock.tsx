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
      // 拖拽中或输入框聚焦时不干预，防止画布跳动和输入闪烁
      const activeEl = document.activeElement
      if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) return
      if (document.querySelector('.dragging-active')) return

      isResetting = true
      const html = document.documentElement
      const computedSize = window.getComputedStyle(html).fontSize
      if (computedSize !== '16px') {
        html.style.setProperty('font-size', '16px', 'important')
      }
      // 同时锁定行高基准，防止安卓系统缩放默认行高
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
