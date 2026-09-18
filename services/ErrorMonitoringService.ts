/**
 * ErrorMonitoringService - Error monitoring and reporting system
 * Provides real-time error monitoring, alerting, and reporting capabilities
 */

import { LoggingService } from './LoggingService';
import { ErrorHandlingService, ErrorReport, ErrorSeverity, ErrorCategory } from './ErrorHandlingService';

export interface MonitoringConfig {
  enableRealTimeMonitoring: boolean;
  alertThresholds: {
    errorRate: number; // errors per minute
    criticalErrors: number; // critical errors per hour
    recoveryFailureRate: number; // percentage
  };
  reportingInterval: number; // milliseconds
  retentionPeriod: number; // milliseconds
}

export interface ErrorMetrics {
  totalErrors: number;
  errorRate: number; // errors per minute
  criticalErrors: number;
  recoveryRate: number;
  topErrorCategories: Array<{ category: ErrorCategory; count: number }>;
  errorTrends: Array<{ timestamp: number; count: number }>;
}

export interface AlertCondition {
  id: string;
  name: string;
  condition: (metrics: ErrorMetrics) => boolean;
  severity: ErrorSeverity;
  message: string;
  cooldownPeriod: number; // milliseconds
  lastTriggered?: number;
}

export interface MonitoringAlert {
  id: string;
  conditionId: string;
  severity: ErrorSeverity;
  message: string;
  timestamp: number;
  metrics: ErrorMetrics;
  acknowledged: boolean;
}

export class ErrorMonitoringService {
  private static instance: ErrorMonitoringService;
  private logger: LoggingService;
  private errorHandler: ErrorHandlingService;
  private config: MonitoringConfig;
  private errorHistory: Array<{ timestamp: number; report: ErrorReport }> = [];
  private alerts: MonitoringAlert[] = [];
  private alertConditions: Map<string, AlertCondition> = new Map();
  private monitoringInterval?: NodeJS.Timeout;
  private metricsCache?: { metrics: ErrorMetrics; timestamp: number };

  private constructor() {
    this.logger = LoggingService.getInstance();
    this.errorHandler = ErrorHandlingService.getInstance();
    this.config = {
      enableRealTimeMonitoring: true,
      alertThresholds: {
        errorRate: 10, // 10 errors per minute
        criticalErrors: 5, // 5 critical errors per hour
        recoveryFailureRate: 50 // 50% recovery failure rate
      },
      reportingInterval: 60000, // 1 minute
      retentionPeriod: 24 * 60 * 60 * 1000 // 24 hours
    };

    this.setupDefaultAlertConditions();
  }

  public static getInstance(): ErrorMonitoringService {
    if (!ErrorMonitoringService.instance) {
      ErrorMonitoringService.instance = new ErrorMonitoringService();
    }
    return ErrorMonitoringService.instance;
  }

  /**
   * Configure monitoring behavior
   */
  public configure(config: Partial<MonitoringConfig>): void {
    this.config = { ...this.config, ...config };
    
    if (this.config.enableRealTimeMonitoring) {
      this.startMonitoring();
    } else {
      this.stopMonitoring();
    }
  }

