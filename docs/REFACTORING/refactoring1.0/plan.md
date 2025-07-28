


Based on my analysis of the codebase, here's a comprehensive refactoring plan to address the identified architectural conflicts:

## 1. Unify Device Detection

The current codebase has multiple conflicting device detection implementations that need to be unified:

**Current Issues:**
useDeviceDetection.ts:12-31
use-mobile.tsx:5-19
canvasAdaptation.ts:385-447

**Refactoring Plan:**
Create a unified `DeviceManager` class that consolidates all device detection logic. This should replace the three separate implementations and provide a single source of truth for:
- User agent detection
- Screen dimension analysis
- Media query matching
- iPhone 16 series specific detection
- Orientation change handling

## 2. Centralize Canvas Management

Canvas management is currently scattered across multiple files, creating coordination issues:

**Current Issues:**
useResponsiveCanvasSizing.ts:23-152
PuzzleCanvas.tsx:53-86
GameContext.tsx:236-238

**Refactoring Plan:**
Create a centralized `CanvasManager` that:
- Manages canvas references through a single provider
- Handles all canvas sizing calculations
- Coordinates between main canvas and background canvas
- Provides unified canvas state to all components
- Implements consistent boundary checking logic as shown in GameContext.tsx:578-757

## 3. Optimize Event Listening

Multiple components are adding redundant event listeners, causing performance issues:

**Current Issues:**
useDeviceDetection.ts:36-54
useResponsiveCanvasSizing.ts:120-149
PuzzleCanvas.tsx:67-84
GameInterface.tsx:92-99

**Refactoring Plan:**
Implement a centralized `EventManager` with:
- Single resize/orientationchange listener at the app level
- Event delegation pattern for distributing resize events
- Debounced event handling to prevent excessive updates
- Cleanup management for all event listeners
- Priority-based event handling for different component needs

## 4. Unify Adaptation Parameters

Adaptation logic is fragmented across multiple files with inconsistent parameters:

**Current Issues:**
canvasAdaptation.ts:6-49
usePuzzleAdaptation.ts:20-92
GameContext.tsx:189-205

**Refactoring Plan:**
Create a unified `AdaptationEngine` that:
- Consolidates all adaptation constants into a single configuration object
- Implements consistent scaling algorithms across all components
- Provides device-specific adaptation strategies
- Handles puzzle piece position normalization and restoration
- Manages canvas size transitions smoothly

## Implementation Architecture

**Proposed Structure:**
```
core/
├── DeviceManager.ts          // Unified device detection
├── CanvasManager.ts          // Centralized canvas management  
├── EventManager.ts           // Optimized event handling
├── AdaptationEngine.ts       // Unified adaptation logic
└── index.ts                  // Core system exports

providers/
├── SystemProvider.tsx        // Top-level system integration
└── hooks/
    ├── useDevice.ts          // Unified device hook
    ├── useCanvas.ts          // Centralized canvas hook
    └── useAdaptation.ts      // Unified adaptation hook
```

**Integration Points:**
- Replace existing device detection hooks with unified `useDevice`
- Migrate canvas sizing logic to centralized `CanvasManager`
- Remove duplicate event listeners and use centralized `EventManager`
- Consolidate adaptation parameters through `AdaptationEngine`

**Migration Strategy:**
1. Create core managers without breaking existing functionality
2. Gradually migrate components to use new unified APIs
3. Remove deprecated implementations after migration is complete
4. Add comprehensive tests for the new unified system

This refactoring will eliminate architectural conflicts, improve performance by reducing redundant event listeners, and provide a more maintainable codebase with clear separation of concerns.

## Notes

The current system shows evidence of organic growth where similar functionality was implemented multiple times across different components. The proposed refactoring creates clear architectural boundaries and single responsibilities for each system component, which will make the codebase more maintainable and reduce bugs related to inconsistent device detection and canvas management.
