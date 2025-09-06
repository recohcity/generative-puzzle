# API分类报告

> 生成时间: 2025/9/6 19:29:32
> 分类工具: API分类器 v1.0

## 📊 分类统计

| 分类 | 数量 | 占比 | 优先级 | 建议 |
|------|------|------|--------|------|
| PUBLIC | 24 | 10.3% | 1 | 必须文档化 |
| TEAM | 25 | 10.7% | 2 | 建议文档化 |
| INTERNAL | 184 | 79.0% | 3 | 选择性文档化 |

## 📋 详细分类

### PUBLIC (优先级1)

**描述**: 对外暴露的核心功能API

**API列表** (24个):

- `UNIFIED_CONFIG`
- `DEVICE_THRESHOLDS`
- `EventManager`
- `getBaseScore`
- `getBaseScoreByPieces`
- `calculateRemainingRotations`
- `validateScoreParams`
- `calculateLiveScore`
- `calculateRotationScore`
- `calculateHintScore`
- `calculateHintScoreFromStats`
- `calculateScoreDelta`
- `calculateLiveScoreWithMonitoring`
- `safeCalculateScore`
- `formatScore`
- `createLiveScoreUpdater`
- `calculateFinalScore`
- `calculateScoreWithLeaderboard`
- `RotationScoreErrorHandler`
- `calculateNewRotationScore`
- `calculateNewRotationScoreWithI18n`
- `isPointInPolygon`
- `rotatePoint`
- `calculateAngle`

### TEAM (优先级2)

**描述**: 团队内部共享的工具和服务

**API列表** (25个):

- `PERFORMANCE_THRESHOLDS`
- `ERROR_HANDLING`
- `LOGGING_CONFIG`
- `ResizeObserverManager`
- `DeviceLayoutManager`
- `useResponsiveCanvasSizing`
- `usePanelState`
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
- `GeometryUtils`
- `GameDataManager`
- `useAngleDisplay`
- `AngleVisibilityManager`
- `AngleDisplayService`
- `angleDisplayService`

### INTERNAL (优先级3)

**描述**: 模块内部实现细节

**API列表** (184个):

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
- `getDeviceMultiplier`
- `calculateDifficultyMultiplier`
- `getBaseDifficultyMultiplierByPieces`
- `getHintAllowance`
- `getHintAllowanceByCutCount`
- `calculateMinimumRotationsAtStart`
- `calculateMinimumRotations`
- `calculateRotationEfficiency`
- `formatRotationDisplay`
- `calculateRotationEfficiencyPercentage`
- `checkTimeRecord`
- `calculateTimeBonus`
- `withPerformanceMonitoring`
- `formatTime`
- `debounce`
- `updateStatsWithOptimalSolution`
- `formatRankDisplay`
- `getNewRecordBadge`
- `calculateLeaderboardStats`
- `RotationEfficiencyResult`
- `TranslationFunction`
- `RotationDataValidator`
- `RotationEfficiencyCalculator`
- `formatNewRotationDisplay`
- `PanelView`
- `PanelState`
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
- `generateSimpleShape`
- `calculatePolygonArea`
- `calculateBounds`
- `createSafeZone`
- `lineIntersection`
- `distanceToLine`
- `isPointNearLine`
- `ShapeGenerator`
- `OptimizedShapeGenerator`
- `soundPlayedForTest`
- `initBackgroundMusic`
- `toggleBackgroundMusic`
- `getBackgroundMusicStatus`
- `autoStartBackgroundMusic`
- `playButtonClickSound`
- `playPieceSnapSound`
- `playCutSound`
- `PuzzlePiece`
- `drawPiece`
- `drawCompletionEffect`
- `drawDistributionArea`
- `drawCanvasCenter`
- `drawShapeCenter`
- `appendAlpha`
- `renderOptimizer`
- `generateSimplePuzzle`
- `splitPolygon`
- `isValidPiece`
- `checkRectOverlap`
- `findLineIntersections`
- `generateCuts`
- `CutValidator`
- `Bounds`
- `CutLine`
- `CutType`
- `CutGenerationContext`
- `CutGenerationResult`
- `CutGenerationStrategy`
- `SimpleCutStrategy`
- `MediumCutStrategy`
- `HardCutStrategy`
- `CutStrategyFactory`
- `doesCutIntersectShape`
- `cutsAreTooClose`
- `generateStraightCutLine`
- `generateDiagonalCutLine`
- `generateCenterCutLine`
- `generateForcedCutLine`
- `CutGeneratorController`
- `CUT_GENERATOR_CONFIG`
- `DIFFICULTY_SETTINGS`
- `MAX_ATTEMPTS`
- `EARLY_EXIT_THRESHOLD`
- `DifficultyLevel`
- `DifficultySettings`
- `LeaderboardSimplifier`
- `calculatePieceBounds`
- `calculateDifficultyLevel`
- `getPieceCountByDifficulty`
- `getDifficultyMultiplier`
- `ALL_DIFFICULTY_LEVELS`
- `isValidDifficultyLevel`
- `clearAllGameData`
- `checkGameDataStatus`
- `GameDataTools`
- `UseAngleDisplayReturn`
- `HintEnhancedDisplay`
- `activateHintWithAngle`
- `deactivateHintWithAngle`
- `isAngleTemporaryVisible`
- `getHintDuration`
- `needsAngleEnhancement`
- `HintEnhancedDisplayImpl`
- `getAngleDisplayState`
- `updateVisibilityRule`
- `setTemporaryVisible`
- `AngleVisibilityManagerImpl`
- `AngleDisplayModeUpdater`
- `updateModeOnCutCountChange`
- `createModeUpdateAction`
- `shouldClearTemporaryDisplay`
- `getTransitionEffect`
- `processCutCountChanges`
- `createCutCountUpdateActions`
- `validateCutCount`
- `getCutCountDifficultyLevel`
- `AngleDisplayModeUpdaterImpl`
- `AngleDisplayController`
- `shouldShowAngle`
- `getAngleDisplayMode`
- `isHintTemporaryDisplay`
- `updateDisplayRule`
- `AngleDisplayControllerImpl`

