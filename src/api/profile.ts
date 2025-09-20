// 个人资料相关API
import axiosInstance from '@/services/axiosInstance';

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
            avatarUrl: string
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
                message: error.response.data.message || '获取用户资料失败'
            };
        }
        return {
            success: false,
            message: '网络错误，请稍后重试'
        };
    }
}

// 更新用户个人资料
export async function updateUserProfile(userId: number, profileData: {
    email?: string;
    fullName?: string;
    phone?: string;
    bio?: string;
    twoFactorEnabled?: boolean;
}): Promise<{
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
                message: error.response.data.message || '更新用户资料失败'
            };
        }
        return {
            success: false,
            message: '网络错误，请稍后重试'
        };
    }
}

// 修改用户密码
export async function changeUserPassword(userId: number, passwordData: {
    currentPassword: string;
    newPassword: string;
}): Promise<{
    success: boolean;
    message: string;
    data?: {
        lastPasswordChange: string;
    };
}> {
    try {
        const response = await axiosInstance.put(`/profile/${userId}/password`, passwordData);
        return response.data;
    } catch (error: any) {
        if (error.response && error.response.data) {
            return {
                success: false,
                message: error.response.data.message || '修改密码失败'
            };
        }
        return {
            success: false,
            message: '网络错误，请稍后重试'
        };
    }
}