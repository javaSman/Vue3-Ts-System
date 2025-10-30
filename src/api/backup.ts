// 数据备份与导出API
import axiosInstance from '@/services/axiosInstance';

// 备份类型定义
export interface BackupInfo {
    id: string;
    name: string;
    type: 'full' | 'incremental' | 'differential';
    size: number;
    createdAt: string;
    status: 'pending' | 'in_progress' | 'completed' | 'failed';
    progress?: number;
    description?: string;
    includedTables: string[];
    downloadUrl?: string;
}

// 获取备份列表
export async function fetchBackups(params?: {
    page?: number;
    limit?: number;
    type?: string;
    status?: string;
}) {
    try {
        const response = await axiosInstance.get('/backups', { params });
        return response.data;
    } catch (error: any) {
        if (error.response && error.response.data) {
            return {
                success: false,
                message: error.response.data.message || '获取备份列表失败'
            };
        }
        return {
            success: false,
            message: '网络错误，请稍后重试'
        };
    }
}

// 创建备份
export async function createBackup(backupData: {
    name: string;
    type: 'full' | 'incremental' | 'differential';
    description?: string;
    includedTables?: string[];
    schedule?: {
        enabled: boolean;
        frequency: 'daily' | 'weekly' | 'monthly';
        time: string;
        dayOfWeek?: number;
        dayOfMonth?: number;
    };
}) {
    try {
        const response = await axiosInstance.post('/backups', backupData);
        return response.data;
    } catch (error: any) {
        if (error.response && error.response.data) {
            return {
                success: false,
                message: error.response.data.message || '创建备份失败'
            };
        }
        return {
            success: false,
            message: '网络错误，请稍后重试'
        };
    }
}

// 下载备份
export async function downloadBackup(backupId: string) {
    try {
        const response = await axiosInstance.get(`/backups/${backupId}/download`, {
            responseType: 'blob'
        });
        
        // 创建下载链接
        const blob = new Blob([response.data]);
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `backup_${backupId}.sql`;
        link.click();
        window.URL.revokeObjectURL(url);
        
        return { success: true, message: '备份下载成功' };
    } catch (error: any) {
        if (error.response && error.response.data) {
            return {
                success: false,
                message: error.response.data.message || '下载备份失败'
            };
        }
        return {
            success: false,
            message: '网络错误，请稍后重试'
        };
    }
}

// 删除备份
export async function deleteBackup(backupId: string) {
    try {
        const response = await axiosInstance.delete(`/backups/${backupId}`);
        return response.data;
    } catch (error: any) {
        if (error.response && error.response.data) {
            return {
                success: false,
                message: error.response.data.message || '删除备份失败'
            };
        }
        return {
            success: false,
            message: '网络错误，请稍后重试'
        };
    }
}

// 恢复备份
export async function restoreBackup(backupId: string, options?: {
    confirmOverwrite?: boolean;
    targetTables?: string[];
}) {
    try {
        const response = await axiosInstance.post(`/backups/${backupId}/restore`, options);
        return response.data;
    } catch (error: any) {
        if (error.response && error.response.data) {
            return {
                success: false,
                message: error.response.data.message || '恢复备份失败'
            };
        }
        return {
            success: false,
            message: '网络错误，请稍后重试'
        };
    }
}

// 导出用户数据
export async function exportUserData(params?: {
    userIds?: number[];
    format?: 'csv' | 'json' | 'xlsx';
    includeProfiles?: boolean;
    includePermissions?: boolean;
    dateRange?: {
        startDate: string;
        endDate: string;
    };
}) {
    try {
        const response = await axiosInstance.post('/export/users', params);
        return response.data;
    } catch (error: any) {
        if (error.response && error.response.data) {
            return {
                success: false,
                message: error.response.data.message || '导出用户数据失败'
            };
        }
        return {
            success: false,
            message: '网络错误，请稍后重试'
        };
    }
}

// 导出审计日志
export async function exportAuditLogs(params?: {
    userIds?: number[];
    modules?: string[];
    actions?: string[];
    format?: 'csv' | 'json' | 'xlsx';
    dateRange?: {
        startDate: string;
        endDate: string;
    };
}) {
    try {
        const response = await axiosInstance.post('/export/audit-logs', params);
        return response.data;
    } catch (error: any) {
        if (error.response && error.response.data) {
            return {
                success: false,
                message: error.response.data.message || '导出审计日志失败'
            };
        }
        return {
            success: false,
            message: '网络错误，请稍后重试'
        };
    }
}

// 导出系统配置
export async function exportSystemConfig(includeSecrets?: boolean) {
    try {
        const response = await axiosInstance.post('/export/system-config', {
            includeSecrets
        });
        return response.data;
    } catch (error: any) {
        if (error.response && error.response.data) {
            return {
                success: false,
                message: error.response.data.message || '导出系统配置失败'
            };
        }
        return {
            success: false,
            message: '网络错误，请稍后重试'
        };
    }
}

// 获取导出任务状态
export async function getExportTaskStatus(taskId: string) {
    try {
        const response = await axiosInstance.get(`/export/tasks/${taskId}`);
        return response.data;
    } catch (error: any) {
        if (error.response && error.response.data) {
            return {
                success: false,
                message: error.response.data.message || '获取导出任务状态失败'
            };
        }
        return {
            success: false,
            message: '网络错误，请稍后重试'
        };
    }
}

// 获取可导出的数据表
export async function getAvailableTables() {
    try {
        const response = await axiosInstance.get('/export/available-tables');
        return response.data;
    } catch (error: any) {
        if (error.response && error.response.data) {
            return {
                success: false,
                message: error.response.data.message || '获取可导出数据表失败'
            };
        }
        return {
            success: false,
            message: '网络错误，请稍后重试'
        };
    }
}

// 导入数据
export async function importData(file: File, options?: {
    table: string;
    format: 'csv' | 'json' | 'xlsx';
    overwrite?: boolean;
    skipErrors?: boolean;
    mapping?: Record<string, string>;
}) {
    try {
        const formData = new FormData();
        formData.append('file', file);
        if (options) {
            formData.append('options', JSON.stringify(options));
        }

        const response = await axiosInstance.post('/import/data', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    } catch (error: any) {
        if (error.response && error.response.data) {
            return {
                success: false,
                message: error.response.data.message || '导入数据失败'
            };
        }
        return {
            success: false,
            message: '网络错误，请稍后重试'
        };
    }
}

// 获取备份统计信息
export async function getBackupStats() {
    try {
        const response = await axiosInstance.get('/backups/stats');
        return response.data;
    } catch (error: any) {
        if (error.response && error.response.data) {
            return {
                success: false,
                message: error.response.data.message || '获取备份统计失败'
            };
        }
        return {
            success: false,
            message: '网络错误，请稍后重试'
        };
    }
}

// 验证备份文件
export async function validateBackupFile(file: File) {
    try {
        const formData = new FormData();
        formData.append('backup', file);

        const response = await axiosInstance.post('/backups/validate', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    } catch (error: any) {
        if (error.response && error.response.data) {
            return {
                success: false,
                message: error.response.data.message || '验证备份文件失败'
            };
        }
        return {
            success: false,
            message: '网络错误，请稍后重试'
        };
    }
}