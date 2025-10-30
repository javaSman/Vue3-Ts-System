// 系统设置管理API
import axiosInstance from '@/services/axiosInstance';

// 系统设置类型定义
export interface SystemSettings {
    general: {
        siteName: string;
        siteDescription: string;
        logo: string;
        favicon: string;
        timezone: string;
        language: string;
        dateFormat: string;
        timeFormat: string;
    };
    security: {
        passwordMinLength: number;
        passwordRequireUppercase: boolean;
        passwordRequireLowercase: boolean;
        passwordRequireNumbers: boolean;
        passwordRequireSymbols: boolean;
        sessionTimeout: number;
        maxLoginAttempts: number;
        lockoutDuration: number;
        enableTwoFactor: boolean;
        enableCaptcha: boolean;
    };
    email: {
        smtpHost: string;
        smtpPort: number;
        smtpUser: string;
        smtpPassword: string;
        smtpSecure: boolean;
        fromEmail: string;
        fromName: string;
        enableEmailNotifications: boolean;
    };
    storage: {
        uploadMaxSize: number;
        allowedFileTypes: string[];
        storageProvider: 'local' | 'aws' | 'azure' | 'gcp';
        storageConfig: Record<string, any>;
    };
    appearance: {
        theme: 'light' | 'dark' | 'auto';
        primaryColor: string;
        secondaryColor: string;
        customCss: string;
        enableCustomBranding: boolean;
    };
    features: {
        enableRegistration: boolean;
        enableUserProfiles: boolean;
        enableNotifications: boolean;
        enableAuditLogs: boolean;
        enableDataExport: boolean;
        maintenanceMode: boolean;
    };
}

// 获取系统设置
export async function getSystemSettings(): Promise<{
    success: boolean;
    data?: SystemSettings;
    message?: string;
}> {
    try {
        const response = await axiosInstance.get('/system/settings');
        return response.data;
    } catch (error: any) {
        if (error.response && error.response.data) {
            return {
                success: false,
                message: error.response.data.message || '获取系统设置失败'
            };
        }
        return {
            success: false,
            message: '网络错误，请稍后重试'
        };
    }
}

// 更新系统设置
export async function updateSystemSettings(
    category: keyof SystemSettings,
    settings: Partial<SystemSettings[keyof SystemSettings]>
): Promise<{
    success: boolean;
    data?: SystemSettings;
    message?: string;
}> {
    try {
        const response = await axiosInstance.put(`/system/settings/${category}`, settings);
        return response.data;
    } catch (error: any) {
        if (error.response && error.response.data) {
            return {
                success: false,
                message: error.response.data.message || '更新系统设置失败'
            };
        }
        return {
            success: false,
            message: '网络错误，请稍后重试'
        };
    }
}

// 重置系统设置
export async function resetSystemSettings(category?: keyof SystemSettings): Promise<{
    success: boolean;
    data?: SystemSettings;
    message?: string;
}> {
    try {
        const url = category ? `/system/settings/${category}/reset` : '/system/settings/reset';
        const response = await axiosInstance.post(url);
        return response.data;
    } catch (error: any) {
        if (error.response && error.response.data) {
            return {
                success: false,
                message: error.response.data.message || '重置系统设置失败'
            };
        }
        return {
            success: false,
            message: '网络错误，请稍后重试'
        };
    }
}

// 导出系统设置
export async function exportSystemSettings(): Promise<{
    success: boolean;
    data?: { downloadUrl: string };
    message?: string;
}> {
    try {
        const response = await axiosInstance.post('/system/settings/export');
        return response.data;
    } catch (error: any) {
        if (error.response && error.response.data) {
            return {
                success: false,
                message: error.response.data.message || '导出系统设置失败'
            };
        }
        return {
            success: false,
            message: '网络错误，请稍后重试'
        };
    }
}

// 导入系统设置
export async function importSystemSettings(file: File): Promise<{
    success: boolean;
    data?: SystemSettings;
    message?: string;
}> {
    try {
        const formData = new FormData();
        formData.append('settings', file);

        const response = await axiosInstance.post('/system/settings/import', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    } catch (error: any) {
        if (error.response && error.response.data) {
            return {
                success: false,
                message: error.response.data.message || '导入系统设置失败'
            };
        }
        return {
            success: false,
            message: '网络错误，请稍后重试'
        };
    }
}

// 测试邮件设置
export async function testEmailSettings(emailSettings: SystemSettings['email']): Promise<{
    success: boolean;
    message?: string;
}> {
    try {
        const response = await axiosInstance.post('/system/settings/test-email', emailSettings);
        return response.data;
    } catch (error: any) {
        if (error.response && error.response.data) {
            return {
                success: false,
                message: error.response.data.message || '邮件设置测试失败'
            };
        }
        return {
            success: false,
            message: '网络错误，请稍后重试'
        };
    }
}

// 获取系统状态
export async function getSystemStatus(): Promise<{
    success: boolean;
    data?: {
        version: string;
        uptime: number;
        memoryUsage: {
            used: number;
            total: number;
            free: number;
        };
        diskUsage: {
            used: number;
            total: number;
            free: number;
        };
        databaseStatus: 'connected' | 'disconnected';
        cacheStatus: 'active' | 'inactive';
        lastBackup: string;
        activeUsers: number;
        totalUsers: number;
        errorRate: number;
    };
    message?: string;
}> {
    try {
        const response = await axiosInstance.get('/system/status');
        return response.data;
    } catch (error: any) {
        if (error.response && error.response.data) {
            return {
                success: false,
                message: error.response.data.message || '获取系统状态失败'
            };
        }
        return {
            success: false,
            message: '网络错误，请稍后重试'
        };
    }
}

// 清理系统缓存
export async function clearSystemCache(): Promise<{
    success: boolean;
    message?: string;
}> {
    try {
        const response = await axiosInstance.post('/system/cache/clear');
        return response.data;
    } catch (error: any) {
        if (error.response && error.response.data) {
            return {
                success: false,
                message: error.response.data.message || '清理缓存失败'
            };
        }
        return {
            success: false,
            message: '网络错误，请稍后重试'
        };
    }
}

// 重启系统
export async function restartSystem(): Promise<{
    success: boolean;
    message?: string;
}> {
    try {
        const response = await axiosInstance.post('/system/restart');
        return response.data;
    } catch (error: any) {
        if (error.response && error.response.data) {
            return {
                success: false,
                message: error.response.data.message || '重启系统失败'
            };
        }
        return {
            success: false,
            message: '网络错误，请稍后重试'
        };
    }
}