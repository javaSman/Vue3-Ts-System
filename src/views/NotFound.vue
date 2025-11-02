<template>
  <div class="not-found">
    <div class="container">
      <div class="error-content">
        <div class="error-code">404</div>
        <h1 class="error-title">页面未找到</h1>
        <p class="error-message">抱歉，您访问的页面不存在或已被移动。</p>
        <div class="action-buttons">
          <button class="btn btn-primary" @click="goBack">← 返回上一页</button>
          <button class="btn btn-secondary" @click="goToLogin">
            🔐 返回登录页
          </button>
          <button class="btn btn-outline" @click="forceReload">
            🔄 刷新页面
          </button>
        </div>

        <!-- 调试信息 -->
        <div v-if="showDebug" class="debug-info">
          <p>认证状态: {{ isAuthenticated ? "已认证" : "未认证" }}</p>
          <p>当前路径: {{ currentPath }}</p>
          <p>可用路由: {{ availableRoutes.join(", ") }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useAuthStore } from "@/stores/auth";

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const showDebug = ref(true); // 开发时显示调试信息

// 计算属性
const isAuthenticated = computed(() => authStore.isAuthenticated);
const currentPath = computed(() => route.fullPath);
const availableRoutes = computed(() => {
  return router
    .getRoutes()
    .filter((r) => !r.path.includes(":")) // 排除动态路由
    .map((r) => r.path)
    .filter((path) => path !== "/" && path !== "*"); // 排除根路径和通配符
});

// 返回上一页
function goBack() {
  if (window.history.length > 1) {
    router.go(-1);
  } else {
    // 如果没有历史记录，直接去登录页
    goToLogin();
  }
}

// 直接跳转到登录页
function goToLogin() {
  console.log("跳转到登录页");

  // 确保清除任何可能的路由状态
  if (authStore.isAuthenticated) {
    console.log("用户已认证，执行退出登录");
    authStore.logout();
  }

  // 直接跳转到登录页，不带重定向参数
  router.push({
    name: "Login",
    query: {}, // 清除所有查询参数
  });
}

// 强制刷新页面
function forceReload() {
  window.location.reload();
}

// 添加键盘快捷键
onMounted(() => {
  const handleKeyPress = (event: KeyboardEvent) => {
    if (event.key === "Escape") {
      goBack();
    } else if (event.key === "Enter") {
      goToLogin();
    }
  };

  window.addEventListener("keydown", handleKeyPress);
});
</script>

<style scoped>
.not-found {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.container {
  text-align: center;
  color: white;
  max-width: 600px;
}

.error-code {
  font-size: 120px;
  font-weight: bold;
  line-height: 1;
  margin-bottom: 20px;
  text-shadow: 4px 4px 0 rgba(0, 0, 0, 0.2);
}

.error-title {
  font-size: 36px;
  margin-bottom: 20px;
  font-weight: 600;
}

.error-message {
  font-size: 18px;
  margin-bottom: 40px;
  opacity: 0.9;
  line-height: 1.6;
}

.action-buttons {
  display: flex;
  gap: 15px;
  justify-content: center;
  flex-wrap: wrap;
  margin-bottom: 30px;
}

.btn {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-width: 140px;
  justify-content: center;
}

.btn-primary {
  background: white;
  color: #667eea;
}

.btn-primary:hover {
  background: #f8f9fa;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.9);
  color: #667eea;
  border: 2px solid rgba(255, 255, 255, 0.3);
}

.btn-secondary:hover {
  background: white;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.btn-outline {
  background: transparent;
  color: white;
  border: 2px solid rgba(255, 255, 255, 0.5);
}

.btn-outline:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.debug-info {
  background: rgba(255, 255, 255, 0.1);
  padding: 20px;
  border-radius: 12px;
  margin-top: 30px;
  text-align: left;
  font-size: 14px;
}

.debug-info p {
  margin: 8px 0;
  font-family: "Monaco", "Menlo", "Ubuntu Mono", monospace;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .error-code {
    font-size: 80px;
  }

  .error-title {
    font-size: 28px;
  }

  .error-message {
    font-size: 16px;
  }

  .action-buttons {
    flex-direction: column;
    align-items: center;
  }

  .btn {
    width: 100%;
    max-width: 250px;
  }

  .container {
    padding: 20px;
  }
}

/* 动画效果 */
.btn {
  animation: fadeInUp 0.6s ease;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 快捷键提示 */
.shortcut-hint {
  margin-top: 20px;
  font-size: 14px;
  opacity: 0.7;
}
</style>
