import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import multer from 'multer';
import * as XLSX from 'xlsx';

const app = express();
const port = 3001;

// 审计日志存储
const AUDIT_LOGS_FILE = path.join(process.cwd(), 'auditLogs.json');
let auditLogs = [];

// 加载审计日志
function loadAuditLogs() {
    try {
        if (fs.existsSync(AUDIT_LOGS_FILE)) {
            const data = fs.readFileSync(AUDIT_LOGS_FILE, 'utf8');
            auditLogs = JSON.parse(data);
            console.log('📂 从文件加载审计日志成功，日志数量:', auditLogs.length);
        }
    } catch (error) {
        console.error('❌ 加载审计日志失败:', error.message);
        auditLogs = [];
    }
}

// 保存审计日志
function saveAuditLogs() {
    try {
        fs.writeFileSync(AUDIT_LOGS_FILE, JSON.stringify(auditLogs, null, 2), 'utf8');
        return true;
    } catch (error) {
        console.error('❌ 保存审计日志失败:', error.message);
        return false;
    }
}

// 获取真实IP地址
function getClientIP(req) {
    // 优先从代理头部获取真实IP
    return req.headers['x-forwarded-for'] ||
        req.headers['x-real-ip'] ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
        req.ip ||
        '127.0.0.1';
}

// 获取IP地理位置信息
async function getIPLocationInfo(ip) {
    if (!ip || ip === 'system') return '系统操作';

    // 本地地址处理
    if (ip === '::1' || ip === '::ffff:127.0.0.1' || ip === '127.0.0.1') {
        return '本地主机';
    }

    try {
        // 使用免费的IP地理位置API
        const fetch = (await import('node-fetch')).default;
        const response = await fetch(`http://ip-api.com/json/${ip}?lang=zh-CN&fields=status,country,regionName,city,isp`);
        const data = await response.json();

        if (data.status === 'success') {
            const { country, regionName, city, isp } = data;
            return `${country} ${regionName} ${city} (${isp})`;
        } else {
            return '位置未知';
        }
    } catch (error) {
        console.error('获取IP地理位置失败:', error.message);
        return '位置获取失败';
    }
}

// 格式化IP地址显示
function formatIPAddress(ip) {
    if (!ip) return '未知';

    // 处理IPv6本地回环地址
    if (ip === '::1' || ip === '::ffff:127.0.0.1') {
        return '127.0.0.1 (本地)';
    }

    // 处理IPv4映射到IPv6的地址
    if (ip.startsWith('::ffff:')) {
        return ip.substring(7) + ' (IPv4)';
    }

    // 处理标准IPv4地址
    if (ip.includes('.') && !ip.includes(':')) {
        return ip + ' (IPv4)';
    }

    // 处理IPv6地址
    if (ip.includes(':')) {
        return ip + ' (IPv6)';
    }

    return ip;
}

// 创建审计日志记录
async function createAuditLog(userId, username, action, module, details, status = 'success', req = null) {
    // 获取真实IP地址
    const rawIP = req ? getClientIP(req) : 'system';
    const formattedIP = rawIP === 'system' ? '系统操作' : formatIPAddress(rawIP);

    // 异步获取IP地理位置信息
    let locationInfo = '未知位置';
    try {
        locationInfo = await getIPLocationInfo(rawIP);
    } catch (error) {
        console.error('获取IP位置失败:', error.message);
    }

    const log = {
        id: Date.now().toString() + Math.random().toString(36).substring(2),
        userId: userId,
        username: username,
        action: action,
        module: module,
        details: details,
        ipAddress: formattedIP,
        rawIP: rawIP, // 保存原始IP供调试使用
        location: locationInfo, // 新增地理位置信息
        userAgent: req ? req.get('User-Agent') : 'system',
        timestamp: new Date().toISOString(),
        status: status
    };

    auditLogs.unshift(log); // 新日志放在最前面

    // 限制日志数量，保留最近1000条
    if (auditLogs.length > 1000) {
        auditLogs = auditLogs.slice(0, 1000);
    }

    saveAuditLogs();
    console.log('📝 创建审计日志:', `${username} - ${action} - ${module} - ${details} [位置: ${locationInfo}]`);
    return log;
}

// 创建上传目录
const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'avatars');
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    console.log('📁 创建头像上传目录:', UPLOAD_DIR);
}

// 配置multer用于文件上传
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, UPLOAD_DIR);
    },
    filename: function (req, file, cb) {
        // 生成唯一文件名: userId_timestamp.ext
        const userId = req.params.userId;
        const timestamp = Date.now();
        const ext = path.extname(file.originalname);
        cb(null, `avatar_${userId}_${timestamp}${ext}`);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 2 * 1024 * 1024 // 2MB
    },
    fileFilter: function (req, file, cb) {
        // 只允许图片文件
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('只允许上传图片文件'));
        }
    }
});

// 启用 CORS - 配置更详细的选项
app.use(cors({
    origin: ['http://localhost:3000', 'http://192.168.2.90:3000'], // 明确指定前端地址
    credentials: true
}));
app.use(express.json());

// 静态文件服务 - 提供头像访问
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// 静态文件服务 - 提供导出文件下载
app.use('/downloads', express.static(path.join(process.cwd(), 'downloads')));

// 数据文件路径
const DATA_FILE = path.join(process.cwd(), 'userData.json');
const ROUTE_PERMISSIONS_FILE = path.join(process.cwd(), 'routePermissions.json');

// 加载路由权限配置
function loadRoutePermissions() {
    try {
        if (fs.existsSync(ROUTE_PERMISSIONS_FILE)) {
            const data = fs.readFileSync(ROUTE_PERMISSIONS_FILE, 'utf8');
            const parsedData = JSON.parse(data);
            console.log('📂 从文件加载路由权限配置成功');
            return parsedData;
        }
    } catch (error) {
        console.error('❌ 加载路由权限配置失败:', error.message);
    }

    // 如果文件不存在或加载失败，返回默认配置
    console.log('📝 使用默认路由权限配置');
    return {
        availableRoutes: [
            {
                name: "Dashboard",
                title: "产品中心",
                path: "/dashboard",
                component: "Dashboard/index",
                description: "产品展示和管理中心",
                category: "核心功能"
            },
            {
                name: "Analysis",
                title: "产品展示",
                path: "/dashboard/analysis",
                component: "Analysis/index",
                description: "产品数据分析和展示",
                category: "核心功能",
                parent: "Dashboard"
            },
            {
                name: "UserManagement",
                title: "用户管理",
                path: "/user-management",
                component: "UserManagement/index",
                description: "系统用户账户管理",
                category: "管理功能"
            },
            {
                name: "Data",
                title: "数据中心",
                path: "/Data",
                component: "Data/index",
                description: "数据存储和管理中心",
                category: "数据功能"
            },
            {
                name: "DataPanel",
                title: "数据面板",
                path: "/dataPanel",
                component: "DataPanel/index",
                description: "数据可视化面板",
                category: "数据功能"
            },
            {
                name: "devices",
                title: "设备管理",
                path: "/devices",
                component: "devices/index",
                description: "设备管理中心",
                category: "数据功能"
            },
            {
                name: "Profile",
                title: "个人资料",
                path: "/profile",
                component: "Profile/index",
                description: "用户个人信息管理",
                category: "基础功能"
            }
        ],
        userRoutePermissions: {},
        defaultPermissions: ["Profile"],
        lastUpdated: new Date().toISOString()
    };
}

// 保存路由权限配置
function saveRoutePermissions() {
    try {
        const data = {
            ...routePermissionsConfig,
            lastUpdated: new Date().toISOString()
        };
        fs.writeFileSync(ROUTE_PERMISSIONS_FILE, JSON.stringify(data, null, 2), 'utf8');
        console.log('💾 路由权限配置已保存到文件');
        return true;
    } catch (error) {
        console.error('❌ 保存路由权限配置失败:', error.message);
        return false;
    }
}
/** 这方法暂时不用*/
// 读取路由权限配置
// function loadRoutePermissions() {
//     try {
//         const permissionsData = fs.readFileSync('./routePermissions.json', 'utf8');
//         return JSON.parse(permissionsData);
//     } catch (error) {
//         console.error('读取路由权限配置失败:', error);
//         return {
//             availableRoutes: [],
//             userRoutePermissions: {},
//             defaultPermissions: ['Profile']
//         };
//     }
// }

