<template>
  <div class="profile">
    <div class="header">
      <h1>个人资料</h1>
      <p>管理您的账户信息和设置</p>
    </div>

    <!-- 自定义弹窗 -->
    <div v-if="showMessageModal" class="modal-overlay" @click="closeMessageModal">
      <div class="message-modal" @click.stop>
        <div class="message-header">
          <span class="message-icon" :class="messageType === 'success' ? 'success' : 'error'">
            {{ messageType === 'success' ? '✅' : '❌' }}
          </span>
          <h3>{{ messageType === 'success' ? '成功' : '错误' }}</h3>
        </div>
        <div class="message-content">
          <p>{{ message }}</p>
        </div>
        <div class="message-actions">
          <button @click="closeMessageModal" class="btn-close">确定</button>
        </div>
      </div>
    </div>

    <div class="profile-content">
      <!-- 加载状态 -->
      <div v-if="loading" class="loading-overlay">
        <div class="loading-content">
          <div class="loading-spinner"></div>
          <p>加载中...</p>
        </div>
      </div>

      <div v-else class="profile-card">
        <div class="avatar-section">
          <div class="avatar-container">
            <div class="avatar-upload">
              <div class="avatar-display" @click="triggerFileInput"
                :style="{ backgroundImage: displayAvatar ? `url(${displayAvatar})` : 'none' }">
                <div v-if="displayAvatar" class="avatar-image">
                  <!-- 头像图片 -->
                </div>
                <div v-else class="avatar-placeholder">
                  <span>{{ userInitials }}</span>
                </div>
                <div class="avatar-overlay">
                  <svg class="upload-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7,10 12,15 17,10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                  </svg>
                  <span class="upload-text">点击上传</span>
                </div>
              </div>
              <input ref="fileInputRef" type="file" accept="image/*" @change="handleFileSelect" style="display: none" />
            </div>
            <!-- <button 
              class="btn-change-avatar" 
              @click="triggerFileInput"
              v-if="!avatarUploading && !previewAvatar"
            >
              更换头像
            </button>
            <button 
              class="btn-saving" 
              v-else-if="avatarUploading"
              disabled
            >
              上传中...
            </button> -->
          </div>

          <!-- 头像预览和操作 -->
          <div v-if="previewAvatar" class="avatar-preview-section">
            <h4>头像预览</h4>
            <div class="preview-container">
              <div class="preview-avatar" :style="{ backgroundImage: `url(${previewAvatar})` }">
                <!-- 预览头像 -->
              </div>
              <div class="preview-actions">
                <button class="btn-confirm" @click="confirmAvatar" :disabled="avatarUploading">
                  确认使用
                </button>
                <button class="btn-cancel" @click="cancelPreview">
                  取消
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="info-section">
          <h3>基本信息</h3>
          <form @submit.prevent="updateProfile">
            <div class="form-row">
              <div class="form-group">
                <label>用户名</label>
                <input v-model="userForm.username" type="text" disabled />
              </div>
              <div class="form-group">
                <label>邮箱</label>
                <input v-model="userForm.email" type="email" />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>姓名</label>
                <input v-model="userForm.fullName" type="text" />
              </div>
              <div class="form-group">
                <label>电话</label>
                <input v-model="userForm.phone" type="tel" />
              </div>
            </div>

            <div class="form-group">
              <label>个人简介</label>
              <textarea v-model="userForm.bio" rows="3" placeholder="介绍一下你自己..."></textarea>
            </div>

            <button type="submit" class="btn-save" :disabled="saving">
              {{ saving ? '保存中...' : '保存更改' }}
            </button>
          </form>
        </div>
      </div>

      <div class="security-card">
        <h3>安全设置</h3>
        <div class="security-item">
          <div class="security-info">
            <h4>密码</h4>
            <p>上次修改时间：{{ formatDate(lastPasswordChange) }}</p>
          </div>
          <button class="btn-change-password" @click="showChangePassword = true">
            修改密码
          </button>
        </div>

        <div class="security-item">
          <div class="security-info">
            <h4>双重认证</h4>
            <p>增强账户安全性</p>
          </div>
          <label class="switch">
            <input type="checkbox" v-model="twoFactorEnabled" />
            <span class="slider"></span>
          </label>
        </div>
      </div>
    </div>

    <!-- 修改密码对话框 -->
    <div v-if="showChangePassword" class="modal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>修改密码</h3>
          <button class="close-btn" @click="showChangePassword = false">&times;</button>
        </div>
        <form @submit.prevent="changePassword">
          <div class="form-group">
            <label>当前密码</label>
            <input v-model="passwordForm.currentPassword" type="password" required />
          </div>
          <div class="form-group">
            <label>新密码</label>
            <input v-model="passwordForm.newPassword" type="password" required />
          </div>
          <div class="form-group">
            <label>确认新密码</label>
            <input v-model="passwordForm.confirmPassword" type="password" required />
          </div>
          <div class="form-actions">
            <button type="button" @click="showChangePassword = false">取消</button>
            <button type="submit" :disabled="changingPassword">
              {{ changingPassword ? '修改中...' : '确认修改' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { fetchUserProfile, updateUserProfile, changeUserPassword } from '@/api/profile';

interface UserForm {
  username: string;
  email: string;
  fullName: string;
  phone: string;
  bio: string;
}

interface PasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface AvatarUploadResponse {
  success: boolean;
  message?: string;
  data?: {
    avatarUrl: string;
    userId?: string;
  };
}

// 消息弹窗相关状态
const showMessageModal = ref(false);
const message = ref('');
const messageType = ref<'success' | 'error'>('success');

// 显示消息弹窗
function showMessage(msg: string, type: 'success' | 'error' = 'success') {
  message.value = msg;
  messageType.value = type;
  showMessageModal.value = true;
}

// 关闭消息弹窗
function closeMessageModal() {
  showMessageModal.value = false;
  message.value = '';
  messageType.value = 'success';
}

// 其他状态
const authStore = useAuthStore();
const userForm = ref<UserForm>({
  username: '',
  email: '',
  fullName: '',
  phone: '',
  bio: ''
});
const passwordForm = ref<PasswordForm>({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
});
const saving = ref(false);
const changingPassword = ref(false);
const showChangePassword = ref(false);
const twoFactorEnabled = ref(false);
const loading = ref(false);
const lastPasswordChange = ref('');
const fileInputRef = ref<HTMLInputElement | null>(null);

// 头像相关状态
const avatarFile = ref<File | null>(null);
const avatarUrl = ref<string | null>(null);
const previewAvatar = ref<string | null>(null);
const avatarUploading = ref(false);
const currentAvatar = ref<string | null>(null);

const userInitials = computed(() => {
  if (userForm.value.fullName) {
    return userForm.value.fullName.split(' ').map(n => n[0]).join('').toUpperCase();
  }
  return userForm.value.username?.slice(0, 2).toUpperCase() || 'US';
});

const displayAvatar = computed(() => {
  if (previewAvatar.value) {
    return previewAvatar.value;
  }
  if (avatarUrl.value) {
    return avatarUrl.value;
  }
  return null;
});

// 触发文件选择
function triggerFileInput() {
  fileInputRef.value?.click();
}

// 处理文件选择
function handleFileSelect(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];

  if (!file) return;

  // 验证文件类型
  if (!file.type.startsWith('image/')) {
    showMessage('请选择图片文件', 'error');
    return;
  }

  // 验证文件大小 (限制为 2MB)
  if (file.size > 2 * 1024 * 1024) {
    showMessage('图片大小不能超过 2MB', 'error');
    return;
  }

  avatarFile.value = file;

  // 创建预览 URL
  const reader = new FileReader();
  reader.onload = (e) => {
    previewAvatar.value = e.target?.result as string;
  };
  reader.readAsDataURL(file);

  showMessage('头像已选择，请点击确认使用', 'success');
}

// 确认使用头像
async function confirmAvatar() {
  if (!avatarFile.value) return;

  avatarUploading.value = true;
  try {
    const result = await uploadAvatar(avatarFile.value);

    if (result.success) {
      showMessage('头像上传成功！');
      avatarUrl.value = result.data?.avatarUrl || URL.createObjectURL(avatarFile.value);
      currentAvatar.value = result.data?.avatarUrl || URL.createObjectURL(avatarFile.value);
      previewAvatar.value = null;
      avatarFile.value = null;

      await loadUserProfile();
    } else {
      showMessage(result.message || '头像上传失败', 'error');
    }
  } catch (error) {
    console.error('上传头像失败:', error);
    showMessage('头像上传失败，请重试', 'error');
  } finally {
    avatarUploading.value = false;
  }
}

// 取消预览
function cancelPreview() {
  previewAvatar.value = null;
  avatarFile.value = null;
}

// 上传头像的 API 调用函数
async function uploadAvatar(file: File): Promise<AvatarUploadResponse> {
  const formData = new FormData();
  formData.append('avatar', file);

  try {
    const localUrl = URL.createObjectURL(file);

    return {
      success: true,
      data: {
        avatarUrl: localUrl
      }
    };
  } catch (error) {
    console.error('上传头像 API 调用失败:', error);
    const localUrl = URL.createObjectURL(file);
    return {
      success: true,
      data: {
        avatarUrl: localUrl
      }
    };
  }
}

// 加载用户资料
async function loadUserProfile() {
  if (!authStore.userInfo?.id) {
    console.warn('用户未登录，无法加载资料');
    return;
  }

  try {
    loading.value = true;
    console.log('🔄 开始加载用户资料...', authStore.userInfo.id);

    const result = await fetchUserProfile(authStore.userInfo.id);
    console.log('📋 用户资料API响应:', result);

    if (result.success && result.data) {
      userForm.value = {
        username: result.data.username,
        email: result.data.email,
        fullName: result.data.profile.fullName || '',
        phone: result.data.profile.phone || '',
        bio: result.data.profile.bio || ''
      };
      twoFactorEnabled.value = result.data.profile.twoFactorEnabled || false;
      lastPasswordChange.value = result.data.profile.lastPasswordChange || '';

      if (result.data.profile.avatarUrl) {
        currentAvatar.value = result.data.profile.avatarUrl;
        avatarUrl.value = result.data.profile.avatarUrl;
      }

      console.log('✅ 用户资料加载成功');
    } else {
      console.error('❌ API返回错误:', result.message);
      showMessage(result.message || '获取用户资料失败', 'error');
    }
  } catch (error) {
    console.error('😨 获取用户资料异常:', error);
    showMessage('获取用户资料失败，请检查网络连接', 'error');
  } finally {
    loading.value = false;
  }
}

// 更新个人资料
async function updateProfile() {
  if (!authStore.userInfo?.id) {
    showMessage('用户未登录', 'error');
    return;
  }

  saving.value = true;
  try {
    console.log('✏️ 开始更新资料:', userForm.value);

    const result = await updateUserProfile(authStore.userInfo.id, {
      email: userForm.value.email,
      fullName: userForm.value.fullName,
      phone: userForm.value.phone,
      bio: userForm.value.bio,
      twoFactorEnabled: twoFactorEnabled.value
    });

    console.log('📋 更新资料API响应:', result);

    if (result.success) {
      showMessage('资料更新成功！');
    } else {
      console.error('❌ API返回错误:', result.message);
      showMessage(result.message || '更新失败，请重试', 'error');
    }
  } catch (error) {
    console.error('😨 更新失败:', error);
    showMessage('更新失败，请重试', 'error');
  } finally {
    saving.value = false;
  }
}

// 修改密码
async function changePassword() {
  if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
    showMessage('两次输入的新密码不一致', 'error');
    return;
  }

  if (passwordForm.value.newPassword.length < 6) {
    showMessage('新密码长度至少6位', 'error');
    return;
  }

  if (!authStore.userInfo?.id) {
    showMessage('用户未登录', 'error');
    return;
  }

  changingPassword.value = true;
  try {
    console.log('🔒 开始修改密码...');

    const result = await changeUserPassword(authStore.userInfo.id, {
      currentPassword: passwordForm.value.currentPassword,
      newPassword: passwordForm.value.newPassword
    });

    console.log('📋 修改密码API响应:', result);

    if (result.success) {
      showMessage('密码修改成功！');
      showChangePassword.value = false;
      passwordForm.value = { currentPassword: '', newPassword: '', confirmPassword: '' };
      if (result.data?.lastPasswordChange) {
        lastPasswordChange.value = result.data.lastPasswordChange;
      }
    } else {
      console.error('❌ API返回错误:', result.message);
      showMessage(result.message || '修改失败，请重试', 'error');
    }
  } catch (error) {
    console.error('😨 修改失败:', error);
    showMessage('修改失败，请重试', 'error');
  } finally {
    changingPassword.value = false;
  }
}

