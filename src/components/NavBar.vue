<template>
  <header class="nav">
    <div class="fx-line" aria-hidden="true"></div>
    <div class="fx-glow" aria-hidden="true"></div>

    <nav class="menu-wrap">
      <ul class="menu">
        <template v-for="item in topLevelMenu" :key="item.path">
          <li
            class="menu-item"
            @mouseenter="hovered = item.path"
            @mouseleave="hovered = ''"
          >
            <RouterLink
              :to="resolveTo(item)"
              class="link"
              :class="{ active: isActive(item) }"
            >
              <span class="link-text">{{ item.meta?.title || item.name }}</span>
              <span class="underline" />
              <span class="hover-effect"></span>
            </RouterLink>

            <ul
              v-if="item.children && item.children.length"
              class="submenu"
              :class="{ show: hovered === item.path }"
            >
              <li v-for="c in item.children" :key="c.path" class="submenu-item">
                <RouterLink
                  :to="resolveTo(c, item.path)"
                  class="sublink"
                  :class="{ active: isActive(c, item.path) }"
                  @click.prevent="onSubNavigate(c, item.path)"
                >
                  {{ c.meta?.title || c.name }}
                </RouterLink>
              </li>
            </ul>
          </li>
        </template>
      </ul>
    </nav>

    <div class="actions">
      <button class="logout" @click="handleLogout">
        <!-- <span class="dot"></span> -->
        <span class="logout-text">退出登录</span>
        <span class="logout-effect"></span>
      </button>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { storeToRefs } from "pinia";
import { useAuthStore } from "@/stores/auth";

const auth = useAuthStore();
const { menuRoutes } = storeToRefs(auth);
const route = useRoute();
const router = useRouter();
const hovered = ref("");

const topLevelMenu = computed(() =>
  (menuRoutes.value || []).filter((r) => r.path && r.name)
);

function resolveTo(r: any, parentPath?: string) {
  const base =
    typeof r.redirect === "string" && r.redirect ? r.redirect : r.path;
  if (!base) return "/";
  if (base.startsWith("/")) return base;
  if (parentPath && parentPath.endsWith("/")) return `${parentPath}${base}`;
  if (parentPath) return `${parentPath}/${base}`;
  return `/${base}`;
}

function isActive(r: any, parentPath?: string) {
  const to = resolveTo(r, parentPath);
  return route.path === to || route.path.startsWith(`${to}/`);
}

async function handleLogout() {
  auth.logout();
  await router.replace({ name: "Login" });
}

async function onSubNavigate(child: any, parentPath?: string) {
  try {
    const to = resolveTo(child, parentPath);
    console.log("[Nav] navigate to:", to, "from:", route.fullPath);
    hovered.value = "";
    if (route.fullPath === to) {
      await router.replace({ path: to, hash: `#ts=${Date.now()}` });
    } else {
      await router.push(to);
    }
  } catch (e) {
    console.error("子路由导航失败:", e);
  }
}
</script>

