// 全局错误处理与监控
import { createAuditLog } from "@/api/auditLog";

// 错误类型定义
export interface ErrorInfo {
  message: string;
  stack?: string;
  componentStack?: string;
  errorBoundary?: string;
  errorInfo?: any;
  timestamp: string;
  url: string;
  userAgent: string;
  userId?: number;
  username?: string;
}

// 错误级别
export enum ErrorLevel {
  INFO = "info",
  WARN = "warn",
  ERROR = "error",
  FATAL = "fatal",
}

// 错误处理器类
class ErrorHandler {
  private errorQueue: ErrorInfo[] = [];
  private isOnline = navigator.onLine;
  private maxQueueSize = 100;

  constructor() {
    this.setupGlobalHandlers();
    this.setupNetworkMonitoring();
  }

  // 设置全局错误处理器
  private setupGlobalHandlers() {
    // 捕获未处理的JavaScript错误
    window.addEventListener("error", (event) => {
      this.handleError(
        {
          message: event.message,
          stack: event.error?.stack,
          timestamp: new Date().toISOString(),
          url: window.location.href,
          userAgent: navigator.userAgent,
          errorInfo: {
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
          },
        },
        ErrorLevel.ERROR
      );
    });

    // 捕获未处理的Promise拒绝
    window.addEventListener("unhandledrejection", (event) => {
      this.handleError(
        {
          message: event.reason?.message || "未处理的Promise拒绝",
          stack: event.reason?.stack,
          timestamp: new Date().toISOString(),
          url: window.location.href,
          userAgent: navigator.userAgent,
          errorInfo: {
            reason: event.reason,
          },
        },
        ErrorLevel.ERROR
      );
    });

    // 捕获Vue错误（如果使用Vue）
    if ((window as any).Vue || (window as any).app) {
      this.setupVueErrorHandler();
    }
  }

  // 设置Vue错误处理器
  private setupVueErrorHandler() {
    // 这里需要在应用初始化时调用
    // app.config.errorHandler = (error, instance, info) => {
    //     this.handleVueError(error, instance, info);
    // };
  }

  // 处理Vue错误
  public handleVueError(error: Error, instance: any, info: string) {
    this.handleError(
      {
        message: error.message,
        stack: error.stack,
        componentStack: info,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        errorInfo: {
          componentInfo: info,
          instance: instance,
        },
      },
      ErrorLevel.ERROR
    );
  }

  // 网络监控
  private setupNetworkMonitoring() {
    window.addEventListener("online", () => {
      this.isOnline = true;
      this.flushErrorQueue();
    });

    window.addEventListener("offline", () => {
      this.isOnline = false;
    });
  }

  // 处理错误
  public handleError(
    errorInfo: ErrorInfo,
    level: ErrorLevel = ErrorLevel.ERROR
  ) {
    // 添加额外信息
    const enrichedError = {
      ...errorInfo,
      level,
      id: this.generateErrorId(),
      browser: this.getBrowserInfo(),
      performance: this.getPerformanceInfo(),
    };

    // 控制台输出
    this.logToConsole(enrichedError, level);

    // 添加到队列
    this.addToQueue(enrichedError);

    // 如果在线，尝试上报
    if (this.isOnline) {
      this.reportError(enrichedError);
    }

    // 触发自定义事件
    this.dispatchErrorEvent(enrichedError);
  }

