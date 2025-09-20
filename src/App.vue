<template>
  <div id="app">
    <NavBar v-if="showNav" />
    <router-view />
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import NavBar from '@/components/NavBar.vue';

const route = useRoute();
const auth = useAuthStore();
const showNav = computed(() => auth.isAuthenticated && route.name !== 'Login');
// 监听路由变化更新标题
watch(
  () => route.meta?.title,
  (newTitle) => {
    if (newTitle) {
      document.title = `${newTitle}`;
    } else {
      document.title = '智能管理系统'; // 默认标题
    }
  },
  { immediate: true }
);
</script>

<style>
html,
body,
#app {
  margin: 0;
  padding: 0;
}
</style>