<template>
  <div class="notification-center">
    <!-- 通知图标和徽章 -->
    <div class="notification-trigger" @click="togglePanel">
      <div class="notification-icon">
        🔔
        <span v-if="unreadCount > 0" class="notification-badge">
          {{ unreadCount > 99 ? '99+' : unreadCount }}
        </span>
      </div>
    </div>

    <!-- 通知面板 -->
    <div v-if="showPanel" class="notification-panel" @click.stop>
      <div class="panel-header">
        <h3>通知中心</h3>
        <div class="header-actions">
          <button 
            v-if="notifications.some(n => !n.read)" 
            @click="markAllAsRead"
            class="btn btn-sm btn-text"
          >
            全部已读
          </button>
          <button @click="showPanel = false" class="btn btn-sm btn-text">
            ✕
          </button>
        </div>
      </div>

      <div class="panel-filters">
        <button 
          v-for="filter in filters" 
          :key="filter.key"
          @click="activeFilter = filter.key"
          :class="['filter-btn', { active: activeFilter === filter.key }]"
        >
          {{ filter.label }}
          <span v-if="filter.count > 0" class="filter-count">{{ filter.count }}</span>
        </button>
      </div>

      <div class="panel-content">
        <div v-if="loading" class="loading">
          <div class="spinner"></div>
          <p>加载中...</p>
        </div>

        <div v-else-if="filteredNotifications.length === 0" class="empty-state">
          <div class="empty-icon">📭</div>
          <p>{{ activeFilter === 'unread' ? '没有未读通知' : '暂无通知' }}</p>
        </div>

        <div v-else class="notification-list">
          <div 
            v-for="notification in filteredNotifications" 
            :key="notification.id"
            :class="[
              'notification-item', 
              notification.type,
              { unread: !notification.read }
            ]"
            @click="handleNotificationClick(notification)"
          >
            <div class="notification-icon">
              {{ getNotificationIcon(notification.type) }}
            </div>
            
            <div class="notification-content">
              <div class="notification-header">
                <h4 class="notification-title">{{ notification.title }}</h4>
                <span class="notification-time">{{ formatTime(notification.createdAt) }}</span>
              </div>
              
              <p class="notification-message">{{ notification.message }}</p>
              
              <div v-if="notification.actionUrl" class="notification-action">
                <button class="action-btn">{{ notification.actionText || '查看详情' }}</button>
              </div>
            </div>

            <div class="notification-controls">
              <button 
                v-if="!notification.read"
                @click.stop="markAsRead(notification.id)"
                class="control-btn"
                title="标记为已读"
              >
                ✓
              </button>
              <button 
                @click.stop="deleteNotification(notification.id)"
                class="control-btn delete"
                title="删除"
              >
                🗑️
              </button>
            </div>
          </div>
        </div>
      </div>

      <div v-if="hasMore" class="panel-footer">
        <button @click="loadMore" class="btn btn-load-more" :disabled="loadingMore">
          {{ loadingMore ? '加载中...' : '加载更多' }}
        </button>
      </div>
    </div>

    <!-- 遮罩层 -->
    <div v-if="showPanel" class="notification-overlay" @click="showPanel = false"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { 
  fetchNotifications,
  markNotificationAsRead,
  markMultipleNotificationsAsRead,
  deleteNotification as deleteNotificationApi,
  getUnreadNotificationCount,
  type Notification
} from '@/api/notification';

// 响应式数据
const showPanel = ref(false);
const notifications = ref<Notification[]>([]);
const loading = ref(false);
const loadingMore = ref(false);
const unreadCount = ref(0);
const activeFilter = ref('all');
const currentPage = ref(1);
const hasMore = ref(true);

// 筛选器
const filters = computed(() => [
  { 
    key: 'all', 
    label: '全部', 
    count: notifications.value.length 
  },
  { 
    key: 'unread', 
    label: '未读', 
    count: notifications.value.filter(n => !n.read).length 
  },
  { 
    key: 'important', 
    label: '重要', 
    count: notifications.value.filter(n => n.priority === 'high' || n.priority === 'urgent').length 
  }
]);

