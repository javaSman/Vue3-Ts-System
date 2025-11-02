<template>
  <div class="audit-logs-container">
    <div class="header">
      <h1>操作日志审计</h1>
      <div class="header-actions">
        <button class="btn btn-export" @click="exportLogs">📥 导出日志</button>
        <button class="btn btn-refresh" @click="fetchLogs">🔄 刷新</button>
      </div>
    </div>

    <!-- 筛选区域 -->
    <div class="filter-section">
      <div class="filter-row">
        <div class="filter-group">
          <label>用户</label>
          <select v-model="filters.userId">
            <option value="">全部用户</option>
            <option v-for="user in users" :key="user.id" :value="user.id">
              {{ user.username }}
            </option>
          </select>
        </div>

        <div class="filter-group">
          <label>模块</label>
          <select v-model="filters.module">
            <option value="">全部模块</option>
            <option value="auth">认证</option>
            <option value="user">用户管理</option>
            <option value="profile">个人资料</option>
            <option value="permission">权限管理</option>
            <option value="system">系统设置</option>
          </select>
        </div>

        <div class="filter-group">
          <label>操作类型</label>
          <select v-model="filters.action">
            <option value="">全部操作</option>
            <option value="login">登录</option>
            <option value="logout">退出</option>
            <option value="create">创建</option>
            <option value="update">更新</option>
            <option value="delete">删除</option>
            <option value="view">查看</option>
          </select>
        </div>
      </div>

      <div class="filter-row">
        <div class="filter-group">
          <label>开始日期</label>
          <input type="date" v-model="filters.startDate" />
        </div>

        <div class="filter-group">
          <label>结束日期</label>
          <input type="date" v-model="filters.endDate" />
        </div>

        <div class="filter-actions">
          <button class="btn btn-search" @click="applyFilters">🔍 搜索</button>
          <button class="btn btn-clear" @click="clearFilters">🗑️ 清空</button>
        </div>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-section">
      <div class="stat-card">
        <div class="stat-icon">📊</div>
        <div class="stat-info">
          <h3>{{ stats.totalActions || 0 }}</h3>
          <p>总操作数</p>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">📅</div>
        <div class="stat-info">
          <h3>{{ stats.todayActions || 0 }}</h3>
          <p>今日操作</p>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">👥</div>
        <div class="stat-info">
          <h3>{{ uniqueUsers.length }}</h3>
          <p>活跃用户</p>
        </div>
      </div>
    </div>

    <!-- 日志表格 -->
    <div class="table-section">
      <div v-if="loading" class="loading">
        <div class="spinner"></div>
        <p>加载中...</p>
      </div>

      <div v-else-if="logs.length === 0" class="empty-state">
        <div class="empty-icon">📝</div>
        <p>暂无操作日志</p>
      </div>

      <table v-else class="logs-table">
        <thead>
          <tr>
            <th>时间</th>
            <th>用户</th>
            <th>模块</th>
            <th>操作</th>
            <th>详情</th>
            <th>状态</th>
            <th>IP地址</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="log in logs"
            :key="log.id"
            :class="{ failed: log.status === 'failed' }"
          >
            <td>{{ formatDateTime(log.timestamp) }}</td>
            <td>
              <div class="user-info">
                <span class="username">{{ log.username }}</span>
                <span class="user-id">(ID: {{ log.userId }})</span>
              </div>
            </td>
            <td>
              <span class="module-tag" :class="log.module">{{
                getModuleName(log.module)
              }}</span>
            </td>
            <td>
              <span class="action-tag" :class="log.action">{{
                getActionName(log.action)
              }}</span>
            </td>
            <td class="details">{{ log.details }}</td>
            <td>
              <span class="status-tag" :class="log.status">
                {{ log.status === "success" ? "✅ 成功" : "❌ 失败" }}
              </span>
            </td>
            <td>{{ formatIpAddress(log.ipAddress) }}</td>
            <td>
              <div class="operation-buttons">
                <button
                  class="btn btn-view"
                  @click="viewIpDetails(log)"
                  title="查看IP详情"
                >
                  👁️ 查看
                </button>
                <button
                  class="btn btn-delete"
                  @click="confirmDeleteLog(log)"
                  title="删除此条日志"
                >
                  🗑️ 删除
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- IP详情查看弹窗 -->
    <div v-if="showIpModal" class="modal-overlay">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>IP地址详情</h3>
          <button class="modal-close" @click="closeIpModal">×</button>
        </div>
        <div class="modal-body">
          <div class="ip-detail-item">
            <label>原始IP地址:</label>
            <span class="ip-value">{{ selectedLog?.ipAddress || "未知" }}</span>
          </div>
          <div class="ip-detail-item">
            <label>友好显示:</label>
            <span class="ip-friendly">{{
              formatIpAddress(selectedLog?.ipAddress)
            }}</span>
          </div>
          <div class="ip-detail-item">
            <label>地理位置:</label>
            <span
              v-if="
                loadingLocation &&
                !ipLocationCache[selectedLog?.ipAddress || '']
              "
              class="loading-text"
            >
              🌍 正在定位...
            </span>
            <span v-else-if="selectedLog?.location" class="location-text">
              {{ selectedLog.location }}
            </span>
            <span v-else class="location-text">
              {{
                ipLocationCache[selectedLog?.ipAddress || ""] ||
                getIpLocationSync(selectedLog?.ipAddress)
              }}
            </span>
          </div>
          <div class="ip-detail-item">
            <label>访问时间:</label>
            <span>{{ formatDateTime(selectedLog?.timestamp || "") }}</span>
          </div>
          <div class="ip-detail-item">
            <label>用户信息:</label>
            <span
              >{{ selectedLog?.username }} (ID: {{ selectedLog?.userId }})</span
            >
          </div>
          <div class="ip-detail-item">
            <label>操作详情:</label>
            <span>{{ selectedLog?.details }}</span>
          </div>
        </div>
        <!-- <div class="modal-footer">
          <button class="btn btn-secondary" @click="closeIpModal">关闭</button>
        </div> -->
      </div>
    </div>

    <!-- 删除确认弹窗 -->
    <div v-if="showDeleteModal" class="modal-overlay" @click="closeDeleteModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>确认删除</h3>
          <button class="modal-close" @click="closeDeleteModal">×</button>
        </div>
        <div class="modal-body">
          <div class="delete-warning">
            <div class="warning-icon">⚠️</div>
            <p>您确定要删除这条操作日志吗？</p>
            <div class="log-summary">
              <p>
                <strong>时间:</strong>
                {{ formatDateTime(selectedLog?.timestamp || "") }}
              </p>
              <p><strong>用户:</strong> {{ selectedLog?.username }}</p>
              <p>
                <strong>操作:</strong>
                {{ getActionName(selectedLog?.action || "") }}
              </p>
              <p><strong>IP地址:</strong> {{ selectedLog?.ipAddress }}</p>
            </div>
            <p class="warning-text">此操作不可撤销，请谨慎操作！</p>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="closeDeleteModal">
            取消
          </button>
          <button
            class="btn btn-danger"
            @click="deleteLog"
            :disabled="deleting"
          >
            {{ deleting ? "删除中..." : "确认删除" }}
          </button>
        </div>
      </div>
    </div>

    <!-- 分页 -->
    <div class="pagination" v-if="pagination.total > 0">
      <div class="pagination-info">
        显示第 {{ (pagination.page - 1) * pagination.limit + 1 }} -
        {{
          Math.min(pagination.page * pagination.limit, pagination.total)
        }}
        条， 共 {{ pagination.total }} 条记录
      </div>

      <div class="pagination-controls">
        <button
          :disabled="pagination.page <= 1"
          @click="changePage(pagination.page - 1)"
          class="btn btn-page"
        >
          ← 上一页
        </button>

        <span class="current-page"
          >{{ pagination.page }} / {{ totalPages }}</span
        >

        <button
          :disabled="pagination.page >= totalPages"
          @click="changePage(pagination.page + 1)"
          class="btn btn-page"
        >
          下一页 →
        </button>
      </div>
    </div>

    <!-- 消息提示 -->
    <div
      v-if="message.show"
      :class="['message-toast', `toast-${message.type}`]"
    >
      <i :class="getMessageIcon(message.type)"></i>
      <span>{{ message.text }}</span>
      <!-- <button class="toast-close" @click="message.show = false">
        <i class="icon-close"></i>
      </button> -->
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import {
  fetchAuditLogs,
  fetchUserActionStats,
  exportAuditLogs,
  deleteAuditLog,
  type AuditLog,
} from "@/api/auditLog";
import { fetchUsers } from "@/api/userManagement";
import { useAuthStore } from "@/stores/auth";

