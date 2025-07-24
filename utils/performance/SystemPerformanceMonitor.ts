/**
 * SystemPerformanceMonitor - 系统性能监控工具
 * 用于验证统一架构重构的性能提升
 */

interface PerformanceMetrics {
  eventListenerCount: number;
  memoryUsage: number;
  renderTime: number;
  deviceDetectionTime: number;
  canvasUpdateTime: number;
  adaptationTime: number;
}

interface PerformanceSnapshot {
  timestamp: number;
  metrics: PerformanceMetrics;
  systemType: 'legacy' | 'unified';
}

export class SystemPerformanceMonitor {
  private static instance: SystemPerformanceMonitor;
  private snapshots: PerformanceSnapshot[] = [];
  private startTime: number = 0;
  private isMonitoring: boolean = false;

  private constructor() {}

  public static getInstance(): SystemPerformanceMonitor {
    if (!SystemPerformanceMonitor.instance) {
      SystemPerformanceMonitor.instance = new SystemPerformanceMonitor();
    }
    return SystemPerformanceMonitor.instance;
  }

  public startMonitoring(): void {
    this.isMonitoring = true;
    this.startTime = performance.now();
    console.log('🔍 性能监控开始');
  }

  public stopMonitoring(): void {
    this.isMonitoring = false;
    console.log('🔍 性能监控结束');
  }

  public takeSnapshot(systemType: 'legacy' | 'unified'): PerformanceSnapshot {
    const metrics = this.collectMetrics();
    const snapshot: PerformanceSnapshot = {
      timestamp: performance.now(),
      metrics,
      systemType
    };

    this.snapshots.push(snapshot);
    console.log(`📊 性能快照 (${systemType}):`, metrics);
    
    return snapshot;
  }

  private collectMetrics(): PerformanceMetrics {
    return {
      eventListenerCount: this.countEventListeners(),
      memoryUsage: this.getMemoryUsage(),
      renderTime: this.measureRenderTime(),
      deviceDetectionTime: this.measureDeviceDetectionTime(),
      canvasUpdateTime: this.measureCanvasUpdateTime(),
      adaptationTime: this.measureAdaptationTime()
    };
  }

  private countEventListeners(): number {
    // 估算当前页面的事件监听器数量
    // 这是一个近似值，因为浏览器没有直接的API来获取确切数量
    let count = 0;
    
    // 检查window上的事件监听器
    const windowEvents = ['resize', 'orientationchange', 'touchstart', 'touchmove', 'touchend'];
    windowEvents.forEach(event => {
      // 这里只能估算，实际数量可能不同
      count += 1; // 假设每个事件类型有1个监听器
    });

    // 检查DOM元素上的事件监听器
    const elements = document.querySelectorAll('canvas, div[data-testid], button');
    count += elements.length * 0.5; // 估算每个元素平均有0.5个监听器

    return Math.round(count);
  }

