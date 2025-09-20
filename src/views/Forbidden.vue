<template>
    <div class="forbidden">
      <div class="container">
        <div class="error-content">
          <div class="error-icon">🚫</div>
          <h1 class="error-title">403 - 禁止访问</h1>
          <p class="error-message">
            抱歉，您没有权限访问此页面。
          </p>
          <p class="error-detail">
            如果您认为这是一个错误，请联系管理员获取帮助。
          </p>
          <div class="action-buttons">
            <button class="btn btn-primary" @click="goBack">
              ← 返回上一页
            </button>
            <button class="btn btn-secondary" @click="goHome">
              🏠 返回首页
            </button>
            <button class="btn btn-outline" @click="contactAdmin">
              📧 联系管理员
            </button>
          </div>
        </div>
        
        <div class="error-illustration">
          <div class="shield">🛡️</div>
          <div class="lock">🔒</div>
          <div class="warning-signs">
            <span class="warning-sign">⚠️</span>
            <span class="warning-sign">⛔</span>
            <span class="warning-sign">🚧</span>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  import { useRouter } from 'vue-router';
  
  const router = useRouter();
  
  function goBack() {
    router.go(-1);
  }
  
  function goHome() {
    router.push('/');
  }
  
  function contactAdmin() {
    // 这里可以跳转到联系页面或者打开邮件客户端
    window.location.href = 'mailto:admin@example.com?subject=权限问题咨询';
  }
  </script>
  
  <style scoped>
  .forbidden {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%);
    padding: 20px;
  }
  
  .container {
    display: flex;
    align-items: center;
    justify-content: space-between;
    max-width: 1000px;
    width: 100%;
    gap: 60px;
  }
  
  .error-content {
    flex: 1;
    color: white;
    text-align: center;
  }
  
  .error-icon {
    font-size: 80px;
    margin-bottom: 20px;
    animation: shake 0.5s ease-in-out infinite alternate;
  }
  
  .error-title {
    font-size: 36px;
    margin-bottom: 20px;
    font-weight: 600;
  }
  
  .error-message {
    font-size: 18px;
    margin-bottom: 10px;
    opacity: 0.9;
  }
  
  .error-detail {
    font-size: 16px;
    margin-bottom: 40px;
    opacity: 0.8;
  }
  
  .action-buttons {
    display: flex;
    gap: 12px;
    justify-content: center;
    flex-wrap: wrap;
  }
  
  .btn {
    padding: 12px 20px;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    gap: 8px;
  }
  
  .btn-primary {
    background: white;
    color: #ff6b6b;
  }
  
  .btn-primary:hover {
    background: #f8f9fa;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
  
  .btn-secondary {
    background: rgba(255, 255, 255, 0.2);
    color: white;
    border: 2px solid rgba(255, 255, 255, 0.3);
  }
  
  .btn-secondary:hover {
    background: rgba(255, 255, 255, 0.3);
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
  
  .error-illustration {
    flex: 1;
    position: relative;
    height: 400px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .shield {
    font-size: 100px;
    animation: bounce 2s ease-in-out infinite;
    z-index: 2;
  }
  
  .lock {
    font-size: 60px;
    position: absolute;
    right: 80px;
    bottom: 70px;
    animation: shake 1s ease-in-out infinite;
  }
  
  .warning-signs {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
  }
  
  .warning-sign {
    position: absolute;
    font-size: 24px;
    animation: pulse 1.5s ease-in-out infinite;
  }
  
  .warning-sign:nth-child(1) {
    top: 20%;
    left: 30%;
    animation-delay: 0s;
  }
  
  .warning-sign:nth-child(2) {
    top: 60%;
    right: 25%;
    animation-delay: 0.5s;
  }
  
  .warning-sign:nth-child(3) {
    bottom: 20%;
    left: 40%;
    animation-delay: 1s;
  }
  
  @keyframes shake {
    0% { transform: translateX(0); }
    100% { transform: translateX(5px); }
  }
  
  @keyframes bounce {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-20px); }
  }
  
  @keyframes pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.7; transform: scale(1.1); }
  }
  
  /* 响应式设计 */
  @media (max-width: 768px) {
    .container {
      flex-direction: column;
      text-align: center;
      gap: 40px;
    }
    
    .error-icon {
      font-size: 60px;
    }
    
    .error-title {
      font-size: 28px;
    }
    
    .error-message,
    .error-detail {
      font-size: 16px;
    }
    
    .error-illustration {
      height: 300px;
    }
    
    .shield {
      font-size: 80px;
    }
    
    .lock {
      font-size: 40px;
      right: 50px;
      bottom: 50px;
    }
    
    .action-buttons {
      flex-direction: column;
      align-items: center;
    }
    
    .btn {
      width: 200px;
      justify-content: center;
    }
  }
  
  @media (max-width: 480px) {
    .error-illustration {
      height: 250px;
    }
    
    .shield {
      font-size: 60px;
    }
    
    .lock {
      font-size: 30px;
      right: 30px;
      bottom: 30px;
    }
    
    .warning-sign {
      font-size: 18px;
    }
  }
  </style>