// 响应式数据
const logs = ref<AuditLog[]>([]);
const users = ref<any[]>([]);
const loading = ref(false);
const stats = ref<any>({});

// 弹窗相关状态
const showIpModal = ref(false);
const showDeleteModal = ref(false);
const selectedLog = ref<AuditLog | null>(null);
const deleting = ref(false);
const ipLocationCache = ref<Record<string, string>>({});
const loadingLocation = ref(false);

// 权限管理
const authStore = useAuthStore();

// 筛选条件
const filters = ref({
  userId: "",
  module: "",
  action: "",
  startDate: "",
  endDate: "",
});

// 分页信息
const pagination = ref({
  page: 1,
  limit: 20,
  total: 0,
});

// 计算属性
const totalPages = computed(() =>
  Math.ceil(pagination.value.total / pagination.value.limit)
);
const uniqueUsers = computed(() => {
  const userIds = new Set(logs.value.map((log) => log.userId));
  return Array.from(userIds);
});

// 获取日志数据
async function fetchLogs() {
  loading.value = true;
  try {
    const params = {
      page: pagination.value.page,
      limit: pagination.value.limit,
      ...filters.value,
      // 修复：将 userId 转换为数字，如果为空则设为 undefined
      userId: filters.value.userId ? Number(filters.value.userId) : undefined,
    };

    const response = await fetchAuditLogs(params);
    if (response.success && response.data) {
      logs.value = response.data.logs;
      pagination.value.total = response.data.total;
    }
  } catch (error) {
    console.error("获取日志失败:", error);
  } finally {
    loading.value = false;
  }
}

