# API扫描报告

> 生成时间: 2025/9/9 21:03:15
> 扫描工具: API变更扫描器 v1.0

## 📊 统计概览

| 项目 | 数量 | 说明 |
|------|------|------|
| API总数 | 270 | 项目中所有导出的API |
| 已文档化 | 31 | 在API文档中已记录的API |
| 文档覆盖率 | 11.5% | 文档化程度 |
| 新增API | 242 | 需要添加到文档的API |
| 可能删除 | 3 | 文档中存在但代码中找不到 |

## 🆕 新增API详情

### 配置管理API

#### EVENT_CONFIG

- **类型**: constant
- **文件**: `src/config/performanceConfig.ts:7`
- **签名**: `export const EVENT_CONFIG = {`

**建议文档结构**:
```markdown
### EVENT_CONFIG

[添加API描述]

```typescript
export const EVENT_CONFIG = {
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### MEMORY_CONFIG

- **类型**: constant
- **文件**: `src/config/performanceConfig.ts:27`
- **签名**: `export const MEMORY_CONFIG = {`

**建议文档结构**:
```markdown
### MEMORY_CONFIG

[添加API描述]

```typescript
export const MEMORY_CONFIG = {
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### PERFORMANCE_THRESHOLDS

- **类型**: constant
- **文件**: `src/config/performanceConfig.ts:42`
- **签名**: `export const PERFORMANCE_THRESHOLDS = {`

**建议文档结构**:
```markdown
### PERFORMANCE_THRESHOLDS

[添加API描述]

```typescript
export const PERFORMANCE_THRESHOLDS = {
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### OPTIMIZATION_FLAGS

- **类型**: constant
- **文件**: `src/config/performanceConfig.ts:58`
- **签名**: `export const OPTIMIZATION_FLAGS = {`

**建议文档结构**:
```markdown
### OPTIMIZATION_FLAGS

[添加API描述]

```typescript
export const OPTIMIZATION_FLAGS = {
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### BROWSER_SUPPORT

- **类型**: constant
- **文件**: `src/config/performanceConfig.ts:76`
- **签名**: `export const BROWSER_SUPPORT = {`

**建议文档结构**:
```markdown
### BROWSER_SUPPORT

[添加API描述]

```typescript
export const BROWSER_SUPPORT = {
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### ERROR_HANDLING

- **类型**: constant
- **文件**: `src/config/performanceConfig.ts:93`
- **签名**: `export const ERROR_HANDLING = {`

**建议文档结构**:
```markdown
### ERROR_HANDLING

[添加API描述]

```typescript
export const ERROR_HANDLING = {
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### LOGGING_CONFIG

- **类型**: constant
- **文件**: `src/config/performanceConfig.ts:110`
- **签名**: `export const LOGGING_CONFIG = {`

**建议文档结构**:
```markdown
### LOGGING_CONFIG

[添加API描述]

```typescript
export const LOGGING_CONFIG = {
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### PerformanceMetrics

- **类型**: interface
- **文件**: `src/config/performanceConfig.ts:130`
- **签名**: `export interface PerformanceMetrics {`

**建议文档结构**:
```markdown
### PerformanceMetrics

[添加API描述]

```typescript
export interface PerformanceMetrics {
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### PerformanceThresholds

- **类型**: interface
- **文件**: `src/config/performanceConfig.ts:139`
- **签名**: `export interface PerformanceThresholds {`

**建议文档结构**:
```markdown
### PerformanceThresholds

[添加API描述]

```typescript
export interface PerformanceThresholds {
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### EventTimingConfig

- **类型**: interface
- **文件**: `src/config/performanceConfig.ts:149`
- **签名**: `export interface EventTimingConfig {`

**建议文档结构**:
```markdown
### EventTimingConfig

[添加API描述]

```typescript
export interface EventTimingConfig {
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### DEVELOPMENT_LOGGING_CONFIG

- **类型**: constant
- **文件**: `src/config/loggingConfig.ts:9`
- **签名**: `export const DEVELOPMENT_LOGGING_CONFIG: LoggingConfig = {`

**建议文档结构**:
```markdown
### DEVELOPMENT_LOGGING_CONFIG

[添加API描述]

```typescript
export const DEVELOPMENT_LOGGING_CONFIG: LoggingConfig = {
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### PRODUCTION_LOGGING_CONFIG

- **类型**: constant
- **文件**: `src/config/loggingConfig.ts:20`
- **签名**: `export const PRODUCTION_LOGGING_CONFIG: LoggingConfig = {`

**建议文档结构**:
```markdown
### PRODUCTION_LOGGING_CONFIG

[添加API描述]

```typescript
export const PRODUCTION_LOGGING_CONFIG: LoggingConfig = {
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### TESTING_LOGGING_CONFIG

- **类型**: constant
- **文件**: `src/config/loggingConfig.ts:31`
- **签名**: `export const TESTING_LOGGING_CONFIG: LoggingConfig = {`

**建议文档结构**:
```markdown
### TESTING_LOGGING_CONFIG

[添加API描述]

```typescript
export const TESTING_LOGGING_CONFIG: LoggingConfig = {
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### getLoggingConfig

- **类型**: function
- **文件**: `src/config/loggingConfig.ts:42`
- **签名**: `export function getLoggingConfig(): LoggingConfig {`

**建议文档结构**:
```markdown
### getLoggingConfig

[添加API描述]

```typescript
export function getLoggingConfig(): LoggingConfig {
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### COMPONENT_CONTEXTS

- **类型**: constant
- **文件**: `src/config/loggingConfig.ts:57`
- **签名**: `export const COMPONENT_CONTEXTS = {`

**建议文档结构**:
```markdown
### COMPONENT_CONTEXTS

[添加API描述]

```typescript
export const COMPONENT_CONTEXTS = {
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### LOG_PATTERNS

- **类型**: constant
- **文件**: `src/config/loggingConfig.ts:70`
- **签名**: `export const LOG_PATTERNS = {`

**建议文档结构**:
```markdown
### LOG_PATTERNS

[添加API描述]

```typescript
export const LOG_PATTERNS = {
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### UNIFIED_CONFIG

- **类型**: constant
- **文件**: `src/config/index.ts:86`
- **签名**: `export const UNIFIED_CONFIG = {`

**建议文档结构**:
```markdown
### UNIFIED_CONFIG

[添加API描述]

```typescript
export const UNIFIED_CONFIG = {
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### ADAPTATION_CONFIG

- **类型**: constant
- **文件**: `src/config/index.ts:118`
- **签名**: `export const ADAPTATION_CONFIG = {`

**建议文档结构**:
```markdown
### ADAPTATION_CONFIG

[添加API描述]

```typescript
export const ADAPTATION_CONFIG = {
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### validateConfig

- **类型**: function
- **文件**: `src/config/index.ts:125`
- **签名**: `export function validateConfig(): boolean {`

**建议文档结构**:
```markdown
### validateConfig

[添加API描述]

```typescript
export function validateConfig(): boolean {
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### getConfigInfo

- **类型**: function
- **文件**: `src/config/index.ts:156`
- **签名**: `export function getConfigInfo() {`

**建议文档结构**:
```markdown
### getConfigInfo

[添加API描述]

```typescript
export function getConfigInfo() {
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### DEVICE_THRESHOLDS

- **类型**: constant
- **文件**: `src/config/deviceConfig.ts:7`
- **签名**: `export const DEVICE_THRESHOLDS = {`

**建议文档结构**:
```markdown
### DEVICE_THRESHOLDS

[添加API描述]

```typescript
export const DEVICE_THRESHOLDS = {
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### DETECTION_CONFIG

- **类型**: constant
- **文件**: `src/config/deviceConfig.ts:40`
- **签名**: `export const DETECTION_CONFIG = {`

**建议文档结构**:
```markdown
### DETECTION_CONFIG

[添加API描述]

```typescript
export const DETECTION_CONFIG = {
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### LARGE_SCREEN_THRESHOLDS

- **类型**: constant
- **文件**: `src/config/deviceConfig.ts:48`
- **签名**: `export const LARGE_SCREEN_THRESHOLDS = {`

**建议文档结构**:
```markdown
### LARGE_SCREEN_THRESHOLDS

[添加API描述]

```typescript
export const LARGE_SCREEN_THRESHOLDS = {
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### USER_AGENT_PATTERNS

- **类型**: constant
- **文件**: `src/config/deviceConfig.ts:57`
- **签名**: `export const USER_AGENT_PATTERNS = {`

**建议文档结构**:
```markdown
### USER_AGENT_PATTERNS

[添加API描述]

```typescript
export const USER_AGENT_PATTERNS = {
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### DeviceType

- **类型**: type
- **文件**: `src/config/deviceConfig.ts:66`
- **签名**: `export type DeviceType = 'desktop' | 'tablet' | 'phone';`

**建议文档结构**:
```markdown
### DeviceType

[添加API描述]

```typescript
export type DeviceType = 'desktop' | 'tablet' | 'phone';
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### LayoutMode

- **类型**: type
- **文件**: `src/config/deviceConfig.ts:67`
- **签名**: `export type LayoutMode = 'desktop' | 'portrait' | 'landscape';`

**建议文档结构**:
```markdown
### LayoutMode

[添加API描述]

```typescript
export type LayoutMode = 'desktop' | 'portrait' | 'landscape';
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### iPhone16Model

- **类型**: type
- **文件**: `src/config/deviceConfig.ts:68`
- **签名**: `export type iPhone16Model = keyof typeof IPHONE16_MODELS;`

**建议文档结构**:
```markdown
### iPhone16Model

[添加API描述]

```typescript
export type iPhone16Model = keyof typeof IPHONE16_MODELS;
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### iPhone16Detection

- **类型**: interface
- **文件**: `src/config/deviceConfig.ts:86`
- **签名**: `export interface iPhone16Detection {`

**建议文档结构**:
```markdown
### iPhone16Detection

[添加API描述]

```typescript
export interface iPhone16Detection {
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### DeviceLayoutInfo

- **类型**: interface
- **文件**: `src/config/deviceConfig.ts:94`
- **签名**: `export interface DeviceLayoutInfo {`

**建议文档结构**:
```markdown
### DeviceLayoutInfo

[添加API描述]

```typescript
export interface DeviceLayoutInfo {
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### IPHONE16_OPTIMIZATION

- **类型**: constant
- **文件**: `src/config/adaptationConfig.ts:47`
- **签名**: `export const IPHONE16_OPTIMIZATION = {`

**建议文档结构**:
```markdown
### IPHONE16_OPTIMIZATION

[添加API描述]

```typescript
export const IPHONE16_OPTIMIZATION = {
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### HIGH_RESOLUTION_MOBILE

- **类型**: constant
- **文件**: `src/config/adaptationConfig.ts:58`
- **签名**: `export const HIGH_RESOLUTION_MOBILE = {`

**建议文档结构**:
```markdown
### HIGH_RESOLUTION_MOBILE

[添加API描述]

```typescript
export const HIGH_RESOLUTION_MOBILE = {
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### CANVAS_SAFETY

- **类型**: constant
- **文件**: `src/config/adaptationConfig.ts:68`
- **签名**: `export const CANVAS_SAFETY = {`

**建议文档结构**:
```markdown
### CANVAS_SAFETY

[添加API描述]

```typescript
export const CANVAS_SAFETY = {
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### AdaptationContext

- **类型**: interface
- **文件**: `src/config/adaptationConfig.ts:78`
- **签名**: `export interface AdaptationContext {`

**建议文档结构**:
```markdown
### AdaptationContext

[添加API描述]

```typescript
export interface AdaptationContext {
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### AdaptationResult

- **类型**: interface
- **文件**: `src/config/adaptationConfig.ts:86`
- **签名**: `export interface AdaptationResult<T> {`

**建议文档结构**:
```markdown
### AdaptationResult

[添加API描述]

```typescript
export interface AdaptationResult<T> {
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### CanvasSizeResult

- **类型**: interface
- **文件**: `src/config/adaptationConfig.ts:97`
- **签名**: `export interface CanvasSizeResult {`

**建议文档结构**:
```markdown
### CanvasSizeResult

[添加API描述]

```typescript
export interface CanvasSizeResult {
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

### 核心管理器API

#### ValidationRule

- **类型**: interface
- **文件**: `core/ValidationService.ts:9`
- **签名**: `export interface ValidationRule<T = any> {`

**建议文档结构**:
```markdown
### ValidationRule

[添加API描述]

```typescript
export interface ValidationRule<T = any> {
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### ValidationSchema

- **类型**: interface
- **文件**: `core/ValidationService.ts:16`
- **签名**: `export interface ValidationSchema {`

**建议文档结构**:
```markdown
### ValidationSchema

[添加API描述]

```typescript
export interface ValidationSchema {
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### ValidationResult

- **类型**: interface
- **文件**: `utils/score/RotationEfficiencyCalculator.ts:19`
- **签名**: `export interface ValidationResult {`

**建议文档结构**:
```markdown
### ValidationResult

[添加API描述]

```typescript
export interface ValidationResult {
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### ValidationError

- **类型**: interface
- **文件**: `core/ValidationService.ts:26`
- **签名**: `export interface ValidationError {`

**建议文档结构**:
```markdown
### ValidationError

[添加API描述]

```typescript
export interface ValidationError {
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### ValidationWarning

- **类型**: interface
- **文件**: `core/ValidationService.ts:33`
- **签名**: `export interface ValidationWarning {`

**建议文档结构**:
```markdown
### ValidationWarning

[添加API描述]

```typescript
export interface ValidationWarning {
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### ResizeObserverManager

- **类型**: class
- **文件**: `core/ResizeObserverManager.ts:19`
- **签名**: `export class ResizeObserverManager {`

**建议文档结构**:
```markdown
### ResizeObserverManager

[添加API描述]

```typescript
export class ResizeObserverManager {
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### LogContext

- **类型**: interface
- **文件**: `core/LoggingService.ts:15`
- **签名**: `export interface LogContext {`

**建议文档结构**:
```markdown
### LogContext

[添加API描述]

```typescript
export interface LogContext {
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### LogEntry

- **类型**: interface
- **文件**: `core/LoggingService.ts:24`
- **签名**: `export interface LogEntry {`

**建议文档结构**:
```markdown
### LogEntry

[添加API描述]

```typescript
export interface LogEntry {
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### LoggingConfig

- **类型**: interface
- **文件**: `core/LoggingService.ts:32`
- **签名**: `export interface LoggingConfig {`

**建议文档结构**:
```markdown
### LoggingConfig

[添加API描述]

```typescript
export interface LoggingConfig {
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### EventScheduler

- **类型**: class
- **文件**: `core/EventScheduler.ts:24`
- **签名**: `export class EventScheduler {`

**建议文档结构**:
```markdown
### EventScheduler

[添加API描述]

```typescript
export class EventScheduler {
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### EventManager

- **类型**: class
- **文件**: `core/EventManager.ts:61`
- **签名**: `export class EventManager {`

**建议文档结构**:
```markdown
### EventManager

[添加API描述]

```typescript
export class EventManager {
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### MonitoringConfig

- **类型**: interface
- **文件**: `core/ErrorMonitoringService.ts:9`
- **签名**: `export interface MonitoringConfig {`

**建议文档结构**:
```markdown
### MonitoringConfig

[添加API描述]

```typescript
export interface MonitoringConfig {
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### ErrorMetrics

- **类型**: interface
- **文件**: `core/ErrorMonitoringService.ts:20`
- **签名**: `export interface ErrorMetrics {`

**建议文档结构**:
```markdown
### ErrorMetrics

[添加API描述]

```typescript
export interface ErrorMetrics {
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### AlertCondition

- **类型**: interface
- **文件**: `core/ErrorMonitoringService.ts:29`
- **签名**: `export interface AlertCondition {`

**建议文档结构**:
```markdown
### AlertCondition

[添加API描述]

```typescript
export interface AlertCondition {
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### MonitoringAlert

- **类型**: interface
- **文件**: `core/ErrorMonitoringService.ts:39`
- **签名**: `export interface MonitoringAlert {`

**建议文档结构**:
```markdown
### MonitoringAlert

[添加API描述]

```typescript
export interface MonitoringAlert {
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### ErrorContext

- **类型**: interface
- **文件**: `core/ErrorHandlingService.ts:28`
- **签名**: `export interface ErrorContext {`

**建议文档结构**:
```markdown
### ErrorContext

[添加API描述]

```typescript
export interface ErrorContext {
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### ErrorReport

- **类型**: interface
- **文件**: `core/ErrorHandlingService.ts:39`
- **签名**: `export interface ErrorReport {`

**建议文档结构**:
```markdown
### ErrorReport

[添加API描述]

```typescript
export interface ErrorReport {
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### ErrorRecoveryStrategy

- **类型**: interface
- **文件**: `core/ErrorHandlingService.ts:53`
- **签名**: `export interface ErrorRecoveryStrategy {`

**建议文档结构**:
```markdown
### ErrorRecoveryStrategy

[添加API描述]

```typescript
export interface ErrorRecoveryStrategy {
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### ErrorHandlingConfig

- **类型**: interface
- **文件**: `core/ErrorHandlingService.ts:61`
- **签名**: `export interface ErrorHandlingConfig {`

**建议文档结构**:
```markdown
### ErrorHandlingConfig

[添加API描述]

```typescript
export interface ErrorHandlingConfig {
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### DeviceLayoutManager

- **类型**: class
- **文件**: `core/DeviceLayoutManager.ts:17`
- **签名**: `export class DeviceLayoutManager {`

**建议文档结构**:
```markdown
### DeviceLayoutManager

[添加API描述]

```typescript
export class DeviceLayoutManager {
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### setHintConfig

- **类型**: constant
- **文件**: `utils/score/ScoreCalculator.ts:53`
- **签名**: `export const setHintConfig = (config: Partial<typeof HINT_CONFIG>) => {`

**建议文档结构**:
```markdown
### setHintConfig

[添加API描述]

```typescript
export const setHintConfig = (config: Partial<typeof HINT_CONFIG>) => {
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### getShapeMultiplier

- **类型**: constant
- **文件**: `utils/score/ScoreCalculator.ts:61`
- **签名**: `export const getShapeMultiplier = (shapeType?: ShapeType | string): number => {`

**建议文档结构**:
```markdown
### getShapeMultiplier

[添加API描述]

```typescript
export const getShapeMultiplier = (shapeType?: ShapeType | string): number => {
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### getDeviceMultiplier

- **类型**: constant
- **文件**: `utils/score/ScoreCalculator.ts:85`
- **签名**: `export const getDeviceMultiplier = (): number => {`

**建议文档结构**:
```markdown
### getDeviceMultiplier

[添加API描述]

```typescript
export const getDeviceMultiplier = (): number => {
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### calculateDifficultyMultiplier

- **类型**: constant
- **文件**: `utils/score/ScoreCalculator.ts:119`
- **签名**: `export const calculateDifficultyMultiplier = (config: DifficultyConfig): number => {`

**建议文档结构**:
```markdown
### calculateDifficultyMultiplier

[添加API描述]

```typescript
export const calculateDifficultyMultiplier = (config: DifficultyConfig): number => {
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### getBaseScore

- **类型**: constant
- **文件**: `utils/score/ScoreCalculator.ts:146`
- **签名**: `export const getBaseScore = (difficultyLevel: number): number => {`

**建议文档结构**:
```markdown
### getBaseScore

[添加API描述]

```typescript
export const getBaseScore = (difficultyLevel: number): number => {
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### getBaseScoreByPieces

- **类型**: constant
- **文件**: `utils/score/ScoreCalculator.ts:156`
- **签名**: `export const getBaseScoreByPieces = (actualPieces: number): number => {`

**建议文档结构**:
```markdown
### getBaseScoreByPieces

[添加API描述]

```typescript
export const getBaseScoreByPieces = (actualPieces: number): number => {
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### getBaseDifficultyMultiplierByPieces

- **类型**: constant
- **文件**: `utils/score/ScoreCalculator.ts:163`
- **签名**: `export const getBaseDifficultyMultiplierByPieces = (actualPieces: number): number => {`

**建议文档结构**:
```markdown
### getBaseDifficultyMultiplierByPieces

[添加API描述]

```typescript
export const getBaseDifficultyMultiplierByPieces = (actualPieces: number): number => {
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### getHintAllowance

- **类型**: constant
- **文件**: `utils/score/ScoreCalculator.ts:173`
- **签名**: `export const getHintAllowance = (_difficultyLevel: string): number => {`

**建议文档结构**:
```markdown
### getHintAllowance

[添加API描述]

```typescript
export const getHintAllowance = (_difficultyLevel: string): number => {
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### getHintAllowanceByCutCount

- **类型**: constant
- **文件**: `utils/score/ScoreCalculator.ts:181`
- **签名**: `export const getHintAllowanceByCutCount = (_cutCount: number): number => {`

**建议文档结构**:
```markdown
### getHintAllowanceByCutCount

[添加API描述]

```typescript
export const getHintAllowanceByCutCount = (_cutCount: number): number => {
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### calculateMinimumRotationsAtStart

- **类型**: constant
- **文件**: `utils/score/ScoreCalculator.ts:197`
- **签名**: `export const calculateMinimumRotationsAtStart = (pieces: PuzzlePiece[]): number => {`

**建议文档结构**:
```markdown
### calculateMinimumRotationsAtStart

[添加API描述]

```typescript
export const calculateMinimumRotationsAtStart = (pieces: PuzzlePiece[]): number => {
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### calculateMinimumRotations

- **类型**: constant
- **文件**: `utils/score/ScoreCalculator.ts:231`
- **签名**: `export const calculateMinimumRotations = (pieces: PuzzlePiece[]): number => {`

**建议文档结构**:
```markdown
### calculateMinimumRotations

[添加API描述]

```typescript
export const calculateMinimumRotations = (pieces: PuzzlePiece[]): number => {
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### calculateRotationEfficiency

- **类型**: constant
- **文件**: `utils/score/ScoreCalculator.ts:239`
- **签名**: `export const calculateRotationEfficiency = (minRotations: number, actualRotations: number): number => {`

**建议文档结构**:
```markdown
### calculateRotationEfficiency

[添加API描述]

```typescript
export const calculateRotationEfficiency = (minRotations: number, actualRotations: number): number => {
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### formatRotationDisplay

- **类型**: constant
- **文件**: `utils/score/ScoreCalculator.ts:255`
- **签名**: `export const formatRotationDisplay = (`

**建议文档结构**:
```markdown
### formatRotationDisplay

[添加API描述]

```typescript
export const formatRotationDisplay = (
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### calculateRotationEfficiencyPercentage

- **类型**: constant
- **文件**: `utils/score/ScoreCalculator.ts:266`
- **签名**: `export const calculateRotationEfficiencyPercentage = (`

**建议文档结构**:
```markdown
### calculateRotationEfficiencyPercentage

[添加API描述]

```typescript
export const calculateRotationEfficiencyPercentage = (
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### calculateRemainingRotations

- **类型**: constant
- **文件**: `utils/score/ScoreCalculator.ts:285`
- **签名**: `export const calculateRemainingRotations = (pieces: PuzzlePiece[]): number => {`

**建议文档结构**:
```markdown
### calculateRemainingRotations

[添加API描述]

```typescript
export const calculateRemainingRotations = (pieces: PuzzlePiece[]): number => {
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### checkTimeRecord

- **类型**: constant
- **文件**: `utils/score/ScoreCalculator.ts:322`
- **签名**: `export const checkTimeRecord = (stats: GameStats, currentLeaderboard: GameRecord[]): {`

**建议文档结构**:
```markdown
### checkTimeRecord

[添加API描述]

```typescript
export const checkTimeRecord = (stats: GameStats, currentLeaderboard: GameRecord[]): {
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### calculateTimeBonus

- **类型**: constant
- **文件**: `utils/score/ScoreCalculator.ts:376`
- **签名**: `export const calculateTimeBonus = (`

**建议文档结构**:
```markdown
### calculateTimeBonus

[添加API描述]

```typescript
export const calculateTimeBonus = (
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### validateScoreParams

- **类型**: constant
- **文件**: `utils/score/ScoreCalculator.ts:424`
- **签名**: `export const validateScoreParams = (stats: GameStats | null | undefined): stats is GameStats => {`

**建议文档结构**:
```markdown
### validateScoreParams

[添加API描述]

```typescript
export const validateScoreParams = (stats: GameStats | null | undefined): stats is GameStats => {
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### calculateLiveScore

- **类型**: constant
- **文件**: `utils/score/ScoreCalculator.ts:462`
- **签名**: `export const calculateLiveScore = (stats: GameStats, leaderboard: GameRecord[] = []): number => {`

**建议文档结构**:
```markdown
### calculateLiveScore

[添加API描述]

```typescript
export const calculateLiveScore = (stats: GameStats, leaderboard: GameRecord[] = []): number => {
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### calculateRotationScore

- **类型**: constant
- **文件**: `utils/score/ScoreCalculator.ts:546`
- **签名**: `export const calculateRotationScore = (stats: GameStats, pieces?: PuzzlePiece[]): number => {`

**建议文档结构**:
```markdown
### calculateRotationScore

[添加API描述]

```typescript
export const calculateRotationScore = (stats: GameStats, pieces?: PuzzlePiece[]): number => {
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### calculateHintScore

- **类型**: constant
- **文件**: `utils/score/ScoreCalculator.ts:626`
- **签名**: `export const calculateHintScore = (actualHints: number, allowance: number): number => {`

**建议文档结构**:
```markdown
### calculateHintScore

[添加API描述]

```typescript
export const calculateHintScore = (actualHints: number, allowance: number): number => {
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### calculateHintScoreFromStats

- **类型**: constant
- **文件**: `utils/score/ScoreCalculator.ts:645`
- **签名**: `export const calculateHintScoreFromStats = (stats: GameStats): number => {`

**建议文档结构**:
```markdown
### calculateHintScoreFromStats

[添加API描述]

```typescript
export const calculateHintScoreFromStats = (stats: GameStats): number => {
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### calculateScoreDelta

- **类型**: constant
- **文件**: `utils/score/ScoreCalculator.ts:664`
- **签名**: `export const calculateScoreDelta = (`

**建议文档结构**:
```markdown
### calculateScoreDelta

[添加API描述]

```typescript
export const calculateScoreDelta = (
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### withPerformanceMonitoring

- **类型**: constant
- **文件**: `utils/score/ScoreCalculator.ts:710`
- **签名**: `export const withPerformanceMonitoring = <T extends any[], R>(`

**建议文档结构**:
```markdown
### withPerformanceMonitoring

[添加API描述]

```typescript
export const withPerformanceMonitoring = <T extends any[], R>(
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### calculateLiveScoreWithMonitoring

- **类型**: constant
- **文件**: `utils/score/ScoreCalculator.ts:732`
- **签名**: `export const calculateLiveScoreWithMonitoring = withPerformanceMonitoring(`

**建议文档结构**:
```markdown
### calculateLiveScoreWithMonitoring

[添加API描述]

```typescript
export const calculateLiveScoreWithMonitoring = withPerformanceMonitoring(
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### safeCalculateScore

- **类型**: constant
- **文件**: `utils/score/ScoreCalculator.ts:741`
- **签名**: `export const safeCalculateScore = <T>(`

**建议文档结构**:
```markdown
### safeCalculateScore

[添加API描述]

```typescript
export const safeCalculateScore = <T>(
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### formatScore

- **类型**: constant
- **文件**: `utils/score/ScoreCalculator.ts:758`
- **签名**: `export const formatScore = (score: number): string => {`

**建议文档结构**:
```markdown
### formatScore

[添加API描述]

```typescript
export const formatScore = (score: number): string => {
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### formatTime

- **类型**: constant
- **文件**: `utils/score/ScoreCalculator.ts:766`
- **签名**: `export const formatTime = (seconds: number): string => {`

**建议文档结构**:
```markdown
### formatTime

[添加API描述]

```typescript
export const formatTime = (seconds: number): string => {
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### debounce

- **类型**: constant
- **文件**: `utils/score/ScoreCalculator.ts:776`
- **签名**: `export const debounce = <T extends (...args: any[]) => any>(`

**建议文档结构**:
```markdown
### debounce

[添加API描述]

```typescript
export const debounce = <T extends (...args: any[]) => any>(
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### createLiveScoreUpdater

- **类型**: constant
- **文件**: `utils/score/ScoreCalculator.ts:797`
- **签名**: `export const createLiveScoreUpdater = (`

**建议文档结构**:
```markdown
### createLiveScoreUpdater

[添加API描述]

```typescript
export const createLiveScoreUpdater = (
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### calculateFinalScore

- **类型**: constant
- **文件**: `utils/score/ScoreCalculator.ts:827`
- **签名**: `export const calculateFinalScore = (`

**建议文档结构**:
```markdown
### calculateFinalScore

[添加API描述]

```typescript
export const calculateFinalScore = (
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### updateStatsWithOptimalSolution

- **类型**: constant
- **文件**: `utils/score/ScoreCalculator.ts:903`
- **签名**: `export const updateStatsWithOptimalSolution = (stats: GameStats, pieces: PuzzlePiece[]): GameStats => {`

**建议文档结构**:
```markdown
### updateStatsWithOptimalSolution

[添加API描述]

```typescript
export const updateStatsWithOptimalSolution = (stats: GameStats, pieces: PuzzlePiece[]): GameStats => {
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### formatRankDisplay

- **类型**: constant
- **文件**: `utils/score/ScoreCalculator.ts:920`
- **签名**: `export const formatRankDisplay = (rank: number, totalRecords: number): string => {`

**建议文档结构**:
```markdown
### formatRankDisplay

[添加API描述]

```typescript
export const formatRankDisplay = (rank: number, totalRecords: number): string => {
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### getNewRecordBadge

- **类型**: constant
- **文件**: `utils/score/ScoreCalculator.ts:934`
- **签名**: `export const getNewRecordBadge = (recordInfo: {`

**建议文档结构**:
```markdown
### getNewRecordBadge

[添加API描述]

```typescript
export const getNewRecordBadge = (recordInfo: {
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### calculateLeaderboardStats

- **类型**: constant
- **文件**: `utils/score/ScoreCalculator.ts:971`
- **签名**: `export const calculateLeaderboardStats = (`

**建议文档结构**:
```markdown
### calculateLeaderboardStats

[添加API描述]

```typescript
export const calculateLeaderboardStats = (
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### calculateScoreWithLeaderboard

- **类型**: constant
- **文件**: `utils/score/ScoreCalculator.ts:1001`
- **签名**: `export const calculateScoreWithLeaderboard = (`

**建议文档结构**:
```markdown
### calculateScoreWithLeaderboard

[添加API描述]

```typescript
export const calculateScoreWithLeaderboard = (
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### RotationEfficiencyResult

- **类型**: interface
- **文件**: `utils/score/RotationEfficiencyCalculator.ts:8`
- **签名**: `export interface RotationEfficiencyResult {`

**建议文档结构**:
```markdown
### RotationEfficiencyResult

[添加API描述]

```typescript
export interface RotationEfficiencyResult {
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### TranslationFunction

- **类型**: type
- **文件**: `utils/score/RotationEfficiencyCalculator.ts:25`
- **签名**: `export type TranslationFunction = (key: string, params?: Record<string, any>) => string;`

**建议文档结构**:
```markdown
### TranslationFunction

[添加API描述]

```typescript
export type TranslationFunction = (key: string, params?: Record<string, any>) => string;
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### RotationDataValidator

- **类型**: class
- **文件**: `utils/score/RotationEfficiencyCalculator.ts:31`
- **签名**: `export class RotationDataValidator {`

**建议文档结构**:
```markdown
### RotationDataValidator

[添加API描述]

```typescript
export class RotationDataValidator {
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### RotationScoreErrorHandler

- **类型**: class
- **文件**: `utils/score/RotationEfficiencyCalculator.ts:90`
- **签名**: `export class RotationScoreErrorHandler {`

**建议文档结构**:
```markdown
### RotationScoreErrorHandler

[添加API描述]

```typescript
export class RotationScoreErrorHandler {
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### RotationEfficiencyCalculator

- **类型**: class
- **文件**: `utils/score/RotationEfficiencyCalculator.ts:129`
- **签名**: `export class RotationEfficiencyCalculator {`

**建议文档结构**:
```markdown
### RotationEfficiencyCalculator

[添加API描述]

```typescript
export class RotationEfficiencyCalculator {
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### calculateNewRotationScore

- **类型**: constant
- **文件**: `utils/score/RotationEfficiencyCalculator.ts:431`
- **签名**: `export const calculateNewRotationScore = (`

**建议文档结构**:
```markdown
### calculateNewRotationScore

[添加API描述]

```typescript
export const calculateNewRotationScore = (
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### calculateNewRotationScoreWithI18n

- **类型**: constant
- **文件**: `utils/score/RotationEfficiencyCalculator.ts:452`
- **签名**: `export const calculateNewRotationScoreWithI18n = (`

**建议文档结构**:
```markdown
### calculateNewRotationScoreWithI18n

[添加API描述]

```typescript
export const calculateNewRotationScoreWithI18n = (
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### formatNewRotationDisplay

- **类型**: constant
- **文件**: `utils/score/RotationEfficiencyCalculator.ts:466`
- **签名**: `export const formatNewRotationDisplay = (`

**建议文档结构**:
```markdown
### formatNewRotationDisplay

[添加API描述]

```typescript
export const formatNewRotationDisplay = (
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

### React Hooks API

#### useResponsiveCanvasSizing

- **类型**: function
- **文件**: `hooks/useResponsiveCanvasSizing.ts:23`
- **签名**: `export function useResponsiveCanvasSizing({`

**建议文档结构**:
```markdown
### useResponsiveCanvasSizing

[添加API描述]

```typescript
export function useResponsiveCanvasSizing({
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### PanelView

- **类型**: type
- **文件**: `hooks/usePanelState.ts:20`
- **签名**: `export type PanelView = 'game' | 'leaderboard' | 'details' | 'recent-game';`

**建议文档结构**:
```markdown
### PanelView

[添加API描述]

```typescript
export type PanelView = 'game' | 'leaderboard' | 'details' | 'recent-game';
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### PanelState

- **类型**: interface
- **文件**: `hooks/usePanelState.ts:22`
- **签名**: `export interface PanelState {`

**建议文档结构**:
```markdown
### PanelState

[添加API描述]

```typescript
export interface PanelState {
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### usePanelState

- **类型**: constant
- **文件**: `hooks/usePanelState.ts:27`
- **签名**: `export const usePanelState = () => {`

**建议文档结构**:
```markdown
### usePanelState

[添加API描述]

```typescript
export const usePanelState = () => {
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### MobileEnhancementState

- **类型**: interface
- **文件**: `hooks/useMobileEnhancements.ts:18`
- **签名**: `export interface MobileEnhancementState {`

**建议文档结构**:
```markdown
### MobileEnhancementState

[添加API描述]

```typescript
export interface MobileEnhancementState {
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### MobileEnhancementCallbacks

- **类型**: interface
- **文件**: `hooks/useMobileEnhancements.ts:45`
- **签名**: `export interface MobileEnhancementCallbacks {`

**建议文档结构**:
```markdown
### MobileEnhancementCallbacks

[添加API描述]

```typescript
export interface MobileEnhancementCallbacks {
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### useMobileEnhancements

- **类型**: function
- **文件**: `hooks/useMobileEnhancements.ts:59`
- **签名**: `export function useMobileEnhancements(callbacks: MobileEnhancementCallbacks = {}) {`

**建议文档结构**:
```markdown
### useMobileEnhancements

[添加API描述]

```typescript
export function useMobileEnhancements(callbacks: MobileEnhancementCallbacks = {}) {
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### useKeyboardDetection

- **类型**: function
- **文件**: `hooks/useMobileEnhancements.ts:329`
- **签名**: `export function useKeyboardDetection() {`

**建议文档结构**:
```markdown
### useKeyboardDetection

[添加API描述]

```typescript
export function useKeyboardDetection() {
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### useNetworkStatus

- **类型**: function
- **文件**: `hooks/useMobileEnhancements.ts:342`
- **签名**: `export function useNetworkStatus() {`

**建议文档结构**:
```markdown
### useNetworkStatus

[添加API描述]

```typescript
export function useNetworkStatus() {
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### useDeviceRotation

- **类型**: function
- **文件**: `hooks/useMobileEnhancements.ts:354`
- **签名**: `export function useDeviceRotation(callbacks?: {`

**建议文档结构**:
```markdown
### useDeviceRotation

[添加API描述]

```typescript
export function useDeviceRotation(callbacks?: {
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### UseMobileAdaptationOptions

- **类型**: interface
- **文件**: `hooks/useMobileAdaptation.ts:17`
- **签名**: `export interface UseMobileAdaptationOptions extends MobileEnhancementCallbacks {`

**建议文档结构**:
```markdown
### UseMobileAdaptationOptions

[添加API描述]

```typescript
export interface UseMobileAdaptationOptions extends MobileEnhancementCallbacks {
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### MobileAdaptationHookResult

- **类型**: interface
- **文件**: `hooks/useMobileAdaptation.ts:25`
- **签名**: `export interface MobileAdaptationHookResult {`

**建议文档结构**:
```markdown
### MobileAdaptationHookResult

[添加API描述]

```typescript
export interface MobileAdaptationHookResult {
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### useMobileAdaptationProvider

- **类型**: function
- **文件**: `hooks/useMobileAdaptation.ts:139`
- **签名**: `export function useMobileAdaptationProvider() {`

**建议文档结构**:
```markdown
### useMobileAdaptationProvider

[添加API描述]

```typescript
export function useMobileAdaptationProvider() {
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### useOrientation

- **类型**: function
- **文件**: `hooks/useMobileAdaptation.ts:177`
- **签名**: `export function useOrientation() {`

**建议文档结构**:
```markdown
### useOrientation

[添加API描述]

```typescript
export function useOrientation() {
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### useKeyboard

- **类型**: function
- **文件**: `hooks/useMobileAdaptation.ts:196`
- **签名**: `export function useKeyboard() {`

**建议文档结构**:
```markdown
### useKeyboard

[添加API描述]

```typescript
export function useKeyboard() {
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### useDeviceDetection

- **类型**: function
- **文件**: `hooks/useDeviceDetection.ts:140`
- **签名**: `export function useDeviceDetection(): DeviceDetectionState {`

**建议文档结构**:
```markdown
### useDeviceDetection

[添加API描述]

```typescript
export function useDeviceDetection(): DeviceDetectionState {
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### useDebugToggle

- **类型**: function
- **文件**: `hooks/useDebugToggle.ts:8`
- **签名**: `export function useDebugToggle(): [boolean, (v: boolean) => void] {`

**建议文档结构**:
```markdown
### useDebugToggle

[添加API描述]

```typescript
export function useDebugToggle(): [boolean, (v: boolean) => void] {
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### reducer

- **类型**: constant
- **文件**: `hooks/use-toast.ts:77`
- **签名**: `export const reducer = (state: State, action: Action): State => {`

**建议文档结构**:
```markdown
### reducer

[添加API描述]

```typescript
export const reducer = (state: State, action: Action): State => {
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

### 工具函数API

#### deviceLogger

- **类型**: constant
- **文件**: `utils/logger.ts:18`
- **签名**: `export const deviceLogger = loggingService.createLogger(COMPONENT_CONTEXTS.DEVICE_MANAGER);`

**建议文档结构**:
```markdown
### deviceLogger

[添加API描述]

```typescript
export const deviceLogger = loggingService.createLogger(COMPONENT_CONTEXTS.DEVICE_MANAGER);
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### canvasLogger

- **类型**: constant
- **文件**: `utils/logger.ts:21`
- **签名**: `export const canvasLogger = loggingService.createLogger(COMPONENT_CONTEXTS.CANVAS_MANAGER);`

**建议文档结构**:
```markdown
### canvasLogger

[添加API描述]

```typescript
export const canvasLogger = loggingService.createLogger(COMPONENT_CONTEXTS.CANVAS_MANAGER);
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### eventLogger

- **类型**: constant
- **文件**: `utils/logger.ts:22`
- **签名**: `export const eventLogger = loggingService.createLogger(COMPONENT_CONTEXTS.EVENT_MANAGER);`

**建议文档结构**:
```markdown
### eventLogger

[添加API描述]

```typescript
export const eventLogger = loggingService.createLogger(COMPONENT_CONTEXTS.EVENT_MANAGER);
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### useCanvasSizeLogger

- **类型**: constant
- **文件**: `utils/logger.ts:24`
- **签名**: `export const useCanvasSizeLogger = loggingService.createLogger(COMPONENT_CONTEXTS.USE_CANVAS_SIZE);`

**建议文档结构**:
```markdown
### useCanvasSizeLogger

[添加API描述]

```typescript
export const useCanvasSizeLogger = loggingService.createLogger(COMPONENT_CONTEXTS.USE_CANVAS_SIZE);
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### useCanvasRefsLogger

- **类型**: constant
- **文件**: `utils/logger.ts:25`
- **签名**: `export const useCanvasRefsLogger = loggingService.createLogger(COMPONENT_CONTEXTS.USE_CANVAS_REFS);`

**建议文档结构**:
```markdown
### useCanvasRefsLogger

[添加API描述]

```typescript
export const useCanvasRefsLogger = loggingService.createLogger(COMPONENT_CONTEXTS.USE_CANVAS_REFS);
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### useCanvasEventsLogger

- **类型**: constant
- **文件**: `utils/logger.ts:26`
- **签名**: `export const useCanvasEventsLogger = loggingService.createLogger(COMPONENT_CONTEXTS.USE_CANVAS_EVENTS);`

**建议文档结构**:
```markdown
### useCanvasEventsLogger

[添加API描述]

```typescript
export const useCanvasEventsLogger = loggingService.createLogger(COMPONENT_CONTEXTS.USE_CANVAS_EVENTS);
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### loggers

- **类型**: constant
- **文件**: `utils/logger.ts:29`
- **签名**: `export const loggers = {`

**建议文档结构**:
```markdown
### loggers

[添加API描述]

```typescript
export const loggers = {
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### performanceLogger

- **类型**: constant
- **文件**: `utils/logger.ts:105`
- **签名**: `export const performanceLogger = {`

**建议文档结构**:
```markdown
### performanceLogger

[添加API描述]

```typescript
export const performanceLogger = {
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### errorLogger

- **类型**: constant
- **文件**: `utils/logger.ts:175`
- **签名**: `export const errorLogger = {`

**建议文档结构**:
```markdown
### errorLogger

[添加API描述]

```typescript
export const errorLogger = {
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### loggingStats

- **类型**: constant
- **文件**: `utils/logger.ts:204`
- **签名**: `export const loggingStats = {`

**建议文档结构**:
```markdown
### loggingStats

[添加API描述]

```typescript
export const loggingStats = {
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### calculateCenter

- **类型**: constant
- **文件**: `utils/geometry/puzzleGeometry.ts:4`
- **签名**: `export const calculateCenter = (points: Point[]) => {`

**建议文档结构**:
```markdown
### calculateCenter

[添加API描述]

```typescript
export const calculateCenter = (points: Point[]) => {
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### MIN_SCREEN_WIDTH

- **类型**: constant
- **文件**: `utils/constants.ts:1`
- **签名**: `export const MIN_SCREEN_WIDTH = 320`

**建议文档结构**:
```markdown
### MIN_SCREEN_WIDTH

[添加API描述]

```typescript
export const MIN_SCREEN_WIDTH = 320
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### MIN_SCREEN_HEIGHT

- **类型**: constant
- **文件**: `utils/constants.ts:2`
- **签名**: `export const MIN_SCREEN_HEIGHT = 480`

**建议文档结构**:
```markdown
### MIN_SCREEN_HEIGHT

[添加API描述]

```typescript
export const MIN_SCREEN_HEIGHT = 480
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### MIN_SHAPE_DIAMETER

- **类型**: constant
- **文件**: `utils/constants.ts:3`
- **签名**: `export const MIN_SHAPE_DIAMETER = 200`

**建议文档结构**:
```markdown
### MIN_SHAPE_DIAMETER

[添加API描述]

```typescript
export const MIN_SHAPE_DIAMETER = 200
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### MAX_SHAPE_DIAMETER

- **类型**: constant
- **文件**: `utils/constants.ts:4`
- **签名**: `export const MAX_SHAPE_DIAMETER = 400`

**建议文档结构**:
```markdown
### MAX_SHAPE_DIAMETER

[添加API描述]

```typescript
export const MAX_SHAPE_DIAMETER = 400
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### MIN_SHAPE_AREA

- **类型**: constant
- **文件**: `utils/constants.ts:5`
- **签名**: `export const MIN_SHAPE_AREA = Math.PI * Math.pow(MIN_SHAPE_DIAMETER / 2, 2)`

**建议文档结构**:
```markdown
### MIN_SHAPE_AREA

[添加API描述]

```typescript
export const MIN_SHAPE_AREA = Math.PI * Math.pow(MIN_SHAPE_DIAMETER / 2, 2)
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### generateSimpleShape

- **类型**: function
- **文件**: `utils/shape/simpleShapeGenerator.ts:11`
- **签名**: `export function generateSimpleShape(): Point[] {`

**建议文档结构**:
```markdown
### generateSimpleShape

[添加API描述]

```typescript
export function generateSimpleShape(): Point[] {
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### calculatePolygonArea

- **类型**: constant
- **文件**: `utils/shape/geometryUtils.ts:22`
- **签名**: `export const calculatePolygonArea = (vertices: Point[]): number => {`

**建议文档结构**:
```markdown
### calculatePolygonArea

[添加API描述]

```typescript
export const calculatePolygonArea = (vertices: Point[]): number => {
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### calculateBounds

- **类型**: constant
- **文件**: `utils/puzzle/cutGeneratorGeometry.ts:13`
- **签名**: `export const calculateBounds = (points: Point[]): Bounds => {`

**建议文档结构**:
```markdown
### calculateBounds

[添加API描述]

```typescript
export const calculateBounds = (points: Point[]): Bounds => {
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### createSafeZone

- **类型**: constant
- **文件**: `utils/shape/geometryUtils.ts:48`
- **签名**: `export const createSafeZone = (shape: Point[]): Bounds => {`

**建议文档结构**:
```markdown
### createSafeZone

[添加API描述]

```typescript
export const createSafeZone = (shape: Point[]): Bounds => {
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### lineIntersection

- **类型**: constant
- **文件**: `utils/puzzle/cutGeneratorGeometry.ts:32`
- **签名**: `export const lineIntersection = (p1: Point, p2: Point, p3: Point, p4: Point): Point | null => {`

**建议文档结构**:
```markdown
### lineIntersection

[添加API描述]

```typescript
export const lineIntersection = (p1: Point, p2: Point, p3: Point, p4: Point): Point | null => {
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### distanceToLine

- **类型**: constant
- **文件**: `utils/shape/geometryUtils.ts:86`
- **签名**: `export const distanceToLine = (point: Point, line: CutLine): number => {`

**建议文档结构**:
```markdown
### distanceToLine

[添加API描述]

```typescript
export const distanceToLine = (point: Point, line: CutLine): number => {
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### isPointInPolygon

- **类型**: function
- **文件**: `utils/geometry/puzzleGeometry.ts:33`
- **签名**: `export function isPointInPolygon(x: number, y: number, polygon: Point[]): boolean {`

**建议文档结构**:
```markdown
### isPointInPolygon

[添加API描述]

```typescript
export function isPointInPolygon(x: number, y: number, polygon: Point[]): boolean {
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### isPointNearLine

- **类型**: constant
- **文件**: `utils/puzzle/cutGeneratorGeometry.ts:53`
- **签名**: `export const isPointNearLine = (point: Point, line: CutLine, threshold: number): boolean => {`

**建议文档结构**:
```markdown
### isPointNearLine

[添加API描述]

```typescript
export const isPointNearLine = (point: Point, line: CutLine, threshold: number): boolean => {
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### ShapeGenerator

- **类型**: class
- **文件**: `utils/shape/ShapeGenerator.ts:9`
- **签名**: `export class ShapeGenerator {`

**建议文档结构**:
```markdown
### ShapeGenerator

[添加API描述]

```typescript
export class ShapeGenerator {
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### OptimizedShapeGenerator

- **类型**: class
- **文件**: `utils/shape/OptimizedShapeGenerator.ts:13`
- **签名**: `export class OptimizedShapeGenerator {`

**建议文档结构**:
```markdown
### OptimizedShapeGenerator

[添加API描述]

```typescript
export class OptimizedShapeGenerator {
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### soundPlayedForTest

- **类型**: constant
- **文件**: `utils/rendering/soundEffects.ts:12`
- **签名**: `export const soundPlayedForTest = (soundName: string) => {`

**建议文档结构**:
```markdown
### soundPlayedForTest

[添加API描述]

```typescript
export const soundPlayedForTest = (soundName: string) => {
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### initBackgroundMusic

- **类型**: constant
- **文件**: `utils/rendering/soundEffects.ts:39`
- **签名**: `export const initBackgroundMusic = () => {`

**建议文档结构**:
```markdown
### initBackgroundMusic

[添加API描述]

```typescript
export const initBackgroundMusic = () => {
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### toggleBackgroundMusic

- **类型**: constant
- **文件**: `utils/rendering/soundEffects.ts:91`
- **签名**: `export const toggleBackgroundMusic = async (): Promise<boolean> => {`

**建议文档结构**:
```markdown
### toggleBackgroundMusic

[添加API描述]

```typescript
export const toggleBackgroundMusic = async (): Promise<boolean> => {
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### getBackgroundMusicStatus

- **类型**: constant
- **文件**: `utils/rendering/soundEffects.ts:129`
- **签名**: `export const getBackgroundMusicStatus = (): boolean => {`

**建议文档结构**:
```markdown
### getBackgroundMusicStatus

[添加API描述]

```typescript
export const getBackgroundMusicStatus = (): boolean => {
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### autoStartBackgroundMusic

- **类型**: constant
- **文件**: `utils/rendering/soundEffects.ts:134`
- **签名**: `export const autoStartBackgroundMusic = async (): Promise<void> => {`

**建议文档结构**:
```markdown
### autoStartBackgroundMusic

[添加API描述]

```typescript
export const autoStartBackgroundMusic = async (): Promise<void> => {
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### playButtonClickSound

- **类型**: constant
- **文件**: `utils/rendering/soundEffects.ts:152`
- **签名**: `export const playButtonClickSound = async (): Promise<void> => {`

**建议文档结构**:
```markdown
### playButtonClickSound

[添加API描述]

```typescript
export const playButtonClickSound = async (): Promise<void> => {
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### playPieceSnapSound

- **类型**: constant
- **文件**: `utils/rendering/soundEffects.ts:218`
- **签名**: `export const playPieceSnapSound = async (): Promise<void> => {`

**建议文档结构**:
```markdown
### playPieceSnapSound

[添加API描述]

```typescript
export const playPieceSnapSound = async (): Promise<void> => {
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### playCutSound

- **类型**: constant
- **文件**: `utils/rendering/soundEffects.ts:313`
- **签名**: `export const playCutSound = async (): Promise<void> => {`

**建议文档结构**:
```markdown
### playCutSound

[添加API描述]

```typescript
export const playCutSound = async (): Promise<void> => {
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### playScatterSound

- **类型**: constant
- **文件**: `utils/rendering/soundEffects.ts:360`
- **签名**: `export const playScatterSound = async (): Promise<void> => {`

**建议文档结构**:
```markdown
### playScatterSound

[添加API描述]

```typescript
export const playScatterSound = async (): Promise<void> => {
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### PuzzlePiece

- **类型**: interface
- **文件**: `utils/rendering/puzzleDrawing.ts:10`
- **签名**: `export interface PuzzlePiece { // Export the interface`

**建议文档结构**:
```markdown
### PuzzlePiece

[添加API描述]

```typescript
export interface PuzzlePiece { // Export the interface
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### drawPiece

- **类型**: constant
- **文件**: `utils/rendering/puzzleDrawing.ts:98`
- **签名**: `export const drawPiece = (`

**建议文档结构**:
```markdown
### drawPiece

[添加API描述]

```typescript
export const drawPiece = (
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### drawCompletionEffect

- **类型**: constant
- **文件**: `utils/rendering/puzzleDrawing.ts:305`
- **签名**: `export const drawCompletionEffect = (`

**建议文档结构**:
```markdown
### drawCompletionEffect

[添加API描述]

```typescript
export const drawCompletionEffect = (
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### drawDistributionArea

- **类型**: constant
- **文件**: `utils/rendering/puzzleDrawing.ts:395`
- **签名**: `export const drawDistributionArea = (`

**建议文档结构**:
```markdown
### drawDistributionArea

[添加API描述]

```typescript
export const drawDistributionArea = (
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### drawCanvasCenter

- **类型**: constant
- **文件**: `utils/rendering/puzzleDrawing.ts:659`
- **签名**: `export const drawCanvasCenter = (`

**建议文档结构**:
```markdown
### drawCanvasCenter

[添加API描述]

```typescript
export const drawCanvasCenter = (
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### drawShapeCenter

- **类型**: constant
- **文件**: `utils/rendering/puzzleDrawing.ts:693`
- **签名**: `export const drawShapeCenter = (`

**建议文档结构**:
```markdown
### drawShapeCenter

[添加API描述]

```typescript
export const drawShapeCenter = (
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### appendAlpha

- **类型**: function
- **文件**: `utils/rendering/colorUtils.ts:13`
- **签名**: `export function appendAlpha(color: string, alpha: number = 1): string {`

**建议文档结构**:
```markdown
### appendAlpha

[添加API描述]

```typescript
export function appendAlpha(color: string, alpha: number = 1): string {
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### renderOptimizer

- **类型**: constant
- **文件**: `utils/rendering/RenderOptimizer.ts:293`
- **签名**: `export const renderOptimizer = RenderOptimizer.getInstance();`

**建议文档结构**:
```markdown
### renderOptimizer

[添加API描述]

```typescript
export const renderOptimizer = RenderOptimizer.getInstance();
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### generateSimplePuzzle

- **类型**: function
- **文件**: `utils/puzzle/simplePuzzleGenerator.ts:13`
- **签名**: `export function generateSimplePuzzle( shape: Point[], cutType: "straight" | "diagonal", cutCount: number ): { pieces: PuzzlePiece[]; originalPositions: PuzzlePiece[] } {`

**建议文档结构**:
```markdown
### generateSimplePuzzle

[添加API描述]

```typescript
export function generateSimplePuzzle( shape: Point[], cutType: "straight" | "diagonal", cutCount: number ): { pieces: PuzzlePiece[]; originalPositions: PuzzlePiece[] } {
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### splitPolygon

- **类型**: constant
- **文件**: `utils/puzzle/puzzleUtils.ts:37`
- **签名**: `export const splitPolygon = (shape: Point[], cuts: CutLine[]): Point[][] => {`

**建议文档结构**:
```markdown
### splitPolygon

[添加API描述]

```typescript
export const splitPolygon = (shape: Point[], cuts: CutLine[]): Point[][] => {
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### isValidPiece

- **类型**: constant
- **文件**: `utils/puzzle/puzzleUtils.ts:337`
- **签名**: `export const isValidPiece = (piece: Point[]): boolean => {`

**建议文档结构**:
```markdown
### isValidPiece

[添加API描述]

```typescript
export const isValidPiece = (piece: Point[]): boolean => {
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### checkRectOverlap

- **类型**: constant
- **文件**: `utils/puzzle/puzzleUtils.ts:342`
- **签名**: `export const checkRectOverlap = (rect1: { x: number, y: number, width: number, height: number }, rect2: { x: number, y: number, width: number, height: number }): boolean => {`

**建议文档结构**:
```markdown
### checkRectOverlap

[添加API描述]

```typescript
export const checkRectOverlap = (rect1: { x: number, y: number, width: number, height: number }, rect2: { x: number, y: number, width: number, height: number }): boolean => {
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### findLineIntersections

- **类型**: function
- **文件**: `utils/puzzle/puzzleUtils.ts:354`
- **签名**: `export function findLineIntersections( line1: { start: Point; end: Point }, line2: { start: Point; end: Point } ): Point[] {`

**建议文档结构**:
```markdown
### findLineIntersections

[添加API描述]

```typescript
export function findLineIntersections( line1: { start: Point; end: Point }, line2: { start: Point; end: Point } ): Point[] {
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### Cut

- **类型**: type
- **文件**: `utils/puzzle/puzzleCompensation.ts:3`
- **签名**: `export type Cut = {`

**建议文档结构**:
```markdown
### Cut

[添加API描述]

```typescript
export type Cut = {
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### Bounds

- **类型**: type
- **文件**: `utils/puzzle/cutGeneratorTypes.ts:7`
- **签名**: `export type Bounds = {`

**建议文档结构**:
```markdown
### Bounds

[添加API描述]

```typescript
export type Bounds = {
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### computeBounds

- **类型**: constant
- **文件**: `utils/puzzle/puzzleCompensation.ts:21`
- **签名**: `export const computeBounds = (shape: Point[]): Bounds => {`

**建议文档结构**:
```markdown
### computeBounds

[添加API描述]

```typescript
export const computeBounds = (shape: Point[]): Bounds => {
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### buildExtraCuts

- **类型**: constant
- **文件**: `utils/puzzle/puzzleCompensation.ts:34`
- **签名**: `export const buildExtraCuts = (params: {`

**建议文档结构**:
```markdown
### buildExtraCuts

[添加API描述]

```typescript
export const buildExtraCuts = (params: {
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### applyExtraCutsWithRetry

- **类型**: constant
- **文件**: `utils/puzzle/puzzleCompensation.ts:78`
- **签名**: `export const applyExtraCutsWithRetry = (params: {`

**建议文档结构**:
```markdown
### applyExtraCutsWithRetry

[添加API描述]

```typescript
export const applyExtraCutsWithRetry = (params: {
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### generateCuts

- **类型**: constant
- **文件**: `utils/puzzle/cutGenerators.ts:49`
- **签名**: `export const generateCuts = (`

**建议文档结构**:
```markdown
### generateCuts

[添加API描述]

```typescript
export const generateCuts = (
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### CutValidator

- **类型**: interface
- **文件**: `utils/puzzle/cutGeneratorTypes.ts:46`
- **签名**: `export interface CutValidator {`

**建议文档结构**:
```markdown
### CutValidator

[添加API描述]

```typescript
export interface CutValidator {
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### CutLine

- **类型**: type
- **文件**: `utils/puzzle/cutGeneratorTypes.ts:14`
- **签名**: `export type CutLine = {`

**建议文档结构**:
```markdown
### CutLine

[添加API描述]

```typescript
export type CutLine = {
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### CutType

- **类型**: type
- **文件**: `utils/puzzle/cutGeneratorTypes.ts:22`
- **签名**: `export type CutType = "straight" | "diagonal";`

**建议文档结构**:
```markdown
### CutType

[添加API描述]

```typescript
export type CutType = "straight" | "diagonal";
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### CutGenerationContext

- **类型**: interface
- **文件**: `utils/puzzle/cutGeneratorTypes.ts:24`
- **签名**: `export interface CutGenerationContext {`

**建议文档结构**:
```markdown
### CutGenerationContext

[添加API描述]

```typescript
export interface CutGenerationContext {
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### CutGenerationResult

- **类型**: interface
- **文件**: `utils/puzzle/cutGeneratorTypes.ts:33`
- **签名**: `export interface CutGenerationResult {`

**建议文档结构**:
```markdown
### CutGenerationResult

[添加API描述]

```typescript
export interface CutGenerationResult {
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### CutGenerationStrategy

- **类型**: interface
- **文件**: `utils/puzzle/cutGeneratorStrategies.ts:15`
- **签名**: `export interface CutGenerationStrategy {`

**建议文档结构**:
```markdown
### CutGenerationStrategy

[添加API描述]

```typescript
export interface CutGenerationStrategy {
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### GeometryUtils

- **类型**: interface
- **文件**: `utils/puzzle/cutGeneratorTypes.ts:50`
- **签名**: `export interface GeometryUtils {`

**建议文档结构**:
```markdown
### GeometryUtils

[添加API描述]

```typescript
export interface GeometryUtils {
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### SimpleCutStrategy

- **类型**: class
- **文件**: `utils/puzzle/cutGeneratorStrategies.ts:25`
- **签名**: `export class SimpleCutStrategy implements CutGenerationStrategy {`

**建议文档结构**:
```markdown
### SimpleCutStrategy

[添加API描述]

```typescript
export class SimpleCutStrategy implements CutGenerationStrategy {
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### MediumCutStrategy

- **类型**: class
- **文件**: `utils/puzzle/cutGeneratorStrategies.ts:32`
- **签名**: `export class MediumCutStrategy implements CutGenerationStrategy {`

**建议文档结构**:
```markdown
### MediumCutStrategy

[添加API描述]

```typescript
export class MediumCutStrategy implements CutGenerationStrategy {
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### HardCutStrategy

- **类型**: class
- **文件**: `utils/puzzle/cutGeneratorStrategies.ts:79`
- **签名**: `export class HardCutStrategy implements CutGenerationStrategy {`

**建议文档结构**:
```markdown
### HardCutStrategy

[添加API描述]

```typescript
export class HardCutStrategy implements CutGenerationStrategy {
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### CutStrategyFactory

- **类型**: class
- **文件**: `utils/puzzle/cutGeneratorStrategies.ts:143`
- **签名**: `export class CutStrategyFactory {`

**建议文档结构**:
```markdown
### CutStrategyFactory

[添加API描述]

```typescript
export class CutStrategyFactory {
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### doesCutIntersectShape

- **类型**: constant
- **文件**: `utils/puzzle/cutGeneratorGeometry.ts:65`
- **签名**: `export const doesCutIntersectShape = (cut: CutLine, shape: Point[]): number => {`

**建议文档结构**:
```markdown
### doesCutIntersectShape

[添加API描述]

```typescript
export const doesCutIntersectShape = (cut: CutLine, shape: Point[]): number => {
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### cutsAreTooClose

- **类型**: constant
- **文件**: `utils/puzzle/cutGeneratorGeometry.ts:80`
- **签名**: `export const cutsAreTooClose = (cut1: CutLine, cut2: CutLine, minDistance: number = CUT_GENERATOR_CONFIG.MIN_CUT_DISTANCE): boolean => {`

**建议文档结构**:
```markdown
### cutsAreTooClose

[添加API描述]

```typescript
export const cutsAreTooClose = (cut1: CutLine, cut2: CutLine, minDistance: number = CUT_GENERATOR_CONFIG.MIN_CUT_DISTANCE): boolean => {
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### generateStraightCutLine

- **类型**: constant
- **文件**: `utils/puzzle/cutGeneratorGeometry.ts:114`
- **签名**: `export const generateStraightCutLine = (bounds: Bounds): CutLine => {`

**建议文档结构**:
```markdown
### generateStraightCutLine

[添加API描述]

```typescript
export const generateStraightCutLine = (bounds: Bounds): CutLine => {
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### generateDiagonalCutLine

- **类型**: constant
- **文件**: `utils/puzzle/cutGeneratorGeometry.ts:141`
- **签名**: `export const generateDiagonalCutLine = (bounds: Bounds): CutLine => {`

**建议文档结构**:
```markdown
### generateDiagonalCutLine

[添加API描述]

```typescript
export const generateDiagonalCutLine = (bounds: Bounds): CutLine => {
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### generateCenterCutLine

- **类型**: constant
- **文件**: `utils/puzzle/cutGeneratorGeometry.ts:159`
- **签名**: `export const generateCenterCutLine = (shape: Point[], isStraight: boolean, cutType: "straight" | "diagonal"): CutLine => {`

**建议文档结构**:
```markdown
### generateCenterCutLine

[添加API描述]

```typescript
export const generateCenterCutLine = (shape: Point[], isStraight: boolean, cutType: "straight" | "diagonal"): CutLine => {
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### generateForcedCutLine

- **类型**: constant
- **文件**: `utils/puzzle/cutGeneratorGeometry.ts:191`
- **签名**: `export const generateForcedCutLine = (shape: Point[], existingCuts: CutLine[], cutType: "straight" | "diagonal" = "diagonal"): CutLine | null => {`

**建议文档结构**:
```markdown
### generateForcedCutLine

[添加API描述]

```typescript
export const generateForcedCutLine = (shape: Point[], existingCuts: CutLine[], cutType: "straight" | "diagonal" = "diagonal"): CutLine | null => {
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### CutGeneratorController

- **类型**: class
- **文件**: `utils/puzzle/cutGeneratorController.ts:16`
- **签名**: `export class CutGeneratorController {`

**建议文档结构**:
```markdown
### CutGeneratorController

[添加API描述]

```typescript
export class CutGeneratorController {
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### CUT_GENERATOR_CONFIG

- **类型**: constant
- **文件**: `utils/puzzle/cutGeneratorConfig.ts:6`
- **签名**: `export const CUT_GENERATOR_CONFIG = {`

**建议文档结构**:
```markdown
### CUT_GENERATOR_CONFIG

[添加API描述]

```typescript
export const CUT_GENERATOR_CONFIG = {
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### DIFFICULTY_SETTINGS

- **类型**: constant
- **文件**: `utils/puzzle/cutGeneratorConfig.ts:116`
- **签名**: `export const DIFFICULTY_SETTINGS = CUT_GENERATOR_CONFIG.DIFFICULTY_SETTINGS;`

**建议文档结构**:
```markdown
### DIFFICULTY_SETTINGS

[添加API描述]

```typescript
export const DIFFICULTY_SETTINGS = CUT_GENERATOR_CONFIG.DIFFICULTY_SETTINGS;
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### MAX_ATTEMPTS

- **类型**: constant
- **文件**: `utils/puzzle/cutGeneratorConfig.ts:117`
- **签名**: `export const MAX_ATTEMPTS = CUT_GENERATOR_CONFIG.MAX_ATTEMPTS;`

**建议文档结构**:
```markdown
### MAX_ATTEMPTS

[添加API描述]

```typescript
export const MAX_ATTEMPTS = CUT_GENERATOR_CONFIG.MAX_ATTEMPTS;
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### EARLY_EXIT_THRESHOLD

- **类型**: constant
- **文件**: `utils/puzzle/cutGeneratorConfig.ts:118`
- **签名**: `export const EARLY_EXIT_THRESHOLD = CUT_GENERATOR_CONFIG.EARLY_EXIT_THRESHOLD;`

**建议文档结构**:
```markdown
### EARLY_EXIT_THRESHOLD

[添加API描述]

```typescript
export const EARLY_EXIT_THRESHOLD = CUT_GENERATOR_CONFIG.EARLY_EXIT_THRESHOLD;
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### DifficultyLevel

- **类型**: type
- **文件**: `utils/puzzle/cutGeneratorConfig.ts:120`
- **签名**: `export type DifficultyLevel = keyof typeof CUT_GENERATOR_CONFIG.DIFFICULTY_SETTINGS;`

**建议文档结构**:
```markdown
### DifficultyLevel

[添加API描述]

```typescript
export type DifficultyLevel = keyof typeof CUT_GENERATOR_CONFIG.DIFFICULTY_SETTINGS;
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### DifficultySettings

- **类型**: type
- **文件**: `utils/puzzle/cutGeneratorConfig.ts:121`
- **签名**: `export type DifficultySettings = typeof CUT_GENERATOR_CONFIG.DIFFICULTY_SETTINGS[DifficultyLevel];`

**建议文档结构**:
```markdown
### DifficultySettings

[添加API描述]

```typescript
export type DifficultySettings = typeof CUT_GENERATOR_CONFIG.DIFFICULTY_SETTINGS[DifficultyLevel];
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### PieceRange

- **类型**: interface
- **文件**: `utils/puzzle/cutGeneratorConfig.ts:124`
- **签名**: `export interface PieceRange {`

**建议文档结构**:
```markdown
### PieceRange

[添加API描述]

```typescript
export interface PieceRange {
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### EnhancedDifficultySettings

- **类型**: interface
- **文件**: `utils/puzzle/cutGeneratorConfig.ts:129`
- **签名**: `export interface EnhancedDifficultySettings {`

**建议文档结构**:
```markdown
### EnhancedDifficultySettings

[添加API描述]

```typescript
export interface EnhancedDifficultySettings {
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### LeaderboardSimplifier

- **类型**: class
- **文件**: `utils/leaderboard/LeaderboardSimplifier.ts:15`
- **签名**: `export class LeaderboardSimplifier {`

**建议文档结构**:
```markdown
### LeaderboardSimplifier

[添加API描述]

```typescript
export class LeaderboardSimplifier {
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### rotatePoint

- **类型**: function
- **文件**: `utils/geometry/puzzleGeometry.ts:84`
- **签名**: `export function rotatePoint(x: number, y: number, cx: number, cy: number, angle: number): {x: number, y: number} {`

**建议文档结构**:
```markdown
### rotatePoint

[添加API描述]

```typescript
export function rotatePoint(x: number, y: number, cx: number, cy: number, angle: number): {x: number, y: number} {
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### calculateAngle

- **类型**: function
- **文件**: `utils/geometry/puzzleGeometry.ts:101`
- **签名**: `export function calculateAngle(x1: number, y1: number, x2: number, y2: number): number {`

**建议文档结构**:
```markdown
### calculateAngle

[添加API描述]

```typescript
export function calculateAngle(x1: number, y1: number, x2: number, y2: number): number {
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### calculatePieceBounds

- **类型**: function
- **文件**: `utils/geometry/puzzleGeometry.ts:105`
- **签名**: `export function calculatePieceBounds(piece: { points: Point[] }): { minX: number; maxX: number; minY: number; maxY: number; width: number; height: number; centerX: number; centerY: number } {`

**建议文档结构**:
```markdown
### calculatePieceBounds

[添加API描述]

```typescript
export function calculatePieceBounds(piece: { points: Point[] }): { minX: number; maxX: number; minY: number; maxY: number; width: number; height: number; centerX: number; centerY: number } {
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### calculateDifficultyLevel

- **类型**: constant
- **文件**: `utils/difficulty/DifficultyUtils.ts:11`
- **签名**: `export const calculateDifficultyLevel = (cutCount: number): DifficultyLevel => {`

**建议文档结构**:
```markdown
### calculateDifficultyLevel

[添加API描述]

```typescript
export const calculateDifficultyLevel = (cutCount: number): DifficultyLevel => {
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### getPieceCountByDifficulty

- **类型**: constant
- **文件**: `utils/difficulty/DifficultyUtils.ts:22`
- **签名**: `export const getPieceCountByDifficulty = (difficulty: DifficultyLevel): number => {`

**建议文档结构**:
```markdown
### getPieceCountByDifficulty

[添加API描述]

```typescript
export const getPieceCountByDifficulty = (difficulty: DifficultyLevel): number => {
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### getDifficultyMultiplier

- **类型**: constant
- **文件**: `utils/difficulty/DifficultyUtils.ts:36`
- **签名**: `export const getDifficultyMultiplier = (difficulty: DifficultyLevel): number => {`

**建议文档结构**:
```markdown
### getDifficultyMultiplier

[添加API描述]

```typescript
export const getDifficultyMultiplier = (difficulty: DifficultyLevel): number => {
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### ALL_DIFFICULTY_LEVELS

- **类型**: constant
- **文件**: `utils/difficulty/DifficultyUtils.ts:49`
- **签名**: `export const ALL_DIFFICULTY_LEVELS: DifficultyLevel[] = ['easy', 'medium', 'hard', 'extreme', 'expert'];`

**建议文档结构**:
```markdown
### ALL_DIFFICULTY_LEVELS

[添加API描述]

```typescript
export const ALL_DIFFICULTY_LEVELS: DifficultyLevel[] = ['easy', 'medium', 'hard', 'extreme', 'expert'];
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### isValidDifficultyLevel

- **类型**: constant
- **文件**: `utils/difficulty/DifficultyUtils.ts:54`
- **签名**: `export const isValidDifficultyLevel = (difficulty: string): difficulty is DifficultyLevel => {`

**建议文档结构**:
```markdown
### isValidDifficultyLevel

[添加API描述]

```typescript
export const isValidDifficultyLevel = (difficulty: string): difficulty is DifficultyLevel => {
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### clearAllGameData

- **类型**: function
- **文件**: `utils/data-tools/clearGameData.ts:4`
- **签名**: `export function clearAllGameData() {`

**建议文档结构**:
```markdown
### clearAllGameData

[添加API描述]

```typescript
export function clearAllGameData() {
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### checkGameDataStatus

- **类型**: function
- **文件**: `utils/data-tools/clearGameData.ts:24`
- **签名**: `export function checkGameDataStatus() {`

**建议文档结构**:
```markdown
### checkGameDataStatus

[添加API描述]

```typescript
export function checkGameDataStatus() {
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### GameDataTools

- **类型**: class
- **文件**: `utils/data-tools/GameDataTools.ts:9`
- **签名**: `export class GameDataTools {`

**建议文档结构**:
```markdown
### GameDataTools

[添加API描述]

```typescript
export class GameDataTools {
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### GameDataManager

- **类型**: class
- **文件**: `utils/data/GameDataManager.ts:8`
- **签名**: `export class GameDataManager {`

**建议文档结构**:
```markdown
### GameDataManager

[添加API描述]

```typescript
export class GameDataManager {
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### UseAngleDisplayReturn

- **类型**: interface
- **文件**: `utils/angleDisplay/useAngleDisplay.ts:11`
- **签名**: `export interface UseAngleDisplayReturn {`

**建议文档结构**:
```markdown
### UseAngleDisplayReturn

[添加API描述]

```typescript
export interface UseAngleDisplayReturn {
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### useAngleDisplay

- **类型**: constant
- **文件**: `utils/angleDisplay/useAngleDisplay.ts:31`
- **签名**: `export const useAngleDisplay = (): UseAngleDisplayReturn => {`

**建议文档结构**:
```markdown
### useAngleDisplay

[添加API描述]

```typescript
export const useAngleDisplay = (): UseAngleDisplayReturn => {
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### HintEnhancedDisplay

- **类型**: interface
- **文件**: `utils/angleDisplay/HintEnhancedDisplay.ts:6`
- **签名**: `export interface HintEnhancedDisplay {`

**建议文档结构**:
```markdown
### HintEnhancedDisplay

[添加API描述]

```typescript
export interface HintEnhancedDisplay {
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### activateHintWithAngle

- **类型**: constant
- **文件**: `utils/angleDisplay/HintEnhancedDisplay.ts:19`
- **签名**: `export const activateHintWithAngle = (`

**建议文档结构**:
```markdown
### activateHintWithAngle

[添加API描述]

```typescript
export const activateHintWithAngle = (
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### deactivateHintWithAngle

- **类型**: constant
- **文件**: `utils/angleDisplay/HintEnhancedDisplay.ts:37`
- **签名**: `export const deactivateHintWithAngle = (pieceId: number): { pieceId: number } => {`

**建议文档结构**:
```markdown
### deactivateHintWithAngle

[添加API描述]

```typescript
export const deactivateHintWithAngle = (pieceId: number): { pieceId: number } => {
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### isAngleTemporaryVisible

- **类型**: constant
- **文件**: `utils/angleDisplay/HintEnhancedDisplay.ts:47`
- **签名**: `export const isAngleTemporaryVisible = (`

**建议文档结构**:
```markdown
### isAngleTemporaryVisible

[添加API描述]

```typescript
export const isAngleTemporaryVisible = (
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### getHintDuration

- **类型**: constant
- **文件**: `utils/angleDisplay/HintEnhancedDisplay.ts:59`
- **签名**: `export const getHintDuration = (cutCount: number): number => {`

**建议文档结构**:
```markdown
### getHintDuration

[添加API描述]

```typescript
export const getHintDuration = (cutCount: number): number => {
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### needsAngleEnhancement

- **类型**: constant
- **文件**: `utils/angleDisplay/HintEnhancedDisplay.ts:75`
- **签名**: `export const needsAngleEnhancement = (cutCount: number): boolean => {`

**建议文档结构**:
```markdown
### needsAngleEnhancement

[添加API描述]

```typescript
export const needsAngleEnhancement = (cutCount: number): boolean => {
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### HintEnhancedDisplayImpl

- **类型**: constant
- **文件**: `utils/angleDisplay/HintEnhancedDisplay.ts:82`
- **签名**: `export const HintEnhancedDisplayImpl: HintEnhancedDisplay = {`

**建议文档结构**:
```markdown
### HintEnhancedDisplayImpl

[添加API描述]

```typescript
export const HintEnhancedDisplayImpl: HintEnhancedDisplay = {
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### AngleVisibilityManager

- **类型**: interface
- **文件**: `utils/angleDisplay/AngleVisibilityManager.ts:12`
- **签名**: `export interface AngleVisibilityManager {`

**建议文档结构**:
```markdown
### AngleVisibilityManager

[添加API描述]

```typescript
export interface AngleVisibilityManager {
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### getAngleDisplayState

- **类型**: constant
- **文件**: `utils/angleDisplay/AngleVisibilityManager.ts:25`
- **签名**: `export const getAngleDisplayState = (`

**建议文档结构**:
```markdown
### getAngleDisplayState

[添加API描述]

```typescript
export const getAngleDisplayState = (
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### updateVisibilityRule

- **类型**: constant
- **文件**: `utils/angleDisplay/AngleVisibilityManager.ts:54`
- **签名**: `export const updateVisibilityRule = (cutCount: number): 'always' | 'conditional' => {`

**建议文档结构**:
```markdown
### updateVisibilityRule

[添加API描述]

```typescript
export const updateVisibilityRule = (cutCount: number): 'always' | 'conditional' => {
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### setTemporaryVisible

- **类型**: constant
- **文件**: `utils/angleDisplay/AngleVisibilityManager.ts:64`
- **签名**: `export const setTemporaryVisible = (`

**建议文档结构**:
```markdown
### setTemporaryVisible

[添加API描述]

```typescript
export const setTemporaryVisible = (
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### AngleVisibilityManagerImpl

- **类型**: constant
- **文件**: `utils/angleDisplay/AngleVisibilityManager.ts:74`
- **签名**: `export const AngleVisibilityManagerImpl: AngleVisibilityManager = {`

**建议文档结构**:
```markdown
### AngleVisibilityManagerImpl

[添加API描述]

```typescript
export const AngleVisibilityManagerImpl: AngleVisibilityManager = {
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### AngleDisplayService

- **类型**: interface
- **文件**: `utils/angleDisplay/AngleDisplayService.ts:10`
- **签名**: `export interface AngleDisplayService {`

**建议文档结构**:
```markdown
### AngleDisplayService

[添加API描述]

```typescript
export interface AngleDisplayService {
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### angleDisplayService

- **类型**: constant
- **文件**: `utils/angleDisplay/AngleDisplayService.ts:61`
- **签名**: `export const angleDisplayService = new AngleDisplayServiceImpl();`

**建议文档结构**:
```markdown
### angleDisplayService

[添加API描述]

```typescript
export const angleDisplayService = new AngleDisplayServiceImpl();
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### AngleDisplayModeUpdater

- **类型**: interface
- **文件**: `utils/angleDisplay/AngleDisplayModeUpdater.ts:8`
- **签名**: `export interface AngleDisplayModeUpdater {`

**建议文档结构**:
```markdown
### AngleDisplayModeUpdater

[添加API描述]

```typescript
export interface AngleDisplayModeUpdater {
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### updateModeOnCutCountChange

- **类型**: constant
- **文件**: `utils/angleDisplay/AngleDisplayModeUpdater.ts:20`
- **签名**: `export const updateModeOnCutCountChange = (cutCount: number): 'always' | 'conditional' => {`

**建议文档结构**:
```markdown
### updateModeOnCutCountChange

[添加API描述]

```typescript
export const updateModeOnCutCountChange = (cutCount: number): 'always' | 'conditional' => {
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### createModeUpdateAction

- **类型**: constant
- **文件**: `utils/angleDisplay/AngleDisplayModeUpdater.ts:29`
- **签名**: `export const createModeUpdateAction = (cutCount: number): GameAction => {`

**建议文档结构**:
```markdown
### createModeUpdateAction

[添加API描述]

```typescript
export const createModeUpdateAction = (cutCount: number): GameAction => {
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### shouldClearTemporaryDisplay

- **类型**: constant
- **文件**: `utils/angleDisplay/AngleDisplayModeUpdater.ts:42`
- **签名**: `export const shouldClearTemporaryDisplay = (oldCutCount: number, newCutCount: number): boolean => {`

**建议文档结构**:
```markdown
### shouldClearTemporaryDisplay

[添加API描述]

```typescript
export const shouldClearTemporaryDisplay = (oldCutCount: number, newCutCount: number): boolean => {
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### getTransitionEffect

- **类型**: constant
- **文件**: `utils/angleDisplay/AngleDisplayModeUpdater.ts:56`
- **签名**: `export const getTransitionEffect = (`

**建议文档结构**:
```markdown
### getTransitionEffect

[添加API描述]

```typescript
export const getTransitionEffect = (
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### processCutCountChanges

- **类型**: constant
- **文件**: `utils/angleDisplay/AngleDisplayModeUpdater.ts:80`
- **签名**: `export const processCutCountChanges = (`

**建议文档结构**:
```markdown
### processCutCountChanges

[添加API描述]

```typescript
export const processCutCountChanges = (
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### createCutCountUpdateActions

- **类型**: constant
- **文件**: `utils/angleDisplay/AngleDisplayModeUpdater.ts:112`
- **签名**: `export const createCutCountUpdateActions = (newCutCount: number): GameAction[] => {`

**建议文档结构**:
```markdown
### createCutCountUpdateActions

[添加API描述]

```typescript
export const createCutCountUpdateActions = (newCutCount: number): GameAction[] => {
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### validateCutCount

- **类型**: constant
- **文件**: `utils/angleDisplay/AngleDisplayModeUpdater.ts:129`
- **签名**: `export const validateCutCount = (cutCount: number): boolean => {`

**建议文档结构**:
```markdown
### validateCutCount

[添加API描述]

```typescript
export const validateCutCount = (cutCount: number): boolean => {
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### getCutCountDifficultyLevel

- **类型**: constant
- **文件**: `utils/angleDisplay/AngleDisplayModeUpdater.ts:138`
- **签名**: `export const getCutCountDifficultyLevel = (cutCount: number): string => {`

**建议文档结构**:
```markdown
### getCutCountDifficultyLevel

[添加API描述]

```typescript
export const getCutCountDifficultyLevel = (cutCount: number): string => {
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### AngleDisplayModeUpdaterImpl

- **类型**: constant
- **文件**: `utils/angleDisplay/AngleDisplayModeUpdater.ts:148`
- **签名**: `export const AngleDisplayModeUpdaterImpl: AngleDisplayModeUpdater = {`

**建议文档结构**:
```markdown
### AngleDisplayModeUpdaterImpl

[添加API描述]

```typescript
export const AngleDisplayModeUpdaterImpl: AngleDisplayModeUpdater = {
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### AngleDisplayController

- **类型**: interface
- **文件**: `utils/angleDisplay/AngleDisplayController.ts:6`
- **签名**: `export interface AngleDisplayController {`

**建议文档结构**:
```markdown
### AngleDisplayController

[添加API描述]

```typescript
export interface AngleDisplayController {
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### shouldShowAngle

- **类型**: constant
- **文件**: `utils/angleDisplay/AngleDisplayController.ts:19`
- **签名**: `export const shouldShowAngle = (`

**建议文档结构**:
```markdown
### shouldShowAngle

[添加API描述]

```typescript
export const shouldShowAngle = (
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### getAngleDisplayMode

- **类型**: constant
- **文件**: `utils/angleDisplay/AngleDisplayController.ts:43`
- **签名**: `export const getAngleDisplayMode = (cutCount: number): 'always' | 'conditional' => {`

**建议文档结构**:
```markdown
### getAngleDisplayMode

[添加API描述]

```typescript
export const getAngleDisplayMode = (cutCount: number): 'always' | 'conditional' => {
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### isHintTemporaryDisplay

- **类型**: constant
- **文件**: `utils/angleDisplay/AngleDisplayController.ts:53`
- **签名**: `export const isHintTemporaryDisplay = (`

**建议文档结构**:
```markdown
### isHintTemporaryDisplay

[添加API描述]

```typescript
export const isHintTemporaryDisplay = (
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### updateDisplayRule

- **类型**: constant
- **文件**: `utils/angleDisplay/AngleDisplayController.ts:66`
- **签名**: `export const updateDisplayRule = (cutCount: number): 'always' | 'conditional' => {`

**建议文档结构**:
```markdown
### updateDisplayRule

[添加API描述]

```typescript
export const updateDisplayRule = (cutCount: number): 'always' | 'conditional' => {
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### AngleDisplayControllerImpl

- **类型**: constant
- **文件**: `utils/angleDisplay/AngleDisplayController.ts:73`
- **签名**: `export const AngleDisplayControllerImpl: AngleDisplayController = {`

**建议文档结构**:
```markdown
### AngleDisplayControllerImpl

[添加API描述]

```typescript
export const AngleDisplayControllerImpl: AngleDisplayController = {
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

## 📂 分类统计

### 配置管理API (39个)

- ❌ `EVENT_CONFIG` (constant)
- ❌ `MEMORY_CONFIG` (constant)
- ❌ `PERFORMANCE_THRESHOLDS` (constant)
- ❌ `OPTIMIZATION_FLAGS` (constant)
- ❌ `BROWSER_SUPPORT` (constant)
- ❌ `ERROR_HANDLING` (constant)
- ❌ `LOGGING_CONFIG` (constant)
- ❌ `PerformanceMetrics` (interface)
- ❌ `PerformanceThresholds` (interface)
- ❌ `EventTimingConfig` (interface)
- ❌ `DEVELOPMENT_LOGGING_CONFIG` (constant)
- ❌ `PRODUCTION_LOGGING_CONFIG` (constant)
- ❌ `TESTING_LOGGING_CONFIG` (constant)
- ❌ `getLoggingConfig` (function)
- ❌ `COMPONENT_CONTEXTS` (constant)
- ❌ `LOG_PATTERNS` (constant)
- ❌ `UNIFIED_CONFIG` (constant)
- ❌ `ADAPTATION_CONFIG` (constant)
- ❌ `validateConfig` (function)
- ❌ `getConfigInfo` (function)
- ❌ `DEVICE_THRESHOLDS` (constant)
- ✅ `IPHONE16_MODELS` (constant)
- ❌ `DETECTION_CONFIG` (constant)
- ❌ `LARGE_SCREEN_THRESHOLDS` (constant)
- ❌ `USER_AGENT_PATTERNS` (constant)
- ❌ `DeviceType` (type)
- ❌ `LayoutMode` (type)
- ❌ `iPhone16Model` (type)
- ✅ `DeviceState` (interface)
- ❌ `iPhone16Detection` (interface)
- ❌ `DeviceLayoutInfo` (interface)
- ✅ `DESKTOP_ADAPTATION` (constant)
- ✅ `MOBILE_ADAPTATION` (constant)
- ❌ `IPHONE16_OPTIMIZATION` (constant)
- ❌ `HIGH_RESOLUTION_MOBILE` (constant)
- ❌ `CANVAS_SAFETY` (constant)
- ❌ `AdaptationContext` (interface)
- ❌ `AdaptationResult` (interface)
- ❌ `CanvasSizeResult` (interface)

### 核心管理器API (70个)

- ❌ `ValidationRule` (interface)
- ❌ `ValidationSchema` (interface)
- ❌ `ValidationResult` (interface)
- ❌ `ValidationError` (interface)
- ❌ `ValidationWarning` (interface)
- ✅ `ValidationService` (class)
- ❌ `ResizeObserverManager` (class)
- ❌ `LogContext` (interface)
- ❌ `LogEntry` (interface)
- ❌ `LoggingConfig` (interface)
- ✅ `LoggingService` (class)
- ❌ `EventScheduler` (class)
- ❌ `EventManager` (class)
- ❌ `MonitoringConfig` (interface)
- ❌ `ErrorMetrics` (interface)
- ❌ `AlertCondition` (interface)
- ❌ `MonitoringAlert` (interface)
- ✅ `ErrorMonitoringService` (class)
- ❌ `ErrorContext` (interface)
- ❌ `ErrorReport` (interface)
- ❌ `ErrorRecoveryStrategy` (interface)
- ❌ `ErrorHandlingConfig` (interface)
- ✅ `ErrorHandlingService` (class)
- ✅ `DeviceManager` (class)
- ❌ `DeviceLayoutManager` (class)
- ✅ `CanvasManager` (class)
- ❌ `setHintConfig` (constant)
- ❌ `getShapeMultiplier` (constant)
- ❌ `getDeviceMultiplier` (constant)
- ❌ `calculateDifficultyMultiplier` (constant)
- ❌ `getBaseScore` (constant)
- ❌ `getBaseScoreByPieces` (constant)
- ❌ `getBaseDifficultyMultiplierByPieces` (constant)
- ❌ `getHintAllowance` (constant)
- ❌ `getHintAllowanceByCutCount` (constant)
- ❌ `calculateMinimumRotationsAtStart` (constant)
- ❌ `calculateMinimumRotations` (constant)
- ❌ `calculateRotationEfficiency` (constant)
- ❌ `formatRotationDisplay` (constant)
- ❌ `calculateRotationEfficiencyPercentage` (constant)
- ❌ `calculateRemainingRotations` (constant)
- ❌ `checkTimeRecord` (constant)
- ❌ `calculateTimeBonus` (constant)
- ❌ `validateScoreParams` (constant)
- ❌ `calculateLiveScore` (constant)
- ❌ `calculateRotationScore` (constant)
- ❌ `calculateHintScore` (constant)
- ❌ `calculateHintScoreFromStats` (constant)
- ❌ `calculateScoreDelta` (constant)
- ❌ `withPerformanceMonitoring` (constant)
- ❌ `calculateLiveScoreWithMonitoring` (constant)
- ❌ `safeCalculateScore` (constant)
- ❌ `formatScore` (constant)
- ❌ `formatTime` (constant)
- ❌ `debounce` (constant)
- ❌ `createLiveScoreUpdater` (constant)
- ❌ `calculateFinalScore` (constant)
- ❌ `updateStatsWithOptimalSolution` (constant)
- ❌ `formatRankDisplay` (constant)
- ❌ `getNewRecordBadge` (constant)
- ❌ `calculateLeaderboardStats` (constant)
- ❌ `calculateScoreWithLeaderboard` (constant)
- ❌ `RotationEfficiencyResult` (interface)
- ❌ `TranslationFunction` (type)
- ❌ `RotationDataValidator` (class)
- ❌ `RotationScoreErrorHandler` (class)
- ❌ `RotationEfficiencyCalculator` (class)
- ❌ `calculateNewRotationScore` (constant)
- ❌ `calculateNewRotationScoreWithI18n` (constant)
- ❌ `formatNewRotationDisplay` (constant)

### React Hooks API (21个)

- ❌ `useResponsiveCanvasSizing` (function)
- ✅ `usePuzzleInteractions` (function)
- ❌ `PanelView` (type)
- ❌ `PanelState` (interface)
- ❌ `usePanelState` (constant)
- ❌ `MobileEnhancementState` (interface)
- ❌ `MobileEnhancementCallbacks` (interface)
- ❌ `useMobileEnhancements` (function)
- ❌ `useKeyboardDetection` (function)
- ❌ `useNetworkStatus` (function)
- ❌ `useDeviceRotation` (function)
- ❌ `UseMobileAdaptationOptions` (interface)
- ❌ `MobileAdaptationHookResult` (interface)
- ✅ `useMobileAdaptation` (function)
- ❌ `useMobileAdaptationProvider` (function)
- ✅ `useDeviceType` (function)
- ❌ `useOrientation` (function)
- ❌ `useKeyboard` (function)
- ❌ `useDeviceDetection` (function)
- ❌ `useDebugToggle` (function)
- ❌ `reducer` (constant)

### 工具函数API (140个)

- ❌ `deviceLogger` (constant)
- ✅ `adaptationLogger` (constant)
- ✅ `puzzleLogger` (constant)
- ❌ `canvasLogger` (constant)
- ❌ `eventLogger` (constant)
- ✅ `useCanvasLogger` (constant)
- ❌ `useCanvasSizeLogger` (constant)
- ❌ `useCanvasRefsLogger` (constant)
- ❌ `useCanvasEventsLogger` (constant)
- ❌ `loggers` (constant)
- ❌ `performanceLogger` (constant)
- ✅ `debugLogger` (constant)
- ❌ `errorLogger` (constant)
- ❌ `loggingStats` (constant)
- ❌ `calculateCenter` (constant)
- ❌ `MIN_SCREEN_WIDTH` (constant)
- ❌ `MIN_SCREEN_HEIGHT` (constant)
- ❌ `MIN_SHAPE_DIAMETER` (constant)
- ❌ `MAX_SHAPE_DIAMETER` (constant)
- ❌ `MIN_SHAPE_AREA` (constant)
- ❌ `generateSimpleShape` (function)
- ❌ `calculatePolygonArea` (constant)
- ❌ `calculateBounds` (constant)
- ❌ `createSafeZone` (constant)
- ❌ `lineIntersection` (constant)
- ❌ `distanceToLine` (constant)
- ❌ `isPointInPolygon` (function)
- ❌ `isPointNearLine` (constant)
- ❌ `ShapeGenerator` (class)
- ❌ `OptimizedShapeGenerator` (class)
- ❌ `soundPlayedForTest` (constant)
- ❌ `initBackgroundMusic` (constant)
- ❌ `toggleBackgroundMusic` (constant)
- ❌ `getBackgroundMusicStatus` (constant)
- ❌ `autoStartBackgroundMusic` (constant)
- ❌ `playButtonClickSound` (constant)
- ✅ `playPieceSelectSound` (constant)
- ❌ `playPieceSnapSound` (constant)
- ✅ `playPuzzleCompletedSound` (constant)
- ✅ `playRotateSound` (constant)
- ❌ `playCutSound` (constant)
- ❌ `playScatterSound` (constant)
- ❌ `PuzzlePiece` (interface)
- ✅ `drawShape` (constant)
- ❌ `drawPiece` (constant)
- ✅ `drawHintOutline` (constant)
- ❌ `drawCompletionEffect` (constant)
- ✅ `drawCanvasBorderLine` (constant)
- ❌ `drawDistributionArea` (constant)
- ✅ `drawPuzzle` (constant)
- ❌ `drawCanvasCenter` (constant)
- ❌ `drawShapeCenter` (constant)
- ❌ `appendAlpha` (function)
- ✅ `RenderOptimizer` (class)
- ❌ `renderOptimizer` (constant)
- ❌ `generateSimplePuzzle` (function)
- ❌ `splitPolygon` (constant)
- ✅ `splitPieceWithLine` (constant)
- ❌ `isValidPiece` (constant)
- ❌ `checkRectOverlap` (constant)
- ❌ `findLineIntersections` (function)
- ❌ `Cut` (type)
- ❌ `Bounds` (type)
- ❌ `computeBounds` (constant)
- ❌ `buildExtraCuts` (constant)
- ❌ `applyExtraCutsWithRetry` (constant)
- ❌ `generateCuts` (constant)
- ❌ `CutValidator` (interface)
- ❌ `CutLine` (type)
- ❌ `CutType` (type)
- ❌ `CutGenerationContext` (interface)
- ❌ `CutGenerationResult` (interface)
- ❌ `CutGenerationStrategy` (interface)
- ❌ `GeometryUtils` (interface)
- ❌ `SimpleCutStrategy` (class)
- ❌ `MediumCutStrategy` (class)
- ❌ `HardCutStrategy` (class)
- ❌ `CutStrategyFactory` (class)
- ❌ `doesCutIntersectShape` (constant)
- ❌ `cutsAreTooClose` (constant)
- ❌ `generateStraightCutLine` (constant)
- ❌ `generateDiagonalCutLine` (constant)
- ❌ `generateCenterCutLine` (constant)
- ❌ `generateForcedCutLine` (constant)
- ❌ `CutGeneratorController` (class)
- ❌ `CUT_GENERATOR_CONFIG` (constant)
- ❌ `DIFFICULTY_SETTINGS` (constant)
- ❌ `MAX_ATTEMPTS` (constant)
- ❌ `EARLY_EXIT_THRESHOLD` (constant)
- ❌ `DifficultyLevel` (type)
- ❌ `DifficultySettings` (type)
- ❌ `PieceRange` (interface)
- ❌ `EnhancedDifficultySettings` (interface)
- ✅ `ScatterPuzzle` (class)
- ✅ `PuzzleGenerator` (class)
- ❌ `LeaderboardSimplifier` (class)
- ❌ `rotatePoint` (function)
- ❌ `calculateAngle` (function)
- ❌ `calculatePieceBounds` (function)
- ❌ `calculateDifficultyLevel` (constant)
- ❌ `getPieceCountByDifficulty` (constant)
- ❌ `getDifficultyMultiplier` (constant)
- ❌ `ALL_DIFFICULTY_LEVELS` (constant)
- ❌ `isValidDifficultyLevel` (constant)
- ❌ `clearAllGameData` (function)
- ❌ `checkGameDataStatus` (function)
- ❌ `GameDataTools` (class)
- ❌ `GameDataManager` (class)
- ❌ `UseAngleDisplayReturn` (interface)
- ❌ `useAngleDisplay` (constant)
- ❌ `HintEnhancedDisplay` (interface)
- ❌ `activateHintWithAngle` (constant)
- ❌ `deactivateHintWithAngle` (constant)
- ❌ `isAngleTemporaryVisible` (constant)
- ❌ `getHintDuration` (constant)
- ❌ `needsAngleEnhancement` (constant)
- ❌ `HintEnhancedDisplayImpl` (constant)
- ❌ `AngleVisibilityManager` (interface)
- ❌ `getAngleDisplayState` (constant)
- ❌ `updateVisibilityRule` (constant)
- ❌ `setTemporaryVisible` (constant)
- ❌ `AngleVisibilityManagerImpl` (constant)
- ❌ `AngleDisplayService` (interface)
- ❌ `angleDisplayService` (constant)
- ❌ `AngleDisplayModeUpdater` (interface)
- ❌ `updateModeOnCutCountChange` (constant)
- ❌ `createModeUpdateAction` (constant)
- ❌ `shouldClearTemporaryDisplay` (constant)
- ❌ `getTransitionEffect` (constant)
- ❌ `processCutCountChanges` (constant)
- ❌ `createCutCountUpdateActions` (constant)
- ❌ `validateCutCount` (constant)
- ❌ `getCutCountDifficultyLevel` (constant)
- ❌ `AngleDisplayModeUpdaterImpl` (constant)
- ❌ `AngleDisplayController` (interface)
- ❌ `shouldShowAngle` (constant)
- ❌ `getAngleDisplayMode` (constant)
- ❌ `isHintTemporaryDisplay` (constant)
- ❌ `updateDisplayRule` (constant)
- ❌ `AngleDisplayControllerImpl` (constant)

