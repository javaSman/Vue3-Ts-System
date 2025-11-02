// 权限相关API
import axiosInstance from "@/services/axiosInstance";

// 获取所有可用的路由权限
export async function fetchAvailablePermissions(): Promise<{
  success: boolean;
  data?: Array<{
    name: string;
    title: string;
    path: string;
    component: string;
    description?: string;
    category?: string;
    parent?: string;
  }>;
  message?: string;
}> {
  try {
    const response = await axiosInstance.get("/permissions");
    return response.data;
  } catch (error: any) {
    if (error.response && error.response.data) {
      return {
        success: false,
        message: error.response.data.message || "获取可用权限失败",
      };
    }
    return {
      success: false,
      message: "网络错误，请稍后重试",
    };
  }
}

// 获取用户的路由权限详情
export async function fetchUserRoutePermissions(userId: number): Promise<{
  success: boolean;
  data?: {
    userId: number;
    username: string;
    permissions: Array<{
      name: string;
      title: string;
      path: string;
      description?: string;
      category?: string;
    }>;
    allAvailablePermissions: Array<{
      name: string;
      title: string;
      path: string;
      description?: string;
      category?: string;
    }>;
  };
  message?: string;
}> {
  try {
    const response = await axiosInstance.get(
      `/user/${userId}/route-permissions`
    );
    return response.data;
  } catch (error: any) {
    if (error.response && error.response.data) {
      return {
        success: false,
        message: error.response.data.message || "获取用户路由权限失败",
      };
    }
    return {
      success: false,
      message: "网络错误，请稍后重试",
    };
  }
}

// 更新用户的路由权限
export async function updateUserRoutePermissions(
  userId: number,
  permissions: string[]
): Promise<{
  success: boolean;
  message: string;
  data?: any;
}> {
  try {
    const response = await axiosInstance.put(
      `/user/${userId}/route-permissions`,
      {
        permissions,
      }
    );
    return response.data;
  } catch (error: any) {
    if (error.response && error.response.data) {
      return {
        success: false,
        message: error.response.data.message || "更新用户路由权限失败",
      };
    }
    return {
      success: false,
      message: "网络错误，请稍后重试",
    };
  }
}
