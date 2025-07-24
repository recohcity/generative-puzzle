import type React from "react"
import "@/app/globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { useEffect } from "react"
import EnvModeClient from "@/components/EnvModeClient"
import { SystemProvider } from "@/providers/SystemProvider";

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "生成式拼图游戏",
  description: "一个基于Next.js和React的生成式拼图游戏项目",
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
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className={inter.className}>
        <EnvModeClient />
        <SystemProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            {children}
          </ThemeProvider>
        </SystemProvider>
      </body>
    </html>
  )
}

