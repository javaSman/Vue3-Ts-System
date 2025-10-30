// src/stores/auth.ts
import { defineStore } from 'pinia';
import type { RouteRecordRaw } from 'vue-router';
import type { UserInfo } from '@/types/router';
import { fetchUserRoutes } from '@/api/auth';
import { convertRoutes } from '@/utils/routeConverter';
import router from '@/router';
import axiosInstance from '@/services/axiosInstance';

interface AuthState {
    isAuthenticated: boolean;
    userId: number;
    userInfo: UserInfo | null;
    routesLoaded: boolean;
    menuRoutes: RouteRecordRaw[];
    homePage: string; // 动态首页路径
}

export const useAuthStore = defineStore('auth', {
    state: (): AuthState => ({
        isAuthenticated: false,
        userId: 0,
        userInfo: null,
        routesLoaded: false,
        menuRoutes: [],
        homePage: '/dashboard' // 默认首页
    }),

    actions: {
        async login(username: string, password: string): Promise<boolean> {
            try {
                console.log('开始登录:', username);

                // 使用axios实例发起登录请求
                const response = await axiosInstance.post('/login', {
                    username,
                    password
                });

                console.log('登录响应数据:', response.data);

                if (response.data.success) {
                    // 保存token到localStorage
                    if (response.data.token) {
                        localStorage.setItem('authToken', response.data.token);
                        console.log('保存token成功:', response.data.token);
                    }

                    // 更新认证状态
                    this.isAuthenticated = true;
                    this.userId = response.data.userId;
                    this.userInfo = response.data.userInfo;

                    // 异步加载动态路由，不阻塞登录
                    (this as any).loadDynamicRoutes().catch((error: unknown) => {
                        console.error('动态路由加载失败（非阻塞）:', error);
                    });

                    console.log('登录成功');
                    return true; // 明确返回 true
                } else {
                    throw new Error(response.data.message || '登录失败');
                }
            } catch (error: any) {
                console.error('登录错误:', error);
                // 返回 false 而不是抛出错误，让调用方处理
                return false;
            }
        },

        async loadDynamicRoutes() {
            try {
                console.log('开始加载动态路由，用户ID:', this.userId);

                const routes = await fetchUserRoutes(this.userId);
                console.log('获取到的路由数据:', routes);

                // 检查路由数据是否有效
                if (!routes || !Array.isArray(routes)) {
                    console.warn('获取的路由数据无效:', routes);
                    throw new Error('获取的路由数据格式不正确');
                }

                if (routes.length === 0) {
                    console.warn('用户没有可用的动态路由');
                    // 没有路由也不报错，只是记录警告
                    this.routesLoaded = true;
                    return;
                }

                const convertedRoutes = convertRoutes(routes);
                console.log('转换后的路由:', convertedRoutes);

                // 动态添加路由
                convertedRoutes.forEach(route => {
                    if (route.path && route.name) {
                        router.addRoute(route);
                        console.log('✅ 添加路由:', route.path);
                    } else {
                        console.warn('❌ 跳过无效路由:', route);
                    }
                });

                // 保存可展示的菜单路由（这里简单保存全部动态路由，如需权限可在此过滤）
                this.menuRoutes = convertedRoutes;

                // 设置动态首页为第一个路由的路径
                if (convertedRoutes.length > 0) {
                    this.homePage = convertedRoutes[0].path || '/dashboard';
                    console.log('设置动态首页为:', this.homePage);
                } else {
                    this.homePage = '/dashboard'; // 如果没有动态路由，使用默认首页
                    console.log('没有动态路由，使用默认首页:', this.homePage);
                }

                this.routesLoaded = true;
                console.log('动态路由加载完成，当前总路由数:', router.getRoutes().length);

            } catch (error) {
                console.error('加载动态路由失败:', error);
                // 不抛出错误，只是记录日志
                this.routesLoaded = true; // 仍然标记为已加载，避免阻塞
            }
        },

        logout() {
            // 清除token
            localStorage.removeItem('authToken');
            console.log('已清除token');
            
            this.isAuthenticated = false;
            this.userId = 0;
            this.userInfo = null;
            this.routesLoaded = false;
            this.menuRoutes = [];
            this.homePage = '/dashboard'; // 重置为默认首页

            // 清除动态路由（可选）
            const routes = router.getRoutes();
            routes.forEach(route => {
                if (route.name && !['Login', 'NotFound', 'Forbidden', 'Home'].includes(route.name as string)) {
                    router.removeRoute(route.name);
                }
            });
        }
    },

    persist: true
});