<template>
  <div class="login-container">
    <!-- 动态背景 -->
    <div class="tech-background">
      <div class="gradient-overlay"></div>
      <div class="floating-particles">
        <div class="particle" v-for="i in 20" :key="i" :style="{ '--delay': `${i * 0.1}s` }"></div>
      </div>
      <div class="grid-lines">
        <div class="grid-line" v-for="i in 10" :key="i"></div>
      </div>
      <div class="tech-circles">
        <div class="tech-circle circle-1"></div>
        <div class="tech-circle circle-2"></div>
        <div class="tech-circle circle-3"></div>
      </div>
    </div>

    <!-- 登录表单 -->
    <div class="login-card" v-if="!showForgotPassword && !showRegister">
      <div class="card-glow"></div>
      <div class="login-header">
        <div class="logo-container">
          <div class="logo-icon">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                stroke-linejoin="round" />
              <path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                stroke-linejoin="round" />
              <path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                stroke-linejoin="round" />
            </svg>
          </div>
          <h1>系统登录</h1>
        </div>
        <p>欢迎进入智能管理系统</p>
      </div>

      <form class="login-form" @submit.prevent="handleLogin">
        <div class="form-group">
          <label>
            <span class="label-icon">👤</span>
            用户名
          </label>
          <div class="input-container">
            <input v-model="loginForm.username" type="text" placeholder="请输入用户名" required :disabled="loading" />
            <div class="input-border"></div>
          </div>
        </div>

        <div class="form-group">
          <label>
            <span class="label-icon">🔒</span>
            密码
          </label>
          <div class="input-container">
            <input v-model="loginForm.password" :type="showPassword ? 'text' : 'password'" placeholder="请输入密码" required
              :disabled="loading" />
            <div class="input-border"></div>
            <button type="button" class="password-toggle" @click="showPassword = !showPassword">
              {{ showPassword ? '👁️' : '👁️‍🗨️' }}
            </button>
          </div>
        </div>

        <div class="form-options">
          <label class="remember-me">
            <div class="custom-checkbox">
              <input type="checkbox" v-model="rememberMe" :checked="rememberMe" @change="handleRememberMeChange" />
              <span class="checkmark"></span>
            </div>
            <span>记住我</span>
          </label>
          <a href="#" class="forgot-password" @click.prevent="showForgotPassword = true">忘记密码？</a>
        </div>

        <button type="submit" class="login-btn" :disabled="loading">
          <div class="btn-content">
            <span v-if="loading" class="loading-spinner"></span>
            <span v-else class="btn-text">{{ loading ? '登录中...' : '登录' }}</span>
          </div>
          <div class="btn-glow"></div>
        </button>

        <div v-if="errorMessage" class="error-message">
          <span class="error-icon">⚠️</span>
          {{ errorMessage }}
        </div>
      </form>

      <div class="login-footer">
        <p>还没有账户？ <a href="#" class="register-link" @click.prevent="showRegister = true">立即注册</a></p>
      </div>
    </div>

    <!-- 忘记密码表单 -->
    <div class="login-card" v-if="showForgotPassword">
      <div class="card-glow"></div>
      <div class="login-header">
        <div class="logo-container">
          <div class="logo-icon">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                stroke-linejoin="round" />
              <path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                stroke-linejoin="round" />
              <path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                stroke-linejoin="round" />
            </svg>
          </div>
          <h1>重置密码</h1>
        </div>
        <p>请输入您的邮箱地址，我们将发送重置链接</p>
      </div>

      <form class="login-form" @submit.prevent="handleForgotPassword">
        <div class="form-group">
          <label>
            <span class="label-icon">📧</span>
            邮箱地址
          </label>
          <div class="input-container">
            <input v-model="forgotPasswordForm.email" type="email" placeholder="请输入您的邮箱地址" required
              :disabled="forgotPasswordLoading" />
            <div class="input-border"></div>
          </div>
        </div>

        <button type="submit" class="login-btn" :disabled="forgotPasswordLoading">
          <div class="btn-content">
            <span v-if="forgotPasswordLoading" class="loading-spinner"></span>
            <span v-else class="btn-text">{{ forgotPasswordLoading ? '发送中...' : '发送重置链接' }}</span>
          </div>
          <div class="btn-glow"></div>
        </button>

        <div v-if="forgotPasswordMessage" class="message" :class="forgotPasswordMessageType">
          <span class="message-icon">{{ forgotPasswordMessageType === 'success' ? '✅' : '⚠️' }}</span>
          {{ forgotPasswordMessage }}
        </div>
      </form>

      <div class="login-footer">
        <a href="#" class="back-link" @click.prevent="showForgotPassword = false">← 返回登录</a>
      </div>
    </div>

    <!-- 注册表单 -->
    <div class="login-card" v-if="showRegister">
      <div class="card-glow"></div>
      <div class="login-header">
        <div class="logo-container">
          <div class="logo-icon">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                stroke-linejoin="round" />
              <path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                stroke-linejoin="round" />
              <path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                stroke-linejoin="round" />
            </svg>
          </div>
          <h1>用户注册</h1>
        </div>
        <p>创建您的账户</p>
      </div>

      <form class="login-form" @submit.prevent="handleRegister">
        <div class="form-group">
          <label>
            <span class="label-icon">👤</span>
            用户名
          </label>
          <div class="input-container">
            <input v-model="registerForm.username" type="text" placeholder="请输入用户名" required
              :disabled="registerLoading" />
            <div class="input-border"></div>
          </div>
        </div>

        <div class="form-group">
          <label>
            <span class="label-icon">📧</span>
            邮箱地址
          </label>
          <div class="input-container">
            <input v-model="registerForm.email" type="email" placeholder="请输入邮箱地址" required
              :disabled="registerLoading" />
            <div class="input-border"></div>
          </div>
        </div>

        <div class="form-group">
          <label>
            <span class="label-icon">🔒</span>
            密码
          </label>
          <div class="input-container">
            <input v-model="registerForm.password" :type="showRegisterPassword ? 'text' : 'password'"
              placeholder="请输入密码" required :disabled="registerLoading" />
            <div class="input-border"></div>
            <button type="button" class="password-toggle" @click="showRegisterPassword = !showRegisterPassword">
              {{ showRegisterPassword ? '👁️' : '👁️‍🗨️' }}
            </button>
          </div>
        </div>

        <div class="form-group">
          <label>
            <span class="label-icon">🔒</span>
            确认密码
          </label>
          <div class="input-container">
            <input v-model="registerForm.confirmPassword" :type="showConfirmPassword ? 'text' : 'password'"
              placeholder="请再次输入密码" required :disabled="registerLoading" />
            <div class="input-border"></div>
            <button type="button" class="password-toggle" @click="showConfirmPassword = !showConfirmPassword">
              {{ showConfirmPassword ? '👁️' : '👁️‍🗨️' }}
            </button>
          </div>
        </div>

        <div class="form-options">
          <label class="remember-me">
            <div class="custom-checkbox">
              <input type="checkbox" v-model="registerForm.agreeTerms" required :checked="registerForm.agreeTerms"
                @change="handleAgreeTermsChange" />
              <span class="checkmark"></span>
            </div>
            <span>我同意 <a href="#" class="terms-link" @click.prevent="showTerms = true">服务条款</a> 和 <a href="#"
                class="terms-link" @click.prevent="showPrivacy = true">隐私政策</a></span>
          </label>
        </div>

        <button type="submit" class="login-btn" :disabled="registerLoading">
          <div class="btn-content">
            <span v-if="registerLoading" class="loading-spinner"></span>
            <span v-else class="btn-text">{{ registerLoading ? '注册中...' : '注册' }}</span>
          </div>
          <div class="btn-glow"></div>
        </button>

        <div v-if="registerMessage" class="message" :class="registerMessageType">
          <span class="message-icon">{{ registerMessageType === 'success' ? '✅' : '⚠️' }}</span>
          {{ registerMessage }}
        </div>
      </form>

      <div class="login-footer">
        <a href="#" class="back-link" @click.prevent="showRegister = false">← 返回登录</a>
      </div>
    </div>

    <!-- 服务条款弹窗 -->
    <div class="modal-overlay" v-if="showTerms" @click="showTerms = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>服务条款</h2>
          <button class="modal-close" @click="showTerms = false">×</button>
        </div>
        <div class="modal-body">
          <h3>1. 服务说明</h3>
          <p>本系统为用户提供智能管理服务，包括但不限于数据管理、用户管理、权限控制等功能。</p>

          <h3>2. 用户责任</h3>
          <p>用户在使用本系统时应遵守相关法律法规，不得从事违法活动，不得侵犯他人权益。</p>

          <h3>3. 系统使用</h3>
          <p>用户应妥善保管账户信息，不得将账户转让给他人使用，因账户安全问题造成的损失由用户自行承担。</p>

          <h3>4. 服务变更</h3>
          <p>我们保留随时修改或终止服务的权利，修改后的条款将在系统中公布。</p>

          <h3>5. 免责声明</h3>
          <p>在法律法规允许的范围内，我们不对因使用本系统而产生的任何直接或间接损失承担责任。</p>

          <h3>6. 争议解决</h3>
          <p>本条款的解释和争议解决适用中华人民共和国法律。</p>
        </div>
        <div class="modal-footer">
          <button class="modal-btn" @click="showTerms = false">我已阅读并同意</button>
        </div>
      </div>
    </div>

    <!-- 隐私政策弹窗 -->
    <div class="modal-overlay" v-if="showPrivacy" @click="showPrivacy = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>隐私政策</h2>
          <button class="modal-close" @click="showPrivacy = false">×</button>
        </div>
        <div class="modal-body">
          <h3>1. 信息收集</h3>
          <p>我们收集的信息包括：用户名、邮箱地址、登录时间、操作日志等必要信息。</p>

          <h3>2. 信息使用</h3>
          <p>收集的信息仅用于：提供系统服务、改善用户体验、系统安全维护等目的。</p>

          <h3>3. 信息保护</h3>
          <p>我们采用行业标准的安全措施保护用户信息，包括数据加密、访问控制等。</p>

          <h3>4. 信息共享</h3>
          <p>除法律法规要求外，我们不会向第三方分享用户信息。</p>

          <h3>5. 用户权利</h3>
          <p>用户有权查看、修改、删除自己的个人信息，有权要求我们停止收集相关信息。</p>

          <h3>6. 政策更新</h3>
          <p>我们可能会更新本隐私政策，更新后的政策将在系统中公布。</p>

          <h3>7. 联系我们</h3>
          <p>如对隐私政策有疑问，请联系我们的客服团队。</p>
        </div>
        <div class="modal-footer">
          <button class="modal-btn" @click="showPrivacy = false">我已阅读并同意</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { registerUser } from '@/api/auth';

