import type React from "react"
import "@/app/globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import EnvModeClient from "@/components/EnvModeClient"

const inter = Inter({ subsets: ["latin"] })

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
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover"
        />
        {/* 小尺寸 PNG - 浏览器标签页（优先使用，文件更小） */}
        <link rel="icon" href="/icon-16.png" type="image/png" sizes="16x16" />
        <link rel="icon" href="/icon-32.png" type="image/png" sizes="32x32" />
        {/* Favicon - ICO 格式作为后备，确保传统浏览器兼容性 */}
        <link rel="icon" href="/icon.ico" sizes="any" />
        <link rel="shortcut icon" href="/icon.ico" type="image/x-icon" />
        {/* 大尺寸 PNG - 高分辨率显示 */}
        <link rel="icon" href="/icon-192.png" type="image/png" sizes="192x192" />
        <link rel="icon" href="/icon-512.png" type="image/png" sizes="512x512" />
        {/* Apple Touch Icon - 使用精确尺寸 PNG */}
        <link rel="apple-touch-icon" href="/icon-180.png" sizes="180x180" />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <EnvModeClient />
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}