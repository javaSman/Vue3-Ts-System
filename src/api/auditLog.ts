// 操作日志审计API
import axiosInstance from "@/services/axiosInstance";

// 操作日志类型定义
export interface AuditLog {
  id: string;
  userId: number;
  username: string;
  action: string;
  module: string;
  details: string;
  ipAddress?: string;
  location?: string; // 新增地理位置信息
  userAgent?: string;
  timestamp: string;
  status: "success" | "failed";
}

// 创建操作日志
export async function createAuditLog(logData: {
  action: string;
  module: string;
  details: string;
  status?: "success" | "failed";
}): Promise<{
  success: boolean;
  message: string;
  data?: AuditLog;
}> {
  try {
    const response = await axiosInstance.post("/audit-logs", logData);
    return response.data;
  } catch (error: any) {
    if (error.response && error.response.data) {
      return {
        success: false,
        message: error.response.data.message || "创建操作日志失败",
      };
    }
    return {
      success: false,
      message: "网络错误，请稍后重试",
    };
  }
}

// 获取操作日志列表
export async function fetchAuditLogs(params?: {
  page?: number;
  limit?: number;
  userId?: number;
  module?: string;
  action?: string;
  startDate?: string;
  endDate?: string;
}): Promise<{
  success: boolean;
  data?: {
    logs: AuditLog[];
    total: number;
    page: number;
    limit: number;
  };
  message?: string;
}> {
  try {
    const response = await axiosInstance.get("/audit-logs", {
      params: params,
    });
    return response.data;
  } catch (error: any) {
    if (error.response && error.response.data) {
      return {
        success: false,
        message: error.response.data.message || "获取操作日志失败",
      };
    }
    return {
      success: false,
      message: "网络错误，请稍后重试",
    };
  }
}

// 获取用户操作统计
export async function fetchUserActionStats(userId?: number): Promise<{
  success: boolean;
  data?: {
    totalActions: number;
    todayActions: number;
    recentActions: { action: string; count: number }[];
    moduleStats: { module: string; count: number }[];
  };
  message?: string;
}> {
  try {
    const url = userId ? `/audit-logs/stats/${userId}` : "/audit-logs/stats";
    const response = await axiosInstance.get(url);
    return response.data;
  } catch (error: any) {
    if (error.response && error.response.data) {
      return {
        success: false,
        message: error.response.data.message || "获取操作统计失败",
      };
    }
    return {
      success: false,
      message: "网络错误，请稍后重试",
    };
  }
}

// 删除单个操作日志
export async function deleteAuditLog(logId: string): Promise<{
  success: boolean;
  message: string;
  data?: { deleted: boolean };
}> {
  try {
    const response = await axiosInstance.delete(`/audit-logs/${logId}`);
    return response.data;
  } catch (error: any) {
    if (error.response && error.response.data) {
      return {
        success: false,
        message: error.response.data.message || "删除操作日志失败",
      };
    }
    return {
      success: false,
      message: "网络错误，请稍后重试",
    };
  }
}

// 删除操作日志（管理员权限）
export async function deleteAuditLogs(logIds: string[]): Promise<{
  success: boolean;
  message: string;
  data?: { deletedCount: number };
}> {
  try {
    const response = await axiosInstance.delete("/audit-logs", {
      data: { logIds },
    });
    return response.data;
  } catch (error: any) {
    if (error.response && error.response.data) {
      return {
        success: false,
        message: error.response.data.message || "删除操作日志失败",
      };
    }
    return {
      success: false,
      message: "网络错误，请稍后重试",
    };
  }
}

// 导出操作日志
export async function exportAuditLogs(params?: {
  userId?: number;
  module?: string;
  startDate?: string;
  endDate?: string;
  format?: "csv" | "xlsx";
}): Promise<{
  success: boolean;
  message: string;
  data?: { downloadUrl: string };
}> {
  try {
    const response = await axiosInstance.post("/audit-logs/export", params);
    return response.data;
  } catch (error: any) {
    if (error.response && error.response.data) {
      return {
        success: false,
        message: error.response.data.message || "导出操作日志失败",
      };
    }
    return {
      success: false,
      message: "网络错误，请稍后重试",
    };
  }
}