// 加载用户数据
function loadUsers() {
    try {
        if (fs.existsSync(DATA_FILE)) {
            const data = fs.readFileSync(DATA_FILE, 'utf8');
            const parsedData = JSON.parse(data);
            console.log('📂 从文件加载用户数据成功，用户数量:', Object.keys(parsedData.users || {}).length);

            // 计算正确的userIdCounter：取所有用户ID的最大值 + 1
            const users = parsedData.users || {};
            const maxId = Object.values(users).reduce((max, user) => {
                return Math.max(max, user.id || 0);
            }, 0);
            const correctCounter = maxId + 1;

            console.log('🔢 当前最大用户ID:', maxId, '下一个ID将是:', correctCounter);

            return {
                users: users,
                userIdCounter: correctCounter
            };
        }
    } catch (error) {
        console.error('❌ 加载用户数据失败:', error.message);
    }

    // 如果文件不存在或加载失败，返回默认数据
    console.log('📝 使用默认用户数据');
    return {
        users: {
            admin: { id: 1, username: 'admin', password: 'admin123', email: 'admin@example.com', permissions: ['admin'], status: 'active', registeredAt: '2023-01-01', profile: { fullName: '系统管理员', phone: '13800138001', bio: '系统管理员账户，负责系统整体管理和维护', avatar: '', avatarUrl: '', twoFactorEnabled: false, lastPasswordChange: '2024-01-15' } },
            user: { id: 2, username: 'user', password: 'user123', email: 'user@example.com', permissions: [], status: 'active', registeredAt: '2023-01-01', profile: { fullName: '普通用户', phone: '13800138002', bio: '普通用户账户', avatar: '', avatarUrl: '', twoFactorEnabled: false, lastPasswordChange: '2024-01-10' } },
            guest: { id: 3, username: 'guest', password: '21693', email: 'guest@example.com', permissions: ['admin'], status: 'active', registeredAt: '2023-01-01', profile: { fullName: '访客用户', phone: '13800138003', bio: '访客用户账户，拥有管理员权限', avatar: '', avatarUrl: '', twoFactorEnabled: true, lastPasswordChange: '2024-01-20' } }
        },
        userIdCounter: 4
    };
}

// 保存用户数据
function saveUsers() {
    try {
        const data = {
            users,
            userIdCounter,
            lastUpdated: new Date().toISOString()
        };
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
        console.log('💾 用户数据已保存到文件');
        return true;
    } catch (error) {
        console.error('❌ 保存用户数据失败:', error.message);
        return false;
    }
}

// 初始化用户数据
const userData = loadUsers();
let users = userData.users;
let userIdCounter = userData.userIdCounter;

// 初始化路由权限配置
let routePermissionsConfig = loadRoutePermissions();

// 初始化审计日志
loadAuditLogs();

// 用户登录API - 添加详细的日志和错误处理
app.post('/api/login', async (req, res) => {
    try {
        console.log('收到登录请求:', req.body);

        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: '用户名和密码不能为空'
            });
        }

        // 查找用户 - 添加更详细的调试信息
        const user = Object.values(users).find(u => u.username === username);

        console.log('查找用户:', username, '找到:', user ? '是' : '否');

        if (user) {
            console.log('用户密码:', user.password, '输入密码:', password);
            console.log('密码匹配:', user.password === password);
        }

        if (user && user.password === password) {
            console.log('登录成功:', username);

            // 生成简单的token（在实际项目中应该使用JWT等安全token）
            const token = `token_${user.id}_${Date.now()}_${Math.random().toString(36).substring(2)}`;

            // 记录登录成功的审计日志
            await createAuditLog(user.id, user.username, 'login', 'auth', '用户登录成功', 'success', req);

            res.json({
                success: true,
                userId: user.id,
                token: token,
                userInfo: {
                    id: user.id,
                    username: user.username,
                    permissions: user.permissions
                }
            });
        } else {
            console.log('登录失败: 用户名或密码错误');

            // 记录登录失败的审计日志
            const userId = user ? user.id : 0;
            const displayUsername = user ? user.username : username;
            await createAuditLog(userId, displayUsername, 'login', 'auth', '用户登录失败: 用户名或密码错误', 'failed', req);

            res.status(401).json({
                success: false,
                message: '用户名或密码错误'
            });
        }
    } catch (error) {
        console.error('登录处理错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误'
        });
    }
});

// 用户注册API
app.post('/api/register', (req, res) => {
    try {
        console.log('收到注册请求:', req.body);

        const { username, email, password, confirmPassword } = req.body;

        // 输入验证
        if (!username || !email || !password || !confirmPassword) {
            return res.status(400).json({
                success: false,
                message: '所有字段都是必填的'
            });
        }

        // 验证密码确认
        if (password !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: '两次输入的密码不一致'
            });
        }

        // 验证密码长度
        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: '密码长度至少6位'
            });
        }

        // 验证邮箱格式
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: '请输入有效的邮箱地址'
            });
        }

        // 检查用户名是否已存在
        const existingUserByUsername = Object.values(users).find(u => u.username === username);
        if (existingUserByUsername) {
            return res.status(409).json({
                success: false,
                message: '用户名已存在'
            });
        }

        // 检查邮箱是否已存在
        const existingUserByEmail = Object.values(users).find(u => u.email === email);
        if (existingUserByEmail) {
            return res.status(409).json({
                success: false,
                message: '邮箱地址已被注册'
            });
        }

        // 创建新用户
        const newUserId = userIdCounter;
        userIdCounter++; // 先递增计数器

        const newUser = {
            id: newUserId,
            username,
            email,
            password,
            permissions: [], // 新用户默认没有特殊权限
            status: 'active', // 新用户默认状态为活跃
            registeredAt: new Date().toISOString().split('T')[0] // YYYY-MM-DD 格式
        };

        console.log('🆔 分配新用户ID:', newUserId, '下一个可用ID:', userIdCounter);

        // 将新用户添加到用户列表
        users[username] = newUser;

        // 保存到文件
        const saveSuccess = saveUsers();
        if (!saveSuccess) {
            console.warn('⚠️ 用户数据保存失败，但注册仍然成功（仅在内存中）');
        }

        // 加载路由权限配置
        const routePermissions = loadRoutePermissions();

        // 为新用户分配默认路由权限
        routePermissions.userRoutePermissions[newUser.username] = [...routePermissions.defaultPermissions];

        // 保存路由权限配置
        fs.writeFileSync('./routePermissions.json', JSON.stringify(routePermissions, null, 2));

        console.log('\n🎉 用户注册成功!');
        console.log('📝 新用户信息:');
        console.log(`   ID: ${newUser.id}`);
        console.log(`   用户名: ${newUser.username}`);
        console.log(`   邮箱: ${newUser.email}`);
        console.log(`   注册时间: ${newUser.registeredAt}`);
        console.log(`   权限: ${newUser.permissions.length > 0 ? newUser.permissions.join(', ') : '无特殊权限'}`);
        console.log(`   路由权限: ${routePermissions.userRoutePermissions[newUser.username].join(', ')}`);

        console.log('\n👥 当前所有用户列表:');
        Object.values(users).forEach((user, index) => {
            console.log(`   ${index + 1}. ${user.username} (ID: ${user.id}, 邮箱: ${user.email}, 注册: ${user.registeredAt})`);
        });
        console.log(`\n📊 总用户数: ${Object.keys(users).length}`);
        console.log('='.repeat(60));

        // 返回成功响应
        res.status(201).json({
            success: true,
            message: '注册成功！请使用新账户登录',
            userInfo: {
                id: newUser.id,
                username: newUser.username,
                email: newUser.email,
                registeredAt: newUser.registeredAt
            }
        });

    } catch (error) {
        console.error('注册处理错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误'
        });
    }
});

// 获取所有用户列表API（用于调试和验证）
app.get('/api/users', (req, res) => {
    try {
        // 返回所有用户信息（不包含密码）
        const userList = Object.values(users).map(user => ({
            id: user.id,
            username: user.username,
            email: user.email,
            permissions: user.permissions,
            status: user.status || 'active', // 为旧数据提供默认状态
            registeredAt: user.registeredAt
        }));

        console.log('获取用户列表，当前用户数量:', userList.length);

        res.json({
            success: true,
            data: userList,
            total: userList.length,
            message: '获取用户列表成功'
        });
    } catch (error) {
        console.error('获取用户列表错误:', error);
        res.status(500).json({
            success: false,
            message: '获取用户列表失败',
            data: []
        });
    }
});