const router = useRouter();
const authStore = useAuthStore();

// 表单状态
const loginForm = ref({
  username: '',
  password: ''
});

const forgotPasswordForm = ref({
  email: ''
});

const registerForm = ref({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  agreeTerms: false
});

// UI状态
const showPassword = ref(false);
const showRegisterPassword = ref(false);
const showConfirmPassword = ref(false);
const rememberMe = ref(false);
const loading = ref(false);
const forgotPasswordLoading = ref(false);
const registerLoading = ref(false);
const errorMessage = ref('');
const forgotPasswordMessage = ref('');
const forgotPasswordMessageType = ref<'success' | 'error'>('success');
const registerMessage = ref('');
const registerMessageType = ref<'success' | 'error'>('success');

// 页面切换状态
const showForgotPassword = ref(false);
const showRegister = ref(false);
const showTerms = ref(false);
const showPrivacy = ref(false);

// 从本地存储恢复记住我的状态
onMounted(() => {
  const savedUsername = localStorage.getItem('rememberedUsername');
  const savedRememberMe = localStorage.getItem('rememberMe');
  const savedPassword = localStorage.getItem('rememberedPassword');

  if (savedRememberMe === 'true' && savedUsername && savedPassword) {
    rememberMe.value = true;
    loginForm.value.username = savedUsername;
    loginForm.value.password = savedPassword;
  }
});