// 获取用户列表
async function loadUsers() {
  try {
    const response = await fetchUsers();
    if (response.success) {
      users.value = response.data;
    }
  } catch (error) {
    console.error("获取用户列表失败:", error);
  }
}

// 获取统计数据
async function loadStats() {
  try {
    const response = await fetchUserActionStats();
    if (response.success && response.data) {
      stats.value = response.data;
    }
  } catch (error) {
    console.error("获取统计数据失败:", error);
  }
}

// 应用筛选条件
function applyFilters() {
  pagination.value.page = 1;
  fetchLogs();
}

// 清空筛选条件
function clearFilters() {
  filters.value = {
    userId: "",
    module: "",
    action: "",
    startDate: "",
    endDate: "",
  };
  pagination.value.page = 1;
  fetchLogs();
}

// 切换页面
function changePage(page: number) {
  pagination.value.page = page;
  fetchLogs();
}

// 导出日志
async function exportLogs() {
  try {
    const response = await exportAuditLogs({
      ...filters.value,
      // 修复：将 userId 转换为数字，如果为空则设为 undefined
      userId: filters.value.userId ? Number(filters.value.userId) : undefined,
      format: "xlsx",
    });

    if (response.success && response.data) {
      // 创建下载链接
      const link = document.createElement("a");
      link.href = response.data.downloadUrl;
      link.download = `audit_logs_${
        new Date().toISOString().split("T")[0]
      }.xlsx`;
      link.click();
    }
  } catch (error) {
    console.error("导出日志失败:", error);
  }
}

