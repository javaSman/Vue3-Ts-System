<template>
  <div class="user-management">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <div class="title-section">
          <h1 class="page-title">
            <i class="icon-users"></i>
            用户管理
          </h1>
          <p class="page-description">管理系统用户账户和权限</p>
        </div>
        <div class="header-actions">
          <button class="btn btn-primary btn-icon" @click="handleAddUser">
            <i class="icon-plus"></i>
            <span>添加用户</span>
          </button>
        </div>
      </div>
    </div>

    <!-- 工具栏区域 -->
    <div class="toolbar-section">
      <div class="search-container">
        <div class="search-box">
          <i class="icon-search"></i>
          <input v-model="searchKeyword" type="text" placeholder="搜索用户名或邮箱..." />
        </div>
        <div class="filter-section">
          <select v-model="roleFilter" class="filter-select">
            <option value="">所有角色</option>
            <option value="guest">超级管理员</option>
            <option value="admin">管理员</option>
            <option value="user">用户</option>
          </select>
          <select v-model="statusFilter" class="filter-select">
            <option value="">所有状态</option>
            <option value="active">活跃</option>
            <option value="inactive">非活跃</option>
          </select>
        </div>
      </div>

      <div class="stats-cards">
        <div class="stat-card">
          <div class="stat-value">{{ totalUsers }}</div>
          <div class="stat-label">总用户数</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ activeUsers }}</div>
          <div class="stat-label">活跃用户</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ adminUsers }}</div>
          <div class="stat-label">管理员</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ guestUsers }}</div>
          <div class="stat-label">超级管理员</div>
        </div>
      </div>
    </div>

    <!-- 用户表格 -->
    <div class="table-container">
      <div v-if="loading" class="loading-overlay">
        <div class="loading-content">
          <div class="loading-spinner"></div>
          <p>加载中...</p>
        </div>
      </div>

      <div class="table-wrapper">
        <table class="users-table">
          <thead>
            <tr>
              <th class="sortable" @click="sortBy('id')">
                ID
                <i :class="getSortIcon('id')"></i>
              </th>
              <th class="sortable" @click="sortBy('username')">
                用户名
                <i :class="getSortIcon('username')"></i>
              </th>
              <th>邮箱</th>
              <th>角色</th>
              <th>状态</th>
              <th class="sortable" @click="sortBy('registeredAt')">
                注册时间
                <i :class="getSortIcon('registeredAt')"></i>
              </th>
              <th class="actions-col">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="filteredUsers.length === 0" class="empty-row">
              <td colspan="7" class="empty-state">
                <div class="empty-content">
                  <i class="icon-empty"></i>
                  <h3>{{ searchKeyword || roleFilter || statusFilter ? '没有找到匹配的用户' : '暂无用户数据' }}</h3>
                  <p>{{ searchKeyword || roleFilter || statusFilter ? '请尝试修改搜索条件' : '点击上方按钮添加第一个用户' }}</p>
                </div>
              </td>
            </tr>
            <tr v-else v-for="user in paginatedUsers" :key="user.id" class="user-row">
              <td class="id-cell">{{ user.id }}</td>
              <td class="username-cell">
                <div class="user-info">
                  <div class="user-avatar">{{ user.username.charAt(0).toUpperCase() }}</div>
                  <span class="username">{{ user.username }}</span>
                </div>
              </td>
              <td class="email-cell">{{ user.email }}</td>
              <td class="role-cell">
                <span :class="['role-badge', `role-${user.role}`]">
                  <i :class="user.role === 'admin' ? 'icon-shield' : 'icon-user'"></i>
                  {{ user.role === 'guest' ? '超级管理员' : user.role === 'admin' ? '管理员' : '用户' }}
                </span>
              </td>
              <td class="status-cell">
                <span :class="['status-badge', `status-${user.status}`]">
                  <i :class="user.status === 'active' ? 'icon-check' : 'icon-pause'"></i>
                  {{ user.status === 'active' ? '活跃' : '非活跃' }}
                </span>
              </td>
              <td class="date-cell">{{ formatDate(user.registeredAt) }}</td>
              <td class="actions-cell">
                <div class="action-buttons">
                  <button class="btn-action btn-view" @click="viewUserPermissions(user)" :title="'查看权限'">
                    <i class="icon-eye"></i>
                  </button>
                  <button class="btn-action btn-edit" @click="editUser(user)" :title="'编辑用户'">
                    <i class="icon-edit"></i>
                  </button>
                  <button class="btn-action btn-delete" @click="confirmDelete(user)" :disabled="deleteLoading"
                    :title="'删除用户'">
                    <i class="icon-delete"></i>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 分页 -->
      <div v-if="totalPages > 1" class="pagination">
        <button class="pagination-btn" @click="currentPage = 1" :disabled="currentPage === 1">
          首页
        </button>
        <button class="pagination-btn" @click="currentPage--" :disabled="currentPage === 1">
          上一页
        </button>
        <span class="pagination-info">
          {{ currentPage }} / {{ totalPages }} 页 (共 {{ filteredUsers.length }} 条记录)
        </span>
        <button class="pagination-btn" @click="currentPage++" :disabled="currentPage === totalPages">
          下一页
        </button>
        <button class="pagination-btn" @click="currentPage = totalPages" :disabled="currentPage === totalPages">
          末页
        </button>
      </div>
    </div>

    <!-- 添加用户对话框 -->
    <div v-if="showAddDialog" class="modal-overlay">
      <div class="modal-container">
        <div class="modal-header">
          <h2>添加新用户</h2>
          <button class="modal-close" @click="showAddDialog = false">
            <i class="icon-close"></i>
          </button>
        </div>
        <form @submit.prevent="addUser" class="modal-form">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">用户名 *</label>
              <input v-model="newUser.username" type="text" class="form-input" placeholder="请输入用户名" required />
            </div>
            <div class="form-group">
              <label class="form-label">邮箱 *</label>
              <input v-model="newUser.email" type="email" class="form-input" placeholder="请输入邮箱地址" required />
            </div>
            <div class="form-group">
              <label class="form-label">密码 *</label>
              <input v-model="newUser.password" type="password" class="form-input" placeholder="请输入密码" required />
            </div>
          </div>
          <!-- 权限选择区域（仅超级管理员可见） -->
          <div v-if="isSuperAdmin" class="form-row permissions-section">
            <div class="form-group full-width">
              <label class="form-label">
                页面权限
                <span class="form-hint">(选择用户可以访问的页面)</span>
                <span v-if="permissionsLoading" class="loading-text">加载中...</span>
              </label>
              <div class="permissions-container">
                <div v-if="permissionsLoading" class="permissions-loading">
                  <div class="mini-spinner"></div>
                  <span>正在加载可用权限...</span>
                </div>
                <div v-else-if="availablePermissions.length === 0" class="permissions-empty">
                  <i class="icon-warning"></i>
                  <span>无可用权限</span>
                </div>
                <div v-else class="permissions-checkboxes">
                  <label v-for="permission in availablePermissions" :key="permission.name" class="permission-checkbox">
                    <input type="checkbox" :value="permission.name" v-model="newUser.routePermissions" />
                    <span class="checkmark"></span>
                    <div class="permission-info">
                      <span class="permission-title">{{ permission.title }}</span>
                      <span class="permission-path">{{ permission.path }}</span>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">角色</label>
              <select v-model="newUser.role" class="form-select">
                <option value="user">用户</option>
                <option value="admin">管理员</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">状态</label>
              <select v-model="newUser.status" class="form-select">
                <option value="active">活跃</option>
                <option value="inactive">非活跃</option>
              </select>
            </div>
          </div>
          <div class="form-actions">
            <button type="button" class="btn btn-secondary" @click="showAddDialog = false">
              取消
            </button>
            <button type="submit" class="btn btn-primary" :disabled="addLoading">
              {{ addLoading ? '添加中...' : '添加用户' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- 编辑用户对话框 -->
    <div v-if="showEditDialog" class="modal-overlay">
      <div class="modal-container">
        <div class="modal-header">
          <h2>编辑用户</h2>
          <button class="modal-close" @click="showEditDialog = false">
            <i class="icon-close"></i>
          </button>
        </div>
        <form @submit.prevent="updateUser" class="modal-form">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">ID</label>
              <input v-model="editingUser.id" type="text" class="form-input" disabled />
            </div>
            <div class="form-group">
              <label class="form-label">用户名 *</label>
              <input v-model="editingUser.username" type="text" class="form-input" placeholder="请输入用户名" required />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">邮箱 *</label>
              <input v-model="editingUser.email" type="email" class="form-input" placeholder="请输入邮箱地址" required />
            </div>
            <div class="form-group">
              <label class="form-label">角色</label>
              <select v-model="editingUser.role" class="form-select">
                <option value="guest">超级管理员</option>
                <option value="user">用户</option>
                <option value="admin">管理员</option>
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">状态</label>
              <select v-model="editingUser.status" class="form-select">
                <option value="active">活跃</option>
                <option value="inactive">非活跃</option>
              </select>
            </div>
          </div>
          <div class="form-actions">
            <button type="button" class="btn btn-secondary" @click="showEditDialog = false">
              取消
            </button>
            <button type="submit" class="btn btn-primary" :disabled="editLoading">
              {{ editLoading ? '保存中...' : '保存修改' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- 删除确认对话框 -->
    <div v-if="showDeleteDialog" class="modal-overlay">
      <div class="modal-container delete-modal">
        <div class="modal-header">
          <h2>确认删除</h2>
          <button class="modal-close" @click="showDeleteDialog = false">
            <i class="icon-close"></i>
          </button>
        </div>
        <div class="modal-body">
          <div class="warning-icon">
            <i class="icon-warning"></i>
          </div>
          <h3>您确定要删除用户 "{{ userToDelete?.username }}" 吗？</h3>
          <p>此操作不可恢复，请谨慎操作。</p>
        </div>
        <div class="form-actions">
          <button type="button" class="btn btn-secondary" @click="showDeleteDialog = false">
            取消
          </button>
          <button type="button" class="btn btn-danger" @click="performDelete" :disabled="deleteLoading">
            {{ deleteLoading ? '删除中...' : '确认删除' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 权限查看/管理对话框 -->
    <div v-if="showPermissionDialog" class="modal-overlay">
      <div class="modal-container permission-modal">
        <div class="modal-header">
          <h2>
            <i class="icon-shield"></i>
            用户权限管理
          </h2>
          <button class="modal-close" @click="closePermissionDialog">
            <i class="icon-close"></i>
          </button>
        </div>
        <div class="modal-form permission-form">
          <div v-if="permissionLoading" class="loading-section">
            <div class="loading-content">
              <div class="loading-spinner"></div>
              <p>正在加载用户权限...</p>
            </div>
          </div>

          <div v-else class="permission-content">
            <!-- 用户信息展示 -->
            <div class="user-section">
              <div class="user-header">
                <div class="user-avatar-large">{{ permissionUser?.username?.charAt(0)?.toUpperCase() }}</div>
                <div class="user-details">
                  <h3 class="user-name">{{ permissionUser?.username }}</h3>
                  <p class="user-email">{{ permissionUser?.email }}</p>
                  <span :class="['role-badge', `role-${permissionUser?.role}`]">
                    <i :class="permissionUser?.role === 'admin' ? 'icon-shield' : 'icon-user'"></i>
                    {{ permissionUser?.role === 'guest' ? '超级管理员' : permissionUser?.role === 'admin' ? '管理员' : '用户' }}
                  </span>
                </div>
              </div>
            </div>

            <!-- 当前权限展示 -->
            <div class="current-permissions-section">
              <h4 class="section-title">
                <i class="icon-list"></i>
                当前权限 ({{ userPermissions.length }} 个)
              </h4>
              <div v-if="userPermissions.length === 0" class="empty-permissions">
                <i class="icon-empty"></i>
                <p>该用户暂未分配任何页面权限</p>
              </div>
              <div v-else class="permissions-grid">
                <div v-for="permission in userPermissions" :key="permission.name" class="permission-card current">
                  <div class="permission-icon">
                    <i class="icon-page"></i>
                  </div>
                  <div class="permission-details">
                    <h5 class="permission-name">{{ permission.title }}</h5>
                    <code class="permission-path">{{ permission.path }}</code>
                    <p class="permission-desc">{{ permission.description || '暂无描述' }}</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- 权限管理区域 (仅超级管理员可见) -->
            <div v-if="isSuperAdmin" class="permission-management-section">
              <div class="section-header">
                <h4 class="section-title">
                  <i class="icon-settings"></i>
                  权限管理
                </h4>
                <div class="permission-stats">
                  <span class="stat">已选择: {{ tempSelectedPermissions.length }}</span>
                  <span class="stat">可用: {{ allPermissions.length }}</span>
                  <span class="stat">剩余: {{ allPermissions.length - tempSelectedPermissions.length }}</span>
                </div>
              </div>

              <!-- 权限选择区域代码 -->
              <div class="permissions-editor">
                <div class="editor-hint">
                  <i class="icon-info"></i>
                  <span>选择该用户可以访问的页面，更改会立即保存</span>
                  <span v-if="tempSelectedPermissions.length > 0" class="selection-order-hint">
                    (选中顺序: {{ getOrderHint() }})
                  </span>
                </div>

                <div class="permissions-list">
                  <label v-for="permission in allPermissions" :key="permission.name" class="permission-checkbox" :class="{
                    'selected': tempSelectedPermissions.includes(permission.name),
                    'disabled': permissionSaving,
                    'order-highlight': tempSelectedPermissions.includes(permission.name)
                  }" :style="getPermissionOrderStyle(permission.name)">
                    <input type="checkbox" :value="permission.name"
                      :checked="tempSelectedPermissions.includes(permission.name)" :disabled="permissionSaving"
                      @change="handlePermissionChange(permission.name, $event)" />
                    <span class="checkmark"></span>
                    <div class="permission-info">
                      <span class="permission-title">{{ permission.title }}</span>
                      <code class="permission-path">{{ permission.path }}</code>
                      <span class="permission-category">{{ permission.category || '未分类' }}</span>
                      <span v-if="tempSelectedPermissions.includes(permission.name)" class="permission-order-badge">
                        第 {{ getPermissionOrder(permission.name) }} 个选中
                      </span>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            <!-- 只读提示 (非超级管理员) -->
            <div v-else class="readonly-notice">
              <i class="icon-lock"></i>
              <p>您没有权限修改用户权限设置</p>
            </div>
          </div>
        </div>

        <!-- 弹窗操作按钮 -->
        <div class="form-actions">
          <button type="button" class="btn btn-secondary" @click="closePermissionDialog">
            关闭
          </button>
          <button v-if="isSuperAdmin" type="button" class="btn btn-primary" @click="savePermissionChanges"
            :disabled="permissionSaving">
            {{ permissionSaving ? '保存中...' : '保存更改' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 消息提示 -->
    <div v-if="message.show" :class="['message-toast', `toast-${message.type}`]">
      <i :class="getMessageIcon(message.type)"></i>
      <span>{{ message.text }}</span>
      <button class="toast-close" @click="message.show = false">
        <i class="icon-close"></i>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import {
  fetchAvailablePermissions,
  fetchUserRoutePermissions,
  updateUserRoutePermissions
} from '@/api/permissions';
import {
  fetchUsers,
  deleteUser as apiDeleteUser,
  updateUser as apiUpdateUser,
  createUser as apiCreateUser
} from '@/api/userManagement';
import { useAuthStore } from '@/stores/auth';

// 定义用户接口类型 - 明确包含status属性
interface User {
  id: number;
  username: string;
  email: string;
  role: 'user' | 'admin' | 'guest';
  status: 'active' | 'inactive'; // 确保包含status
  registeredAt?: string;
  permissions?: string[]; // API返回的权限数组
}

// 定义权限接口类型 - 使category成为可选，并处理其他可能字段
interface Permission {
  name: string;
  title: string;
  category?: string | undefined; // 明确category为可选
  path?: string;
  description?: string;
  component?: string;
  parent?: string;
}

// 定义API响应接口类型
interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
}

// 定义用户表单数据接口
interface UserData {
  username: string;
  email: string;
  password: string;
  role: 'user' | 'admin' | 'guest';
  status: 'active' | 'inactive';
  routePermissions?: string[];
}

// 响应式状态
const users = ref<User[]>([]);
const loading = ref<boolean>(false);
const addLoading = ref<boolean>(false);
const editLoading = ref<boolean>(false);
const deleteLoading = ref<boolean>(false);

// 权限相关
const authStore = useAuthStore();
const availablePermissions = ref<Permission[]>([]);
const permissionsLoading = ref<boolean>(false);

// 检查是否为超级管理员
const isSuperAdmin = computed(() => {
  return authStore.userInfo?.username === 'guest';
});

// 搜索和过滤
const searchKeyword = ref<string>('');
const roleFilter = ref<string>('');
const statusFilter = ref<string>('');

// 排序
const sortField = ref<string>('id');
const sortDirection = ref<string>('asc');

// 分页
const currentPage = ref<number>(1);
const pageSize = ref<number>(10);

// 对话框状态
const showAddDialog = ref<boolean>(false);
const showEditDialog = ref<boolean>(false);
const showDeleteDialog = ref<boolean>(false);
const showPermissionDialog = ref<boolean>(false);

// 表单数据
const newUser = ref<UserData>({
  username: '',
  email: '',
  password: '',
  role: 'user',
  status: 'active',
  routePermissions: []
});

// 修复编辑用户类型问题
const editingUser = ref<{
  id: number;
  username: string;
  email: string;
  role: 'user' | 'admin' | 'guest';
  status: 'active' | 'inactive';
}>({
  id: 0,
  username: '',
  email: '',
  role: 'user',
  status: 'active'
});

const userToDelete = ref<User | null>(null);

// 权限管理相关状态
const permissionUser = ref<User | null>(null);
const userPermissions = ref<Permission[]>([]);
const allPermissions = ref<Permission[]>([]);
const permissionLoading = ref<boolean>(false);
const permissionSaving = ref<boolean>(false);
const tempSelectedPermissions = ref<string[]>([]);

// 安全访问用户属性的函数
function getUserProperty<T extends keyof User>(user: User, key: T): User[T] {
  return user[key];
}

// 处理权限选择变化
function handlePermissionChange(permissionName: string, event: Event): void {
  const target = event.target as HTMLInputElement;
  const isChecked = target.checked;

  if (isChecked) {
    if (!tempSelectedPermissions.value.includes(permissionName)) {
      tempSelectedPermissions.value.push(permissionName);
    }
  } else {
    const index = tempSelectedPermissions.value.indexOf(permissionName);
    if (index > -1) {
      tempSelectedPermissions.value.splice(index, 1);
    }
  }

  tempSelectedPermissions.value = [...tempSelectedPermissions.value];
}

// 获取权限的选中顺序
function getPermissionOrder(permissionName: string): number {
  const index = tempSelectedPermissions.value.indexOf(permissionName);
  return index > -1 ? index + 1 : 0;
}

// 获取权限顺序样式
function getPermissionOrderStyle(permissionName: string): { [key: string]: string } {
  const index = tempSelectedPermissions.value.indexOf(permissionName);
  if (index === -1) return {};

  const hue = (index * 30) % 360;
  return {
    '--order-color': `hsl(${hue}, 70%, 90%)`,
    '--order-border-color': `hsl(${hue}, 70%, 70%)`
  };
}

// 获取顺序提示文本
function getOrderHint(): string {
  if (tempSelectedPermissions.value.length === 0) {
    return '无选中权限';
  }

  return tempSelectedPermissions.value.map((name, index) => {
    const permission = allPermissions.value.find(p => p.name === name);
    return `${index + 1}.${permission ? permission.title : name}`;
  }).join(' → ');
}

// 消息提示
const message = ref<{
  show: boolean;
  text: string;
  type: 'success' | 'error' | 'warning' | 'info';
}>({
  show: false,
  text: '',
  type: 'info'
});

// 计算属性 - 修复索引访问问题和未定义值问题
const filteredUsers = computed<User[]>(() => {
  let filtered = users.value;

  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase();
    filtered = filtered.filter(user =>
      getUserProperty(user, 'username').toLowerCase().includes(keyword) ||
      getUserProperty(user, 'email').toLowerCase().includes(keyword)
    );
  }

  if (roleFilter.value) {
    filtered = filtered.filter(user => getUserProperty(user, 'role') === roleFilter.value);
  }

  if (statusFilter.value) {
    filtered = filtered.filter(user => getUserProperty(user, 'status') === statusFilter.value);
  }

  filtered.sort((a, b) => {
    let aVal = a[sortField.value as keyof User];
    let bVal = b[sortField.value as keyof User];

    // 处理数字类型字段
    if (sortField.value === 'id') {
      aVal = aVal !== undefined ? parseInt(String(aVal)) : 0;
      bVal = bVal !== undefined ? parseInt(String(bVal)) : 0;
    }
    // 处理日期类型字段
    else if (sortField.value === 'registeredAt') {
      aVal = aVal ? new Date(aVal as string).getTime() : 0;
      bVal = bVal ? new Date(bVal as string).getTime() : 0;
    }
    // 处理其他可能的字段，确保它们不是undefined
    else {
      // 对于其他字段，如果它们是undefined，则提供一个默认值
      // 字符串字段可以转换为小写进行比较，但首先确保它们不是undefined
      if (aVal !== undefined && bVal !== undefined) {
        // 如果是字符串，确保安全转换
        if (typeof aVal === 'string' && typeof bVal === 'string') {
          aVal = aVal.toLowerCase();
          bVal = bVal.toLowerCase();
        }
      } else {
        // 如果任一值为undefined，给它们一个默认值以确保排序稳定
        aVal = '';
        bVal = '';
      }
    }

    // 确保aVal和bVal在进行比较前不是undefined
    // 对于数字比较
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      if (sortDirection.value === 'asc') {
        return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      } else {
        return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
      }
    }
    // 对于字符串比较
    else if (typeof aVal === 'string' && typeof bVal === 'string') {
      if (sortDirection.value === 'asc') {
        return aVal.localeCompare(bVal);
      } else {
        return bVal.localeCompare(aVal);
      }
    }
    // 对于其他类型，提供默认排序
    else {
      if (sortDirection.value === 'asc') {
        return 0;
      } else {
        return 0;
      }
    }
  });

  return filtered;
});

const paginatedUsers = computed<User[]>(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return filteredUsers.value.slice(start, end);
});

const totalPages = computed<number>(() => {
  return Math.ceil(filteredUsers.value.length / pageSize.value);
});

const totalUsers = computed<number>(() => users.value.length);
const activeUsers = computed<number>(() => users.value.filter(u => getUserProperty(u, 'status') === 'active').length);
const adminUsers = computed<number>(() => users.value.filter(u => getUserProperty(u, 'role') === 'admin').length);
const guestUsers = computed<number>(() => users.value.filter(u => getUserProperty(u, 'role') === 'guest').length);

// 监听过滤条件变化，重置页码
watch([searchKeyword, roleFilter, statusFilter], () => {
  currentPage.value = 1;
});

// 消息提示函数
function showMessage(text: string, type: 'success' | 'error' | 'warning' | 'info' = 'info', duration: number = 3000): void {
  message.value = {
    show: true,
    text,
    type
  };

  setTimeout(() => {
    message.value.show = false;
  }, duration);
}

// 格式化日期
function formatDate(dateString?: string): string {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// 查看用户权限 - 修复权限数据处理
async function viewUserPermissions(user: User): Promise<void> {
  try {
    permissionUser.value = { ...user };
    showPermissionDialog.value = true;
    permissionLoading.value = true;

    const result = await fetchUserRoutePermissions(user.id);

    if (result.success && result.data) {
      // 安全处理权限数据 - 修复类型不匹配问题
      userPermissions.value = [];
      allPermissions.value = [];
      tempSelectedPermissions.value = [];

      // 处理 permissions 数据
      if (result.data.permissions) {
        // 方案1: 如果权限数据已经是我们期望的格式 (有 name 和 title 属性)
        if (Array.isArray(result.data.permissions) &&
          result.data.permissions.length > 0 &&
          'name' in result.data.permissions[0] &&
          'title' in result.data.permissions[0]) {
          userPermissions.value = result.data.permissions as Permission[];
        }
        // 方案2: 如果权限数据格式不同，进行转换
        else if (Array.isArray(result.data.permissions)) {
          userPermissions.value = (result.data.permissions as Array<{ name: string; title: string;[key: string]: any }>).map((p: any) => ({
            name: p.name,
            title: p.title,
            category: p.category || '', // 确保category有默认值
            path: p.path,
            description: p.description
          })) as Permission[];
        }
      }

      // 处理 allAvailablePermissions 数据
      if (result.data.allAvailablePermissions) {
        if (Array.isArray(result.data.allAvailablePermissions) &&
          result.data.allAvailablePermissions.length > 0 &&
          'name' in result.data.allAvailablePermissions[0] &&
          'title' in result.data.allAvailablePermissions[0]) {
          allPermissions.value = result.data.allAvailablePermissions as Permission[];
        }
        else if (Array.isArray(result.data.allAvailablePermissions)) {
          allPermissions.value = (result.data.allAvailablePermissions as Array<{ name: string; title: string;[key: string]: any }>).map((p: any) => ({
            name: p.name,
            title: p.title,
            category: p.category || '', // 确保category有默认值
            path: p.path,
            description: p.description
          })) as Permission[];
        }
      }

      // 设置选中的权限
      if (userPermissions.value.length > 0) {
        tempSelectedPermissions.value = userPermissions.value.map(p => p.name);
      }
    } else {
      console.error('API返回错误:', result.message);
      showMessage(result.message || '获取用户权限失败', 'error');
      showPermissionDialog.value = false;
    }
  } catch (error) {
    console.error('查看用户权限异常:', error);
    showMessage('查看用户权限失败，请重试', 'error');
    showPermissionDialog.value = false;
  } finally {
    permissionLoading.value = false;
  }
}

// 保存用户权限更改
async function savePermissionChanges(): Promise<void> {
  if (!permissionUser.value || !isSuperAdmin.value) {
    showMessage('没有权限修改用户权限', 'error');
    return;
  }

  try {
    permissionSaving.value = true;
    const result = await updateUserRoutePermissions(
      permissionUser.value.id,
      tempSelectedPermissions.value
    );

    if (result.success) {
      userPermissions.value = allPermissions.value.filter(p =>
        tempSelectedPermissions.value.includes(p.name)
      );

      showMessage('用户权限更新成功', 'success');
    } else {
      console.error('API返回错误:', result.message);
      showMessage(result.message || '更新用户权限失败', 'error');
      tempSelectedPermissions.value = userPermissions.value.map(p => p.name);
    }
  } catch (error) {
    console.error('保存权限异常:', error);
    showMessage('保存权限失败，请重试', 'error');
    tempSelectedPermissions.value = userPermissions.value.map(p => p.name);
  } finally {
    permissionSaving.value = false;
  }
}

// 取消权限编辑
function cancelPermissionEdit(): void {
  tempSelectedPermissions.value = userPermissions.value.map(p => p.name);
}

// 关闭权限弹窗
function closePermissionDialog(): void {
  showPermissionDialog.value = false;
  permissionUser.value = null;
  userPermissions.value = [];
  allPermissions.value = [];
  tempSelectedPermissions.value = [];
}

// 获取可用权限列表 - 修复权限类型处理
async function loadAvailablePermissions(): Promise<void> {
  if (!isSuperAdmin.value) return;

  try {
    permissionsLoading.value = true;

    const result = await fetchAvailablePermissions();

    if (result.success && result.data) {
      // 处理权限数据，确保类型安全
      if (Array.isArray(result.data)) {
        // 方案1: 数据已经是正确的Permission类型
        if (result.data.length > 0 && 'name' in result.data[0] && 'title' in result.data[0]) {
          availablePermissions.value = result.data as Permission[];
        }
        // 方案2: 数据格式不同，进行转换
        else {
          availablePermissions.value = (result.data as Array<{ name: string; title: string;[key: string]: any }>).map((p: any) => ({
            name: p.name,
            title: p.title,
            category: p.category || '', // 确保category有默认值
            path: p.path,
            description: p.description
          })) as Permission[];
        }
      } else {
        availablePermissions.value = [];
      }
    } else {
      console.error('API返回错误:', result.message);
      showMessage(result.message || '获取可用权限失败', 'error');
    }
  } catch (error) {
    console.error('获取可用权限异常:', error);
    showMessage('获取可用权限失败，请检查网络连接', 'error');
  } finally {
    permissionsLoading.value = false;
  }
}

// 获取用户列表 - 修复用户status属性问题
async function loadUsers(): Promise<void> {
  try {
    loading.value = true;

    const result = await fetchUsers();

    if (result.success && result.data) {
      users.value = result.data.map(user => {
        // 确保每个用户都有status属性，如果API没有返回则默认为'active'
        const userStatus = (user as any).status !== undefined ? (user as any).status : 'active';

        return {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.permissions?.includes('guest')
            ? 'guest'
            : user.permissions?.includes('admin')
              ? 'admin'
              : 'user',
          status: userStatus as 'active' | 'inactive', // 确保类型正确
          registeredAt: user.registeredAt
        };
      });
    } else {
      console.error('API返回错误:', result.message);
      showMessage(result.message || '获取用户列表失败', 'error');
    }
  } catch (error) {
    console.error('获取用户列表异常:', error);
    showMessage('获取用户列表失败，请检查网络连接或重启Mock服务器', 'error');
  } finally {
    loading.value = false;
  }
}

// 排序功能
function sortBy(field: string): void {
  if (sortField.value === field) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc';
  } else {
    sortField.value = field;
    sortDirection.value = 'asc';
  }
}

function getSortIcon(field: string): string {
  if (sortField.value !== field) {
    return 'icon-sort';
  }
  return sortDirection.value === 'asc' ? 'icon-sort-up' : 'icon-sort-down';
}

function handleAddUser(): void {
  if (isSuperAdmin.value === false) {
    showMessage('你没有权限添加用户', 'info');
    return;
  } else {
    showAddDialog.value = true;
  }
}

// 添加用户
async function addUser(): Promise<void> {
  try {
    addLoading.value = true;

    const result = await apiCreateUser({
      username: newUser.value.username,
      email: newUser.value.email,
      password: newUser.value.password,
      permissions: newUser.value.role === 'admin' ? ['admin'] : [],
      status: newUser.value.status,
      routePermissions: isSuperAdmin.value ? newUser.value.routePermissions : []
    });

    if (result.success) {
      showAddDialog.value = false;
      newUser.value = {
        username: '',
        email: '',
        password: '',
        role: 'user',
        status: 'active',
        routePermissions: []
      };
      await loadUsers();
      showMessage('用户添加成功', 'success');
    } else {
      console.error('API返回错误:', result.message);
      showMessage(result.message || '添加用户失败', 'error');
    }
  } catch (error) {
    console.error('添加用户异常:', error);
    showMessage('添加用户失败，请重试', 'error');
  } finally {
    addLoading.value = false;
  }
}

// 编辑用户
function editUser(user: User): void {
  if (isSuperAdmin.value === false) {
    showMessage('你没有权限修改用户信息', 'info');
    return;
  }
  editingUser.value = {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    status: user.status
  };
  showEditDialog.value = true;
}

// 更新用户
async function updateUser(): Promise<void> {
  try {
    editLoading.value = true;

    const result = await apiUpdateUser(editingUser.value.id, {
      username: editingUser.value.username,
      email: editingUser.value.email,
      permissions: editingUser.value.role === 'admin' ? ['admin'] : [],
      status: editingUser.value.status
    });

    if (result.success) {
      showEditDialog.value = false;
      await loadUsers();
      showMessage('用户信息更新成功', 'success');
    } else {
      console.error('API返回错误:', result.message);
      showMessage(result.message || '更新用户失败', 'error');
    }
  } catch (error) {
    console.error('更新用户异常:', error);
    showMessage('更新用户失败，请重试', 'error');
  } finally {
    editLoading.value = false;
  }
}

// 确认删除
function confirmDelete(user: User): void {
  if (isSuperAdmin.value === false) {
    showMessage('你没有权限删除', 'info');
  } else {
    userToDelete.value = user;
    showDeleteDialog.value = true;
  }
}

// 执行删除
async function performDelete(): Promise<void> {
  if (!userToDelete.value) return;

  try {
    deleteLoading.value = true;

    const result = await apiDeleteUser(userToDelete.value.id);

    if (result.success) {
      showMessage(`用户 "${userToDelete.value.username}" 删除成功`, 'success');
      await loadUsers();
    } else {
      console.error('API返回错误:', result.message);
      showMessage(result.message || '删除用户失败', 'error');
    }
  } catch (error) {
    console.error('删除用户异常:', error);
    showMessage('删除用户失败，请检查网络连接', 'error');
  } finally {
    deleteLoading.value = false;
    showDeleteDialog.value = false;
    userToDelete.value = null;
  }
}

// 获取消息图标
function getMessageIcon(type: 'success' | 'error' | 'warning' | 'info'): string {
  const icons = {
    success: 'icon-check',
    error: 'icon-error',
    warning: 'icon-warning',
    info: 'icon-info'
  };
  return icons[type] || 'icon-info';
}

// 组件挂载时加载数据
onMounted(async (): Promise<void> => {
  await loadUsers();
  if (isSuperAdmin.value) {
    await loadAvailablePermissions();
  }
});
</script>

<style>
/* CSS 变量定义 */
:root {
  --primary-color: #3b82f6;
  --primary-hover: #2563eb;
  --success-color: #10b981;
  --warning-color: #f59e0b;
  --danger-color: #ef4444;
  --info-color: #06b6d4;
  --gray-50: #f9fafb;
  --gray-100: #f3f4f6;
  --gray-200: #e5e7eb;
  --gray-300: #d1d5db;
  --gray-400: #9ca3af;
  --gray-500: #6b7280;
  --gray-600: #4b5563;
  --gray-700: #374151;
  --gray-800: #1f2937;
  --gray-900: #111827;
  --radius: 8px;
  --radius-lg: 12px;
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
}

/* 重置和基础样式 */
* {
  box-sizing: border-box;
}
</style>

<style scoped>
.user-management {
  padding: 24px;
  min-height: 100vh;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Microsoft YaHei', sans-serif;
}

/* 页面头部优化 */
.page-header {
  margin-bottom: 32px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 24px;
}

.title-section {
  flex: 1;
}

.page-title {
  font-size: 32px;
  font-weight: 700;
  color: var(--gray-900);
  margin: 0 0 8px 0;
  line-height: 1.2;
  display: flex;
  align-items: center;
  gap: 12px;
}

.page-title i {
  font-size: 28px;
  background: linear-gradient(135deg, var(--primary-color), var(--info-color));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.page-description {
  font-size: 16px;
  color: var(--gray-600);
  margin: 0;
  line-height: 1.5;
}

.header-actions {
  display: flex;
  gap: 12px;
}

/* 工具栏区域优化 */
.toolbar-section {
  background: white;
  border-radius: var(--radius-lg);
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--gray-200);
}

.search-container {
  display: flex;
  gap: 16px;
  align-items: center;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.search-box {
  position: relative;
  flex: 1;
  min-width: 300px;
}

.search-box i {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--gray-400);
  font-size: 16px;
}

.search-box input {
  width: 100%;
  padding: 12px 16px 12px 48px;
  border: 2px solid var(--gray-200);
  border-radius: var(--radius);
  font-size: 14px;
  background: white;
  transition: all 0.2s ease;
}

.search-box input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgb(59 130 246 / 0.1);
}

.search-box input::placeholder {
  color: var(--gray-400);
}

.filter-section {
  display: flex;
  gap: 12px;
  align-items: center;
}

.filter-select {
  padding: 10px 16px;
  border: 2px solid var(--gray-200);
  border-radius: var(--radius);
  background: white;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 120px;
}

.filter-select:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgb(59 130 246 / 0.1);
}

.filter-select:hover {
  border-color: var(--gray-300);
}

/* 统计卡片优化 */
.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.stat-card {
  background: white;
  padding: 24px;
  border-radius: var(--radius-lg);
  border: 1px solid var(--gray-200);
  text-align: center;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, var(--primary-color), var(--info-color));
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
  border-color: var(--primary-color);
}

