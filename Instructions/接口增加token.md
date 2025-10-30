# Token功能测试指南

## 🔧 已完成的修改

### 1. 登录接口修改（mockServer.js）
```javascript
// 登录成功时返回token
if (user && user.password === password) {
    const token = `token_${user.id}_${Date.now()}_${Math.random().toString(36).substring(2)}`;
    
    res.json({
        success: true,
        userId: user.id,
        token: token,  // 新增token返回
        userInfo: { /* ... */ }
    });
}
```

### 2. 登录方法修改（src/stores/auth.ts）
```typescript
// 使用axios实例并保存token
const response = await axiosInstance.post('/login', { username, password });

if (response.data.success) {
    // 保存token到localStorage
    if (response.data.token) {
        localStorage.setItem('authToken', response.data.token);
        console.log('保存token成功:', response.data.token);
    }
    // ...其他登录逻辑
}
```

### 3. axios拦截器配置（src/services/axiosInstance.ts）
```typescript
// 请求拦截器 - 自动添加token
axiosInstance.interceptors.request.use((config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log('已添加token到请求头');
    }
    return config;
});

// 响应拦截器 - 处理401错误
axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            console.log('Token已失效，清除本地存储');
            localStorage.removeItem('authToken');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);
```

### 4. 退出登录修改
```typescript
logout() {
    // 清除token
    localStorage.removeItem('authToken');
    console.log('已清除token');
    // ...其他清理逻辑
}
```

## 🧪 测试步骤

### 1. 启动服务
```bash
# 启动mock服务器
node mockServer.js

# 启动前端开发服务器
npm run dev
```

### 2. 登录测试
1. 打开浏览器登录页面
2. 使用测试账户登录（如 admin/admin123）
3. 打开浏览器开发者工具Console查看日志
4. 在Application -> Local Storage中查看authToken

### 3. API请求测试
1. 登录后访问任何需要认证的页面（如用户管理）
2. 打开Network标签查看请求
3. 验证请求头中是否包含Authorization: Bearer token_xxx

### 4. Token失效测试
1. 手动删除localStorage中的authToken
2. 刷新页面或尝试访问API
3. 应该被重定向到登录页

## 📝 预期效果

### ✅ 成功指标
- [x] 登录时控制台显示"保存token成功"
- [x] localStorage中存储authToken
- [x] 所有API请求自动携带Authorization头
- [x] 控制台显示"已添加token到请求头"
- [x] 退出时token被清除
- [x] Token失效时自动跳转登录页

### 🔧 配置文件
所有相关API调用都通过以下模块，会自动携带token：
- `src/api/auth.ts` - 认证相关
- `src/api/userManagement.ts` - 用户管理
- `src/api/profile.ts` - 个人资料
- `src/api/permissions.ts` - 权限管理
- `src/api/dashboard.ts` - 仪表板数据
- `src/api/activity.ts` - 活动数据

## 🎯 核心改进

现在您的项目中：
1. **登录接口有token** - mockServer返回token
2. **所有API请求都带token** - axios拦截器自动添加
3. **token持久化** - 存储在localStorage
4. **自动清理** - 退出和401错误时清除
5. **统一管理** - 通过axios实例统一处理

所有这些修改确保了整个应用的API请求都会自动携带认证token！