// 格式化日期时间
function formatDateTime(timestamp: string) {
  return new Date(timestamp).toLocaleString("zh-CN");
}

// 获取模块名称
function getModuleName(module: string) {
  const moduleNames: Record<string, string> = {
    auth: "认证",
    user: "用户管理",
    profile: "个人资料",
    permission: "权限管理",
    system: "系统设置",
    audit: "操作日志",
    data: "数据管理",
  };
  return moduleNames[module] || module;
}

// 获取操作名称
function getActionName(action: string) {
  const actionNames: Record<string, string> = {
    login: "登录",
    logout: "退出",
    create: "创建",
    update: "更新",
    delete: "删除",
    view: "查看",
  };
  return actionNames[action] || action;
}

// 格式化IP地址显示
function formatIpAddress(ip: string | undefined) {
  if (!ip) return "-";

  // 将::1显示为更友好的格式
  if (ip === "::1") {
    return "127.0.0.1 (本地)";
  }

  if (ip === "127.0.0.1") {
    return "127.0.0.1 (本地)";
  }

  return ip;
}

// 获取IP地理位置（集成真实API）
async function getIpLocation(ip: string | undefined): Promise<string> {
  if (!ip) return "未知";

  if (ip === "::1" || ip === "127.0.0.1" || ip.includes("127.0.0.1")) {
    return "本地主机";
  }

  try {
    // 使用免费的IP地理位置API
    const response = await fetch(`http://ip-api.com/json/${ip}?lang=zh-CN`);
    const data = await response.json();

    if (data.status === "success") {
      const { country, regionName, city, isp } = data;
      return `${country} ${regionName} ${city} (${isp})`;
    } else {
      return "未知位置";
    }
  } catch (error) {
    console.error("获取IP地理位置失败:", error);
    return "获取失败";
  }
}

// 获取IP地理位置（模拟，如果API不可用）
function getIpLocationSync(ip: string | undefined) {
  if (!ip) return "未知";

  if (ip === "::1" || ip === "127.0.0.1" || ip.includes("127.0.0.1")) {
    return "本地主机";
  }

  // 这里可以集成真实的IP地理位置服务
  return "未知位置";
}

// 查看IP详情
async function viewIpDetails(log: AuditLog) {
  selectedLog.value = log;
  showIpModal.value = true;

  // 异步获取IP地理位置
  if (log.ipAddress && !ipLocationCache.value[log.ipAddress]) {
    loadingLocation.value = true;
    try {
      const location = await getIpLocation(log.ipAddress.split(" ")[0]); // 去掉 (本地) 等后缀
      ipLocationCache.value[log.ipAddress] = location;
    } catch (error) {
      console.error("获取IP位置失败:", error);
      ipLocationCache.value[log.ipAddress] = "获取失败";
    } finally {
      loadingLocation.value = false;
    }
  }
}

// 关闭IP详情弹窗
function closeIpModal() {
  showIpModal.value = false;
  selectedLog.value = null;
}

// 确认删除日志
function confirmDeleteLog(log: AuditLog) {
  if (authStore.userInfo?.username === "guest") {
    selectedLog.value = log;
    showDeleteModal.value = true;
  } else {
    showMessage("您没有权限删除日志", "info");
  }
}
// 关闭删除确认弹窗
function closeDeleteModal() {
  showDeleteModal.value = false;
  selectedLog.value = null;
}