// 创建用户API
app.post('/api/users', (req, res) => {
    try {
        console.log('🆕 收到创建用户请求:', req.body);

        const { username, email, password, permissions = [], status = 'active', routePermissions = [] } = req.body;

        // 输入验证
        if (!username || !email || !password) {
            return res.status(400).json({
                success: false,
                message: '用户名、邮箱和密码都是必填的'
            });
        }

        // 验证邮箱格式
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: '请输入有效的邮箱地址'
            });
        }

        // 检查用户名是否已存在
        const existingUserByUsername = Object.values(users).find(u => u.username === username);
        if (existingUserByUsername) {
            return res.status(409).json({
                success: false,
                message: '用户名已存在'
            });
        }

        // 检查邮箱是否已存在
        const existingUserByEmail = Object.values(users).find(u => u.email === email);
        if (existingUserByEmail) {
            return res.status(409).json({
                success: false,
                message: '邮箱地址已被注册'
            });
        }

        // 创建新用户
        const newUserId = userIdCounter;
        userIdCounter++;

        const newUser = {
            id: newUserId,
            username,
            email,
            password,
            permissions: Array.isArray(permissions) ? permissions : [],
            status: status || 'active',
            registeredAt: new Date().toISOString().split('T')[0],
            profile: {
                fullName: '',
                phone: '',
                bio: '',
                avatarUrl: '',
                avatarUrl: '',
                twoFactorEnabled: false,
                lastPasswordChange: new Date().toISOString().split('T')[0]
            }
        };

        // 添加到用户列表
        users[username] = newUser;

        // 加载路由权限配置
        const routePermissionsConfig = loadRoutePermissions();

        // 根据选择的路由权限动态分配路由
        if (Array.isArray(routePermissions) && routePermissions.length > 0) {
            console.log('🗺️ 为用户分配自定义路由权限:', routePermissions);

            // 保存到路由权限配置中
            routePermissionsConfig.userRoutePermissions[newUser.username] = routePermissions;

            console.log('✅ 用户路由权限分配完成:', routePermissions);
        } else {
            // 如果没有选择路由权限，使用默认权限
            console.log('🗺️ 为用户分配默认路由权限');
            routePermissionsConfig.userRoutePermissions[newUser.username] = [...routePermissionsConfig.defaultPermissions];
        }

        // 保存路由权限配置
        fs.writeFileSync('./routePermissions.json', JSON.stringify(routePermissionsConfig, null, 2));

        // 保存到文件
        const saveSuccess = saveUsers();
        if (!saveSuccess) {
            console.warn('⚠️ 用户数据保存失败，但创建仍然成功（仅在内存中）');
        }

        console.log('\n🎉 用户在用户界面创建成功!');
        console.log('📝 新创建的用户信息:');
        console.log(`   ID: ${newUser.id}`);
        console.log(`   用户名: ${newUser.username}`);
        console.log(`   邮箱: ${newUser.email}`);
        console.log(`   权限: ${newUser.permissions.length > 0 ? newUser.permissions.join(', ') : '无特殊权限'}`);
        console.log(`   路由权限: ${routePermissionsConfig.userRoutePermissions[newUser.username].join(', ')}`);
        console.log(`   创建时间: ${newUser.registeredAt}`);
        console.log('='.repeat(60));

        res.status(201).json({
            success: true,
            message: '用户创建成功',
            data: {
                id: newUser.id,
                username: newUser.username,
                email: newUser.email,
                permissions: newUser.permissions,
                status: newUser.status,
                registeredAt: newUser.registeredAt
            }
        });

    } catch (error) {
        console.error('创建用户错误:', error);
        res.status(500).json({
            success: false,
            message: '创建用户失败',
            error: error.message
        });
    }
});

// 更新用户API
app.put('/api/users/:userId', (req, res) => {
    try {
        const userId = parseInt(req.params.userId);
        console.log('✏️ 收到修改用户请求，用户ID:', userId, '更新数据:', req.body);

        const { username, email, permissions, status } = req.body;

        // 查找要更新的用户
        let userToUpdate = null;
        let userKeyToUpdate = null;

        for (const [key, user] of Object.entries(users)) {
            if (user.id === userId) {
                userToUpdate = user;
                userKeyToUpdate = key;
                break;
            }
        }

        if (!userToUpdate) {
            return res.status(404).json({
                success: false,
                message: '用户不存在'
            });
        }

        // 记录修改前的数据用于日志
        const oldData = { ...userToUpdate };

        // 如果要修改用户名，检查是否与其他用户冲突
        if (username && username !== userToUpdate.username) {
            const existingUser = Object.values(users).find(u => u.username === username && u.id !== userId);
            if (existingUser) {
                return res.status(409).json({
                    success: false,
                    message: '用户名已存在'
                });
            }
        }

        // 如果要修改邮箱，检查是否与其他用户冲突
        if (email && email !== userToUpdate.email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return res.status(400).json({
                    success: false,
                    message: '请输入有效的邮箱地址'
                });
            }

            const existingUser = Object.values(users).find(u => u.email === email && u.id !== userId);
            if (existingUser) {
                return res.status(409).json({
                    success: false,
                    message: '邮箱地址已被使用'
                });
            }
        }

        // 更新用户信息
        if (username !== undefined) userToUpdate.username = username;
        if (email !== undefined) userToUpdate.email = email;
        if (permissions !== undefined) userToUpdate.permissions = Array.isArray(permissions) ? permissions : [];
        if (status !== undefined) userToUpdate.status = status;

        // 如果用户名发生了变化，需要更新键名
        if (username && username !== oldData.username) {
            delete users[userKeyToUpdate];
            users[username] = userToUpdate;
        }

        // 保存到文件
        const saveSuccess = saveUsers();
        if (!saveSuccess) {
            console.warn('⚠️ 用户数据保存失败，但修改仍然成功（仅在内存中）');
        }

        console.log('\n✅ 用户在用户界面修改成功!');
        console.log('📝 修改的用户信息:');
        console.log(`   用户ID: ${userId}`);
        console.log('   修改前:');
        console.log(`     用户名: ${oldData.username}`);
        console.log(`     邮箱: ${oldData.email}`);
        console.log(`     权限: ${oldData.permissions?.join(', ') || '无'}`);
        console.log(`     状态: ${oldData.status || '无'}`);
        console.log('   修改后:');
        console.log(`     用户名: ${userToUpdate.username}`);
        console.log(`     邮箱: ${userToUpdate.email}`);
        console.log(`     权限: ${userToUpdate.permissions?.join(', ') || '无'}`);
        console.log(`     状态: ${userToUpdate.status || '无'}`);
        console.log('='.repeat(60));

        res.json({
            success: true,
            message: '用户信息更新成功',
            data: {
                id: userToUpdate.id,
                username: userToUpdate.username,
                email: userToUpdate.email,
                permissions: userToUpdate.permissions,
                status: userToUpdate.status,
                registeredAt: userToUpdate.registeredAt
            }
        });

    } catch (error) {
        console.error('更新用户错误:', error);
        res.status(500).json({
            success: false,
            message: '更新用户失败',
            error: error.message
        });
    }
});

// 删除用户API
app.delete('/api/users/:userId', (req, res) => {
    try {
        const userId = parseInt(req.params.userId);
        console.log('🗑️ 收到删除用户请求，用户ID:', userId);

        // 查找要删除的用户
        let userToDelete = null;
        let userKeyToDelete = null;

        for (const [key, user] of Object.entries(users)) {
            if (user.id === userId) {
                userToDelete = user;
                userKeyToDelete = key;
                break;
            }
        }

        if (!userToDelete) {
            return res.status(404).json({
                success: false,
                message: '用户不存在'
            });
        }

        // 检查是否是默认管理员用户（保护系统安全）
        if (userToDelete.username === 'admin' && userToDelete.id === 1) {
            return res.status(403).json({
                success: false,
                message: '不能删除默认管理员账户'
            });
        }

        // 删除用户
        delete users[userKeyToDelete];

        // 加载路由权限配置
        const routePermissionsConfig = loadRoutePermissions();

        // 同时删除用户的路由权限配置
        if (routePermissionsConfig.userRoutePermissions[userToDelete.username]) {
            delete routePermissionsConfig.userRoutePermissions[userToDelete.username];

            // 保存路由权限配置
            fs.writeFileSync('./routePermissions.json', JSON.stringify(routePermissionsConfig, null, 2));
        }

        // 保存到文件
        const saveSuccess = saveUsers();
        if (!saveSuccess) {
            console.warn('⚠️ 用户数据保存失败，但删除仍然成功（仅在内存中）');
        }

        console.log('\n✅ 用户在用户界面删除成功!');
        console.log('📝 删除的用户信息:');
        console.log(`   ID: ${userToDelete.id}`);
        console.log(`   用户名: ${userToDelete.username}`);
        console.log(`   邮箱: ${userToDelete.email}`);

        console.log('\n👥 剩余用户列表:');
        Object.values(users).forEach((user, index) => {
            console.log(`   ${index + 1}. ${user.username} (ID: ${user.id}, 邮箱: ${user.email})`);
        });
        console.log(`\n📊 剩余用户数: ${Object.keys(users).length}`);
        console.log('='.repeat(60));

        // 返回成功响应
        res.json({
            success: true,
            message: '用户删除成功',
            deletedUser: {
                id: userToDelete.id,
                username: userToDelete.username,
                email: userToDelete.email
            },
            remainingCount: Object.keys(users).length
        });

    } catch (error) {
        console.error('删除用户错误:', error);
        res.status(500).json({
            success: false,
            message: '删除用户失败',
            error: error.message
        });
    }
});

