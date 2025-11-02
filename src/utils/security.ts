// 输入验证与安全相关工具函数
import axiosInstance from "@/services/axiosInstance";

// XSS防护 - 转义HTML字符
export function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

// 清理HTML标签
export function stripHtml(html: string): string {
  const doc = new DOMParser().parseFromString(html, "text/html");
  return doc.body.textContent || "";
}

// 文件上传安全检查
export function validateFileUpload(file: File): {
  valid: boolean;
  message: string;
} {
  // 检查文件大小 (限制为5MB)
  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    return { valid: false, message: "文件大小不能超过5MB" };
  }

  // 检查文件类型
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ];

  if (!allowedTypes.includes(file.type)) {
    return { valid: false, message: "不支持的文件类型" };
  }

  // 检查文件名
  const fileName = file.name;
  const dangerousPatterns = [
    /\.exe$/i,
    /\.bat$/i,
    /\.cmd$/i,
    /\.scr$/i,
    /\.vbs$/i,
    /\.js$/i,
    /\.php$/i,
    /\.asp$/i,
    /\.jsp$/i,
    /\.\./, // 路径遍历
    /[<>:"|?*]/, // 非法字符
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(fileName)) {
      return { valid: false, message: "文件名包含非法字符或危险扩展名" };
    }
  }

  return { valid: true, message: "" };
}

// 密码强度验证
export function validatePasswordStrength(password: string): {
  valid: boolean;
  score: number;
  message: string;
  suggestions: string[];
} {
  let score = 0;
  const suggestions: string[] = [];

  // 长度检查
  if (password.length >= 8) {
    score += 25;
  } else {
    suggestions.push("密码长度至少8位");
  }

  // 包含小写字母
  if (/[a-z]/.test(password)) {
    score += 25;
  } else {
    suggestions.push("包含小写字母");
  }

  // 包含大写字母
  if (/[A-Z]/.test(password)) {
    score += 25;
  } else {
    suggestions.push("包含大写字母");
  }

  // 包含数字
  if (/\d/.test(password)) {
    score += 25;
  } else {
    suggestions.push("包含数字");
  }

  // 包含特殊字符
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    score += 10;
  } else {
    suggestions.push("包含特殊字符");
  }

  // 长度奖励
  if (password.length >= 12) {
    score += 10;
  }

  let message = "";
  if (score < 50) {
    message = "密码强度弱";
  } else if (score < 75) {
    message = "密码强度中等";
  } else {
    message = "密码强度强";
  }

  return {
    valid: score >= 50,
    score: Math.min(score, 100),
    message,
    suggestions,
  };
}

// 邮箱格式验证
export function validateEmail(email: string): {
  valid: boolean;
  message: string;
} {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  if (!email) {
    return { valid: false, message: "邮箱地址不能为空" };
  }

  if (!emailRegex.test(email)) {
    return { valid: false, message: "邮箱格式不正确" };
  }

  if (email.length > 254) {
    return { valid: false, message: "邮箱地址过长" };
  }

  return { valid: true, message: "" };
}

// 手机号验证
export function validatePhone(phone: string): {
  valid: boolean;
  message: string;
} {
  if (!phone) {
    return { valid: false, message: "手机号不能为空" };
  }

  // 中国大陆手机号格式
  const phoneRegex = /^1[3-9]\d{9}$/;

  if (!phoneRegex.test(phone)) {
    return { valid: false, message: "手机号格式不正确" };
  }

  return { valid: true, message: "" };
}

// 用户名验证
export function validateUsername(username: string): {
  valid: boolean;
  message: string;
} {
  if (!username) {
    return { valid: false, message: "用户名不能为空" };
  }

  if (username.length < 3) {
    return { valid: false, message: "用户名至少3个字符" };
  }

  if (username.length > 20) {
    return { valid: false, message: "用户名不能超过20个字符" };
  }

  // 只允许字母、数字、下划线
  const usernameRegex = /^[a-zA-Z0-9_]+$/;
  if (!usernameRegex.test(username)) {
    return { valid: false, message: "用户名只能包含字母、数字和下划线" };
  }

  // 不能以数字开头
  if (/^\d/.test(username)) {
    return { valid: false, message: "用户名不能以数字开头" };
  }

  return { valid: true, message: "" };
}

// SQL注入防护 - 基本检查
export function detectSqlInjection(input: string): {
  safe: boolean;
  message: string;
} {
  const sqlPatterns = [
    /('|(\\'))+.*(OR|or).*(('|(\\')))+.*((=)|(==)|[>]|[<])/,
    /(SELECT|select).*(FROM|from)/,
    /(INSERT|insert).*(INTO|into)/,
    /(UPDATE|update).*(SET|set)/,
    /(DELETE|delete).*(FROM|from)/,
    /(DROP|drop).*(TABLE|table|DATABASE|database)/,
    /(UNION|union).*(SELECT|select)/,
    /--/,
    /\/\*/,
    /\*\//,
    /xp_/i,
    /sp_/i,
  ];

  for (const pattern of sqlPatterns) {
    if (pattern.test(input)) {
      return { safe: false, message: "输入包含可疑的SQL语句" };
    }
  }

  return { safe: true, message: "" };
}

