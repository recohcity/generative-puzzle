/**
 * UnifiedSystemDemo - Demonstration of the new unified architecture
 * Shows how to use the consolidated device detection, canvas management, and adaptation
 */

"use client";

import React, { useRef, useEffect, useState } from 'react';
import { useDevice, useCanvas, useAdaptation } from '@/providers/hooks';

export const UnifiedSystemDemo: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const backgroundCanvasRef = useRef<HTMLCanvasElement>(null);

  // Unified device detection - replaces multiple hooks
  const device = useDevice();

  // Unified canvas management - replaces useResponsiveCanvasSizing
  const canvasSize = useCanvas({
    containerRef,
    canvasRef,
    backgroundCanvasRef
  });

  // Unified adaptation system
  const { calculateOptimalCanvasSize, adaptShape } = useAdaptation({
    canvasSize,
    onShapeAdapted: (shape) => console.log('Shape adapted:', shape.length, 'points')
  });

  const [demoShape, setDemoShape] = useState<Array<{x: number, y: number}>>([]);

  // Generate a demo shape
  useEffect(() => {
    if (canvasSize.width > 0 && canvasSize.height > 0) {
      const centerX = canvasSize.width / 2;
      const centerY = canvasSize.height / 2;
      const radius = Math.min(canvasSize.width, canvasSize.height) * 0.2;

      const shape = [];
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        shape.push({
          x: centerX + Math.cos(angle) * radius,
          y: centerY + Math.sin(angle) * radius
        });
      }
      setDemoShape(shape);
    }
  }, [canvasSize]);

  // Draw the demo
  useEffect(() => {
    if (!canvasRef.current || demoShape.length === 0) return;

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvasSize.width, canvasSize.height);

    // Draw background
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, canvasSize.width, canvasSize.height);

    // Draw demo shape
    ctx.beginPath();
    ctx.moveTo(demoShape[0].x, demoShape[0].y);
    for (let i = 1; i < demoShape.length; i++) {
      ctx.lineTo(demoShape[i].x, demoShape[i].y);
    }
    ctx.closePath();
    ctx.fillStyle = '#4CAF50';
    ctx.fill();
    ctx.strokeStyle = '#2E7D32';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw info text
    ctx.fillStyle = '#333';
    ctx.font = '14px Arial';
    ctx.fillText(`Device: ${device.deviceType} (${device.layoutMode})`, 10, 25);
    ctx.fillText(`Canvas: ${canvasSize.width}x${canvasSize.height}`, 10, 45);
    ctx.fillText(`Screen: ${device.screenWidth}x${device.screenHeight}`, 10, 65);
  }, [canvasSize, demoShape, device]);

  return (
    <div className="unified-system-demo p-4 border rounded-lg">
      <h3 className="text-lg font-semibold mb-4">Unified System Demo</h3>
      
      {/* Device Information */}
      <div className="mb-4 p-3 bg-gray-100 rounded">
        <h4 className="font-medium mb-2">Device Detection (Unified)</h4>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>Type: {device.deviceType}</div>
          <div>Layout: {device.layoutMode}</div>
          <div>Mobile: {device.isMobile ? 'Yes' : 'No'}</div>
          <div>Portrait: {device.isPortrait ? 'Yes' : 'No'}</div>
          <div>Screen: {device.screenWidth}×{device.screenHeight}</div>
          <div>Platform: {device.isIOS ? 'iOS' : device.isAndroid ? 'Android' : 'Other'}</div>
        </div>
      </div>

      {/* Canvas Demo */}
      <div className="mb-4">
        <h4 className="font-medium mb-2">Canvas Management (Unified)</h4>
        <div 
          ref={containerRef}
          className="border border-gray-300 rounded"
          style={{ width: '100%', height: '300px' }}
        >
          <canvas
            ref={backgroundCanvasRef}
            style={{ position: 'absolute', width: '100%', height: '100%' }}
            width={canvasSize.width}
            height={canvasSize.height}
          />
          <canvas
            ref={canvasRef}
            style={{ position: 'relative', width: '100%', height: '100%' }}
            width={canvasSize.width}
            height={canvasSize.height}
          />
        </div>
        <div className="text-sm text-gray-600 mt-2">
          Canvas automatically resizes and adapts to container changes
        </div>
      </div>

      {/* Benefits */}
      <div className="p-3 bg-green-50 rounded">
        <h4 className="font-medium mb-2 text-green-800">Architecture Benefits</h4>
        <ul className="text-sm text-green-700 space-y-1">
          <li>✅ Single device detection system (was 3 separate implementations)</li>
          <li>✅ Centralized canvas management (eliminates coordination issues)</li>
          <li>✅ Optimized event handling (3 global listeners vs ~12 component listeners)</li>
          <li>✅ Unified adaptation logic (consistent scaling algorithms)</li>
          <li>✅ Better performance and memory efficiency</li>
        </ul>
      </div>
    </div>
  );
};