.stat-value {
  font-size: 36px;
  font-weight: 700;
  color: var(--gray-900);
  margin-bottom: 8px;
  background: linear-gradient(135deg, var(--primary-color), var(--info-color));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.stat-label {
  font-size: 14px;
  color: var(--gray-600);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* 表格区域优化 */
.table-container {
  background: white;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--gray-200);
  overflow: hidden;
  position: relative;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  backdrop-filter: blur(2px);
}

.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  color: var(--gray-600);
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--gray-200);
  border-top: 3px solid var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

.table-wrapper {
  overflow-x: auto;
}

.users-table {
  width: 100%;
  border-collapse: collapse;
}

.users-table th {
  background: var(--gray-50);
  padding: 16px 20px;
  text-align: left;
  font-weight: 600;
  color: var(--gray-700);
  font-size: 14px;
  border-bottom: 2px solid var(--gray-200);
  white-space: nowrap;
  position: sticky;
  top: 0;
  z-index: 1;
}

.users-table th.sortable {
  cursor: pointer;
  user-select: none;
  transition: all 0.2s ease;
}

.users-table th.sortable:hover {
  background: var(--gray-100);
  color: var(--primary-color);
}

.users-table th.sortable i {
  margin-left: 8px;
  color: var(--gray-400);
  transition: color 0.2s ease;
}

