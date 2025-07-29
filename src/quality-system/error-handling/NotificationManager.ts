// Error Notification Management System

import { QualitySystemError, ErrorSeverity, ErrorCategory } from './ErrorTypes';
import { ILogger, INotificationService } from '../interfaces';

export interface NotificationTemplate {
  title: string;
  message: string;
  actionText?: string;
  actionUrl?: string;
  dismissible: boolean;
  autoHide: boolean;
  hideDelay: number;
  icon: string;
  color: 'info' | 'warning' | 'error' | 'success';
}

export interface UserNotification {
  id: string;
  type: 'toast' | 'modal' | 'banner' | 'inline';
  severity: ErrorSeverity;
  template: NotificationTemplate;
  timestamp: Date;
  userId?: string;
  sessionId?: string;
  correlationId: string;
  acknowledged: boolean;
  retryable: boolean;
  retryAction?: () => Promise<void>;
}

export interface TeamNotification {
  id: string;
  type: 'email' | 'slack' | 'webhook' | 'dashboard';
  severity: ErrorSeverity;
  error: QualitySystemError;
  timestamp: Date;
  recipients: string[];
  escalationLevel: number;
  acknowledged: boolean;
  assignee?: string;
}

export class NotificationManager {
  private logger: ILogger;
  private notificationService: INotificationService;
  private userNotifications: Map<string, UserNotification> = new Map();
  private teamNotifications: Map<string, TeamNotification> = new Map();
  private notificationTemplates: Map<string, NotificationTemplate> = new Map();
  private escalationRules: Map<ErrorSeverity, number[]> = new Map();

  constructor(logger: ILogger, notificationService: INotificationService) {
    this.logger = logger;
    this.notificationService = notificationService;
    this.initializeTemplates();
    this.initializeEscalationRules();
  }

  async notifyUser(error: QualitySystemError, retryAction?: () => Promise<void>): Promise<void> {
    if (!error.metadata.userNotification) {
      return;
    }

    const notificationId = this.generateNotificationId();
    const template = this.getUserNotificationTemplate(error);

    const notification: UserNotification = {
      id: notificationId,
      type: this.determineNotificationType(error),
      severity: error.severity,
      template,
      timestamp: new Date(),
      userId: error.userId,
      sessionId: error.sessionId,
      correlationId: error.correlationId,
      acknowledged: false,
      retryable: error.metadata.retryable,
      retryAction
    };

    this.userNotifications.set(notificationId, notification);

    this.logger.info('User notification created', {
      notificationId,
      correlationId: error.correlationId,
      severity: error.severity,
      type: notification.type
    });

    try {
      await this.sendUserNotification(notification);
    } catch (notificationError) {
      this.logger.error('Failed to send user notification', notificationError as Error, {
        notificationId,
        correlationId: error.correlationId
      });
    }
  }

  async notifyTeam(error: QualitySystemError): Promise<void> {
    if (!error.metadata.teamNotification) {
      return;
    }

    const notificationId = this.generateNotificationId();
    const recipients = this.getTeamRecipients(error);

    const notification: TeamNotification = {
      id: notificationId,
      type: this.determineTeamNotificationType(error),
      severity: error.severity,
      error,
      timestamp: new Date(),
      recipients,
      escalationLevel: 0,
      acknowledged: false
    };

    this.teamNotifications.set(notificationId, notification);

    this.logger.info('Team notification created', {
      notificationId,
      correlationId: error.correlationId,
      severity: error.severity,
      recipients: recipients.length
    });

    try {
      await this.sendTeamNotification(notification);
      await this.scheduleEscalation(notification);
    } catch (notificationError) {
      this.logger.error('Failed to send team notification', notificationError as Error, {
        notificationId,
        correlationId: error.correlationId
      });
    }
  }

  private async sendUserNotification(notification: UserNotification): Promise<void> {
    const { template, type, severity } = notification;

    switch (type) {
      case 'toast':
        await this.sendToastNotification(notification);
        break;
      case 'modal':
        await this.sendModalNotification(notification);
        break;
      case 'banner':
        await this.sendBannerNotification(notification);
        break;
      case 'inline':
        await this.sendInlineNotification(notification);
        break;
    }

    // Auto-hide if configured
    if (template.autoHide && template.hideDelay > 0) {
      setTimeout(() => {
        this.dismissUserNotification(notification.id);
      }, template.hideDelay);
    }
  }

