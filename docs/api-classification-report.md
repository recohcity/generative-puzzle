# API分类报告

> 生成时间: 2025/8/7 19:53:55
> 分类工具: API分类器 v1.0

## 📊 分类统计

| 分类 | 数量 | 占比 | 优先级 | 建议 |
|------|------|------|--------|------|
| PUBLIC | 6 | 4.9% | 1 | 必须文档化 |
| TEAM | 18 | 14.8% | 2 | 建议文档化 |
| INTERNAL | 98 | 80.3% | 3 | 选择性文档化 |

## 📋 详细分类

### PUBLIC (优先级1)

**描述**: 对外暴露的核心功能API

**API列表** (6个):

- `UNIFIED_CONFIG`
- `DEVICE_THRESHOLDS`
- `EventManager`
- `isPointInPolygon`
- `rotatePoint`
- `calculateAngle`

### TEAM (优先级2)

**描述**: 团队内部共享的工具和服务

**API列表** (18个):

- `PERFORMANCE_THRESHOLDS`
- `ERROR_HANDLING`
- `LOGGING_CONFIG`
- `ResizeObserverManager`
- `DeviceLayoutManager`
- `useResponsiveCanvasSizing`
- `useMobileEnhancements`
- `useKeyboardDetection`
- `useNetworkStatus`
- `useDeviceRotation`
- `useMobileAdaptationProvider`
- `useOrientation`
- `useKeyboard`
- `useDeviceDetection`
- `useDebugToggle`
- `useCanvasSizeLogger`
- `useCanvasRefsLogger`
- `useCanvasEventsLogger`

### INTERNAL (优先级3)

**描述**: 模块内部实现细节

**API列表** (98个):

- `EVENT_CONFIG`
- `MEMORY_CONFIG`
- `OPTIMIZATION_FLAGS`
- `BROWSER_SUPPORT`
- `PerformanceMetrics`
- `PerformanceThresholds`
- `EventTimingConfig`
- `DEVELOPMENT_LOGGING_CONFIG`
- `PRODUCTION_LOGGING_CONFIG`
- `TESTING_LOGGING_CONFIG`
- `getLoggingConfig`
- `COMPONENT_CONTEXTS`
- `LOG_PATTERNS`
- `ADAPTATION_CONFIG`
- `validateConfig`
- `getConfigInfo`
- `DETECTION_CONFIG`
- `LARGE_SCREEN_THRESHOLDS`
- `USER_AGENT_PATTERNS`
- `DeviceType`
- `LayoutMode`
- `iPhone16Model`
- `iPhone16Detection`
- `DeviceLayoutInfo`
- `IPHONE16_OPTIMIZATION`
- `HIGH_RESOLUTION_MOBILE`
- `CANVAS_SAFETY`
- `AdaptationContext`
- `AdaptationResult`
- `CanvasSizeResult`
- `ValidationRule`
- `ValidationSchema`
- `ValidationResult`
- `ValidationError`
- `ValidationWarning`
- `LogContext`
- `LogEntry`
- `LoggingConfig`
- `EventScheduler`
- `MonitoringConfig`
- `ErrorMetrics`
- `AlertCondition`
- `MonitoringAlert`
- `ErrorContext`
- `ErrorReport`
- `ErrorRecoveryStrategy`
- `ErrorHandlingConfig`
- `MobileEnhancementState`
- `MobileEnhancementCallbacks`
- `UseMobileAdaptationOptions`
- `MobileAdaptationHookResult`
- `reducer`
- `deviceLogger`
- `canvasLogger`
- `eventLogger`
- `loggers`
- `performanceLogger`
- `errorLogger`
- `loggingStats`
- `calculateCenter`
- `MIN_SCREEN_WIDTH`
- `MIN_SCREEN_HEIGHT`
- `MIN_SHAPE_DIAMETER`
- `MAX_SHAPE_DIAMETER`
- `MIN_SHAPE_AREA`
- `CanvasSize`
- `AdaptationOptions`
- `adaptShapeToCanvas`
- `scaleShapeToSize`
- `isShapeInBounds`
- `calculatePolygonArea`
- `calculateBounds`
- `createSafeZone`
- `lineIntersection`
- `distanceToLine`
- `isPointNearLine`
- `ShapeGenerator`
- `soundPlayedForTest`
- `initBackgroundMusic`
- `toggleBackgroundMusic`
- `getBackgroundMusicStatus`
- `playButtonClickSound`
- `playPieceSnapSound`
- `playCutSound`
- `PuzzlePiece`
- `Point`
- `drawPiece`
- `drawCompletionEffect`
- `drawDistributionArea`
- `drawCanvasCenter`
- `drawShapeCenter`
- `appendAlpha`
- `renderOptimizer`
- `splitPolygon`
- `isValidPiece`
- `checkRectOverlap`
- `generateCuts`
- `calculatePieceBounds`

