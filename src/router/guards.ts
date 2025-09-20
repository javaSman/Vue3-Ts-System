import type { Router } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

export function setupRouterGuard(router: Router) {
    router.beforeEach(async (to, from, next) => {
        const authStore = useAuthStore();

        console.log('导航到:', to.path, '认证状态:', authStore.isAuthenticated, '路由加载:', authStore.routesLoaded);

        // 白名单路由，不需要认证
        const whiteList = ['/login', '/404', '/403'];
        if (whiteList.includes(to.path)) {
            // 如果已登录且访问登录页，重定向到动态首页
            if (to.path === '/login' && authStore.isAuthenticated) {
                next(authStore.homePage);
                return;
            }
            next();
            return;
        }

        // 如果访问的是根路径且已认证，重定向到动态首页
        if (to.path === '/' && authStore.isAuthenticated) {
            next(authStore.homePage);
            return;
        }

        // 如果未登录，跳转到登录页
        if (!authStore.isAuthenticated) {
            next({
                name: 'Login',
                query: { redirect: to.fullPath !== '/' ? to.fullPath : undefined }
            });
            return;
        }

        // 已登录但路由未加载，先加载动态路由
        if (!authStore.routesLoaded) {
            try {
                console.log('路由未加载，尝试加载动态路由...');
                await authStore.loadDynamicRoutes();
            } catch (error) {
                console.error('加载路由失败:', error);
                authStore.logout();
                next({ name: 'Login' });
                return;
            }
        }

        // 检查目标路由是否存在
        const targetRoute = router.resolve(to.path);
        if (targetRoute.matched.length === 0) {
            console.log('目标路由不存在，跳转到404页面');
            next('/404');
            return;
        }

        // 检查是否需要认证
        if (targetRoute.meta?.requiresAuth && !authStore.isAuthenticated) {
            next({ name: 'Login' });
            return;
        }

        // 其他情况直接放行
        next();
    });
}