// 获取所有可用的路由权限API
app.get('/api/permissions', (req, res) => {
    try {
        console.log('📝 获取可用权限列表...');

        // 从配置文件中获取可用路由
        const routePermissions = loadRoutePermissions();
        const availableRoutes = routePermissions.availableRoutes || [];

        console.log('✅ 返回可用权限:', availableRoutes);

        res.json({
            success: true,
            data: availableRoutes,
            message: '获取可用权限成功'
        });

    } catch (error) {
        console.error('获取可用权限错误:', error);
        res.status(500).json({
            success: false,
            message: '获取可用权限失败',
            data: []
        });
    }
});

// 获取用户的路由权限详情API
app.get('/api/user/:userId/route-permissions', (req, res) => {
    try {
        const userId = parseInt(req.params.userId);
        console.log('🔎 获取用户路由权限详情，用户ID:', userId);

        // 查找用户
        const targetUser = Object.values(users).find(u => u.id === userId);
        if (!targetUser) {
            return res.status(404).json({
                success: false,
                message: '用户不存在'
            });
        }

        // 加载路由权限配置
        const routePermissionsConfig = loadRoutePermissions();

        // 获取用户当前的权限（使用用户名作为键）
        const userPermissions = routePermissionsConfig.userRoutePermissions[targetUser.username] || routePermissionsConfig.defaultPermissions;

        // 获取所有可用权限
        const allAvailablePermissions = routePermissionsConfig.availableRoutes || [];

        // 按照用户权限配置的顺序生成权限详情（保持原有顺序）
        const userPermissionDetails = userPermissions.map(permissionName => {
            return allAvailablePermissions.find(route => route.name === permissionName);
        }).filter(route => route !== undefined); // 过滤掉未找到的权限

        const responseData = {
            userId: userId,
            username: targetUser.username,
            permissions: userPermissionDetails,
            allAvailablePermissions: allAvailablePermissions
        };

        console.log('✅ 返回用户权限详情:', responseData);

        res.json({
            success: true,
            data: responseData,
            message: '获取用户路由权限成功'
        });

    } catch (error) {
        console.error('获取用户路由权限错误:', error);
        res.status(500).json({
            success: false,
            message: '获取用户路由权限失败'
        });
    }
});

// 更新用户的路由权限API
app.put('/api/user/:userId/route-permissions', (req, res) => {
    try {
        const userId = parseInt(req.params.userId);
        const { permissions } = req.body;
        console.log('✏️ 更新用户路由权限，用户ID:', userId, '新权限:', permissions);

        // 查找用户
        const targetUser = Object.values(users).find(u => u.id === userId);
        if (!targetUser) {
            return res.status(404).json({
                success: false,
                message: '用户不存在'
            });
        }

        // 加载路由权限配置
        const routePermissionsConfig = loadRoutePermissions();

        // 验证权限有效性
        if (!Array.isArray(permissions)) {
            return res.status(400).json({
                success: false,
                message: '权限数据格式错误'
            });
        }

        // 检查所有权限是否在可用列表中
        const availableRouteNames = routePermissionsConfig.availableRoutes.map(route => route.name);
        const invalidPermissions = permissions.filter(perm => !availableRouteNames.includes(perm));

        if (invalidPermissions.length > 0) {
            return res.status(400).json({
                success: false,
                message: `无效的权限: ${invalidPermissions.join(', ')}`
            });
        }

        // 保存原有权限用于日志（使用用户名作为键）
        const oldPermissions = routePermissionsConfig.userRoutePermissions[targetUser.username] || routePermissionsConfig.defaultPermissions;

        // 更新用户权限（使用用户名作为键）
        routePermissionsConfig.userRoutePermissions[targetUser.username] = permissions;

        // 保存路由权限配置
        fs.writeFileSync('./routePermissions.json', JSON.stringify(routePermissionsConfig, null, 2));

        console.log('\n✅ 用户路由权限更新成功!');
        console.log('📋 权限变更详情:');
        console.log(`   用户ID: ${userId}`);
        console.log(`   用户名: ${targetUser.username}`);
        console.log(`   原有权限: ${oldPermissions.join(', ')}`);
        console.log(`   新权限: ${permissions.join(', ')}`);
        console.log('='.repeat(60));

        res.json({
            success: true,
            message: '用户路由权限更新成功',
            data: {
                userId: userId,
                username: targetUser.username,
                oldPermissions: oldPermissions,
                newPermissions: permissions
            }
        });

    } catch (error) {
        console.error('更新用户路由权限错误:', error);
        res.status(500).json({
            success: false,
            message: '更新用户路由权限失败',
            error: error.message
        });
    }
});

// 获取用户路由API
app.get('/api/user/:userId/routes', (req, res) => {
    try {
        const userId = parseInt(req.params.userId);
        console.log('🗺️ 获取用户路由:', userId);

        // 查找用户
        let targetUser = null;
        for (const user of Object.values(users)) {
            if (user.id === userId) {
                targetUser = user;
                break;
            }
        }

        if (!targetUser) {
            return res.status(404).json({
                success: false,
                message: '用户不存在',
                data: []
            });
        }

        // 加载路由权限配置
        const routePermissions = loadRoutePermissions();

        // 根据用户名获取对应的路由权限配置
        let userRouteConfig = [];
        if (routePermissions.userRoutePermissions[targetUser.username]) {
            userRouteConfig = routePermissions.userRoutePermissions[targetUser.username];
        } else {
            // 如果没有对应的配置，根据用户权限选择默认配置
            if (targetUser.permissions.includes('admin')) {
                userRouteConfig = routePermissions.userRoutePermissions.admin || routePermissions.defaultPermissions;
            } else {
                userRouteConfig = routePermissions.userRoutePermissions.user || routePermissions.defaultPermissions;
            }
        }

        // 生成路由配置
        const routes = generateUserRoutesFromPermissions(userRouteConfig, routePermissions, targetUser.permissions);

        console.log(`✅ 成功生成用户 ${targetUser.username} 的路由配置:`, routes);
        console.log(`   用户权限: ${targetUser.permissions}`);
        console.log(`   路由数量: ${routes.length}`);

        // 确保返回正确的格式
        res.json({
            success: true,
            data: routes // 确保这是数组
        });
    } catch (error) {
        console.error('获取路由错误:', error);
        res.status(500).json({
            success: false,
            message: '获取路由失败',
            data: [] // 确保返回空数组而不是undefined
        });
    }
});
// 获取最近活动API
app.get('/api/activity', (req, res) => {
    try {
        function generateActivityData(count) {
            const users = ['用户1', '用户2', '用户3'];
            return Array.from({ length: count }, (_, i) => {
                const userIndex = i % users.length;
                const hour = 10 + i;
                return {
                    id: i + 1,
                    content: `${users[userIndex]}发布了新文章`,
                    time: `2021-08-01 ${String(hour).padStart(2, '0')}:00:00`
                };
            });
        }
        const activityData = generateActivityData(req.query.value);
        // 确保返回正确的格式
        res.json({
            success: true,
            data: activityData // 确保这是数组
        });
    } catch (error) {
        console.error('获取最近活动错误:', error);
        res.status(500).json({
            success: false,
            message: '获取最近活动失败',
            data: [] // 确保返回空数组而不是undefined
        });
    }
});