.users-table th.sortable:hover i {
  color: var(--primary-color);
}

.users-table td {
  padding: 16px 20px;
  border-bottom: 1px solid var(--gray-100);
  vertical-align: middle;
}

.user-row {
  transition: all 0.2s ease;
}

.user-row:hover {
  background: var(--gray-50);
  /* transform: scale(1.002); */
}

.user-row:nth-child(even) {
  background: rgba(248, 250, 252, 0.5);
}

.user-row:nth-child(even):hover {
  background: var(--gray-50);
}

/* 用户信息展示优化 */
.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--primary-color), var(--info-color));
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 16px;
  border: 2px solid white;
  box-shadow: var(--shadow-sm);
  transition: all 0.3s ease;
}

.user-row:hover .user-avatar {
  transform: scale(1.1);
  box-shadow: var(--shadow-md);
}

.username {
  font-weight: 600;
  color: var(--gray-900);
  font-size: 14px;
  transition: color 0.2s ease;
}

.user-row:hover .username {
  color: var(--primary-color);
}

.id-cell {
  font-weight: 600;
  color: var(--gray-700);
  font-family: 'Monaco', 'Consolas', monospace;
}

.email-cell {
  color: var(--gray-600);
  font-size: 13px;
}

/* 标签样式优化 */
.role-badge,
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border: 1px solid;
  transition: all 0.2s ease;
}

