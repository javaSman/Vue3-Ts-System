import { createApp } from "vue";
import { createPinia } from "pinia";
import piniaPluginPersistedstate from "pinia-plugin-persistedstate";
import App from "./App.vue";
import router from "./router";
import { useAuthStore } from "@/stores/auth";

const pinia = createPinia();
pinia.use(piniaPluginPersistedstate);

const app = createApp(App);

app.use(pinia);

// 在挂载路由和应用之前，优先根据登录态恢复动态路由
(async () => {
  const authStore = useAuthStore() as any;
  if (authStore.isAuthenticated) {
    try {
      await authStore.loadDynamicRoutes();
    } catch (error) {
      console.error("启动时加载动态路由失败:", error);
    }
  }

  app.use(router);
  await router.isReady();
  app.mount("#app");
})();