// 数据中心API
app.post('/api/Data', (req, res) => {
    try {
        // 从请求体获取分页信息
        const { page = 1, pageSize = 10 } = req.body;

        // 模拟数据中心数据
        function generateMockData(count) {
            const types = ['string', 'number', 'boolean', 'date'];
            const statuses = ['active', 'inactive'];

            return Array.from({ length: count }, (_, i) => ({
                id: i + 1,
                name: `field_${i + 1}`,
                type: types[Math.floor(Math.random() * types.length)],
                description: `这是字段${i + 1}的描述信息`,
                createTime: `2023-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
                status: statuses[Math.floor(Math.random() * statuses.length)],
                value: `value_${Math.floor(Math.random() * 1000)}`
            }));
        }

        const data = generateMockData(req.body.value);
        // 从请求体获取筛选条件
        const {
            fieldName,
            fieldType,
            status,
            keyword,
            createTimeStart,
            createTimeEnd,
            sortField = 'id',
            sortOrder = 'asc'
        } = req.body;

        // =============================
        // 新增：检查是否有更新数据的请求
        // 假如传入了 id 和其他字段，就认为要更新这条数据
        // 可以约定前端传一个 updates: { id: 1, name: 'xxx', ... }，或者直接判断有没有 id 和非分页/筛选/排序字段
        // 这里我们简单判断：如果传入了 id，并且还传入了非分页/筛选/排序等字段，就认为是要更新
        // 为了明确，也可以要求前端传一个专门的字段，比如 updateData: { id: 1, name: 'new' }
        // 下面采用更明确的判断：如果 req.body 中有 updateData 对象，且里面有 id，则执行更新
        // =============================

        let updateResult = {
            updated: false,
            updatedId: null,
            updatedItem: null,
            message: '无更新操作'
        };

        // 判断是否有更新操作（约定：如果传了 updateData 对象且包含 id，则执行更新）
        const updateData = req.body.updateData; // ✅ 前端应传 { ..., updateData: { id: 1, name: '新名称' } }
        if (updateData && updateData.id) {
            // 在全局 data 数组中查找对应 id 的项
            const dataIndex = data.findIndex(item => item.id === updateData.id);
            if (dataIndex !== -1) {
                // 使用展开运算符进行浅拷贝并更新字段
                data[dataIndex] = {
                    ...data[dataIndex],
                    ...updateData // 将 updateData 上的字段覆盖到原数据上（比如 updateData.name, updateData.status...）
                };
                const now = new Date()
                updateResult = {
                    updated: true,
                    updatedId: updateData.id,
                    updatedItem: data[dataIndex],
                    message: '数据更新成功',
                    Time: now.toLocaleString()
                };
                console.log('数据已更新:', updateResult);
            } else {
                updateResult = {
                    updated: false,
                    updatedId: updateData.id,
                    updatedItem: null,
                    message: '未找到对应 ID 的数据进行更新'
                };
                console.warn('未找到 ID 为', updateData.id, '的数据');
            }
        }

        // =============================
        // 原有逻辑：筛选、分页、排序（基于原始或刚更新的数据）
        // =============================

        // 先拷贝原始数据（避免修改原数组）
        let filteredData = [...data]; // data 是你预先定义的全局数据数组（已可能被更新）

        // 字段名称筛选（假设每个 item 有 name 字段）
        if (fieldName) {
            filteredData = filteredData.filter(item =>
                item.name && item.name.toLowerCase().includes(fieldName.toLowerCase())
            );
        }

        // 字段类型筛选
        if (fieldType) {
            filteredData = filteredData.filter(item => item.type === fieldType);
        }

        // 状态筛选
        if (status) {
            filteredData = filteredData.filter(item => item.status === status);
        }

        // 关键字搜索（模糊匹配所有字段的值）
        if (keyword) {
            const keywordLower = keyword.toLowerCase();
            filteredData = filteredData.filter(item =>
                Object.values(item).some(val =>
                    val != null && String(val).toLowerCase().includes(keywordLower)
                )
            );
        }

        // 创建时间范围筛选
        if (createTimeStart && createTimeEnd) {
            filteredData = filteredData.filter(item =>
                item.createTime >= createTimeStart && item.createTime <= createTimeEnd
            );
        }

        // ======================
        // 分页逻辑（先分页，再排序当前页）
        // ======================
        const startIndex = (page - 1) * pageSize;
        const endIndex = Math.min(startIndex + pageSize, filteredData.length);
        let paginatedData = filteredData.slice(startIndex, endIndex);

        // 对当前页的数据进行排序
        if (sortField && sortOrder) {
            paginatedData.sort((a, b) => {
                let valueA = a[sortField];
                let valueB = b[sortField];

                if (typeof valueA === 'string' && typeof valueB === 'string') {
                    valueA = valueA.toLowerCase();
                    valueB = valueB.toLowerCase();
                }

                if (sortField === 'createTime') {
                    valueA = new Date(valueA);
                    valueB = new Date(valueB);
                }

                if (valueA < valueB) {
                    return sortOrder === 'asc' ? -1 : 1;
                }
                if (valueA > valueB) {
                    return sortOrder === 'asc' ? 1 : -1;
                }
                return 0;
            });
        }

        // ======================
        // 返回结果
        // ======================
        res.json({
            success: true,
            data: paginatedData,
            total: filteredData.length, // 筛选后的总条数
            currentPage: Number(page),
            totalPages: Math.ceil(filteredData.length / pageSize),
            sortField: sortField,
            sortOrder: sortOrder,

            // 新增：返回更新操作的结果
            updateResult: updateResult
        });

    } catch (error) {
        console.error('获取或更新数据中心数据错误:', error);
        res.status(500).json({
            success: false,
            message: '获取或更新数据中心数据失败',
            data: [],
            updateResult: {
                updated: false,
                message: '服务器内部错误'
            }
        });
    }
});
// 获取设备数据
app.post('/api/dataPanel', (req, res) => {
    try {
        const generateDeviceData = (num) => {  // 添加num参数
            const statuses = ['normal', 'normal', 'normal', 'warning', 'offline'];
            const devices = [];

            // 使用传入的num参数，但确保最小值为0，最大值设为合理范围（比如1000）
            const deviceCount = Math.max(0, Math.min(num, 1000));  // 限制最大生成1000条数据

            for (let i = 1; i <= deviceCount; i++) {  // 使用deviceCount而非固定的15
                const status = statuses[Math.floor(Math.random() * statuses.length)];
                devices.push({
                    id: `DEV-${1000 + i}`,
                    name: `设备 ${i}`,
                    status,
                    temperature: Math.round(65 + Math.random() * 30),
                    humidity: Math.round(40 + Math.random() * 55),
                    voltage: Math.round(200 + Math.random() * 50),
                    uptime: Math.round(Math.random() * 500),
                    lastReport: `${Math.floor(Math.random() * 60)}分钟前`,
                    ip: `192.168.0.${i}`
                });
            }

            return devices;
        };

        // 获取前端传入的num参数，如果没有则默认为15
        const num = req.body.num || 15;

        const devices = generateDeviceData(num);
        res.json({
            success: true,
            data: devices,
            message: '获取设备数据成功',
            total: devices.length
        });
    } catch (error) {
        console.error('获取设备数据失败:', error);
        res.status(500).json({
            success: false,
            message: '获取设备数据失败',
            data: []
        });
    }
});


// 根据权限列表生成路由配置
function generateUserRoutesFromPermissions(allowedRoutes, routePermissions, userPermissions) {
    const { availableRoutes } = routePermissions;

    const routes = [];
    const processedParents = new Set(); // 记录已处理的父路由

    allowedRoutes.forEach(routeName => {
        const route = availableRoutes.find(r => r.name === routeName);
        if (route) {
            const routeConfig = {
                path: route.path,
                name: route.name,
                component: route.component,
                meta: {
                    title: route.title,
                    requiresAuth: true,
                    permissions: userPermissions
                }
            };

            // 处理子路由
            if (route.parent) {
                // 查找父路由是否已经存在
                let parentRoute = routes.find(r => r.name === route.parent);

                if (!parentRoute) {
                    // 如果父路由还没有添加，先添加父路由
                    const parentRouteConfig = availableRoutes.find(r => r.name === route.parent);
                    if (parentRouteConfig && allowedRoutes.includes(parentRouteConfig.name)) {
                        parentRoute = {
                            path: parentRouteConfig.path,
                            name: parentRouteConfig.name,
                            component: parentRouteConfig.component,
                            meta: {
                                title: parentRouteConfig.title,
                                requiresAuth: true,
                                permissions: userPermissions
                            },
                            children: []
                        };
                        routes.push(parentRoute);
                        processedParents.add(parentRouteConfig.name);
                    }
                }

                // 添加子路由
                if (parentRoute) {
                    if (!parentRoute.children) {
                        parentRoute.children = [];
                    }

                    // 处理子路由的相对路径
                    const childPath = route.path.replace(parentRoute.path, '').replace(/^\//, '') || route.name.toLowerCase();

                    parentRoute.children.push({
                        path: childPath,
                        name: route.name,
                        component: route.component,
                        meta: routeConfig.meta
                    });
                }
            } else {
                // 普通路由，直接添加（如果不是已经作为父路由处理过）
                if (!processedParents.has(route.name)) {
                    routes.push(routeConfig);
                }
            }
        }
    });

    return routes;
}

// 根据用户权限生成路由配置（旧版本，保留以兼容）
function generateUserRoutes(userPermissions, routePermissions) {
    const { availableRoutes, userRoutePermissions, defaultPermissions } = routePermissions;

    // 获取用户的路由权限
    let allowedRoutes = [];

    // 特殊处理：如果用户有admin权限，优先检查是否为guest用户（超级管理员）
    // 这里需要通过上下文来判断，但为了简化，我们假设只有guest用户才能访问数据相关功能

    // 先尝试guest配置（超级管理员）
    if (userRoutePermissions.guest) {
        allowedRoutes = userRoutePermissions.guest;
    }
    // 再尝试admin配置
    else if (userPermissions.includes('admin') && userRoutePermissions.admin) {
        allowedRoutes = userRoutePermissions.admin;
    }
    // 最后使用user配置或默认配置
    else {
        allowedRoutes = userRoutePermissions.user || defaultPermissions;
    }

    // 根据允许的路由名称，从availableRoutes中生成完整的路由配置
    const routes = [];
    const processedParents = new Set(); // 记录已处理的父路由

    allowedRoutes.forEach(routeName => {
        const route = availableRoutes.find(r => r.name === routeName);
        if (route) {
            const routeConfig = {
                path: route.path,
                name: route.name,
                component: route.component,
                meta: {
                    title: route.title,
                    requiresAuth: true,
                    permissions: userPermissions
                }
            };

            // 处理子路由
            if (route.parent) {
                // 查找父路由是否已经存在
                let parentRoute = routes.find(r => r.name === route.parent);

                if (!parentRoute) {
                    // 如果父路由还没有添加，先添加父路由
                    const parentRouteConfig = availableRoutes.find(r => r.name === route.parent);
                    if (parentRouteConfig && allowedRoutes.includes(parentRouteConfig.name)) {
                        parentRoute = {
                            path: parentRouteConfig.path,
                            name: parentRouteConfig.name,
                            component: parentRouteConfig.component,
                            meta: {
                                title: parentRouteConfig.title,
                                requiresAuth: true,
                                permissions: userPermissions
                            },
                            children: []
                        };
                        routes.push(parentRoute);
                        processedParents.add(parentRouteConfig.name);
                    }
                }

                // 添加子路由
                if (parentRoute) {
                    if (!parentRoute.children) {
                        parentRoute.children = [];
                    }

                    // 处理子路由的相对路径
                    const childPath = route.path.replace(parentRoute.path, '').replace(/^\//, '') || route.name.toLowerCase();

                    parentRoute.children.push({
                        path: childPath,
                        name: route.name,
                        component: route.component,
                        meta: routeConfig.meta
                    });
                }
            } else {
                // 普通路由，直接添加（如果不是已经作为父路由处理过）
                if (!processedParents.has(route.name)) {
                    routes.push(routeConfig);
                }
            }
        }
    });

    return routes;
}

// 获取用户个人资料API
app.get('/api/profile/:userId', (req, res) => {
    try {
        const userId = parseInt(req.params.userId);
        console.log('📋 获取用户个人资料，用户ID:', userId);

        // 查找用户
        let targetUser = null;
        for (const user of Object.values(users)) {
            if (user.id === userId) {
                targetUser = user;
                break;
            }
        }

        if (!targetUser) {
            return res.status(404).json({
                success: false,
                message: '用户不存在'
            });
        }

        // 确保用户有profile字段，如果没有则创建默认值
        if (!targetUser.profile) {
            targetUser.profile = {
                fullName: '',
                phone: '',
                bio: '',
                avatarUrl: '',
                avatarUrl: '',
                twoFactorEnabled: false,
                lastPasswordChange: targetUser.registeredAt || new Date().toISOString().split('T')[0]
            };
            // 保存更新
            saveUsers();
        }

        // 返回用户资料（不包含密码）
        const profileData = {
            id: targetUser.id,
            username: targetUser.username,
            email: targetUser.email,
            permissions: targetUser.permissions,
            status: targetUser.status,
            registeredAt: targetUser.registeredAt,
            profile: targetUser.profile
        };

        console.log('✅ 成功获取用户资料:', profileData);

        res.json({
            success: true,
            data: profileData,
            message: '获取用户资料成功'
        });

    } catch (error) {
        console.error('获取用户资料错误:', error);
        res.status(500).json({
            success: false,
            message: '获取用户资料失败',
            error: error.message
        });
    }
});

// 更新用户个人资料API
app.put('/api/profile/:userId', (req, res) => {
    try {
        const userId = parseInt(req.params.userId);
        console.log('✏️ 更新用户个人资料，用户ID:', userId, '更新数据:', req.body);

        const { email, fullName, phone, bio, twoFactorEnabled } = req.body;

        // 查找用户
        let targetUser = null;
        let userKey = null;
        for (const [key, user] of Object.entries(users)) {
            if (user.id === userId) {
                targetUser = user;
                userKey = key;
                break;
            }
        }

        if (!targetUser) {
            return res.status(404).json({
                success: false,
                message: '用户不存在'
            });
        }

        // 如果要修改邮箱，检查是否与其他用户冲突
        if (email && email !== targetUser.email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return res.status(400).json({
                    success: false,
                    message: '请输入有效的邮箱地址'
                });
            }

            const existingUser = Object.values(users).find(u => u.email === email && u.id !== userId);
            if (existingUser) {
                return res.status(409).json({
                    success: false,
                    message: '邮箱地址已被使用'
                });
            }
        }

        // 记录修改前的数据
        const oldData = { ...targetUser };

        // 更新基本信息
        if (email !== undefined) targetUser.email = email;

        // 确保profile对象存在
        if (!targetUser.profile) {
            targetUser.profile = {
                fullName: '',
                phone: '',
                bio: '',
                avatarUrl: '',
                twoFactorEnabled: false,
                lastPasswordChange: targetUser.registeredAt || new Date().toISOString().split('T')[0]
            };
        }

        // 更新profile信息
        if (fullName !== undefined) targetUser.profile.fullName = fullName;
        if (phone !== undefined) targetUser.profile.phone = phone;
        if (bio !== undefined) targetUser.profile.bio = bio;
        if (twoFactorEnabled !== undefined) targetUser.profile.twoFactorEnabled = twoFactorEnabled;

        // 保存到文件
        const saveSuccess = saveUsers();
        if (!saveSuccess) {
            console.warn('⚠️ 用户资料保存失败，但更新仍然成功（仅在内存中）');
        }

        console.log('\n✅ 用户资料更新成功!');
        console.log('📝 更新的用户资料:');
        console.log(`   用户ID: ${userId}`);
        console.log('   修改前:');
        console.log(`     邮箱: ${oldData.email}`);
        console.log(`     姓名: ${oldData.profile?.fullName || '无'}`);
        console.log(`     电话: ${oldData.profile?.phone || '无'}`);
        console.log('   修改后:');
        console.log(`     邮箱: ${targetUser.email}`);
        console.log(`     姓名: ${targetUser.profile.fullName}`);
        console.log(`     电话: ${targetUser.profile.phone}`);
        console.log('='.repeat(60));

        // 返回更新后的用户资料（不包含密码）
        const updatedProfile = {
            id: targetUser.id,
            username: targetUser.username,
            email: targetUser.email,
            permissions: targetUser.permissions,
            status: targetUser.status,
            registeredAt: targetUser.registeredAt,
            profile: targetUser.profile
        };

        res.json({
            success: true,
            data: updatedProfile,
            message: '用户资料更新成功'
        });

    } catch (error) {
        console.error('更新用户资料错误:', error);
        res.status(500).json({
            success: false,
            message: '更新用户资料失败',
            error: error.message
        });
    }
});

// 上传用户头像API
// 上传用户头像API - 真实文件上传
app.post('/api/profile/:userId/avatar', upload.single('avatar'), (req, res) => {
    try {
        const userId = parseInt(req.params.userId);
        console.log('📸 收到头像上传请求，用户ID:', userId);

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: '未选择文件'
            });
        }

        // 查找用户
        let targetUser = null;
        for (const user of Object.values(users)) {
            if (user.id === userId) {
                targetUser = user;
                break;
            }
        }

        if (!targetUser) {
            // 删除已上传的文件
            fs.unlinkSync(req.file.path);
            return res.status(404).json({
                success: false,
                message: '用户不存在'
            });
        }

        // 删除旧头像文件（如果存在）
        if (targetUser.profile?.avatarUrl && targetUser.profile.avatarUrl.startsWith('/uploads/')) {
            const oldAvatarPath = path.join(process.cwd(), targetUser.profile.avatarUrl);
            if (fs.existsSync(oldAvatarPath)) {
                try {
                    fs.unlinkSync(oldAvatarPath);
                    console.log('🗑️ 已删除旧头像文件:', oldAvatarPath);
                } catch (error) {
                    console.warn('⚠️ 删除旧头像文件失败:', error.message);
                }
            }
        }

        // 生成头像URL
        const avatarUrl = `/uploads/avatars/${req.file.filename}`;
        const fullAvatarUrl = `http://localhost:${port}${avatarUrl}`;

        // 确保profile对象存在
        if (!targetUser.profile) {
            targetUser.profile = {
                fullName: '',
                phone: '',
                bio: '',
                avatar: '',
                avatarUrl: '',
                twoFactorEnabled: false,
                lastPasswordChange: targetUser.registeredAt || new Date().toISOString().split('T')[0]
            };
        }

        // 更新头像
        targetUser.profile.avatar = fullAvatarUrl;
        targetUser.profile.avatarUrl = fullAvatarUrl;

        // 保存到文件
        const saveSuccess = saveUsers();
        if (!saveSuccess) {
            console.warn('⚠️ 用户数据保存失败，但头像上传仍然成功（仅在内存中）');
        }

        console.log('\n✅ 用户头像上传成功!');
        console.log('📋 头像上传信息:');
        console.log(`   用户ID: ${userId}`);
        console.log(`   用户名: ${targetUser.username}`);
        console.log(`   文件名: ${req.file.filename}`);
        console.log(`   文件大小: ${(req.file.size / 1024).toFixed(2)}KB`);
        console.log(`   头像URL: ${fullAvatarUrl}`);
        console.log(`   更新时间: ${new Date().toISOString()}`);
        console.log('='.repeat(60));

        res.json({
            success: true,
            message: '头像上传成功',
            data: {
                avatarUrl: fullAvatarUrl,
                userId: userId,
                filename: req.file.filename,
                size: req.file.size
            }
        });

    } catch (error) {
        console.error('上传头像错误:', error);

        // 如果有文件上传，删除它
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }

        res.status(500).json({
            success: false,
            message: '上传头像失败',
            error: error.message
        });
    }
});

// 保留原有的PUT方法作为备用API
app.put('/api/profile/:userId/avatar', (req, res) => {
    try {
        const userId = parseInt(req.params.userId);
        console.log('📸 上传用户头像（URL方式），用户ID:', userId);

        const { avatarUrl } = req.body;

        // 输入验证
        if (!avatarUrl) {
            return res.status(400).json({
                success: false,
                message: '头像URL不能为空'
            });
        }

        // 查找用户
        let targetUser = null;
        for (const user of Object.values(users)) {
            if (user.id === userId) {
                targetUser = user;
                break;
            }
        }

        if (!targetUser) {
            return res.status(404).json({
                success: false,
                message: '用户不存在'
            });
        }

        // 确保profile对象存在
        if (!targetUser.profile) {
            targetUser.profile = {
                fullName: '',
                phone: '',
                bio: '',
                avatar: '',
                avatarUrl: '',
                twoFactorEnabled: false,
                lastPasswordChange: targetUser.registeredAt || new Date().toISOString().split('T')[0]
            };
        }

        // 更新头像
        const oldAvatar = targetUser.profile.avatar;
        targetUser.profile.avatar = avatarUrl;
        targetUser.profile.avatarUrl = avatarUrl; // 同时设置avatarUrl字段以保持兼容性

        // 保存到文件
        const saveSuccess = saveUsers();
        if (!saveSuccess) {
            console.warn('⚠️ 头像保存失败，但更新仍然成功（仅在内存中）');
        }

        console.log('\n✅ 用户头像上传成功!');
        console.log('📝 头像更新信息:');
        console.log(`   用户ID: ${userId}`);
        console.log(`   用户名: ${targetUser.username}`);
        console.log(`   旧头像: ${oldAvatar || '无'}`);
        console.log(`   新头像: ${avatarUrl}`);
        console.log(`   更新时间: ${new Date().toISOString()}`);
        console.log('='.repeat(60));

        res.json({
            success: true,
            message: '头像上传成功',
            data: {
                avatarUrl: avatarUrl,
                userId: userId
            }
        });

    } catch (error) {
        console.error('上传头像错误:', error);
        res.status(500).json({
            success: false,
            message: '上传头像失败',
            error: error.message
        });
    }
});

// 修改用户密码API
app.put('/api/profile/:userId/password', (req, res) => {
    try {
        const userId = parseInt(req.params.userId);
        console.log('🔒 修改用户密码，用户ID:', userId);

        const { currentPassword, newPassword } = req.body;

        // 输入验证
        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: '当前密码和新密码都是必填的'
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: '新密码长度至少6位'
            });
        }

        // 查找用户
        let targetUser = null;
        for (const user of Object.values(users)) {
            if (user.id === userId) {
                targetUser = user;
                break;
            }
        }

        if (!targetUser) {
            return res.status(404).json({
                success: false,
                message: '用户不存在'
            });
        }

        // 验证当前密码
        if (targetUser.password !== currentPassword) {
            return res.status(401).json({
                success: false,
                message: '当前密码错误'
            });
        }

        // 更新密码
        targetUser.password = newPassword;

        // 确保profile对象存在并更新密码修改时间
        if (!targetUser.profile) {
            targetUser.profile = {
                fullName: '',
                phone: '',
                bio: '',
                avatarUrl: '',
                avatarUrl: '',
                twoFactorEnabled: false,
                lastPasswordChange: targetUser.registeredAt || new Date().toISOString().split('T')[0]
            };
        } else {
            targetUser.profile.lastPasswordChange = new Date().toISOString().split('T')[0];
        }

        // 保存到文件
        const saveSuccess = saveUsers();
        if (!saveSuccess) {
            console.warn('⚠️ 密码修改保存失败，但更新仍然成功（仅在内存中）');
        }

        console.log('\n✅ 用户密码修改成功!');
        console.log('📝 密码修改信息:');
        console.log(`   用户ID: ${userId}`);
        console.log(`   用户名: ${targetUser.username}`);
        console.log(`   修改时间: ${targetUser.profile.lastPasswordChange}`);
        console.log('='.repeat(60));

        res.json({
            success: true,
            message: '密码修改成功',
            data: {
                lastPasswordChange: targetUser.profile.lastPasswordChange
            }
        });

    } catch (error) {
        console.error('修改密码错误:', error);
        res.status(500).json({
            success: false,
            message: '修改密码失败',
            error: error.message
        });
    }
});

