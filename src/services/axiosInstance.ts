import axios from 'axios';

// 创建axios实例
const axiosInstance = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// 请求拦截器
axiosInstance.interceptors.request.use(
    (config) => {
        // 添加token到请求头
        const token = localStorage.getItem('authToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
            console.log('已添加token到请求头:', token.substring(0, 20) + '...');
        } else {
            console.log('未找到token，跳过Authorization头设置');
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// 响应拦截器
axiosInstance.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        // 统一处理错误
        if (error.response) {
            // 服务器返回错误状态码
            console.error('API Error:', error.response.status, error.response.data);
            
            // 处理401未授权错误
            if (error.response.status === 401) {
                console.log('Token已失效，清除本地存储并跳转到登录页');
                localStorage.removeItem('authToken');
                // 可以在这里跳转到登录页或触发logout事件
                window.location.href = '/login';
            }
        } else if (error.request) {
            // 请求已发出但没有收到响应
            console.error('Network Error:', error.request);
        } else {
            // 其他错误
            console.error('Error:', error.message);
        }
        return Promise.reject(error);
    }
);

export default axiosInstance;