  // 生成错误ID
  private generateErrorId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }

  // 获取浏览器信息
  private getBrowserInfo() {
    const ua = navigator.userAgent;
    return {
      userAgent: ua,
      language: navigator.language,
      platform: navigator.platform,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
    };
  }

  // 获取性能信息
  private getPerformanceInfo() {
    if (!window.performance) return null;

    const timing = window.performance.timing;
    const navigation = (window.performance as any).navigation;

    return {
      loadTime: timing.loadEventEnd - timing.navigationStart,
      domReady: timing.domContentLoadedEventEnd - timing.navigationStart,
      firstPaint: this.getFirstPaint(),
      memory: (window.performance as any).memory
        ? {
            used: (window.performance as any).memory.usedJSHeapSize,
            total: (window.performance as any).memory.totalJSHeapSize,
            limit: (window.performance as any).memory.jsHeapSizeLimit,
          }
        : null,
      navigationType: navigation ? navigation.type : null,
    };
  }

  // 获取首次绘制时间
  private getFirstPaint(): number | null {
    if (!window.performance || !window.performance.getEntriesByType)
      return null;

    const paintEntries = window.performance.getEntriesByType("paint");
    const firstPaint = paintEntries.find(
      (entry) => entry.name === "first-paint"
    );
    return firstPaint ? firstPaint.startTime : null;
  }

  // 控制台输出
  private logToConsole(error: any, level: ErrorLevel) {
    const style = this.getConsoleStyle(level);
    const prefix = `[${level.toUpperCase()}] ${new Date().toLocaleTimeString()}`;

    switch (level) {
      case ErrorLevel.INFO:
        console.info(`%c${prefix}`, style, error);
        break;
      case ErrorLevel.WARN:
        console.warn(`%c${prefix}`, style, error);
        break;
      case ErrorLevel.ERROR:
      case ErrorLevel.FATAL:
        console.error(`%c${prefix}`, style, error);
        break;
    }
  }

  // 获取控制台样式
  private getConsoleStyle(level: ErrorLevel): string {
    const styles = {
      [ErrorLevel.INFO]: "color: #2196F3; font-weight: bold;",
      [ErrorLevel.WARN]: "color: #FF9800; font-weight: bold;",
      [ErrorLevel.ERROR]: "color: #F44336; font-weight: bold;",
      [ErrorLevel.FATAL]:
        "color: #FFFFFF; background: #F44336; font-weight: bold; padding: 2px 6px; border-radius: 3px;",
    };
    return styles[level];
  }

  // 添加到错误队列
  private addToQueue(error: any) {
    this.errorQueue.push(error);

    // 限制队列大小
    if (this.errorQueue.length > this.maxQueueSize) {
      this.errorQueue = this.errorQueue.slice(-this.maxQueueSize);
    }

    // 存储到本地存储
    this.saveToLocalStorage();
  }

  // 上报错误
  private async reportError(error: any) {
    try {
      // 这里可以发送到错误收集服务
      await this.sendToServer(error);

      // 记录到审计日志
      if (error.userId) {
        await createAuditLog({
          action: "error",
          module: "system",
          details: `系统错误: ${error.message}`,
          status: "failed",
        });
      }
    } catch (reportError) {
      console.error("错误上报失败:", reportError);
    }
  }

  // 发送到服务器
  private async sendToServer(error: any) {
    const endpoint = "/api/errors";

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(error),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (networkError) {
      // 网络错误，重新加入队列等待重试
      throw networkError;
    }
  }

  // 清空错误队列
  private async flushErrorQueue() {
    if (this.errorQueue.length === 0) return;

    const errors = [...this.errorQueue];
    this.errorQueue = [];

    for (const error of errors) {
      try {
        await this.reportError(error);
      } catch (e) {
        // 上报失败，重新加入队列
        this.addToQueue(error);
        break;
      }
    }
  }

  // 保存到本地存储
  private saveToLocalStorage() {
    try {
      const key = "app_error_queue";
      const data = {
        errors: this.errorQueue.slice(-10), // 只保存最近10个错误
        timestamp: Date.now(),
      };
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      // 本地存储失败，忽略
    }
  }

  // 从本地存储恢复
  public restoreFromLocalStorage() {
    try {
      const key = "app_error_queue";
      const data = localStorage.getItem(key);

      if (data) {
        const parsed = JSON.parse(data);
        const now = Date.now();
        const maxAge = 24 * 60 * 60 * 1000; // 24小时

        // 只恢复24小时内的错误
        if (now - parsed.timestamp < maxAge) {
          this.errorQueue = parsed.errors || [];
        }
      }
    } catch (e) {
      // 恢复失败，忽略
    }
  }

  // 触发自定义错误事件
  private dispatchErrorEvent(error: any) {
    const event = new CustomEvent("app-error", {
      detail: error,
    });
    window.dispatchEvent(event);
  }

  // 手动报告错误
  public reportManualError(
    message: string,
    extra?: any,
    level: ErrorLevel = ErrorLevel.ERROR
  ) {
    this.handleError(
      {
        message,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        errorInfo: extra,
      },
      level
    );
  }

  // 获取错误统计
  public getErrorStats() {
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    const oneDay = 24 * oneHour;

    const recentErrors = this.errorQueue.filter((error) => {
      const errorTime = new Date(error.timestamp).getTime();
      return now - errorTime < oneDay;
    });

    const hourlyErrors = recentErrors.filter((error) => {
      const errorTime = new Date(error.timestamp).getTime();
      return now - errorTime < oneHour;
    });

    return {
      total: this.errorQueue.length,
      lastDay: recentErrors.length,
      lastHour: hourlyErrors.length,
      byLevel: this.groupByLevel(recentErrors),
      byPage: this.groupByPage(recentErrors),
    };
  }

  // 按级别分组
  private groupByLevel(errors: any[]) {
    return errors.reduce((acc, error) => {
      const level = error.level || ErrorLevel.ERROR;
      acc[level] = (acc[level] || 0) + 1;
      return acc;
    }, {});
  }

  // 按页面分组
  private groupByPage(errors: any[]) {
    return errors.reduce((acc, error) => {
      const url = new URL(error.url);
      const page = url.pathname;
      acc[page] = (acc[page] || 0) + 1;
      return acc;
    }, {});
  }

  // 清理旧错误
  public cleanupOldErrors(maxAge: number = 7 * 24 * 60 * 60 * 1000) {
    const now = Date.now();
    this.errorQueue = this.errorQueue.filter((error) => {
      const errorTime = new Date(error.timestamp).getTime();
      return now - errorTime < maxAge;
    });
    this.saveToLocalStorage();
  }
}

// 创建全局实例
export const errorHandler = new ErrorHandler();

// 初始化函数
export function initErrorHandler() {
  errorHandler.restoreFromLocalStorage();

  // 定期清理旧错误
  setInterval(() => {
    errorHandler.cleanupOldErrors();
  }, 60 * 60 * 1000); // 每小时清理一次
}

// 导出便捷方法
export function reportError(
  message: string,
  extra?: any,
  level: ErrorLevel = ErrorLevel.ERROR
) {
  errorHandler.reportManualError(message, extra, level);
}

export function getErrorStats() {
  return errorHandler.getErrorStats();
}

// Vue 3 插件
export function createErrorPlugin() {
  return {
    install(app: any) {
      app.config.errorHandler = (error: Error, instance: any, info: string) => {
        errorHandler.handleVueError(error, instance, info);
      };

      // 提供全局方法
      app.config.globalProperties.$reportError = reportError;
      app.config.globalProperties.$getErrorStats = getErrorStats;
    },
  };
}