// 删除日志
async function deleteLog() {
  if (!selectedLog.value) return;

  deleting.value = true;
  try {
    // 调用真正的删除API
    const response = await deleteAuditLog(selectedLog.value.id);

    if (response.success) {
      console.log("日志删除成功:", response.message);
      showMessage("日志删除成功", "success");
      // 从列表中移除
      const index = logs.value.findIndex(
        (log) => log.id === selectedLog.value?.id
      );
      if (index > -1) {
        logs.value.splice(index, 1);
        pagination.value.total -= 1;
      }

      closeDeleteModal();

      // 重新加载数据以确保一致性
      await fetchLogs();
      await loadStats(); // 更新统计数据
    } else {
      console.error("删除失败:", response.message);
      showMessage(response.message, "error");
    }
  } catch (error) {
    console.error("删除日志失败:", error);
    showMessage("删除日志失败", "error");
  } finally {
    deleting.value = false;
  }
}

// 定义消息类型
type MessageType = "success" | "error" | "warning" | "info";

// 定义消息对象接口
interface Message {
  show: boolean;
  text: string;
  type: MessageType;
}

const message = ref<Message>({
  show: false,
  text: "",
  type: "info",
});

// 消息提示函数 - 添加参数类型注解
function showMessage(
  text: string,
  type: MessageType = "info",
  duration = 3000
) {
  message.value = {
    show: true,
    text,
    type,
  };

  setTimeout(() => {
    message.value.show = false;
  }, duration);
}

// 获取消息图标 - 添加参数类型注解和返回类型
function getMessageIcon(type: MessageType): string {
  const icons: Record<MessageType, string> = {
    success: "icon-check",
    error: "icon-error",
    warning: "icon-warning",
    info: "icon-info",
  };
  return icons[type];
}

// 初始化
onMounted(() => {
  fetchLogs();
  loadUsers();
  loadStats();
});
</script>

<style scoped>
/* 消息提示优化 */
.message-toast {
  position: fixed;
  top: 24px;
  right: 24px;
  padding: 16px 20px;
  border-radius: var(--radius);
  box-shadow: var(--shadow-lg);
  z-index: 9999;
  display: flex;
  align-items: center;
  gap: 12px;
  font-weight: 500;
  min-width: 320px;
  border: 1px solid;
  animation: slideIn 0.3s ease-out;
}

.toast-success {
  background: #ecfdf5;
  color: #065f46;
  border-color: #34d399;
}

.toast-error {
  background: #fef2f2;
  color: #991b1b;
  border-color: #f87171;
}

.toast-warning {
  background: #fffbeb;
  color: #92400e;
  border-color: #fbbf24;
}

.toast-info {
  background: #f0f9ff;
  color: #1e40af;
  border-color: #60a5fa;
}