  private async sendToastNotification(notification: UserNotification): Promise<void> {
    // This would integrate with a toast notification system
    this.logger.debug('Sending toast notification', {
      notificationId: notification.id,
      title: notification.template.title
    });

    // Mock implementation - in real app would use actual toast library
    console.log(`🍞 Toast: ${notification.template.title} - ${notification.template.message}`);
  }

  private async sendModalNotification(notification: UserNotification): Promise<void> {
    // This would integrate with a modal system
    this.logger.debug('Sending modal notification', {
      notificationId: notification.id,
      title: notification.template.title
    });

    // Mock implementation
    console.log(`📋 Modal: ${notification.template.title} - ${notification.template.message}`);
  }

  private async sendBannerNotification(notification: UserNotification): Promise<void> {
    // This would integrate with a banner notification system
    this.logger.debug('Sending banner notification', {
      notificationId: notification.id,
      title: notification.template.title
    });

    // Mock implementation
    console.log(`🏷️ Banner: ${notification.template.title} - ${notification.template.message}`);
  }

  private async sendInlineNotification(notification: UserNotification): Promise<void> {
    // This would integrate with inline notification system
    this.logger.debug('Sending inline notification', {
      notificationId: notification.id,
      title: notification.template.title
    });

    // Mock implementation
    console.log(`📝 Inline: ${notification.template.title} - ${notification.template.message}`);
  }

  private async sendTeamNotification(notification: TeamNotification): Promise<void> {
    // 简化：只发送邮件通知
    await this.sendEmailNotification(notification);
  }

  private async sendEmailNotification(notification: TeamNotification): Promise<void> {
    const { error, recipients } = notification;
    
    this.logger.debug('Sending email notification', {
      notificationId: notification.id,
      recipients: recipients.length,
      severity: error.severity
    });

    // Mock implementation - would integrate with email service
    console.log(`📧 Email sent to ${recipients.join(', ')}: ${error.message}`);
  }

  // 移除不需要的通知方法，保持代码简洁

  private async scheduleEscalation(notification: TeamNotification): Promise<void> {
    const escalationDelays = this.escalationRules.get(notification.severity) || [300000]; // 5 minutes default

    for (let i = 0; i < escalationDelays.length; i++) {
      setTimeout(async () => {
        if (!notification.acknowledged) {
          await this.escalateNotification(notification, i + 1);
        }
      }, escalationDelays[i]);
    }
  }

  private async escalateNotification(notification: TeamNotification, level: number): Promise<void> {
    notification.escalationLevel = level;

    this.logger.warn('Escalating team notification', {
      notificationId: notification.id,
      escalationLevel: level,
      correlationId: notification.error.correlationId
    });

    // Send escalated notification
    await this.sendTeamNotification(notification);
  }

  private getUserNotificationTemplate(error: QualitySystemError): NotificationTemplate {
    const templateKey = `${error.category}_${error.severity}`;
    return this.notificationTemplates.get(templateKey) || this.getDefaultUserTemplate(error);
  }

  private getDefaultUserTemplate(error: QualitySystemError): NotificationTemplate {
    const baseTemplate = {
      dismissible: true,
      autoHide: error.severity === ErrorSeverity.LOW,
      hideDelay: 5000,
      icon: this.getErrorIcon(error.severity),
      color: this.getErrorColor(error.severity) as 'info' | 'warning' | 'error' | 'success'
    };

    switch (error.severity) {
      case ErrorSeverity.LOW:
        return {
          ...baseTemplate,
          title: 'Minor Issue',
          message: 'A minor issue occurred but has been handled automatically.',
          autoHide: true
        };
      case ErrorSeverity.MEDIUM:
        return {
          ...baseTemplate,
          title: 'Attention Required',
          message: error.message || 'An issue occurred that may require your attention.',
          actionText: error.metadata.retryable ? 'Retry' : 'Dismiss',
          autoHide: false
        };
      case ErrorSeverity.HIGH:
        return {
          ...baseTemplate,
          title: 'Important Error',
          message: error.message || 'An important error occurred. Please review and take action.',
          actionText: 'View Details',
          autoHide: false
        };
      case ErrorSeverity.CRITICAL:
        return {
          ...baseTemplate,
          title: 'Critical Error',
          message: 'A critical error occurred. The system may be affected.',
          actionText: 'Contact Support',
          autoHide: false
        };
      default:
        return {
          ...baseTemplate,
          title: 'Error',
          message: error.message || 'An error occurred.',
          autoHide: true
        };
    }
  }