  /**
   * Start real-time monitoring
   */
  public startMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }

    this.monitoringInterval = setInterval(() => {
      this.performMonitoringCheck();
    }, this.config.reportingInterval);

    this.logger.info('Error monitoring started', {
      reportingInterval: this.config.reportingInterval,
      retentionPeriod: this.config.retentionPeriod
    });
  }

  /**
   * Stop monitoring
   */
  public stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }

    this.logger.info('Error monitoring stopped');
  }

  /**
   * Record an error for monitoring
   */
  public recordError(report: ErrorReport): void {
    this.errorHistory.push({
      timestamp: Date.now(),
      report
    });

    // Clean up old entries
    this.cleanupOldEntries();

    // Clear metrics cache to force recalculation
    this.metricsCache = undefined;

    // Check for immediate alerts if monitoring is enabled
    if (this.config.enableRealTimeMonitoring) {
      this.checkAlertConditions();
    }
  }

  /**
   * Get current error metrics
   */
  public getMetrics(): ErrorMetrics {
    // Use cached metrics if available and recent
    if (this.metricsCache && Date.now() - this.metricsCache.timestamp < 30000) {
      return this.metricsCache.metrics;
    }

    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    const oneHourAgo = now - 3600000;

    // Filter recent errors
    const recentErrors = this.errorHistory.filter(entry => entry.timestamp >= oneMinuteAgo);
    const hourlyErrors = this.errorHistory.filter(entry => entry.timestamp >= oneHourAgo);

    // Calculate metrics
    const totalErrors = this.errorHistory.length;
    const errorRate = recentErrors.length; // errors per minute
    const criticalErrors = hourlyErrors.filter(entry => 
      entry.report.severity === ErrorSeverity.CRITICAL
    ).length;

    // Calculate recovery rate
    const errorsWithRecoveryAttempt = this.errorHistory.filter(entry => 
      entry.report.retryCount > 0
    );
    const recoveredErrors = errorsWithRecoveryAttempt.filter(entry => 
      entry.report.recovered
    );
    const recoveryRate = errorsWithRecoveryAttempt.length > 0 
      ? (recoveredErrors.length / errorsWithRecoveryAttempt.length) * 100 
      : 100;

    // Top error categories
    const categoryCount: Record<string, number> = {};
    this.errorHistory.forEach(entry => {
      const category = entry.report.category;
      categoryCount[category] = (categoryCount[category] || 0) + 1;
    });

    const topErrorCategories = Object.entries(categoryCount)
      .map(([category, count]) => ({ category: category as ErrorCategory, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Error trends (last 10 minutes in 1-minute buckets)
    const errorTrends: Array<{ timestamp: number; count: number }> = [];
    for (let i = 9; i >= 0; i--) {
      const bucketStart = now - (i + 1) * 60000;
      const bucketEnd = now - i * 60000;
      const bucketErrors = this.errorHistory.filter(entry => 
        entry.timestamp >= bucketStart && entry.timestamp < bucketEnd
      );
      errorTrends.push({
        timestamp: bucketStart,
        count: bucketErrors.length
      });
    }

    const metrics: ErrorMetrics = {
      totalErrors,
      errorRate,
      criticalErrors,
      recoveryRate,
      topErrorCategories,
      errorTrends
    };

    // Cache the metrics
    this.metricsCache = {
      metrics,
      timestamp: now
    };

    return metrics;
  }

  /**
   * Get active alerts
   */
  public getActiveAlerts(): MonitoringAlert[] {
    return this.alerts.filter(alert => !alert.acknowledged);
  }

  /**
   * Acknowledge an alert
   */
  public acknowledgeAlert(alertId: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      this.logger.info('Alert acknowledged', { alertId, message: alert.message });
      return true;
    }
    return false;
  }

  /**
   * Add custom alert condition
   */
  public addAlertCondition(condition: AlertCondition): void {
    this.alertConditions.set(condition.id, condition);
    this.logger.info('Alert condition added', { conditionId: condition.id, name: condition.name });
  }

  /**
   * Remove alert condition
   */
  public removeAlertCondition(conditionId: string): boolean {
    const removed = this.alertConditions.delete(conditionId);
    if (removed) {
      this.logger.info('Alert condition removed', { conditionId });
    }
    return removed;
  }

  /**
   * Generate monitoring report
   */
  public generateReport(): {
    summary: ErrorMetrics;
    alerts: MonitoringAlert[];
    recommendations: string[];
  } {
    const metrics = this.getMetrics();
    const activeAlerts = this.getActiveAlerts();
    const recommendations = this.generateRecommendations(metrics);

    return {
      summary: metrics,
      alerts: activeAlerts,
      recommendations
    };
  }

  /**
   * Export monitoring data
   */
  public exportData(format: 'json' | 'csv' = 'json'): string {
    const data = {
      metrics: this.getMetrics(),
      alerts: this.alerts,
      errorHistory: this.errorHistory.slice(-100) // Last 100 errors
    };

    if (format === 'json') {
      return JSON.stringify(data, null, 2);
    } else {
      // CSV format for error history
      const headers = ['timestamp', 'category', 'severity', 'component', 'message', 'recovered'];
      const rows = this.errorHistory.slice(-100).map(entry => [
        new Date(entry.timestamp).toISOString(),
        entry.report.category,
        entry.report.severity,
        entry.report.context.component,
        entry.report.error.message,
        entry.report.recovered.toString()
      ]);
      
      return [headers, ...rows].map(row => row.join(',')).join('\n');
    }
  }

  /**
   * Setup default alert conditions
   */
  private setupDefaultAlertConditions(): void {
    // High error rate alert
    this.addAlertCondition({
      id: 'high-error-rate',
      name: 'High Error Rate',
      condition: (metrics) => metrics.errorRate > this.config.alertThresholds.errorRate,
      severity: ErrorSeverity.HIGH,
      message: `Error rate exceeded threshold: ${this.config.alertThresholds.errorRate} errors/minute`,
      cooldownPeriod: 300000 // 5 minutes
    });

    // Critical errors alert
    this.addAlertCondition({
      id: 'critical-errors',
      name: 'Critical Errors',
      condition: (metrics) => metrics.criticalErrors > this.config.alertThresholds.criticalErrors,
      severity: ErrorSeverity.CRITICAL,
      message: `Critical errors exceeded threshold: ${this.config.alertThresholds.criticalErrors} errors/hour`,
      cooldownPeriod: 600000 // 10 minutes
    });

    // Low recovery rate alert
    this.addAlertCondition({
      id: 'low-recovery-rate',
      name: 'Low Recovery Rate',
      condition: (metrics) => metrics.recoveryRate < (100 - this.config.alertThresholds.recoveryFailureRate),
      severity: ErrorSeverity.HIGH,
      message: `Recovery rate below threshold: ${100 - this.config.alertThresholds.recoveryFailureRate}%`,
      cooldownPeriod: 900000 // 15 minutes
    });
  }

  /**
   * Perform monitoring check
   */
  private performMonitoringCheck(): void {
    try {
      this.cleanupOldEntries();
      this.checkAlertConditions();
      
      const metrics = this.getMetrics();
      this.logger.debug('Monitoring check completed', {
        totalErrors: metrics.totalErrors,
        errorRate: metrics.errorRate,
        recoveryRate: metrics.recoveryRate
      });
    } catch (error) {
      this.logger.error('Monitoring check failed', error as Error);
    }
  }

  /**
   * Check alert conditions
   */
  private checkAlertConditions(): void {
    const metrics = this.getMetrics();
    const now = Date.now();

    this.alertConditions.forEach((condition, conditionId) => {
      try {
        // Check cooldown period
        if (condition.lastTriggered && 
            now - condition.lastTriggered < condition.cooldownPeriod) {
          return;
        }

        // Check condition
        if (condition.condition(metrics)) {
          const alert: MonitoringAlert = {
            id: this.generateAlertId(),
            conditionId,
            severity: condition.severity,
            message: condition.message,
            timestamp: now,
            metrics: { ...metrics },
            acknowledged: false
          };

          this.alerts.push(alert);
          condition.lastTriggered = now;

          // Log the alert
          const logMethod = condition.severity === ErrorSeverity.CRITICAL ? 'error' : 'warn';
          this.logger[logMethod]('Monitoring alert triggered', new Error(condition.message), {
            alertId: alert.id,
            conditionId,
            severity: condition.severity
          });
        }
      } catch (error) {
        this.logger.error('Alert condition check failed', error as Error, {
          conditionId,
          conditionName: condition.name
        });
      }
    });
  }

  /**
   * Clean up old entries
   */
  private cleanupOldEntries(): void {
    const cutoffTime = Date.now() - this.config.retentionPeriod;
    
    // Clean up error history
    this.errorHistory = this.errorHistory.filter(entry => entry.timestamp >= cutoffTime);
    
    // Clean up old alerts (keep for 7 days)
    const alertCutoffTime = Date.now() - (7 * 24 * 60 * 60 * 1000);
    this.alerts = this.alerts.filter(alert => alert.timestamp >= alertCutoffTime);
  }

  /**
   * Generate recommendations based on metrics
   */
  private generateRecommendations(metrics: ErrorMetrics): string[] {
    const recommendations: string[] = [];

    if (metrics.errorRate > this.config.alertThresholds.errorRate) {
      recommendations.push('Consider implementing additional error prevention measures due to high error rate');
    }

    if (metrics.recoveryRate < 70) {
      recommendations.push('Review and improve error recovery strategies - current recovery rate is below optimal');
    }

    if (metrics.criticalErrors > 0) {
      recommendations.push('Investigate and address critical errors immediately');
    }

    if (metrics.topErrorCategories.length > 0) {
      const topCategory = metrics.topErrorCategories[0];
      recommendations.push(`Focus on ${topCategory.category} errors - they represent the highest error volume`);
    }

    // Trend analysis
    const recentTrend = metrics.errorTrends.slice(-3);
    const isIncreasing = recentTrend.length >= 2 && 
      recentTrend[recentTrend.length - 1].count > recentTrend[0].count;
    
    if (isIncreasing) {
      recommendations.push('Error rate is trending upward - monitor closely and consider preventive action');
    }

    return recommendations;
  }

  /**
   * Generate unique alert ID
   */
  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}