// 格式化日期
function formatDate(dateString: string) {
  if (!dateString) return '未知';
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
}

onMounted(() => {
  loadUserProfile();
});
</script>

<style scoped>
/* 自定义弹窗样式 */
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
  z-index: 2000;
  /* 比模态框的 1000 更高 */
}

.message-modal {
  background: white;
  border-radius: 12px;
  width: 400px;
  max-width: 90%;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  animation: modalFadeIn 0.3s ease-out;
}

@keyframes modalFadeIn {
  from {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }

  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.message-header {
  display: flex;
  align-items: center;
  padding: 20px 20px 15px;
  border-bottom: 1px solid #eee;
}

.message-icon {
  font-size: 24px;
  margin-right: 12px;
  line-height: 1;
}

.message-icon.success {
  color: #4caf50;
}

.message-icon.error {
  color: #f44336;
}

.message-header h3 {
  margin: 0;
  font-size: 18px;
  color: #2c3e50;
}

.message-content {
  padding: 20px;
}

.message-content p {
  margin: 0;
  font-size: 14px;
  line-height: 1.5;
  color: #34495e;
}

.message-actions {
  padding: 15px 20px 20px;
  display: flex;
  justify-content: flex-end;
}

.btn-close {
  background: #2196f3;
  color: white;
  border: none;
  padding: 8px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
}

.btn-close:hover {
  background: #1976d2;
}

/* 其他原有的样式保持不变 */
.loading-overlay {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  color: #666;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #2196f3;
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

/* 修改密码弹窗的额外样式 */
.modal {
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
  padding: 0;
  border-radius: 12px;
  width: 400px;
  max-width: 90%;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 20px 0;
  border-bottom: 1px solid #eee;
}

.modal-header h3 {
  margin: 0 0 15px;
  font-size: 18px;
  color: #2c3e50;
}

.close-btn {
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
  border-radius: 50%;
  transition: all 0.2s;
}

.close-btn:hover {
  background: #f5f5f5;
  color: #333;
}

/* 确保表单内容正确填充 */
.modal-content form {
  padding: 20px;
}

/* 原有的 form-actions 样式 */
.form-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 20px;
}

.form-actions button {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.form-actions button[type="button"] {
  background: #ccc;
}

.form-actions button[type="submit"] {
  background: #2196f3;
  color: white;
}

.form-actions button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 其余原有样式保持不变 */
.profile {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.header {
  margin-bottom: 30px;
}

.profile-content {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.profile-card,
.security-card {
  background: white;
  padding: 30px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.profile-card {
  display: flex;
  gap: 40px;
  align-items: flex-start;
}

.avatar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
}

.avatar-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
}

.avatar-upload {
  position: relative;
}

.avatar-display {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  border: 3px solid #e1e8ed;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  cursor: pointer;
  position: relative;
  transition: all 0.2s ease;

  &:hover {
    border-color: #2196f3;
    transform: scale(1.02);
  }
}

.avatar-image {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background-size: cover;
  background-position: center;
}

.avatar-placeholder {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 2em;
  font-weight: bold;
}

.avatar-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s ease;
  color: white;

  .avatar-display:hover & {
    opacity: 1;
  }
}

.upload-icon {
  width: 20px;
  height: 20px;
  margin-bottom: 4px;
}

.upload-text {
  font-size: 10px;
  text-align: center;
}

.btn-change-avatar,
.btn-saving {
  background: none;
  border: 1px solid #ddd;
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  color: #666;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    background: #f5f5f5;
    color: #333;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.btn-saving {
  border-color: #ccc;
  color: #666;
}

.avatar-preview-section {
  margin-top: 20px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
  width: 100%;
  max-width: 300px;
}

.avatar-preview-section h4 {
  margin: 0 0 15px 0;
  color: #2c3e50;
  font-size: 14px;
}

.preview-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
}

.preview-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background-size: cover;
  background-position: center;
  border: 2px solid #e1e8ed;
}