<style scoped>
.nav {
  position: sticky;
  top: 0;
  z-index: 100;
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  padding: 10px 18px;
  backdrop-filter: blur(16px) saturate(180%);
  background: linear-gradient(
    135deg,
    rgba(34, 40, 49, 0.85),
    rgba(24, 28, 38, 0.75)
  );
  border-bottom: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

/* 霓虹动画线条 */
.fx-line {
  position: absolute;
  inset: auto 0 0 0;
  height: 2px;
  background: linear-gradient(
    90deg,
    transparent,
    #22d3ee,
    #3b82f6,
    #a855f7,
    transparent
  );
  background-size: 200% 100%;
  filter: drop-shadow(0 0 8px #22d3ee);
  animation: flow 3s linear infinite;
}

.fx-glow {
  position: absolute;
  inset: 0;
  background: radial-gradient(
    circle at 50% 0%,
    rgba(59, 130, 246, 0.15),
    transparent 70%
  );
  pointer-events: none;
  z-index: -1;
}

@keyframes flow {
  0% {
    opacity: 0.6;
    background-position: 0% 0;
  }

  50% {
    opacity: 0.95;
    background-position: 100% 0;
  }

  100% {
    opacity: 0.6;
    background-position: 0% 0;
  }
}

.menu-wrap {
  justify-self: start;
}

.menu {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  gap: 12px;
}

.menu-item {
  position: relative;
}

.link {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  color: rgba(199, 210, 254, 0.9);
  text-decoration: none;
  font-weight: 500;
  letter-spacing: 0.5px;
  transition: all 0.3s ease;
  z-index: 1;
  border-radius: 8px;
  overflow: hidden;
}

.link-text {
  position: relative;
  z-index: 2;
  transition: transform 0.3s ease;
}

.link:hover .link-text {
  transform: translateY(-2px);
  color: white;
}

.hover-effect {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    135deg,
    rgba(59, 130, 246, 0.2),
    rgba(34, 211, 238, 0.2)
  );
  transform: scaleY(0);
  transform-origin: bottom;
  transition: transform 0.3s ease;
  z-index: 1;
}

.link:hover .hover-effect {
  transform: scaleY(1);
}

.link.active {
  color: white;
  text-shadow: 0 0 8px rgba(59, 130, 246, 0.5);
}

.underline {
  position: absolute;
  left: 16px;
  right: 16px;
  bottom: 6px;
  height: 2px;
  background: linear-gradient(90deg, #22d3ee, #3b82f6, #a855f7);
  border-radius: 2px;
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
  z-index: 2;
}

.link:hover .underline,
.link.active .underline {
  transform: scaleX(1);
}

.submenu {
  list-style: none;
  position: absolute;
  top: 42px;
  /* left: -15px; */
  right: -15px;
  min-width: 120px;
  padding: 12px 0;
  margin: 0;
  border-radius: 12px;
  background: linear-gradient(
    135deg,
    rgba(17, 24, 39, 0.95),
    rgba(17, 24, 39, 0.9)
  );
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.5);
  display: none;
  z-index: 200;
  opacity: 0;
  transform: translateY(10px);
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.submenu.show {
  display: block;
  opacity: 1;
  transform: translateY(0);
}

.submenu-item {
  padding: 0 8px;
  transition: all 0.2s ease;
}

/* .submenu-item:hover {
  transform: translateX(4px);
} */

.sublink {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 4px 0;
  color: #cbd5e1;
  text-decoration: none;
  border-radius: 6px;
  transition: all 0.3s ease;
  text-align: center;
  width: 100%;
}

.sublink:hover {
  background: rgba(59, 130, 246, 0.2);
  color: #e2e8f0;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2);
}

.sublink.active {
  background: linear-gradient(
    90deg,
    rgba(59, 130, 246, 0.3),
    rgba(34, 211, 238, 0.3)
  );
  color: #ffffff;
}

.actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logout {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  color: #e2e8f0;
  background: linear-gradient(
    135deg,
    rgba(59, 130, 246, 0.2),
    rgba(34, 211, 238, 0.2)
  );
  border: 1px solid rgba(148, 163, 184, 0.3);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
  overflow: hidden;
}

.logout-text {
  position: relative;
  z-index: 2;
}

.logout-effect {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    135deg,
    rgba(59, 130, 246, 0.4),
    rgba(34, 211, 238, 0.4)
  );
  transform: scaleX(0);
  transform-origin: right;
  transition: transform 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
  z-index: 1;
}

.logout:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 24px rgba(59, 130, 246, 0.4);
  border-color: rgba(59, 130, 246, 0.5);
}

.logout:hover .logout-effect {
  transform: scaleX(1);
  transform-origin: left;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: radial-gradient(
    circle at 30% 30%,
    #6ee7ff,
    #3b82f6 60%,
    transparent 70%
  );
  box-shadow: 0 0 10px #60a5fa, 0 0 20px #22d3ee;
  animation: pulse 2s infinite;
  z-index: 2;
}

@keyframes pulse {
  0% {
    transform: scale(1);
  }

  50% {
    transform: scale(1.1);
  }

  100% {
    transform: scale(1);
  }
}
</style>
