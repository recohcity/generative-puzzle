import type React from "react"
import "@/app/globals.css"
import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/contexts/AuthContext"
import EnvModeClient from "@/components/EnvModeClient"
import { SpeedInsights } from "@vercel/speed-insights/next"

const inter = Inter({ 
  subsets: ["latin"],
  display: 'swap',
  adjustFontFallback: true,
})

export const metadata: Metadata = {
  title: "生成式拼图游戏",
  description: "一个基于Next.js和React的生成式拼图游戏项目",
  icons: {
    icon: [
      // 小尺寸 PNG - 浏览器标签页（优先使用，文件更小，显示更清晰）
      { url: '/icon-16.png', sizes: '16x16', type: 'image/png' },
      { url: '/icon-32.png', sizes: '32x32', type: 'image/png' },
      // ICO 格式 - 传统浏览器兼容（作为后备）
      { url: '/icon.ico', sizes: 'any' },
      { url: '/icon.ico', type: 'image/x-icon' },
      // 大尺寸 PNG - 高分辨率显示
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icon-180.png', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: '/icon.ico',
  },
  openGraph: {
    title: "生成式拼图游戏",
    description: "一个基于Next.js和React的生成式拼图游戏项目",
    type: "website",
    images: [
      {
        url: '/icon-1024.png',
        width: 1024,
        height: 1024,
        alt: '生成式拼图游戏',
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "生成式拼图游戏",
    description: "一个基于Next.js和React的生成式拼图游戏项目",
    images: ['/icon-1024.png'],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: '生成式拼图游戏',
  },
  manifest: '/manifest.json',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}

declare global {
  interface Window {
    __ENV_MODE__?: string;
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <EnvModeClient />
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <AuthProvider>
            {children}
            <SpeedInsights />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}