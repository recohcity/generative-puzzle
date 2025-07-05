"use client";
import { useEffect } from "react";

declare global {
  interface Window {
    __ENV_MODE__?: string;
  }
}

export default function EnvModeClient() {
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.__ENV_MODE__ = process.env.NODE_ENV || "unknown";
    }
  }, []);
  return null;
} 