// 请求频率限制检查
const requestHistory = new Map<string, number[]>();

export function checkRateLimit(
  identifier: string,
  maxRequests: number = 10,
  windowMs: number = 60000
): {
  allowed: boolean;
  remaining: number;
  resetTime: number;
} {
  const now = Date.now();
  const windowStart = now - windowMs;

  // 获取当前标识符的请求历史
  let history = requestHistory.get(identifier) || [];

  // 清理过期的请求记录
  history = history.filter((timestamp) => timestamp > windowStart);

  // 检查是否超过限制
  if (history.length >= maxRequests) {
    const oldestRequest = Math.min(...history);
    const resetTime = oldestRequest + windowMs;

    return {
      allowed: false,
      remaining: 0,
      resetTime: resetTime,
    };
  }

  // 添加当前请求
  history.push(now);
  requestHistory.set(identifier, history);

  return {
    allowed: true,
    remaining: maxRequests - history.length,
    resetTime: now + windowMs,
  };
}

// URL验证
export function validateUrl(url: string): { valid: boolean; message: string } {
  if (!url) {
    return { valid: false, message: "URL不能为空" };
  }

  try {
    const urlObj = new URL(url);

    // 只允许HTTP和HTTPS协议
    if (!["http:", "https:"].includes(urlObj.protocol)) {
      return { valid: false, message: "只支持HTTP和HTTPS协议" };
    }

    // 禁止访问内网IP
    const hostname = urlObj.hostname;
    const privateIpPatterns = [
      /^127\./,
      /^10\./,
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
      /^192\.168\./,
      /^169\.254\./,
      /^::1$/,
      /^fc00:/,
      /^fe80:/,
    ];

    for (const pattern of privateIpPatterns) {
      if (pattern.test(hostname)) {
        return { valid: false, message: "不允许访问内网地址" };
      }
    }

    return { valid: true, message: "" };
  } catch (error) {
    return { valid: false, message: "URL格式不正确" };
  }
}

// 通用输入清理
export function sanitizeInput(
  input: string,
  options: {
    maxLength?: number;
    allowHtml?: boolean;
    trimWhitespace?: boolean;
  } = {}
): string {
  const {
    maxLength = 1000,
    allowHtml = false,
    trimWhitespace = true,
  } = options;

  let sanitized = input;

  // 去除首尾空白
  if (trimWhitespace) {
    sanitized = sanitized.trim();
  }

  // 长度限制
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  // HTML处理
  if (!allowHtml) {
    sanitized = escapeHtml(sanitized);
  }

  return sanitized;
}

// 表单数据验证
export function validateFormData(
  data: Record<string, any>,
  rules: Record<string, any>
): {
  valid: boolean;
  errors: Record<string, string>;
  sanitized: Record<string, any>;
} {
  const errors: Record<string, string> = {};
  const sanitized: Record<string, any> = {};

  for (const [field, value] of Object.entries(data)) {
    const rule = rules[field];
    if (!rule) {
      sanitized[field] = value;
      continue;
    }

    // 必填检查
    if (rule.required && (!value || value.toString().trim() === "")) {
      errors[field] = `${rule.label || field}不能为空`;
      continue;
    }

    // 如果不是必填且为空，跳过后续验证
    if (!rule.required && (!value || value.toString().trim() === "")) {
      sanitized[field] = value;
      continue;
    }

    // 类型验证
    switch (rule.type) {
      case "email":
        const emailResult = validateEmail(value);
        if (!emailResult.valid) {
          errors[field] = emailResult.message;
        } else {
          sanitized[field] = value.toLowerCase();
        }
        break;

      case "phone":
        const phoneResult = validatePhone(value);
        if (!phoneResult.valid) {
          errors[field] = phoneResult.message;
        } else {
          sanitized[field] = value;
        }
        break;

      case "username":
        const usernameResult = validateUsername(value);
        if (!usernameResult.valid) {
          errors[field] = usernameResult.message;
        } else {
          sanitized[field] = value;
        }
        break;

      case "password":
        if (rule.checkStrength) {
          const passwordResult = validatePasswordStrength(value);
          if (!passwordResult.valid) {
            errors[field] = `密码强度不足: ${passwordResult.suggestions.join(
              ", "
            )}`;
          } else {
            sanitized[field] = value;
          }
        } else {
          sanitized[field] = value;
        }
        break;

      case "url":
        const urlResult = validateUrl(value);
        if (!urlResult.valid) {
          errors[field] = urlResult.message;
        } else {
          sanitized[field] = value;
        }
        break;

      default:
        // 通用清理
        sanitized[field] = sanitizeInput(value.toString(), {
          maxLength: rule.maxLength,
          allowHtml: rule.allowHtml,
          trimWhitespace: rule.trimWhitespace,
        });
    }

    // SQL注入检查
    if (rule.checkSql && typeof value === "string") {
      const sqlResult = detectSqlInjection(value);
      if (!sqlResult.safe) {
        errors[field] = sqlResult.message;
      }
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    sanitized,
  };
}