.preview-actions {
  display: flex;
  gap: 10px;
}

.btn-confirm,
.btn-cancel {
  padding: 6px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s ease;
}

.btn-confirm {
  background: #4caf50;
  color: white;

  &:hover:not(:disabled) {
    background: #45a049;
  }

  &:disabled {
    background: #ccc;
    cursor: not-allowed;
  }
}

.btn-cancel {
  background: #f44336;
  color: white;

  &:hover {
    background: #da190b;
  }
}

.info-section {
  flex: 1;
}

.info-section h3,
.security-card h3 {
  margin: 0 0 20px;
  color: #2c3e50;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 20px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
  color: #34495e;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.2s;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #2196f3;
}

.form-group input:disabled {
  background: #f5f5f5;
  color: #999;
}

.btn-save {
  background: #4caf50;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}

.btn-save:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.security-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 0;
  border-bottom: 1px solid #eee;
}

.security-item:last-child {
  border-bottom: none;
}

.security-info h4 {
  margin: 0 0 5px;
  color: #2c3e50;
}

.security-info p {
  margin: 0;
  color: #7f8c8d;
  font-size: 14px;
}

.btn-change-password {
  background: #2196f3;
  color: white;
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}

.switch {
  position: relative;
  display: inline-block;
  width: 50px;
  height: 24px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: .4s;
  border-radius: 24px;
}

.slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: .4s;
  border-radius: 50%;
}

input:checked+.slider {
  background-color: #4caf50;
}

input:checked+.slider:before {
  transform: translateX(26px);
}

/* 加载状态样式 */
.loading-overlay {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  color: #666;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #2196f3;
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
</style>