.role-badge:hover,
.status-badge:hover {
  transform: scale(1.05);
}

.role-admin {
  background: #fef3c7;
  color: #92400e;
  border-color: #fbbf24;
}

.role-user {
  background: #dbeafe;
  color: #1e40af;
  border-color: #60a5fa;
}

.status-active {
  background: #d1fae5;
  color: #065f46;
  border-color: #34d399;
}

.status-inactive {
  background: #fee2e2;
  color: #991b1b;
  border-color: #f87171;
}

.role-badge i,
.status-badge i {
  font-size: 10px;
}

/* 操作按钮优化 */
.action-buttons {
  display: flex;
  gap: 8px;
  justify-content: center;
}

.btn-action {
  width: 36px;
  height: 36px;
  border: none;
  border-radius: var(--radius);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  position: relative;
  font-size: 14px;
}

.btn-action::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: currentColor;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.btn-action:hover::before {
  opacity: 0.1;
}

.btn-edit {
  background: var(--warning-color);
  color: white;
  box-shadow: var(--shadow-sm);
}

.btn-edit:hover {
  background: #d97706;
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.btn-view {
  background: var(--info-color);
  color: white;
  box-shadow: var(--shadow-sm);
}

.btn-view:hover {
  background: #0891b2;
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.btn-delete {
  background: var(--danger-color);
  color: white;
  box-shadow: var(--shadow-sm);
}

.btn-delete:hover {
  background: #dc2626;
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.btn-delete:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

/* 通用按钮优化 */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  border: none;
  border-radius: var(--radius);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
  position: relative;
  overflow: hidden;
}

.btn::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  transition: all 0.4s ease;
  transform: translate(-50%, -50%);
}

.btn:hover::before {
  width: 300px;
  height: 300px;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.btn-primary {
  background: linear-gradient(135deg, var(--primary-color), var(--info-color));
  color: white;
  box-shadow: var(--shadow-sm);
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.btn-secondary {
  background: var(--gray-200);
  color: var(--gray-700);
  border: 1px solid var(--gray-300);
}

.btn-secondary:hover:not(:disabled) {
  background: var(--gray-300);
  border-color: var(--gray-400);
}

.btn-danger {
  background: var(--danger-color);
  color: white;
  box-shadow: var(--shadow-sm);
}

.btn-danger:hover:not(:disabled) {
  background: #dc2626;
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.btn-icon {
  gap: 8px;
}

.btn-icon i {
  font-size: 16px;
}

/* 空状态 */
.empty-cell {
  text-align: center;
  padding: 80px 20px;
}

.empty-state {
  color: #718096;
}

.empty-state svg {
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-state h3 {
  margin: 0 0 8px 0;
  font-size: 18px;
  color: #4a5568;
}

.empty-state p {
  margin: 0;
  font-size: 14px;
}

/* 模态框 */
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal {
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 32px;
  border-bottom: 1px solid var(--gray-200);
  background: var(--gray-50);
}

.modal-header h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: var(--gray-900);
  display: flex;
  align-items: center;
  gap: 8px;
}

.modal-close {
  width: 36px;
  height: 36px;
  border: none;
  background: white;
  border-radius: var(--radius);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--gray-400);
  transition: all 0.2s ease;
  border: 1px solid var(--gray-200);
}

.modal-close:hover {
  background: var(--gray-100);
  color: var(--gray-600);
  border-color: var(--gray-300);
  transform: scale(1.05);
}

.modal-body {
  padding: 24px;
  flex: 1;
  overflow-y: auto;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 24px;
}

.form-field {
  display: flex;
  flex-direction: column;
}

.field-label {
  margin-bottom: 8px;
  font-weight: 500;
  color: #4a5568;
  font-size: 14px;
}

.field-input,
.field-select {
  padding: 12px 16px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
  transition: all 0.2s ease;
}

.field-input:focus,
.field-select:focus {
  outline: none;
  border-color: #4299e1;
  box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.1);
}

.field-input:disabled {
  background: #f7fafc;
  color: #a0aec0;
  cursor: not-allowed;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
}

/* 模态框布局修复 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

.modal-container {
  background: white;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  animation: slideUp 0.3s ease;
  position: relative;
}

@keyframes slideUp {
  from {
    transform: translateY(30px);
    opacity: 0;
  }

  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.modal-form {
  padding: 32px;
  flex: 1;
  overflow-y: auto;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 24px;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-label {
  margin-bottom: 8px;
  font-weight: 600;
  color: var(--gray-700);
  font-size: 14px;
}

.form-input,
.form-select {
  padding: 12px 16px;
  border: 2px solid var(--gray-200);
  border-radius: var(--radius);
  font-size: 14px;
  transition: all 0.2s ease;
  background: white;
}

.form-input:focus,
.form-select:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgb(59 130 246 / 0.1);
}

.form-input:disabled {
  background: var(--gray-100);
  color: var(--gray-500);
  cursor: not-allowed;
  border-color: var(--gray-200);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 24px 32px;
  border-top: 1px solid var(--gray-200);
  background: var(--gray-50);
}

/* 删除确认模态框优化 */
.delete-modal {
  max-width: 480px;
}

.warning-icon {
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
}

.warning-icon i {
  font-size: 64px;
  color: var(--warning-color);
  animation: pulse 2s infinite;
}

@keyframes pulse {

  0%,
  100% {
    transform: scale(1);
  }

  50% {
    transform: scale(1.05);
  }
}

.modal-body h3 {
  margin: 0 0 16px 0;
  text-align: center;
  font-size: 18px;
  color: var(--gray-900);
  font-weight: 600;
}

.modal-body p {
  margin: 0;
  text-align: center;
  color: var(--gray-600);
  line-height: 1.6;
  font-size: 14px;
}

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

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }

  to {
    transform: translateX(0);
    opacity: 1;
  }
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

/* 图标优化 */
.icon-users::before {
  content: '👥';
}

.icon-plus::before {
  content: '+';
  font-weight: bold;
}

.icon-search::before {
  content: '🔍';
}

.icon-edit::before {
  content: '✏️';
}

.icon-delete::before {
  content: '🗑️';
}

.icon-close::before {
  content: '✕';
  font-weight: bold;
}

.icon-check::before {
  content: '✓';
  font-weight: bold;
}

.icon-error::before {
  content: '⚠️';
}

.icon-warning::before {
  content: '⚠️';
}

.icon-info::before {
  content: 'ℹ️';
}

.icon-shield::before {
  content: '🛡️';
}

.icon-user::before {
  content: '👤';
}

.icon-pause::before {
  content: '⏸️';
}

.icon-sort::before {
  content: '↕️';
  opacity: 0.5;
}

.icon-sort-up::before {
  content: '↑';
  color: var(--primary-color);
}

.icon-sort-down::before {
  content: '↓';
  color: var(--primary-color);
}

.icon-empty::before {
  content: '📁';
  font-size: 64px;
  opacity: 0.3;
}

/* 响应式设计优化 */
@media (max-width: 1024px) {
  .search-container {
    flex-direction: column;
    align-items: stretch;
  }

  .search-box {
    min-width: auto;
  }

  .filter-section {
    justify-content: center;
  }
}

@media (max-width: 768px) {
  .user-management {
    padding: 16px;
  }

  .header-content {
    flex-direction: column;
    gap: 16px;
    text-align: center;
  }

  .page-title {
    font-size: 24px;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .action-buttons {
    flex-direction: column;
    gap: 4px;
  }

  .pagination {
    flex-wrap: wrap;
    gap: 8px;
  }

  .message-toast {
    left: 16px;
    right: 16px;
    top: 16px;
    min-width: auto;
  }
}

/* 权限选择区域样式 */
.permissions-section {
  margin: 20px 0;
  padding: 20px;
  background: var(--gray-50);
  border-radius: var(--radius);
  border: 1px solid var(--gray-200);
}

.full-width {
  grid-column: 1 / -1;
}

.form-hint {
  font-size: 12px;
  color: var(--gray-500);
  font-weight: normal;
  margin-left: 8px;
}

.loading-text {
  font-size: 12px;
  color: var(--primary-color);
  font-weight: normal;
  margin-left: 8px;
}

.permissions-container {
  margin-top: 12px;
}

.permissions-loading {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px;
  color: var(--gray-600);
  font-size: 14px;
}

.mini-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid var(--gray-200);
  border-top: 2px solid var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.permissions-empty {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 20px;
  color: var(--gray-500);
  font-size: 14px;
  justify-content: center;
}

.permissions-checkboxes {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px;
  max-height: 300px;
  overflow-y: auto;
  padding: 16px;
  border: 1px solid var(--gray-200);
  border-radius: var(--radius);
  background: white;
}

.permission-checkbox {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  border: 1px solid var(--gray-200);
  border-radius: var(--radius);
  cursor: pointer;
  transition: all 0.2s ease;
  background: white;
  position: relative;
}

.permission-checkbox:hover {
  border-color: var(--primary-color);
  background: rgba(59, 130, 246, 0.02);
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
}

.permission-checkbox input[type="checkbox"] {
  position: absolute;
  opacity: 0;
  cursor: pointer;
  height: 0;
  width: 0;
}

.checkmark {
  width: 18px;
  height: 18px;
  border: 2px solid var(--gray-300);
  border-radius: 3px;
  background: white;
  transition: all 0.2s ease;
  flex-shrink: 0;
  position: relative;
  margin-top: 2px;
}

.permission-checkbox input[type="checkbox"]:checked+.checkmark {
  background: var(--primary-color);
  border-color: var(--primary-color);
}

.permission-checkbox input[type="checkbox"]:checked+.checkmark::after {
  content: '';
  position: absolute;
  left: 5px;
  top: 2px;
  width: 4px;
  height: 8px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

.permission-info {
  flex: 1;
  min-width: 0;
}

.permission-title {
  display: block;
  font-weight: 600;
  color: var(--gray-900);
  font-size: 14px;
  line-height: 1.4;
  margin-bottom: 4px;
}

.permission-path {
  display: block;
  font-size: 12px;
  color: var(--gray-500);
  font-family: 'Monaco', 'Consolas', monospace;
  background: var(--gray-100);
  padding: 2px 6px;
  border-radius: 3px;
  word-break: break-all;
}

.selection-order-hint {
  margin-left: 12px;
  font-size: 12px;
  color: var(--info-color);
  background: #e0f2fe;
  padding: 4px 8px;
  border-radius: 12px;
  display: inline-block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  /* white-space: nowrap; */
}

.permission-order-badge {
  display: inline-block;
  margin-top: 6px;
  padding: 2px 8px;
  background: var(--primary-color);
  color: white;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 600;
}

.order-highlight {
  background: var(--order-color, #f0f9ff) !important;
  border-color: var(--order-border-color, var(--primary-color)) !important;
  border-left-width: 4px;
}

.permission-checkbox {
  transition: all 0.3s ease;
  position: relative;
}

.permission-checkbox::before {
  content: '';
  position: absolute;
  left: 4px;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 0;
  background: var(--order-border-color, transparent);
  border-radius: 2px;
  transition: height 0.3s ease;
}

.order-highlight::before {
  height: 60%;
}

/* 响应式优化 */
@media (max-width: 768px) {
  .permissions-checkboxes {
    grid-template-columns: 1fr;
  }

  .permission-checkbox {
    flex-direction: row;
    align-items: flex-start;
  }
}

/* 焦点样式优化 */
.btn:focus,
.btn-action:focus,
.form-input:focus,
.form-select:focus,
.filter-select:focus {
  outline: 2px solid var(--primary-color);
  outline-offset: 2px;
}

/* 权限管理弹窗样式 */
.permission-modal {
  max-width: 800px;
  max-height: 85vh;
}

.permission-form {
  max-height: 70vh;
  overflow-y: auto;
}

.loading-section {
  padding: 60px 0;
  text-align: center;
}

.permission-content {
  padding: 0;
}

/* 用户信息展示区域 */
.user-section {
  margin-bottom: 32px;
  padding: 24px;
  background: linear-gradient(135deg, #f8fafc, #e2e8f0);
  border-radius: var(--radius-lg);
  border: 1px solid var(--gray-200);
}

.user-header {
  display: flex;
  align-items: center;
  gap: 20px;
}

.user-avatar-large {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--primary-color), var(--info-color));
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 700;
  font-size: 24px;
  border: 3px solid white;
  box-shadow: var(--shadow-md);
}

.user-details {
  flex: 1;
}

.user-name {
  margin: 0 0 8px 0;
  font-size: 20px;
  font-weight: 700;
  color: var(--gray-900);
}

.user-email {
  margin: 0 0 12px 0;
  color: var(--gray-600);
  font-size: 14px;
}

/* 当前权限展示区域 */
.current-permissions-section {
  margin-bottom: 32px;
  padding: 24px;
  background: white;
  border-radius: var(--radius-lg);
  border: 1px solid var(--gray-200);
}

.section-title {
  margin: 0 0 20px 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--gray-900);
  display: flex;
  align-items: center;
  gap: 8px;
}

.section-title i {
  color: var(--primary-color);
}

.empty-permissions {
  text-align: center;
  padding: 40px 20px;
  color: var(--gray-500);
}

.empty-permissions i {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.permissions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.permission-card {
  display: flex;
  gap: 12px;
  padding: 16px;
  border: 1px solid var(--gray-200);
  border-radius: var(--radius);
  background: white;
  transition: all 0.2s ease;
}

.permission-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
  border-color: var(--primary-color);
}

.permission-card.current {
  border-left: 4px solid var(--success-color);
  background: #f0fdf4;
}

.permission-icon {
  width: 40px;
  height: 40px;
  border-radius: var(--radius);
  background: var(--primary-color);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
}

.permission-details {
  flex: 1;
  min-width: 0;
}

.permission-name {
  margin: 0 0 8px 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--gray-900);
}

.permission-path {
  display: block;
  font-size: 12px;
  color: var(--info-color);
  background: #e0f2fe;
  padding: 2px 6px;
  border-radius: 3px;
  margin-bottom: 8px;
  font-family: 'Monaco', 'Consolas', monospace;
}

.permission-desc {
  margin: 0;
  font-size: 12px;
  color: var(--gray-500);
  line-height: 1.4;
}

/* 权限管理区域 */
.permission-management-section {
  padding: 24px;
  background: white;
  border-radius: var(--radius-lg);
  border: 1px solid var(--gray-200);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.permission-stats {
  display: flex;
  gap: 16px;
}

.stat {
  font-size: 12px;
  color: var(--gray-600);
  background: var(--gray-100);
  padding: 4px 8px;
  border-radius: 12px;
  font-weight: 500;
}

.permissions-editor {
  margin-top: 16px;
}

.editor-hint {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: #eff6ff;
  color: var(--info-color);
  border-radius: var(--radius);
  margin-bottom: 16px;
  font-size: 13px;
}

.permissions-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 12px;
  max-height: 300px;
  overflow-y: auto;
  padding: 16px;
  border: 1px solid var(--gray-200);
  border-radius: var(--radius);
  background: var(--gray-50);
}

.permission-checkbox.selected {
  border-color: var(--primary-color);
  background: #f0f9ff;
}

.permission-checkbox.disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.permission-category {
  display: inline-block;
  font-size: 10px;
  color: var(--gray-500);
  background: var(--gray-200);
  padding: 2px 6px;
  border-radius: 8px;
  margin-top: 4px;
}

/* 只读提示 */
.readonly-notice {
  text-align: center;
  padding: 40px 20px;
  color: var(--gray-500);
  background: var(--gray-50);
  border-radius: var(--radius-lg);
  border: 1px solid var(--gray-200);
}

.readonly-notice i {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
}

/* 新增图标 */
.icon-eye::before {
  content: '👁️';
}

.icon-page::before {
  content: '📄';
}

.icon-list::before {
  content: '📋';
}

.icon-settings::before {
  content: '⚙️';
}

.icon-lock::before {
  content: '🔒';
}

/* 响应式设计 */
@media (max-width: 768px) {
  .permission-modal {
    max-width: 95vw;
    margin: 10px;
  }

  .permissions-grid {
    grid-template-columns: 1fr;
  }

  .permissions-list {
    grid-template-columns: 1fr;
  }

  .user-header {
    flex-direction: column;
    text-align: center;
    gap: 16px;
  }

  .section-header {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }
}
</style>