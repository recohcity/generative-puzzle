# Migration Guide: Unified Architecture Refactoring

This guide outlines the step-by-step migration from the current fragmented architecture to the new unified system.

## Overview

The refactoring consolidates multiple conflicting implementations into unified core managers:

- **DeviceManager**: Replaces `useDeviceDetection.ts`, `use-mobile.tsx`, and device detection in `canvasAdaptation.ts`
- **CanvasManager**: Centralizes canvas management from `useResponsiveCanvasSizing.ts` and `PuzzleCanvas.tsx`
- **EventManager**: Eliminates redundant event listeners across multiple components
- **AdaptationEngine**: Unifies adaptation logic from `canvasAdaptation.ts`, `usePuzzleAdaptation.ts`, and `GameContext.tsx`

## Migration Steps

### Step 1: Install Core System

1. Add the `SystemProvider` to your app root:

```tsx
// app/layout.tsx or your root component
import { SystemProvider } from '@/providers/SystemProvider';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <SystemProvider>
          {children}
        </SystemProvider>
      </body>
    </html>
  );
}
```

### Step 2: Replace Device Detection

**Before:**
```tsx
import { useDeviceDetection } from '@/hooks/useDeviceDetection';
import { useIsMobile } from '@/hooks/use-mobile';

const { isMobile, isPortrait, screenWidth, screenHeight } = useDeviceDetection();
const isMobileBreakpoint = useIsMobile();
```

**After:**
```tsx
import { useDevice } from '@/providers/hooks';

const { isMobile, isTablet, isDesktop, isPortrait, deviceType, layoutMode } = useDevice();
```

### Step 3: Replace Canvas Management

**Before:**
```tsx
import { useResponsiveCanvasSizing } from '@/hooks/useResponsiveCanvasSizing';

const canvasSize = useResponsiveCanvasSizing({
  containerRef,
  canvasRef,
  backgroundCanvasRef,
});
```

**After:**
```tsx
import { useCanvas, useCanvasBounds } from '@/providers/hooks';

const canvasSize = useCanvas({
  containerRef,
  canvasRef,
  backgroundCanvasRef,
});

const { isPointInBounds, clampToBounds } = useCanvasBounds();
```

### Step 4: Replace Adaptation Logic

**Before:**
```tsx
import { usePuzzleAdaptation } from '@/hooks/usePuzzleAdaptation';
import { useShapeAdaptation } from '@/hooks/useShapeAdaptation';

usePuzzleAdaptation(canvasSize);
useShapeAdaptation(canvasSize, baseShape, baseCanvasSize, onAdapted);
```

**After:**
```tsx
import { usePuzzleAdaptation, useShapeAdaptation } from '@/providers/hooks';

usePuzzleAdaptation(
  canvasSize,
  puzzle,
  originalPositions,
  completedPieces,
  previousCanvasSize,
  onAdapted
);

useShapeAdaptation(canvasSize, baseShape, baseCanvasSize, onAdapted);
```

### Step 5: Remove Event Listeners

**Before:**
```tsx
useEffect(() => {
  const handleResize = () => { /* ... */ };
  window.addEventListener('resize', handleResize);
  window.addEventListener('orientationchange', handleResize);
  
  return () => {
    window.removeEventListener('resize', handleResize);
    window.removeEventListener('orientationchange', handleResize);
  };
}, []);
```

**After:**
```tsx
// Event handling is now automatic through the SystemProvider
// No manual event listeners needed
```

## Component Updates

### PuzzleCanvas.tsx

```tsx
// Replace multiple hooks with unified system
import { useDevice, useCanvas, useAdaptation } from '@/providers/hooks';

export default function PuzzleCanvas() {
  const device = useDevice();
  const canvasSize = useCanvas({ containerRef, canvasRef, backgroundCanvasRef });
  const { adaptPuzzlePieces } = useAdaptation({
    canvasSize,
    onPuzzleAdapted: (pieces) => dispatch({ type: 'UPDATE_PUZZLE', payload: pieces })
  });

  // Remove manual event listeners and resize handling
  // The unified system handles this automatically
}
```

### GameInterface.tsx

```tsx
// Replace device detection
import { useDevice } from '@/providers/hooks';

export default function GameInterface() {
  const { deviceType, layoutMode } = useDevice();
  
  // Use deviceType and layoutMode instead of multiple boolean flags
  const isMobileLayout = deviceType === 'phone';
  const isLandscapeLayout = layoutMode === 'landscape';
}
```

## Backward Compatibility

The new system provides backward compatibility exports:

```tsx
// These still work during migration
export { useDeviceDetection, useIsMobile } from '@/providers/hooks';
```

## Testing Migration

1. **Unit Tests**: Update imports to use new hooks
2. **Integration Tests**: Verify device detection and canvas sizing work correctly
3. **E2E Tests**: Ensure puzzle adaptation and interaction still function

## Performance Benefits

- **Reduced Event Listeners**: From ~12 listeners to 3 global listeners
- **Eliminated Redundant Calculations**: Single device detection instead of multiple
- **Optimized Rendering**: Centralized canvas management reduces unnecessary updates
- **Memory Efficiency**: Singleton pattern reduces object creation

## Rollback Plan

If issues arise during migration:

1. Keep old files temporarily with `.deprecated` extension
2. Use feature flags to switch between old/new systems
3. Gradual component-by-component migration
4. Full rollback by reverting imports and removing SystemProvider

## Validation Checklist

- [ ] Device detection works on all target devices
- [ ] Canvas sizing adapts correctly on resize/orientation change
- [ ] Puzzle pieces maintain position during adaptation
- [ ] No memory leaks from event listeners
- [ ] Performance improvements are measurable
- [ ] All existing functionality preserved
- [ ] Tests pass with new system

## Next Steps

After successful migration:

1. Remove deprecated files
2. Update documentation
3. Add new features using unified system
4. Monitor performance improvements
5. Consider additional optimizations