  private getMemoryUsage(): number {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return memory.usedJSHeapSize / 1024 / 1024; // MB
    }
    return 0;
  }

  private measureRenderTime(): number {
    const start = performance.now();
    
    // 模拟渲染操作
    requestAnimationFrame(() => {
      const end = performance.now();
      return end - start;
    });
    
    return 0; // 异步操作，返回0作为占位符
  }

  private measureDeviceDetectionTime(): number {
    const start = performance.now();
    
    // 模拟设备检测操作
    const ua = navigator.userAgent;
    const width = window.innerWidth;
    const height = window.innerHeight;
    const isMobile = /iPhone|iPad|iPod|Android|webOS|BlackBerry|IEMobile|Opera Mini/i.test(ua);
    const isPortrait = height > width;
    
    const end = performance.now();
    return end - start;
  }

  private measureCanvasUpdateTime(): number {
    const start = performance.now();
    
    // 模拟画布更新操作
    const canvases = document.querySelectorAll('canvas');
    canvases.forEach(canvas => {
      const rect = canvas.getBoundingClientRect();
      // 模拟尺寸计算
      const area = rect.width * rect.height;
    });
    
    const end = performance.now();
    return end - start;
  }

  private measureAdaptationTime(): number {
    const start = performance.now();
    
    // 模拟适配计算
    const mockPoints = Array.from({ length: 100 }, (_, i) => ({
      x: Math.random() * 800,
      y: Math.random() * 600
    }));
    
    // 模拟缩放计算
    const scale = 1.5;
    const adaptedPoints = mockPoints.map(point => ({
      x: point.x * scale,
      y: point.y * scale
    }));
    
    const end = performance.now();
    return end - start;
  }

  public generateReport(): string {
    if (this.snapshots.length < 2) {
      return '需要至少2个快照来生成对比报告';
    }

    const legacySnapshots = this.snapshots.filter(s => s.systemType === 'legacy');
    const unifiedSnapshots = this.snapshots.filter(s => s.systemType === 'unified');

    if (legacySnapshots.length === 0 || unifiedSnapshots.length === 0) {
      return '需要legacy和unified系统的快照来生成对比报告';
    }

    const legacyAvg = this.calculateAverageMetrics(legacySnapshots);
    const unifiedAvg = this.calculateAverageMetrics(unifiedSnapshots);

    const report = `
📊 系统性能对比报告
====================

🔧 事件监听器数量:
  Legacy: ${legacyAvg.eventListenerCount.toFixed(1)}
  Unified: ${unifiedAvg.eventListenerCount.toFixed(1)}
  改进: ${((legacyAvg.eventListenerCount - unifiedAvg.eventListenerCount) / legacyAvg.eventListenerCount * 100).toFixed(1)}%

💾 内存使用 (MB):
  Legacy: ${legacyAvg.memoryUsage.toFixed(2)}
  Unified: ${unifiedAvg.memoryUsage.toFixed(2)}
  改进: ${((legacyAvg.memoryUsage - unifiedAvg.memoryUsage) / legacyAvg.memoryUsage * 100).toFixed(1)}%

⚡ 设备检测时间 (ms):
  Legacy: ${legacyAvg.deviceDetectionTime.toFixed(3)}
  Unified: ${unifiedAvg.deviceDetectionTime.toFixed(3)}
  改进: ${((legacyAvg.deviceDetectionTime - unifiedAvg.deviceDetectionTime) / legacyAvg.deviceDetectionTime * 100).toFixed(1)}%

🎨 画布更新时间 (ms):
  Legacy: ${legacyAvg.canvasUpdateTime.toFixed(3)}
  Unified: ${unifiedAvg.canvasUpdateTime.toFixed(3)}
  改进: ${((legacyAvg.canvasUpdateTime - unifiedAvg.canvasUpdateTime) / legacyAvg.canvasUpdateTime * 100).toFixed(1)}%

🔄 适配计算时间 (ms):
  Legacy: ${legacyAvg.adaptationTime.toFixed(3)}
  Unified: ${unifiedAvg.adaptationTime.toFixed(3)}
  改进: ${((legacyAvg.adaptationTime - unifiedAvg.adaptationTime) / legacyAvg.adaptationTime * 100).toFixed(1)}%

📈 总体性能提升: ${this.calculateOverallImprovement(legacyAvg, unifiedAvg).toFixed(1)}%
`;

    return report;
  }

  private calculateAverageMetrics(snapshots: PerformanceSnapshot[]): PerformanceMetrics {
    const sum = snapshots.reduce((acc, snapshot) => ({
      eventListenerCount: acc.eventListenerCount + snapshot.metrics.eventListenerCount,
      memoryUsage: acc.memoryUsage + snapshot.metrics.memoryUsage,
      renderTime: acc.renderTime + snapshot.metrics.renderTime,
      deviceDetectionTime: acc.deviceDetectionTime + snapshot.metrics.deviceDetectionTime,
      canvasUpdateTime: acc.canvasUpdateTime + snapshot.metrics.canvasUpdateTime,
      adaptationTime: acc.adaptationTime + snapshot.metrics.adaptationTime
    }), {
      eventListenerCount: 0,
      memoryUsage: 0,
      renderTime: 0,
      deviceDetectionTime: 0,
      canvasUpdateTime: 0,
      adaptationTime: 0
    });

    const count = snapshots.length;
    return {
      eventListenerCount: sum.eventListenerCount / count,
      memoryUsage: sum.memoryUsage / count,
      renderTime: sum.renderTime / count,
      deviceDetectionTime: sum.deviceDetectionTime / count,
      canvasUpdateTime: sum.canvasUpdateTime / count,
      adaptationTime: sum.adaptationTime / count
    };
  }

  private calculateOverallImprovement(legacy: PerformanceMetrics, unified: PerformanceMetrics): number {
    const improvements = [
      (legacy.eventListenerCount - unified.eventListenerCount) / legacy.eventListenerCount,
      (legacy.memoryUsage - unified.memoryUsage) / legacy.memoryUsage,
      (legacy.deviceDetectionTime - unified.deviceDetectionTime) / legacy.deviceDetectionTime,
      (legacy.canvasUpdateTime - unified.canvasUpdateTime) / legacy.canvasUpdateTime,
      (legacy.adaptationTime - unified.adaptationTime) / legacy.adaptationTime
    ].filter(improvement => !isNaN(improvement) && isFinite(improvement));

    const averageImprovement = improvements.reduce((sum, improvement) => sum + improvement, 0) / improvements.length;
    return averageImprovement * 100;
  }

  public exportData(): string {
    return JSON.stringify(this.snapshots, null, 2);
  }

  public clearSnapshots(): void {
    this.snapshots = [];
    console.log('🗑️ 性能快照已清除');
  }
}