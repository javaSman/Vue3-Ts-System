// 仪表板相关API
import axiosInstance from '@/services/axiosInstance';

// 获取面板数据
export async function fetchDashboardData(params: { num?: number }): Promise<{ success: boolean; data?: any; message?: string }> {
    try {
        const response = await axiosInstance.post('/dataPanel', { num: params.num || 10 });
        return response.data;
    } catch (error: any) {
        if (error.response && error.response.data) {
            return {
                success: false,
                message: error.response.data.message || '获取面板数据失败'
            };
        }
        return {
            success: false,
            message: '网络错误，请稍后重试'
        }
    }
}