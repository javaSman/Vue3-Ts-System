import type { RouteRecordRaw } from "vue-router";
import type { RouteRecord } from "@/types/router";

// 动态导入组件
const modules = import.meta.glob("../views/**/*.vue");

export function convertRoutes(
  routes: RouteRecord[] | undefined | null
): RouteRecordRaw[] {
  // 处理 undefined 或 null 的情况
  if (!routes || !Array.isArray(routes)) {
    console.warn("convertRoutes: 输入的路由数据无效", routes);
    return [];
  }

  return routes.map((route) => {
    const convertedRoute: RouteRecordRaw = {
      path: route.path || "/undefined",
      name: route.name || "undefined",
      redirect: route.redirect,
      meta: (route.meta as Record<string, unknown>) || {},
      children: route.children ? convertRoutes(route.children) : [],
    };

    // 动态加载组件
    if (route.component) {
      const componentPath = `../views/${route.component}.vue`;

      if (modules[componentPath]) {
        convertedRoute.component = modules[componentPath];
        console.log("✅ 找到组件:", route.component);
      } else {
        console.warn("❌ 组件未找到:", route.component);
        // 使用备用组件
        convertedRoute.component = () => import("@/views/NotFound.vue");
      }
    }

    return convertedRoute;
  });
}