// 健康检查接口
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// =================== 审计日志 API ===================

// 获取审计日志列表
app.get('/api/audit-logs', (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            userId,
            module,
            action,
            startDate,
            endDate
        } = req.query;

        let filteredLogs = [...auditLogs];

        // 筛选条件
        if (userId) {
            filteredLogs = filteredLogs.filter(log => log.userId == userId);
        }
        if (module) {
            filteredLogs = filteredLogs.filter(log => log.module === module);
        }
        if (action) {
            filteredLogs = filteredLogs.filter(log => log.action === action);
        }
        if (startDate) {
            filteredLogs = filteredLogs.filter(log => new Date(log.timestamp) >= new Date(startDate));
        }
        if (endDate) {
            filteredLogs = filteredLogs.filter(log => new Date(log.timestamp) <= new Date(endDate));
        }

        // 分页
        const total = filteredLogs.length;
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + parseInt(limit);
        const paginatedLogs = filteredLogs.slice(startIndex, endIndex);

        console.log(`📄 获取审计日志，筛选后数量: ${total}，返回: ${paginatedLogs.length}`);

        res.json({
            success: true,
            data: {
                logs: paginatedLogs,
                total: total,
                page: parseInt(page),
                limit: parseInt(limit)
            }
        });
    } catch (error) {
        console.error('获取审计日志错误:', error);
        res.status(500).json({
            success: false,
            message: '获取审计日志失败',
            data: { logs: [], total: 0, page: 1, limit: 20 }
        });
    }
});