// 过滤后的通知
const filteredNotifications = computed(() => {
  switch (activeFilter.value) {
    case 'unread':
      return notifications.value.filter(n => !n.read);
    case 'important':
      return notifications.value.filter(n => n.priority === 'high' || n.priority === 'urgent');
    default:
      return notifications.value;
  }
});

// 切换面板显示
function togglePanel() {
  showPanel.value = !showPanel.value;
  if (showPanel.value) {
    loadNotifications();
  }
}

// 加载通知
async function loadNotifications() {
  loading.value = true;
  try {
    const response = await fetchNotifications({
      page: 1,
      limit: 20
    });
    
    if (response.success) {
      notifications.value = response.data.notifications;
      hasMore.value = response.data.hasMore;
      currentPage.value = 1;
    }
  } catch (error) {
    console.error('加载通知失败:', error);
  } finally {
    loading.value = false;
  }
}

// 加载更多
async function loadMore() {
  loadingMore.value = true;
  try {
    const response = await fetchNotifications({
      page: currentPage.value + 1,
      limit: 20
    });
    
    if (response.success) {
      notifications.value.push(...response.data.notifications);
      hasMore.value = response.data.hasMore;
      currentPage.value++;
    }
  } catch (error) {
    console.error('加载更多通知失败:', error);
  } finally {
    loadingMore.value = false;
  }
}

// 标记为已读
async function markAsRead(notificationId: string) {
  try {
    const response = await markNotificationAsRead(notificationId);
    if (response.success) {
      const notification = notifications.value.find(n => n.id === notificationId);
      if (notification) {
        notification.read = true;
        notification.readAt = new Date().toISOString();
      }
      updateUnreadCount();
    }
  } catch (error) {
    console.error('标记通知为已读失败:', error);
  }
}

// 全部标记为已读
async function markAllAsRead() {
  const unreadIds = notifications.value
    .filter(n => !n.read)
    .map(n => n.id);
    
  if (unreadIds.length === 0) return;

  try {
    const response = await markMultipleNotificationsAsRead(unreadIds);
    if (response.success) {
      notifications.value.forEach(n => {
        if (!n.read) {
          n.read = true;
          n.readAt = new Date().toISOString();
        }
      });
      updateUnreadCount();
    }
  } catch (error) {
    console.error('批量标记通知为已读失败:', error);
  }
}

// 删除通知
async function deleteNotification(notificationId: string) {
  if (!confirm('确定要删除这条通知吗？')) return;

  try {
    const response = await deleteNotificationApi(notificationId);
    if (response.success) {
      const index = notifications.value.findIndex(n => n.id === notificationId);
      if (index > -1) {
        notifications.value.splice(index, 1);
      }
      updateUnreadCount();
    }
  } catch (error) {
    console.error('删除通知失败:', error);
  }
}

// 处理通知点击
function handleNotificationClick(notification: Notification) {
  // 如果未读，标记为已读
  if (!notification.read) {
    markAsRead(notification.id);
  }

  // 如果有操作链接，跳转
  if (notification.actionUrl) {
    window.open(notification.actionUrl, '_blank');
  }
}

// 获取通知图标
function getNotificationIcon(type: string) {
  const icons = {
    info: 'ℹ️',
    success: '✅',
    warning: '⚠️',
    error: '❌'
  };
  return icons[type as keyof typeof icons] || 'ℹ️';
}

// 格式化时间
function formatTime(timestamp: string) {
  const now = new Date();
  const time = new Date(timestamp);
  const diff = now.getTime() - time.getTime();
  
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 7) return `${days}天前`;
  
  return time.toLocaleDateString('zh-CN');
}

// 更新未读数量
async function updateUnreadCount() {
  try {
    const response = await getUnreadNotificationCount();
    if (response.success) {
      unreadCount.value = response.count;
    }
  } catch (error) {
    console.error('获取未读通知数量失败:', error);
  }
}

// 键盘事件处理
function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && showPanel.value) {
    showPanel.value = false;
  }
}

// 生命周期
onMounted(() => {
  updateUnreadCount();
  document.addEventListener('keydown', handleKeydown);
  
  // 定期更新未读数量
  setInterval(updateUnreadCount, 30000); // 每30秒更新一次
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown);
});
</script>

