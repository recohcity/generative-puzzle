"use client"

import CurveTestOptimized from "@/curve-test-optimized"
// Removed PuzzleAnalysis import
// import PuzzleAnalysis from "@/curve-test-analysis"
// Removed useState import as it's no longer needed
// import { useState } from "react"

export default function PuzzleTestPage() {
  // Removed showAnalysis state
  // const [showAnalysis, setShowAnalysis] = useState(false)

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-200 flex flex-col items-center justify-center">
      {/* Removed conditional rendering logic */}
      <CurveTestOptimized />
    </main>
  )
}

