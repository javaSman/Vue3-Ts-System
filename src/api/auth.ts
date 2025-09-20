// 认证相关API
import axiosInstance from '@/services/axiosInstance';
import type { RouteRecord } from '@/types/router';

// 获取动态路由
export async function fetchUserRoutes(userId: number): Promise<RouteRecord[]> {
    try {
        console.log('请求用户路由，用户ID:', userId);
        const response = await axiosInstance.get(`/user/${userId}/routes`);

        if (response.data && response.data.success !== undefined) {
            if (response.data.success && Array.isArray(response.data.data)) {
                return response.data.data;
            } else {
                console.warn('API返回成功但数据格式不正确:', response.data);
                return [];
            }
        } else if (Array.isArray(response.data)) {
            return response.data;
        } else {
            console.warn('无法识别的响应格式:', response.data);
            return [];
        }
    } catch (error) {
        console.error('获取用户路由失败:', error);
        return [];
    }
}

// 获取用户信息
export async function fetchUserInfo(): Promise<any> {
    try {
        const response = await axiosInstance.get('/user/info');
        return response.data;
    } catch (error) {
        console.error('Failed to fetch user info:', error);
        throw error;
    }
}

// 用户注册
export async function registerUser(userData: {
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
}): Promise<{
    success: boolean;
    message: string;
    userInfo?: {
        id: number;
        username: string;
        email: string;
        registeredAt: string;
    };
}> {
    try {
        const response = await axiosInstance.post('/register', userData);
        return response.data;
    } catch (error: any) {
        if (error.response && error.response.data) {
            return {
                success: false,
                message: error.response.data.message || '注册失败'
            };
        }
        return {
            success: false,
            message: '网络错误，请稍后重试'
        };
    }
}