// 活动相关API
import axiosInstance from '@/services/axiosInstance';

// 获取最近活动列表
export async function fetchRecentActivities(params?: { value?: number }): Promise<any> {
    try {
        const response = await axiosInstance.get('/activity', {
            params: {
                value: params?.value
            }
        });
        return response.data;
    } catch (error) {
        console.error('Failed to fetch recent activities:', error);
        throw error;
    }
}