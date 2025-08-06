# API扫描报告

> 生成时间: 2025/8/7 02:10:10
> 扫描工具: API变更扫描器 v1.0

## 📊 统计概览

| 项目 | 数量 | 说明 |
|------|------|------|
| API总数 | 151 | 项目中所有导出的API |
| 已文档化 | 32 | 在API文档中已记录的API |
| 文档覆盖率 | 21.2% | 文档化程度 |
| 新增API | 122 | 需要添加到文档的API |
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
- **文件**: `core/ValidationService.ts:20`
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
- **文件**: `utils/geometry/puzzleGeometry.ts:7`
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

#### CanvasSize

- **类型**: interface
- **文件**: `utils/shape/shapeAdaptationUtils.ts:14`
- **签名**: `export interface CanvasSize {`

**建议文档结构**:
```markdown
### CanvasSize

[添加API描述]

```typescript
export interface CanvasSize {
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### AdaptationOptions

- **类型**: interface
- **文件**: `utils/shape/shapeAdaptationUtils.ts:22`
- **签名**: `export interface AdaptationOptions {`

**建议文档结构**:
```markdown
### AdaptationOptions

[添加API描述]

```typescript
export interface AdaptationOptions {
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### adaptShapeToCanvas

- **类型**: function
- **文件**: `utils/shape/shapeAdaptationUtils.ts:80`
- **签名**: `export function adaptShapeToCanvas( originalShape: Point[], oldSize: CanvasSize, newSize: CanvasSize, options: AdaptationOptions = {}`

**建议文档结构**:
```markdown
### adaptShapeToCanvas

[添加API描述]

```typescript
export function adaptShapeToCanvas( originalShape: Point[], oldSize: CanvasSize, newSize: CanvasSize, options: AdaptationOptions = {}
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### scaleShapeToSize

- **类型**: function
- **文件**: `utils/shape/shapeAdaptationUtils.ts:208`
- **签名**: `export function scaleShapeToSize( shape: Point[], targetSize: number, canvasSize: CanvasSize ): Point[] {`

**建议文档结构**:
```markdown
### scaleShapeToSize

[添加API描述]

```typescript
export function scaleShapeToSize( shape: Point[], targetSize: number, canvasSize: CanvasSize ): Point[] {
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### isShapeInBounds

- **类型**: function
- **文件**: `utils/shape/shapeAdaptationUtils.ts:280`
- **签名**: `export function isShapeInBounds( shape: Point[], canvasSize: CanvasSize, margin: number = 0 ): boolean {`

**建议文档结构**:
```markdown
### isShapeInBounds

[添加API描述]

```typescript
export function isShapeInBounds( shape: Point[], canvasSize: CanvasSize, margin: number = 0 ): boolean {
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
- **文件**: `utils/shape/geometryUtils.ts:35`
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
- **文件**: `utils/shape/geometryUtils.ts:61`
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
- **文件**: `utils/geometry/puzzleGeometry.ts:17`
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
- **文件**: `utils/shape/geometryUtils.ts:138`
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
- **文件**: `utils/rendering/soundEffects.ts:48`
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
- **文件**: `utils/rendering/soundEffects.ts:72`
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

#### playButtonClickSound

- **类型**: constant
- **文件**: `utils/rendering/soundEffects.ts:77`
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
- **文件**: `utils/rendering/soundEffects.ts:140`
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
- **文件**: `utils/rendering/soundEffects.ts:235`
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

#### PuzzlePiece

- **类型**: interface
- **文件**: `utils/rendering/puzzleDrawing.ts:8`
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

#### Point

- **类型**: interface
- **文件**: `utils/geometry/puzzleGeometry.ts:1`
- **签名**: `export interface Point {`

**建议文档结构**:
```markdown
### Point

[添加API描述]

```typescript
export interface Point {
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### drawPiece

- **类型**: constant
- **文件**: `utils/rendering/puzzleDrawing.ts:105`
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
- **文件**: `utils/rendering/puzzleDrawing.ts:348`
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
- **文件**: `utils/rendering/puzzleDrawing.ts:438`
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
- **文件**: `utils/rendering/puzzleDrawing.ts:702`
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
- **文件**: `utils/rendering/puzzleDrawing.ts:736`
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
- **文件**: `utils/rendering/RenderOptimizer.ts:175`
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
- **文件**: `utils/puzzle/puzzleUtils.ts:269`
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
- **文件**: `utils/puzzle/puzzleUtils.ts:274`
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

#### generateCuts

- **类型**: constant
- **文件**: `utils/puzzle/cutGenerators.ts:85`
- **签名**: `export const generateCuts = (shape: Point[], count: number, type: "straight" | "diagonal"): CutLine[] => {`

**建议文档结构**:
```markdown
### generateCuts

[添加API描述]

```typescript
export const generateCuts = (shape: Point[], count: number, type: "straight" | "diagonal"): CutLine[] => {
```

#### 使用示例

```typescript
// [添加使用示例]
```
```

#### rotatePoint

- **类型**: function
- **文件**: `utils/geometry/puzzleGeometry.ts:62`
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
- **文件**: `utils/geometry/puzzleGeometry.ts:79`
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
- **文件**: `utils/geometry/puzzleGeometry.ts:83`
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

### 核心管理器API (26个)

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

### React Hooks API (18个)

- ❌ `useResponsiveCanvasSizing` (function)
- ✅ `usePuzzleInteractions` (function)
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

### 工具函数API (68个)

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
- ❌ `CanvasSize` (interface)
- ❌ `AdaptationOptions` (interface)
- ❌ `adaptShapeToCanvas` (function)
- ✅ `centerShapeInCanvas` (function)
- ❌ `scaleShapeToSize` (function)
- ❌ `isShapeInBounds` (function)
- ❌ `calculatePolygonArea` (constant)
- ❌ `calculateBounds` (constant)
- ❌ `createSafeZone` (constant)
- ❌ `lineIntersection` (constant)
- ❌ `distanceToLine` (constant)
- ❌ `isPointInPolygon` (function)
- ❌ `isPointNearLine` (constant)
- ❌ `ShapeGenerator` (class)
- ❌ `soundPlayedForTest` (constant)
- ❌ `initBackgroundMusic` (constant)
- ❌ `toggleBackgroundMusic` (constant)
- ❌ `getBackgroundMusicStatus` (constant)
- ❌ `playButtonClickSound` (constant)
- ✅ `playPieceSelectSound` (constant)
- ❌ `playPieceSnapSound` (constant)
- ✅ `playPuzzleCompletedSound` (constant)
- ✅ `playRotateSound` (constant)
- ❌ `playCutSound` (constant)
- ❌ `PuzzlePiece` (interface)
- ❌ `Point` (interface)
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
- ❌ `splitPolygon` (constant)
- ✅ `splitPieceWithLine` (constant)
- ❌ `isValidPiece` (constant)
- ❌ `checkRectOverlap` (constant)
- ❌ `generateCuts` (constant)
- ✅ `ScatterPuzzle` (class)
- ✅ `PuzzleGenerator` (class)
- ❌ `rotatePoint` (function)
- ❌ `calculateAngle` (function)
- ❌ `calculatePieceBounds` (function)