// 创建审计日志
app.post('/api/audit-logs', async (req, res) => {
    try {
        const { action, module, details, status = 'success' } = req.body;

        // 从请求中获取用户信息（假设从 token 中解析）
        // 这里简化处理，实际应该从 JWT 中获取
        const userId = req.body.userId || 1;
        const username = req.body.username || 'system';

        if (!action || !module || !details) {
            return res.status(400).json({
                success: false,
                message: '操作类型、模块和详情都是必填的'
            });
        }

        const log = await createAuditLog(userId, username, action, module, details, status, req);

        res.status(201).json({
            success: true,
            message: '审计日志创建成功',
            data: log
        });
    } catch (error) {
        console.error('创建审计日志错误:', error);
        res.status(500).json({
            success: false,
            message: '创建审计日志失败'
        });
    }
});

// 获取用户操作统计
app.get('/api/audit-logs/stats/:userId', (req, res) => {
    try {
        const { userId } = req.params;
        let targetLogs = auditLogs;

        if (userId) {
            targetLogs = auditLogs.filter(log => log.userId == userId);
        }

        const today = new Date().toISOString().split('T')[0];
        const todayLogs = targetLogs.filter(log => log.timestamp.startsWith(today));

        // 操作类型统计
        const actionStats = {};
        targetLogs.forEach(log => {
            actionStats[log.action] = (actionStats[log.action] || 0) + 1;
        });

        // 模块统计
        const moduleStats = {};
        targetLogs.forEach(log => {
            moduleStats[log.module] = (moduleStats[log.module] || 0) + 1;
        });

        const stats = {
            totalActions: targetLogs.length,
            todayActions: todayLogs.length,
            recentActions: Object.entries(actionStats).map(([action, count]) => ({ action, count })),
            moduleStats: Object.entries(moduleStats).map(([module, count]) => ({ module, count }))
        };

        console.log(`📈 获取用户 ${userId || '全部'} 的操作统计:`, stats);

        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('获取操作统计错误:', error);
        res.status(500).json({
            success: false,
            message: '获取操作统计失败'
        });
    }
});

// 获取所有用户操作统计
app.get('/api/audit-logs/stats', (req, res) => {
    try {
        let targetLogs = auditLogs;

        const today = new Date().toISOString().split('T')[0];
        const todayLogs = targetLogs.filter(log => log.timestamp.startsWith(today));

        // 操作类型统计
        const actionStats = {};
        targetLogs.forEach(log => {
            actionStats[log.action] = (actionStats[log.action] || 0) + 1;
        });

        // 模块统计
        const moduleStats = {};
        targetLogs.forEach(log => {
            moduleStats[log.module] = (moduleStats[log.module] || 0) + 1;
        });

        const stats = {
            totalActions: targetLogs.length,
            todayActions: todayLogs.length,
            recentActions: Object.entries(actionStats).map(([action, count]) => ({ action, count })),
            moduleStats: Object.entries(moduleStats).map(([module, count]) => ({ module, count }))
        };

        console.log(`📈 获取所有用户的操作统计:`, stats);

        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('获取操作统计错误:', error);
        res.status(500).json({
            success: false,
            message: '获取操作统计失败'
        });
    }
});