<style scoped>
.notification-center {
  position: relative;
  display: inline-block;
}

.notification-trigger {
  cursor: pointer;
  padding: 8px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.notification-trigger:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.notification-icon {
  position: relative;
  font-size: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.notification-badge {
  position: absolute;
  top: -8px;
  right: -8px;
  background: #f44336;
  color: white;
  border-radius: 10px;
  padding: 2px 6px;
  font-size: 12px;
  font-weight: bold;
  min-width: 18px;
  text-align: center;
  line-height: 1.2;
}

.notification-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.1);
  z-index: 999;
}

.notification-panel {
  position: absolute;
  top: 100%;
  right: 0;
  width: 400px;
  max-height: 600px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  display: flex;
  flex-direction: column;
  margin-top: 8px;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #eee;
}

.panel-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.btn {
  padding: 4px 8px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
}

.btn-text {
  background: none;
  color: #666;
}

.btn-text:hover {
  color: #333;
  background: rgba(0, 0, 0, 0.05);
}

.panel-filters {
  display: flex;
  padding: 12px 20px;
  border-bottom: 1px solid #eee;
  gap: 8px;
}

.filter-btn {
  padding: 6px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  color: #666;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 4px;
}

.filter-btn:hover {
  border-color: #2196f3;
  color: #2196f3;
}

.filter-btn.active {
  background: #2196f3;
  color: white;
  border-color: #2196f3;
}

.filter-count {
  background: rgba(255, 255, 255, 0.2);
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 10px;
  min-width: 16px;
  text-align: center;
}

.filter-btn.active .filter-count {
  background: rgba(255, 255, 255, 0.3);
}

.panel-content {
  flex: 1;
  overflow-y: auto;
  max-height: 400px;
}

.loading {
  text-align: center;
  padding: 40px 20px;
  color: #666;
}

.spinner {
  width: 24px;
  height: 24px;
  border: 2px solid #f3f3f3;
  border-top: 2px solid #2196f3;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 12px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #999;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.notification-list {
  padding: 8px 0;
}

.notification-item {
  display: flex;
  align-items: flex-start;
  padding: 12px 20px;
  border-bottom: 1px solid #f5f5f5;
  cursor: pointer;
  transition: background-color 0.2s;
  gap: 12px;
}

.notification-item:hover {
  background: #f8f9fa;
}

.notification-item.unread {
  background: #f0f8ff;
  border-left: 3px solid #2196f3;
}

.notification-item.unread:hover {
  background: #e6f3ff;
}

.notification-item .notification-icon {
  font-size: 16px;
  margin-top: 2px;
  flex-shrink: 0;
}

.notification-content {
  flex: 1;
  min-width: 0;
}

.notification-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 4px;
  gap: 8px;
}

.notification-title {
  margin: 0;
  font-size: 14px;
  font-weight: 500;
  color: #333;
  line-height: 1.3;
}

.notification-time {
  font-size: 11px;
  color: #999;
  white-space: nowrap;
  flex-shrink: 0;
}

.notification-message {
  margin: 0 0 8px;
  font-size: 12px;
  color: #666;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.notification-action {
  margin-top: 8px;
}

.action-btn {
  padding: 4px 12px;
  background: #2196f3;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 11px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.action-btn:hover {
  background: #1976d2;
}

.notification-controls {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex-shrink: 0;
}

.control-btn {
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 4px;
  background: #f5f5f5;
  cursor: pointer;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.control-btn:hover {
  background: #e0e0e0;
}

.control-btn.delete:hover {
  background: #ffebee;
  color: #f44336;
}

.panel-footer {
  padding: 12px 20px;
  border-top: 1px solid #eee;
  text-align: center;
}

.btn-load-more {
  width: 100%;
  padding: 8px;
  background: #f5f5f5;
  border: none;
  border-radius: 4px;
  color: #666;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-load-more:hover:not(:disabled) {
  background: #e0e0e0;
}

.btn-load-more:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 响应式设计 */
@media (max-width: 480px) {
  .notification-panel {
    width: 300px;
    max-height: 500px;
  }
  
  .notification-item {
    padding: 10px 16px;
  }
  
  .panel-header,
  .panel-filters {
    padding: 12px 16px;
  }
}
</style>