// 用户管理相关API
import axiosInstance from '@/services/axiosInstance';

// 获取用户列表
export async function fetchUsers(): Promise<{
    success: boolean;
    data: Array<{
        id: number;
        username: string;
        email: string;
        permissions?: string[];
        registeredAt: string;
    }>;
    message?: string;
}> {
    try {
        const response = await axiosInstance.get('/users');
        return response.data;
    } catch (error: any) {
        if (error.response && error.response.data) {
            return {
                success: false,
                data: [],
                message: error.response.data.message || '获取用户列表失败'
            };
        }
        return {
            success: false,
            data: [],
            message: '网络错误，请稍后重试'
        };
    }
}

// 删除用户
export async function deleteUser(userId: number): Promise<{
    success: boolean;
    message: string;
}> {
    try {
        const response = await axiosInstance.delete(`/users/${userId}`);
        return response.data;
    } catch (error: any) {
        if (error.response && error.response.data) {
            return {
                success: false,
                message: error.response.data.message || '删除用户失败'
            };
        }
        return {
            success: false,
            message: '网络错误，请稍后重试'
        };
    }
}

// 更新用户信息
export async function updateUser(userId: number, userData: {
    username?: string;
    email?: string;
    permissions?: string[];
    status?: string;
}): Promise<{
    success: boolean;
    message: string;
    data?: any;
}> {
    try {
        const response = await axiosInstance.put(`/users/${userId}`, userData);
        return response.data;
    } catch (error: any) {
        if (error.response && error.response.data) {
            return {
                success: false,
                message: error.response.data.message || '更新用户信息失败'
            };
        }
        return {
            success: false,
            message: '网络错误，请稍后重试'
        };
    }
}

// 创建新用户
export async function createUser(userData: {
    username: string;
    email: string;
    password: string;
    permissions?: string[];
    status?: string;
    routePermissions?: string[];
}): Promise<{
    success: boolean;
    message: string;
    data?: any;
}> {
    try {
        const response = await axiosInstance.post('/users', userData);
        return response.data;
    } catch (error: any) {
        if (error.response && error.response.data) {
            return {
                success: false,
                message: error.response.data.message || '创建用户失败'
            };
        }
        return {
            success: false,
            message: '网络错误，请稍后重试'
        };
    }
}