  private determineNotificationType(error: QualitySystemError): 'toast' | 'modal' | 'banner' | 'inline' {
    switch (error.severity) {
      case ErrorSeverity.LOW:
        return 'toast';
      case ErrorSeverity.MEDIUM:
        return 'inline';
      case ErrorSeverity.HIGH:
        return 'banner';
      case ErrorSeverity.CRITICAL:
        return 'modal';
      default:
        return 'toast';
    }
  }

  private determineTeamNotificationType(error: QualitySystemError): 'email' | 'slack' | 'webhook' | 'dashboard' {
    // 简化：只使用邮件通知
    return 'email';
  }

  private getTeamRecipients(error: QualitySystemError): string[] {
    // Single developer team - all notifications go to the same email
    return ['recohcity@gmail.com'];
  }

  private getErrorIcon(severity: ErrorSeverity): string {
    switch (severity) {
      case ErrorSeverity.LOW: return 'ℹ️';
      case ErrorSeverity.MEDIUM: return '⚠️';
      case ErrorSeverity.HIGH: return '❌';
      case ErrorSeverity.CRITICAL: return '🚨';
      default: return '❓';
    }
  }

  private getErrorColor(severity: ErrorSeverity): string {
    switch (severity) {
      case ErrorSeverity.LOW: return 'info';
      case ErrorSeverity.MEDIUM: return 'warning';
      case ErrorSeverity.HIGH: return 'error';
      case ErrorSeverity.CRITICAL: return 'error';
      default: return 'info';
    }
  }

  private initializeTemplates(): void {
    // Initialize notification templates for different error types
    this.notificationTemplates.set('VALIDATION_MEDIUM', {
      title: 'Validation Error',
      message: 'Please check your input and try again.',
      actionText: 'Fix Input',
      dismissible: true,
      autoHide: false,
      hideDelay: 0,
      icon: '📝',
      color: 'warning'
    });

    this.notificationTemplates.set('NETWORK_MEDIUM', {
      title: 'Connection Issue',
      message: 'Network connection problem. Retrying automatically...',
      actionText: 'Retry Now',
      dismissible: true,
      autoHide: true,
      hideDelay: 10000,
      icon: '🌐',
      color: 'warning'
    });

    // Add more templates as needed
  }

  private initializeEscalationRules(): void {
    // 简化升级规则：只有关键错误需要升级
    this.escalationRules.set(ErrorSeverity.CRITICAL, [300000]); // 5 minutes
  }

  private generateNotificationId(): string {
    return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Public methods for managing notifications
  public acknowledgeUserNotification(notificationId: string): void {
    const notification = this.userNotifications.get(notificationId);
    if (notification) {
      notification.acknowledged = true;
      this.logger.debug('User notification acknowledged', { notificationId });
    }
  }

  public acknowledgeTeamNotification(notificationId: string, assignee?: string): void {
    const notification = this.teamNotifications.get(notificationId);
    if (notification) {
      notification.acknowledged = true;
      notification.assignee = assignee;
      this.logger.info('Team notification acknowledged', { notificationId, assignee });
    }
  }

  public dismissUserNotification(notificationId: string): void {
    this.userNotifications.delete(notificationId);
    this.logger.debug('User notification dismissed', { notificationId });
  }

  public getUserNotifications(userId?: string): UserNotification[] {
    const notifications = Array.from(this.userNotifications.values());
    return userId ? notifications.filter(n => n.userId === userId) : notifications;
  }

  public getTeamNotifications(): TeamNotification[] {
    return Array.from(this.teamNotifications.values());
  }

  public getNotificationStats(): {
    userNotifications: number;
    teamNotifications: number;
    unacknowledgedTeam: number;
    criticalAlerts: number;
  } {
    const teamNotifications = Array.from(this.teamNotifications.values());
    
    return {
      userNotifications: this.userNotifications.size,
      teamNotifications: teamNotifications.length,
      unacknowledgedTeam: teamNotifications.filter(n => !n.acknowledged).length,
      criticalAlerts: teamNotifications.filter(n => n.severity === ErrorSeverity.CRITICAL).length
    };
  }
}