// 处理记住我复选框变化
function handleRememberMeChange(event: Event) {
  const target = event.target as HTMLInputElement;
  rememberMe.value = target.checked;
}

// 处理同意条款复选框变化
function handleAgreeTermsChange(event: Event) {
  const target = event.target as HTMLInputElement;
  registerForm.value.agreeTerms = target.checked;
}

async function handleLogin() {
  if (!loginForm.value.username || !loginForm.value.password) {
    errorMessage.value = '请输入用户名和密码';
    return;
  }

  loading.value = true;
  errorMessage.value = '';

  try {
    const success = await (authStore as any).login(loginForm.value.username, loginForm.value.password);

    if (success) {
      // 处理记住我功能
      if (rememberMe.value) {
        localStorage.setItem('rememberMe', 'true');
        localStorage.setItem('rememberedUsername', loginForm.value.username);
        localStorage.setItem('rememberedPassword', loginForm.value.password);
      } else {
        localStorage.removeItem('rememberMe');
        localStorage.removeItem('rememberedUsername');
        localStorage.removeItem('rememberedPassword');
      }

      // 登录成功：若动态路由尚未加载，先加载再跳转
      if (!authStore.routesLoaded) {
        try {
          await (authStore as any).loadDynamicRoutes();
        } catch (e) {
          console.error('登录后加载动态路由失败:', e);
        }
      }

      // 获取重定向地址，如果没有则使用动态首页
      const redirect = (router.currentRoute.value.query.redirect as string) || authStore.homePage;

      // 检查重定向的路由是否存在
      const targetRoute = router.resolve(redirect);
      if (targetRoute.matched.length === 0) {
        console.log('重定向路由不存在，跳转到动态首页');
        router.replace(authStore.homePage);
      } else {
        console.log('登录成功，跳转到:', redirect);
        router.replace(redirect);
      }
    } else {
      errorMessage.value = '登录失败，请检查用户名和密码';
    }
  } catch (error: any) {
    console.error('Login error:', error);
    errorMessage.value = error.message || '登录失败，请稍后重试';
  } finally {
    loading.value = false;
  }
}

