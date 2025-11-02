// 个人资料相关API
import axiosInstance from "@/services/axiosInstance";

// 获取用户个人资料
export async function fetchUserProfile(userId: number): Promise<{
  success: boolean;
  data?: {
    id: number;
    username: string;
    email: string;
    permissions: string[];
    status: string;
    registeredAt: string;
    profile: {
      fullName: string;
      phone: string;
      bio: string;
      avatar: string;
      twoFactorEnabled: boolean;
      lastPasswordChange: string;
      avatarUrl: string;
    };
  };
  message?: string;
}> {
  try {
    const response = await axiosInstance.get(`/profile/${userId}`);
    return response.data;
  } catch (error: any) {
    if (error.response && error.response.data) {
      return {
        success: false,
        message: error.response.data.message || "获取用户资料失败",
      };
    }
    return {
      success: false,
      message: "网络错误，请稍后重试",
    };
  }
}

// 更新用户个人资料
export async function updateUserProfile(
  userId: number,
  profileData: {
    email?: string;
    fullName?: string;
    phone?: string;
    bio?: string;
    twoFactorEnabled?: boolean;
  }
): Promise<{
  success: boolean;
  message: string;
  data?: any;
}> {
  try {
    const response = await axiosInstance.put(`/profile/${userId}`, profileData);
    return response.data;
  } catch (error: any) {
    if (error.response && error.response.data) {
      return {
        success: false,
        message: error.response.data.message || "更新用户资料失败",
      };
    }
    return {
      success: false,
      message: "网络错误，请稍后重试",
    };
  }
}

// 上传用户头像 - 文件上传方式
export async function uploadUserAvatarFile(
  userId: number,
  file: File
): Promise<{
  success: boolean;
  message: string;
  data?: {
    avatarUrl: string;
    userId: number;
    filename: string;
    size: number;
  };
}> {
  try {
    const formData = new FormData();
    formData.append("avatar", file);

    const response = await axiosInstance.post(
      `/profile/${userId}/avatar`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  } catch (error: any) {
    if (error.response && error.response.data) {
      return {
        success: false,
        message: error.response.data.message || "头像上传失败",
      };
    }
    return {
      success: false,
      message: "网络错误，请稍后重试",
    };
  }
}

// 上传用户头像 - URL方式（保留兼容）
export async function uploadUserAvatar(
  userId: number,
  avatarUrl: string
): Promise<{
  success: boolean;
  message: string;
  data?: {
    avatarUrl: string;
    userId: number;
  };
}> {
  try {
    const response = await axiosInstance.put(`/profile/${userId}/avatar`, {
      avatarUrl,
    });
    return response.data;
  } catch (error: any) {
    if (error.response && error.response.data) {
      return {
        success: false,
        message: error.response.data.message || "头像上传失败",
      };
    }
    return {
      success: false,
      message: "网络错误，请稍后重试",
    };
  }
}

// 修改用户密码
export async function changeUserPassword(
  userId: number,
  passwordData: {
    currentPassword: string;
    newPassword: string;
  }
): Promise<{
  success: boolean;
  message: string;
  data?: {
    lastPasswordChange: string;
  };
}> {
  try {
    const response = await axiosInstance.put(
      `/profile/${userId}/password`,
      passwordData
    );
    return response.data;
  } catch (error: any) {
    if (error.response && error.response.data) {
      return {
        success: false,
        message: error.response.data.message || "修改密码失败",
      };
    }
    return {
      success: false,
      message: "网络错误，请稍后重试",
    };
  }
}
