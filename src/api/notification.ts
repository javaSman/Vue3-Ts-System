// 通知系统API
import axiosInstance from '@/services/axiosInstance';

// 通知类型定义
export interface Notification {
    id: string;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    read: boolean;
    createdAt: string;
    readAt?: string;
    expiresAt?: string;
    actionUrl?: string;
    actionText?: string;
    userId: number;
    category: string;
    metadata?: Record<string, any>;
}

// 获取用户通知列表
export async function fetchNotifications(params?: {
    page?: number;
    limit?: number;
    unreadOnly?: boolean;
    category?: string;
    type?: string;
}) {
    try {
        const response = await axiosInstance.get('/notifications', { params });
        return response.data;
    } catch (error: any) {
        if (error.response && error.response.data) {
            return {
                success: false,
                message: error.response.data.message || '获取通知失败'
            };
        }
        return {
            success: false,
            message: '网络错误，请稍后重试'
        };
    }
}

// 标记通知为已读
export async function markNotificationAsRead(notificationId: string) {
    try {
        const response = await axiosInstance.put(`/notifications/${notificationId}/read`);
        return response.data;
    } catch (error: any) {
        if (error.response && error.response.data) {
            return {
                success: false,
                message: error.response.data.message || '标记通知失败'
            };
        }
        return {
            success: false,
            message: '网络错误，请稍后重试'
        };
    }
}

// 批量标记通知为已读
export async function markMultipleNotificationsAsRead(notificationIds: string[]) {
    try {
        const response = await axiosInstance.put('/notifications/batch-read', {
            notificationIds
        });
        return response.data;
    } catch (error: any) {
        if (error.response && error.response.data) {
            return {
                success: false,
                message: error.response.data.message || '批量标记通知失败'
            };
        }
        return {
            success: false,
            message: '网络错误，请稍后重试'
        };
    }
}

// 删除通知
export async function deleteNotification(notificationId: string) {
    try {
        const response = await axiosInstance.delete(`/notifications/${notificationId}`);
        return response.data;
    } catch (error: any) {
        if (error.response && error.response.data) {
            return {
                success: false,
                message: error.response.data.message || '删除通知失败'
            };
        }
        return {
            success: false,
            message: '网络错误，请稍后重试'
        };
    }
}

// 获取未读通知数量
export async function getUnreadNotificationCount() {
    try {
        const response = await axiosInstance.get('/notifications/unread-count');
        return response.data;
    } catch (error: any) {
        if (error.response && error.response.data) {
            return {
                success: false,
                count: 0,
                message: error.response.data.message || '获取未读通知数量失败'
            };
        }
        return {
            success: false,
            count: 0,
            message: '网络错误，请稍后重试'
        };
    }
}

// 创建通知（管理员功能）
export async function createNotification(notification: {
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    category: string;
    targetUsers?: number[]; // 指定用户，为空则发送给所有用户
    expiresAt?: string;
    actionUrl?: string;
    actionText?: string;
    metadata?: Record<string, any>;
}) {
    try {
        const response = await axiosInstance.post('/notifications', notification);
        return response.data;
    } catch (error: any) {
        if (error.response && error.response.data) {
            return {
                success: false,
                message: error.response.data.message || '创建通知失败'
            };
        }
        return {
            success: false,
            message: '网络错误，请稍后重试'
        };
    }
}

// 获取通知设置
export async function getNotificationSettings() {
    try {
        const response = await axiosInstance.get('/notifications/settings');
        return response.data;
    } catch (error: any) {
        if (error.response && error.response.data) {
            return {
                success: false,
                message: error.response.data.message || '获取通知设置失败'
            };
        }
        return {
            success: false,
            message: '网络错误，请稍后重试'
        };
    }
}

// 更新通知设置
export async function updateNotificationSettings(settings: {
    emailNotifications: boolean;
    browserNotifications: boolean;
    categories: Record<string, boolean>;
    quietHours?: {
        enabled: boolean;
        startTime: string;
        endTime: string;
    };
}) {
    try {
        const response = await axiosInstance.put('/notifications/settings', settings);
        return response.data;
    } catch (error: any) {
        if (error.response && error.response.data) {
            return {
                success: false,
                message: error.response.data.message || '更新通知设置失败'
            };
        }
        return {
            success: false,
            message: '网络错误，请稍后重试'
        };
    }
}