async function handleForgotPassword() {
  if (!forgotPasswordForm.value.email) {
    forgotPasswordMessage.value = '请输入邮箱地址';
    forgotPasswordMessageType.value = 'error';
    return;
  }

  // 简单的邮箱格式验证
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(forgotPasswordForm.value.email)) {
    forgotPasswordMessage.value = '请输入有效的邮箱地址';
    forgotPasswordMessageType.value = 'error';
    return;
  }

  forgotPasswordLoading.value = true;
  forgotPasswordMessage.value = '';

  try {
    // 模拟发送重置密码邮件的API调用
    await new Promise(resolve => setTimeout(resolve, 2000));

    forgotPasswordMessage.value = '重置链接已发送到您的邮箱，请查收';
    forgotPasswordMessageType.value = 'success';

    // 3秒后自动返回登录页面
    setTimeout(() => {
      showForgotPassword.value = false;
      forgotPasswordForm.value.email = '';
      forgotPasswordMessage.value = '';
    }, 3000);

  } catch (error: any) {
    forgotPasswordMessage.value = '发送失败，请稍后重试';
    forgotPasswordMessageType.value = 'error';
  } finally {
    forgotPasswordLoading.value = false;
  }
}

async function handleRegister() {
  // 调试信息
  console.log('注册表单数据:', registerForm.value);
  console.log('同意条款状态:', registerForm.value.agreeTerms);

  // 表单验证
  if (!registerForm.value.username || !registerForm.value.email || !registerForm.value.password || !registerForm.value.confirmPassword) {
    registerMessage.value = '请填写所有必填字段';
    registerMessageType.value = 'error';
    return;
  }

  if (registerForm.value.password !== registerForm.value.confirmPassword) {
    registerMessage.value = '两次输入的密码不一致';
    registerMessageType.value = 'error';
    return;
  }

  if (registerForm.value.password.length < 6) {
    registerMessage.value = '密码长度至少6位';
    registerMessageType.value = 'error';
    return;
  }

  if (!registerForm.value.agreeTerms) {
    registerMessage.value = '请勾选同意服务条款和隐私政策';
    registerMessageType.value = 'error';
    return;
  }

  // 简单的邮箱格式验证
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(registerForm.value.email)) {
    registerMessage.value = '请输入有效的邮箱地址';
    registerMessageType.value = 'error';
    return;
  }

  registerLoading.value = true;
  registerMessage.value = '';

  try {
    // 调用注册API
    const result = await registerUser({
      username: registerForm.value.username,
      email: registerForm.value.email,
      password: registerForm.value.password,
      confirmPassword: registerForm.value.confirmPassword
    });

    if (result.success) {
      registerMessage.value = result.message || '注册成功！正在自动跳转并填充登录信息...';
      registerMessageType.value = 'success';

      console.log('注册成功，用户信息:', result.userInfo);

      // 保存注册成功的用户名和密码，用于自动填充
      const registeredUsername = registerForm.value.username;
      const registeredPassword = registerForm.value.password;

      // 3秒后自动返回登录页面
      setTimeout(() => {
        showRegister.value = false;

        // 自动填入用户名和密码到登录表单
        loginForm.value.username = registeredUsername;
        loginForm.value.password = registeredPassword;

        // 清空注册表单
        registerForm.value = {
          username: '',
          email: '',
          password: '',
          confirmPassword: '',
          agreeTerms: false
        };
        registerMessage.value = '';

        // 可以选择自动勾选“记住我”（可选）
        // rememberMe.value = true;
      }, 3000);
    } else {
      registerMessage.value = result.message || '注册失败，请稍后重试';
      registerMessageType.value = 'error';
    }

  } catch (error: any) {
    console.error('注册错误:', error);
    registerMessage.value = error.message || '注册失败，请稍后重试';
    registerMessageType.value = 'error';
  } finally {
    registerLoading.value = false;
  }
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  background: #0a0a0a;
}