// 删除单个审计日志
app.delete('/api/audit-logs/:logId', (req, res) => {
    try {
        const { logId } = req.params;

        if (!logId) {
            return res.status(400).json({
                success: false,
                message: '需要提供要删除的日志ID'
            });
        }

        const originalLength = auditLogs.length;
        const logIndex = auditLogs.findIndex(log => log.id === logId);

        if (logIndex === -1) {
            return res.status(404).json({
                success: false,
                message: '找不到指定的日志记录'
            });
        }

        const deletedLog = auditLogs[logIndex];
        auditLogs.splice(logIndex, 1);

        saveAuditLogs();

        console.log(`🗑️ 删除审计日志: ${deletedLog.username} - ${deletedLog.action} - ${deletedLog.module}`);

        res.json({
            success: true,
            message: '成功删除日志记录',
            data: { deleted: true }
        });
    } catch (error) {
        console.error('删除审计日志错误:', error);
        res.status(500).json({
            success: false,
            message: '删除审计日志失败'
        });
    }
});

// 删除审计日志（管理员权限）
app.delete('/api/audit-logs', (req, res) => {
    try {
        const { logIds } = req.body;

        if (!logIds || !Array.isArray(logIds)) {
            return res.status(400).json({
                success: false,
                message: '需要提供要删除的日志ID数组'
            });
        }

        const originalLength = auditLogs.length;
        auditLogs = auditLogs.filter(log => !logIds.includes(log.id));
        const deletedCount = originalLength - auditLogs.length;

        saveAuditLogs();

        console.log(`🗑️ 删除审计日志: ${deletedCount} 条`);

        res.json({
            success: true,
            message: `成功删除 ${deletedCount} 条日志`,
            data: { deletedCount }
        });
    } catch (error) {
        console.error('删除审计日志错误:', error);
        res.status(500).json({
            success: false,
            message: '删除审计日志失败'
        });
    }
});

// 导出审计日志
app.post('/api/audit-logs/export', (req, res) => {
    try {
        const { userId, module, action, startDate, endDate, format = 'xlsx' } = req.body;

        let exportLogs = [...auditLogs];

        // 应用筛选条件
        if (userId) {
            exportLogs = exportLogs.filter(log => log.userId == userId);
        }
        if (module) {
            exportLogs = exportLogs.filter(log => log.module === module);
        }
        if (action) {
            exportLogs = exportLogs.filter(log => log.action === action);
        }
        if (startDate) {
            exportLogs = exportLogs.filter(log => new Date(log.timestamp) >= new Date(startDate));
        }
        if (endDate) {
            exportLogs = exportLogs.filter(log => new Date(log.timestamp) <= new Date(endDate));
        }

        console.log(`📄 导出审计日志: ${exportLogs.length} 条，格式: ${format}`);

        if (format === 'xlsx') {
            // 生成真正的Excel文件
            try {
                // 创建下载目录
                const downloadsDir = path.join(process.cwd(), 'downloads');
                if (!fs.existsSync(downloadsDir)) {
                    fs.mkdirSync(downloadsDir, { recursive: true });
                }

                // 准备Excel数据
                const excelData = exportLogs.map(log => ({
                    '时间': new Date(log.timestamp).toLocaleString('zh-CN'),
                    '用户ID': log.userId,
                    '用户名': log.username,
                    '模块': getModuleDisplayName(log.module),
                    '操作': getActionDisplayName(log.action),
                    '详情': log.details,
                    '状态': log.status === 'success' ? '成功' : '失败',
                    'IP地址': log.ipAddress || '-',
                    '地理位置': log.location || '未知位置',
                    '用户代理': log.userAgent || '-'
                }));

                // 创建工作簿
                const workbook = XLSX.utils.book_new();
                const worksheet = XLSX.utils.json_to_sheet(excelData);

                // 设置列宽
                const colWidths = [
                    { wch: 18 }, // 时间
                    { wch: 8 },  // 用户ID
                    { wch: 12 }, // 用户名
                    { wch: 10 }, // 模块
                    { wch: 8 },  // 操作
                    { wch: 30 }, // 详情
                    { wch: 8 },  // 状态
                    { wch: 15 }, // IP地址
                    { wch: 20 }, // 地理位置
                    { wch: 25 }  // 用户代理
                ];
                worksheet['!cols'] = colWidths;

                // 添加工作表
                XLSX.utils.book_append_sheet(workbook, worksheet, '操作日志');

                // 生成文件名
                const filename = `audit_logs_${new Date().toISOString().split('T')[0]}_${Date.now()}.xlsx`;
                const filePath = path.join(downloadsDir, filename);

                // 写入文件
                XLSX.writeFile(workbook, filePath);

                console.log(`✅ Excel文件已生成: ${filePath}`);

                // 返回可下载的文件信息
                res.json({
                    success: true,
                    message: '导出成功',
                    data: {
                        downloadUrl: `/downloads/${filename}`,
                        filename: filename,
                        recordCount: exportLogs.length
                    }
                });
            } catch (excelError) {
                console.error('生成Excel文件失败:', excelError);
                res.status(500).json({
                    success: false,
                    message: '生成Excel文件失败: ' + excelError.message
                });
            }
        } else {
            // 其他格式的导出（如CSV）
            const filename = `audit_logs_${new Date().toISOString().split('T')[0]}.${format}`;
            const downloadUrl = `/downloads/${filename}`;

            res.json({
                success: true,
                message: '导出成功',
                data: { downloadUrl }
            });
        }
    } catch (error) {
        console.error('导出审计日志错误:', error);
        res.status(500).json({
            success: false,
            message: '导出审计日志失败'
        });
    }
});

// 辅助函数：获取模块显示名称
function getModuleDisplayName(module) {
    const moduleNames = {
        auth: '认证',
        user: '用户管理',
        profile: '个人资料',
        permission: '权限管理',
        system: '系统设置'
    };
    return moduleNames[module] || module;
}

// 辅助函数：获取操作显示名称
function getActionDisplayName(action) {
    const actionNames = {
        login: '登录',
        logout: '退出',
        create: '创建',
        update: '更新',
        delete: '删除',
        view: '查看'
    };
    return actionNames[action] || action;
}

// 启动服务器
app.listen(port, () => {
    console.log(`✅ Mock服务器运行在 http://localhost:${port}`);
    console.log(`📝 可用接口:`);
    console.log(`   POST /api/login     - 用户登录`);
    console.log(`   POST /api/register  - 用户注册`);
    console.log(`   GET  /api/permissions - 获取可用权限列表`);
    console.log(`   GET  /api/users     - 获取所有用户列表`);
    console.log(`   POST /api/users     - 创建新用户`);
    console.log(`   PUT  /api/users/:userId - 更新用户信息`);
    console.log(`   DELETE /api/users/:userId - 删除指定用户`);
    console.log(`   GET  /api/profile/:userId - 获取用户个人资料`);
    console.log(`   PUT  /api/profile/:userId - 更新用户个人资料`);
    console.log(`   PUT  /api/profile/:userId/avatar - 上传用户头像（URL方式）`);
    console.log(`   POST /api/profile/:userId/avatar - 上传用户头像（文件方式）`);
    console.log(`   PUT  /api/profile/:userId/password - 修改用户密码`);
    console.log(`   GET  /api/user/:userId/routes - 获取用户路由`);
    console.log(`   GET  /api/activity  - 获取最近活动`);
    console.log(`   GET  /api/health    - 健康检查`);
    console.log(`   POST /api/data      - 数据中心`);
    console.log(`   POST /api/dataPanel      - 数据面板`);

    console.log('\n👥 初始用户列表:');
    Object.values(users).forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.username} (ID: ${user.id}, 邮箱: ${user.email}, 注册: ${user.registeredAt})`);
    });
    console.log(`\n📊 总用户数: ${Object.keys(users).length}`);
    console.log(`🚀 可以通过注册接口添加新用户`);
    console.log(`🔍 每次注册成功后都会在控制台显示最新的用户列表`);
    console.log('='.repeat(60));
});

// 优雅关闭
process.on('SIGINT', () => {
    console.log('\n🛑 正在关闭Mock服务器...');

    // 保存用户数据
    console.log('💾 保存用户数据...');
    const saveSuccess = saveUsers();

    if (saveSuccess) {
        console.log('✅ 用户数据已保存');
    } else {
        console.log('❌ 用户数据保存失败');
    }

    console.log('👋 Mock服务器已关闭');
    process.exit(0);
});