<template>
  <div class="dashboard">
    <div v-if="!isChild">
      <div class="header">
        <h1>仪表板</h1>
        <p>欢迎回来，{{ userInfo?.username }}！</p>
      </div>

      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">
            <span>📊</span>
          </div>
          <div class="stat-content">
            <h3>1,234</h3>
            <p>总访问量</p>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">
            <span>👥</span>
          </div>
          <div class="stat-content">
            <h3>567</h3>
            <p>用户数量</p>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">
            <span>💰</span>
          </div>
          <div class="stat-content">
            <h3>¥89,012</h3>
            <p>总收入</p>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">
            <span>✅</span>
          </div>
          <div class="stat-content">
            <h3>345</h3>
            <p>完成订单</p>
          </div>
        </div>
      </div>

      <div class="recent-activity">
        <h2>最近活动</h2>
        <div class="activity-list">
          <div
            v-for="(activity, index) in activities"
            :key="index"
            class="activity-item"
          >
            <span class="activity-time">{{ activity.time }}</span>
            <span class="activity-content">{{ activity.content }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 子路由渲染占位：绑定 key 以便 query/path 变化时强制重渲染 -->
    <router-view :key="$route.fullPath" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { fetchRecentActivities } from "@/api/activity";

const authStore = useAuthStore();
const userInfo = computed(() => authStore.userInfo);
const route = useRoute();
const isChild = computed(() => {
  return route.matched.length > 1;
});
const activities = ref<Array<{ id?: number; time: string; content: string }>>(
  []
);

onMounted(async () => {
  try {
    const params = { value: 35 }; // 传递正确的对象格式
    const res = await fetchRecentActivities(params);
    console.log("获取到的最近活动数据:", res);

    if (Array.isArray(res)) {
      activities.value = res as Array<{ time: string; content: string }>;
    } else if (res && typeof res === "object") {
      if (res.success && Array.isArray(res.data)) {
        activities.value = res.data as Array<{ time: string; content: string }>;
      }
    }

    if (!activities.value || activities.value.length === 0) {
      activities.value = [{ time: "刚刚", content: "暂无活动，稍后再试~" }];
    }
  } catch (error) {
    console.error("获取最近活动数据失败:", error);
  }
});
</script>

<style scoped>
.dashboard {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.header {
  margin-bottom: 30px;
}

.header h1 {
  color: #333;
  margin-bottom: 10px;
}

.header p {
  color: #666;
  font-size: 16px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 40px;
}

.stat-card {
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 15px;
}

.stat-icon span {
  font-size: 2em;
}

.stat-content h3 {
  margin: 0;
  font-size: 24px;
  color: #2c3e50;
}

.stat-content p {
  margin: 5px 0 0;
  color: #7f8c8d;
}

.recent-activity h2 {
  color: #333;
  margin-bottom: 20px;
}

.activity-list {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.activity-item {
  padding: 15px 20px;
  border-bottom: 1px solid #eee;
  display: flex;
  align-items: center;
  gap: 15px;
}

.activity-item:last-child {
  border-bottom: none;
}

.activity-time {
  color: #95a5a6;
  font-size: 14px;
  min-width: 80px;
}

.activity-content {
  color: #34495e;
}
</style>