/* 科技感背景 */
.tech-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
}

.gradient-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background:
    radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.3) 0%, transparent 50%),
    radial-gradient(circle at 40% 40%, rgba(120, 219, 255, 0.2) 0%, transparent 50%);
  animation: gradientShift 20s ease-in-out infinite;
}

@keyframes gradientShift {

  0%,
  100% {
    transform: scale(1) rotate(0deg);
  }

  50% {
    transform: scale(1.1) rotate(180deg);
  }
}

/* 浮动粒子 */
.floating-particles {
  position: absolute;
  width: 100%;
  height: 100%;
}

.particle {
  position: absolute;
  width: 4px;
  height: 4px;
  background: linear-gradient(45deg, #00d4ff, #ff00ff);
  border-radius: 50%;
  animation: float 6s ease-in-out infinite;
  animation-delay: var(--delay);
  opacity: 0.6;
}

.particle:nth-child(odd) {
  background: linear-gradient(45deg, #ff00ff, #00ff88);
}

@keyframes float {

  0%,
  100% {
    transform: translateY(0px) translateX(0px);
    opacity: 0.6;
  }

  50% {
    transform: translateY(-20px) translateX(10px);
    opacity: 1;
  }
}

/* 网格线 */
.grid-lines {
  position: absolute;
  width: 100%;
  height: 100%;
}

.grid-line {
  position: absolute;
  background: linear-gradient(90deg, transparent, rgba(0, 212, 255, 0.1), transparent);
  height: 1px;
  width: 100%;
  animation: gridMove 8s linear infinite;
}

.grid-line:nth-child(even) {
  animation-delay: -4s;
}

@keyframes gridMove {
  0% {
    transform: translateY(-100px);
    opacity: 0;
  }

  10% {
    opacity: 1;
  }

  90% {
    opacity: 1;
  }

  100% {
    transform: translateY(100vh);
    opacity: 0;
  }
}

/* 科技圆圈 */
.tech-circles {
  position: absolute;
  width: 100%;
  height: 100%;
}

.tech-circle {
  position: absolute;
  border: 2px solid rgba(0, 212, 255, 0.3);
  border-radius: 50%;
  animation: circlePulse 4s ease-in-out infinite;
}

.circle-1 {
  width: 200px;
  height: 200px;
  top: 10%;
  left: 10%;
  animation-delay: 0s;
}

.circle-2 {
  width: 150px;
  height: 150px;
  top: 60%;
  right: 15%;
  animation-delay: 1s;
}

.circle-3 {
  width: 100px;
  height: 100px;
  bottom: 20%;
  left: 20%;
  animation-delay: 2s;
}

@keyframes circlePulse {

  0%,
  100% {
    transform: scale(1);
    opacity: 0.3;
  }

  50% {
    transform: scale(1.2);
    opacity: 0.6;
  }
}

/* 登录卡片 */
.login-card {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 40px;
  border-radius: 20px;
  width: 400px;
  max-width: 90%;
  z-index: 10;
  position: relative;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
}

.card-glow {
  position: absolute;
  top: -2px;
  left: -2px;
  right: -2px;
  bottom: -2px;
  background: linear-gradient(45deg, #00d4ff, #ff00ff, #00ff88, #00d4ff);
  border-radius: 20px;
  z-index: -1;
  opacity: 0.3;
  animation: glowRotate 3s linear infinite;
}

@keyframes glowRotate {
  0% {
    filter: hue-rotate(0deg);
  }

  100% {
    filter: hue-rotate(360deg);
  }
}

.login-header {
  text-align: center;
  margin-bottom: 30px;
}

.logo-container {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15px;
  margin-bottom: 15px;
}

.logo-icon {
  width: 40px;
  height: 40px;
  color: #00d4ff;
  animation: logoFloat 3s ease-in-out infinite;
}

@keyframes logoFloat {

  0%,
  100% {
    transform: translateY(0px);
  }

  50% {
    transform: translateY(-5px);
  }
}

.login-header h1 {
  margin: 0;
  color: #ffffff;
  font-size: 28px;
  font-weight: 600;
  text-shadow: 0 0 20px rgba(0, 212, 255, 0.5);
}

.login-header p {
  margin: 0;
  color: rgba(255, 255, 255, 0.8);
  font-size: 16px;
}

.form-group {
  margin-bottom: 25px;
  position: relative;
}

.form-group label {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
  color: #ffffff;
  font-weight: 500;
  font-size: 14px;
}

.label-icon {
  font-size: 16px;
}

.input-container {
  position: relative;
}

.form-group input {
  width: 100%;
  padding: 15px 20px;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: 12px;
  font-size: 16px;
  color: #ffffff;
  transition: all 0.3s ease;
  box-sizing: border-box;
  backdrop-filter: blur(10px);
}

.form-group input::placeholder {
  color: rgba(255, 255, 255, 0.6);
}

.form-group input:focus {
  outline: none;
  background: rgba(255, 255, 255, 0.15);
  box-shadow: 0 0 20px rgba(0, 212, 255, 0.3);
}

.form-group input:disabled {
  background: rgba(255, 255, 255, 0.05);
  cursor: not-allowed;
}

.input-border {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border: 2px solid transparent;
  border-radius: 12px;
  background: linear-gradient(45deg, #00d4ff, #ff00ff) border-box;
  -webkit-mask: linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: destination-out;
  mask: linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0);
  mask-composite: exclude;
  opacity: 0.3;
  transition: opacity 0.3s ease;
  pointer-events: none;
  z-index: -1;
}

.form-group input:focus+.input-border {
  opacity: 1;
}

.password-toggle {
  position: absolute;
  right: 15px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.8);
  cursor: pointer;
  font-size: 16px;
  padding: 5px;
  transition: color 0.3s ease;
}

.password-toggle:hover {
  color: #00d4ff;
}

.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.remember-me {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
}

.custom-checkbox {
  position: relative;
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.custom-checkbox input {
  position: absolute;
  opacity: 1;
  cursor: pointer;
  height: 18px;
  width: 18px;
  z-index: 2;
  margin: 0;
}

.checkmark {
  position: absolute;
  top: 0;
  left: 0;
  height: 18px;
  width: 18px;
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(0, 212, 255, 0.5);
  border-radius: 4px;
  transition: all 0.3s ease;
  z-index: 1;
}

.custom-checkbox input:checked~.checkmark {
  background: linear-gradient(45deg, #00d4ff, #ff00ff);
  border-color: transparent;
}

.checkmark:after {
  content: "";
  position: absolute;
  display: none;
  left: 5px;
  top: 2px;
  width: 4px;
  height: 8px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

.custom-checkbox input:checked~.checkmark:after {
  display: block;
}

.forgot-password {
  color: #00d4ff;
  text-decoration: none;
  font-size: 14px;
  transition: all 0.3s ease;
}

.forgot-password:hover {
  color: #ff00ff;
  text-shadow: 0 0 10px rgba(255, 0, 255, 0.5);
}

.login-btn {
  width: 100%;
  padding: 16px;
  background: linear-gradient(45deg, #00d4ff, #ff00ff);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  margin-bottom: 20px;
}

.btn-content {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.btn-glow {
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  transition: left 0.5s ease;
}

.login-btn:hover .btn-glow {
  left: 100%;
}

.login-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 30px rgba(0, 212, 255, 0.4);
}

.login-btn:disabled {
  background: linear-gradient(45deg, #666, #999);
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.loading-spinner {
  width: 20px;
  height: 20px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top: 3px solid white;
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

.error-message {
  margin-top: 15px;
  padding: 12px;
  background: rgba(255, 0, 0, 0.1);
  border: 1px solid rgba(255, 0, 0, 0.3);
  color: #ff6b6b;
  border-radius: 8px;
  font-size: 14px;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  backdrop-filter: blur(10px);
}

.error-icon {
  font-size: 16px;
}

/* 消息样式 */
.message {
  margin-top: 15px;
  padding: 12px;
  border-radius: 8px;
  font-size: 14px;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  backdrop-filter: blur(10px);
}

.message.success {
  background: rgba(0, 255, 0, 0.1);
  border: 1px solid rgba(0, 255, 0, 0.3);
  color: #4caf50;
}

.message.error {
  background: rgba(255, 0, 0, 0.1);
  border: 1px solid rgba(255, 0, 0, 0.3);
  color: #ff6b6b;
}

.message-icon {
  font-size: 16px;
}

.login-footer {
  text-align: center;
  margin-top: 25px;
  padding-top: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.login-footer p {
  margin: 0;
  color: rgba(255, 255, 255, 0.6);
}

.register-link {
  color: #00d4ff;
  text-decoration: none;
  font-weight: 500;
  transition: all 0.3s ease;
}

.register-link:hover {
  color: #ff00ff;
  text-shadow: 0 0 10px rgba(255, 0, 255, 0.5);
}

.back-link {
  color: #00d4ff;
  text-decoration: none;
  font-weight: 500;
  transition: all 0.3s ease;
  display: inline-block;
}

.back-link:hover {
  color: #ff00ff;
  text-shadow: 0 0 10px rgba(255, 0, 255, 0.5);
  transform: translateX(-5px);
}

.terms-link {
  color: #00d4ff;
  text-decoration: none;
  transition: color 0.3s ease;
}

.terms-link:hover {
  color: #ff00ff;
}

/* 弹窗样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  width: 100%;
  max-width: 600px;
  max-height: 80vh;
  overflow: hidden;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
  position: relative;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 30px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(0, 212, 255, 0.1);
}

.modal-header h2 {
  margin: 0;
  color: #ffffff;
  font-size: 24px;
  font-weight: 600;
}

.modal-close {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.8);
  font-size: 28px;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.3s ease;
}

.modal-close:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #ffffff;
}

.modal-body {
  padding: 30px;
  max-height: 60vh;
  overflow-y: auto;
  color: rgba(255, 255, 255, 0.9);
}

.modal-body h3 {
  color: #00d4ff;
  margin: 20px 0 10px 0;
  font-size: 18px;
  font-weight: 600;
}

.modal-body h3:first-child {
  margin-top: 0;
}

.modal-body p {
  margin: 0 0 15px 0;
  line-height: 1.6;
  font-size: 14px;
}

.modal-footer {
  padding: 20px 30px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  text-align: center;
  background: rgba(0, 0, 0, 0.1);
}

.modal-btn {
  background: linear-gradient(45deg, #00d4ff, #ff00ff);
  color: white;
  border: none;
  border-radius: 12px;
  padding: 12px 30px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.modal-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 30px rgba(0, 212, 255, 0.4);
}

/* 滚动条样式 */
.modal-body::-webkit-scrollbar {
  width: 8px;
}

.modal-body::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
}

.modal-body::-webkit-scrollbar-thumb {
  background: linear-gradient(45deg, #00d4ff, #ff00ff);
  border-radius: 4px;
}

.modal-body::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(45deg, #00b8e6, #e600e6);
}

/* 响应式设计 */
@media (max-width: 480px) {
  .login-card {
    padding: 30px 20px;
    width: 95%;
  }

  .login-header h1 {
    font-size: 24px;
  }

  .form-group input {
    padding: 12px 16px;
  }

  .form-options {
    flex-direction: column;
    gap: 15px;
    align-items: flex-start;
  }

  .modal-content {
    margin: 10px;
    max-height: 90vh;
  }

  .modal-header,
  .modal-body,
  .modal-footer {
    padding: 20px;
  }

  .modal-header h2 {
    font-size: 20px;
  }
}
</style>