.toast-close {
  background: none;
  border: none;
  color: currentColor;
  cursor: pointer;
  opacity: 0.7;
  transition: all 0.2s ease;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.toast-close:hover {
  opacity: 1;
  background: currentColor;
  color: white;
}

.audit-logs-container {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.header h1 {
  margin: 0;
  color: #2c3e50;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.btn-export {
  background: #4caf50;
  color: white;
}

.btn-export:hover {
  background: #45a049;
}

.btn-refresh {
  background: #2196f3;
  color: white;
}

.btn-refresh:hover {
  background: #1976d2;
}

.filter-section {
  background: white;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.filter-row {
  display: flex;
  gap: 20px;
  align-items: end;
  margin-bottom: 15px;
}

.filter-row:last-child {
  margin-bottom: 0;
}

.filter-group {
  flex: 1;
}

.filter-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
  color: #555;
}

.filter-group select,
.filter-group input {
  width: 85%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.filter-actions {
  display: flex;
  gap: 10px;
}

.btn-search {
  background: #ff9800;
  color: white;
}

.btn-clear {
  background: #9e9e9e;
  color: white;
}

.stats-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.stat-card {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 15px;
}

.stat-icon {
  font-size: 24px;
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
  border-radius: 50%;
}

.stat-info h3 {
  margin: 0;
  font-size: 24px;
  color: #2c3e50;
}

.stat-info p {
  margin: 5px 0 0;
  color: #666;
  font-size: 14px;
}

.table-section {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
}

.loading {
  text-align: center;
  padding: 40px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #2196f3;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: #999;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 20px;
}

.logs-table {
  width: 100%;
  border-collapse: collapse;
}

.logs-table th,
.logs-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.logs-table th {
  background: #f8f9fa;
  font-weight: 600;
  color: #555;
}

.logs-table tr.failed {
  background: #fff5f5;
}

.user-info .username {
  font-weight: 500;
}

.user-info .user-id {
  color: #999;
  font-size: 12px;
}

.module-tag,
.action-tag,
.status-tag {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.module-tag.auth {
  background: #e3f2fd;
  color: #1976d2;
}

.module-tag.user {
  background: #f3e5f5;
  color: #7b1fa2;
}

.module-tag.profile {
  background: #e8f5e8;
  color: #388e3c;
}

.module-tag.permission {
  background: #fff3e0;
  color: #f57c00;
}

.module-tag.system {
  background: #fce4ec;
  color: #c2185b;
}

.action-tag.login {
  background: #e8f5e8;
  color: #388e3c;
}

.action-tag.logout {
  background: #fff3e0;
  color: #f57c00;
}

.action-tag.create {
  background: #e3f2fd;
  color: #1976d2;
}

.action-tag.update {
  background: #f3e5f5;
  color: #7b1fa2;
}

.action-tag.delete {
  background: #ffebee;
  color: #d32f2f;
}

.action-tag.view {
  background: #f5f5f5;
  color: #616161;
}

.status-tag.success {
  background: #e8f5e8;
  color: #388e3c;
}

.status-tag.failed {
  background: #ffebee;
  color: #d32f2f;
}

.details {
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.pagination-info {
  color: #666;
  font-size: 14px;
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 15px;
}

.btn-page {
  background: #f5f5f5;
  color: #333;
}

.btn-page:hover:not(:disabled) {
  background: #e0e0e0;
}

.btn-page:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.current-page {
  font-weight: 500;
  color: #2c3e50;
}

/* 操作按钮样式 */
.operation-buttons {
  display: flex;
  gap: 8px;
  align-items: center;
}

.btn-view {
  background: #2196f3;
  color: white;
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 4px;
}

.btn-view:hover {
  background: #1976d2;
}

.btn-delete {
  background: #f44336;
  color: white;
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 4px;
}

.btn-delete:hover {
  background: #d32f2f;
}

/* 弹窗样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #eee;
}

.modal-header h3 {
  margin: 0;
  color: #2c3e50;
}

.modal-close {
  background: none;
  border: none;
  font-size: 24px;
  color: #999;
  cursor: pointer;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-close:hover {
  color: #666;
}

.modal-body {
  padding: 20px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 20px;
  border-top: 1px solid #eee;
}

/* IP详情样式 */
.ip-detail-item {
  display: flex;
  margin-bottom: 15px;
  align-items: flex-start;
}

.ip-detail-item label {
  min-width: 100px;
  font-weight: 500;
  color: #555;
  margin-right: 15px;
}

.ip-value {
  font-family: monospace;
  background: #f5f5f5;
  padding: 2px 6px;
  border-radius: 3px;
}

.ip-friendly {
  color: #2196f3;
  font-weight: 500;
}

/* 删除确认样式 */
.delete-warning {
  text-align: center;
}

.warning-icon {
  font-size: 48px;
  margin-bottom: 15px;
}

.log-summary {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 6px;
  margin: 15px 0;
  text-align: left;
}

.log-summary p {
  margin: 5px 0;
  font-size: 14px;
}

.warning-text {
  color: #f44336;
  font-weight: 500;
  margin-top: 15px;
}

.location-text {
  color: #4caf50;
  font-weight: 500;
}

.loading-text {
  color: #ff9800;
  font-style: italic;
}

.btn-secondary {
  background: #9e9e9e;
  color: white;
}

.btn-secondary:hover {
  background: #757575;
}

.btn-danger {
  background: #f44336;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background: #d32f2f;
}

.btn-danger:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
