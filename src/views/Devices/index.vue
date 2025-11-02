<template>
  <div class="device-management-container">
    <div class="header">
      <h1>设备管理系统</h1>
      <div class="controls">
        <div class="search-box">
          <input type="text" placeholder="搜索设备..." v-model="searchQuery" />
          <button class="search-btn">搜索</button>
        </div>
        <div class="filter-controls">
          <select v-model="filterStatus">
            <option value="all">所有状态</option>
            <option value="online">在线</option>
            <option value="offline">离线</option>
          </select>
          <button class="refresh-btn" @click="fetchDevices">刷新</button>
        </div>
      </div>
    </div>

    <div class="device-grid">
      <div
        v-for="device in paginatedDevices"
        :key="device.id"
        class="device-card"
        :class="{ online: device.status === 'online' }"
      >
        <div class="card-header">
          <h3>{{ device.name }}</h3>
          <span class="status-badge" :class="device.status">
            {{ device.status === "online" ? "在线" : "离线" }}
          </span>
        </div>

        <div class="card-content">
          <div class="info-row">
            <span class="label">类型:</span>
            <span class="value">{{ device.type }}</span>
          </div>
          <div class="info-row">
            <span class="label">版本:</span>
            <span class="value">{{ device.version }}</span>
          </div>
          <div class="info-row">
            <span class="label">IP:</span>
            <span class="value">{{ device.ip }}</span>
          </div>
          <div class="info-row">
            <span class="label">MAC:</span>
            <span class="value">{{ device.mac }}</span>
          </div>

          <div class="metrics-grid">
            <div class="metric-item">
              <div class="metric-label">CPU</div>
              <div class="metric-value">{{ device.cpu }}%</div>
              <div class="progress-bar">
                <div
                  class="progress-fill"
                  :style="{ width: device.cpu + '%' }"
                ></div>
              </div>
            </div>
            <div class="metric-item">
              <div class="metric-label">内存</div>
              <div class="metric-value">{{ device.memory }}%</div>
              <div class="progress-bar">
                <div
                  class="progress-fill"
                  :style="{ width: device.memory + '%' }"
                ></div>
              </div>
            </div>
            <div class="metric-item">
              <div class="metric-label">电池</div>
              <div class="metric-value">{{ device.battery }}%</div>
              <div class="progress-bar">
                <div
                  class="progress-fill"
                  :style="{ width: device.battery + '%' }"
                ></div>
              </div>
            </div>
            <div class="metric-item">
              <div class="metric-label">信号</div>
              <div class="metric-value">{{ device.signal }}%</div>
              <div class="progress-bar">
                <div
                  class="progress-fill"
                  :style="{ width: device.signal + '%' }"
                ></div>
              </div>
            </div>
            <div class="metric-item">
              <div class="metric-label">温度</div>
              <div class="metric-value">{{ device.temperature }}℃</div>
            </div>
            <div class="metric-item">
              <div class="metric-label">磁盘</div>
              <div class="metric-value">{{ device.disk }}%</div>
              <div class="progress-bar">
                <div
                  class="progress-fill"
                  :style="{ width: device.disk + '%' }"
                ></div>
              </div>
            </div>
          </div>

          <div class="action-buttons">
            <button class="btn-details" @click="showDetails(device)">
              详情
            </button>
            <button class="btn-restart">重启</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 分页控件 -->
    <div class="pagination-controls">
      <div class="pagination-info">
        显示第 {{ startIndex + 1 }}-{{ endIndex }} 条，共
        {{ filteredDevices.length }} 条
      </div>
      <div class="pagination-buttons">
        <button
          @click="prevPage"
          :disabled="currentPage === 1"
          class="pagination-btn"
        >
          上一页
        </button>
        <span class="page-indicator">第 {{ currentPage }} 页</span>
        <button
          @click="nextPage"
          :disabled="currentPage >= totalPages"
          class="pagination-btn"
        >
          下一页
        </button>
      </div>
      <div class="page-size-selector">
        <span>每页显示：</span>
        <select v-model="pageSize" @change="resetPagination">
          <option value="6">6</option>
          <option value="12">12</option>
          <option value="24">24</option>
          <option value="60">60</option>
        </select>
      </div>
    </div>

    <!-- ✅ 弹窗：设备详情 -->
    <div v-if="selectedDevice" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>设备详情</h2>
          <button class="close-btn" @click="closeModal">×</button>
        </div>
        <div class="modal-body">
          <div
            v-for="(value, key) in displayDeviceData"
            :key="key"
            class="detail-row"
          >
            <label class="detail-label">{{ getLabelText(key) }}:</label>
            <input type="text" :value="value" readonly class="detail-input" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";

interface Device {
  id: string;
  name: string;
  type: string;
  version: string;
  ip: string;
  mac: string;
  status: "online" | "offline";
  cpu: number;
  memory: number;
  disk: number;
  battery: number;
  signal: number;
  temperature: number;
}

// 模拟设备数据
const devices = ref<Device[]>([
  {
    id: "1",
    name: "DEVICE_FG8BSDD6",
    type: "服务器",
    version: "v4.2.1",
    ip: "192.168.1.101",
    mac: "00:1A:2B:3C:4D:5E",
    status: "online",
    cpu: 47,
    memory: 57,
    disk: 57,
    battery: 6,
    signal: 55,
    temperature: 51,
  },
  {
    id: "2",
    name: "DEVICE_8880DF06",
    type: "网络设备",
    version: "v3.1.5",
    ip: "192.168.1.102",
    mac: "00:1B:2C:3D:4E:5F",
    status: "online",
    cpu: 53,
    memory: 52,
    disk: 52,
    battery: 9,
    signal: 34,
    temperature: 57,
  },
  {
    id: "3",
    name: "DEVICE_PERSISTENCE_TEST",
    type: "存储设备",
    version: "v2.0.8",
    ip: "192.168.1.103",
    mac: "00:1C:2D:3E:4F:60",
    status: "online",
    cpu: 67,
    memory: 63,
    disk: 63,
    battery: 46,
    signal: 78,
    temperature: 46,
  },
  {
    id: "4",
    name: "DEVICE_ESF6C18B",
    type: "安全设备",
    version: "v5.3.2",
    ip: "192.168.1.104",
    mac: "00:1D:2E:3F:50:61",
    status: "online",
    cpu: 96,
    memory: 40,
    disk: 40,
    battery: 37,
    signal: 32,
    temperature: 31,
  },
  {
    id: "5",
    name: "DEVICE_49257G87",
    type: "终端设备",
    version: "v1.2.0",
    ip: "192.168.1.105",
    mac: "00:1E:2F:40:51:62",
    status: "offline",
    cpu: 42,
    memory: 68,
    disk: 68,
    battery: 21,
    signal: 27,
    temperature: 24,
  },
  {
    id: "6",
    name: "DEVICE_A1B2C3D4",
    type: "IoT设备",
    version: "v2.5.3",
    ip: "192.168.1.106",
    mac: "00:1F:30:41:52:63",
    status: "online",
    cpu: 62,
    memory: 30,
    disk: 30,
    battery: 29,
    signal: 33,
    temperature: 37,
  },
  {
    id: "7",
    name: "DEVICE_TEST001",
    type: "测试设备",
    version: "v0.9.5",
    ip: "192.168.1.107",
    mac: "00:20:31:42:53:64",
    status: "offline",
    cpu: 15,
    memory: 25,
    disk: 25,
    battery: 80,
    signal: 0,
    temperature: 22,
  },
  {
    id: "8",
    name: "DEVICE_PROD_SVR",
    type: "生产服务器",
    version: "v4.5.0",
    ip: "192.168.1.108",
    mac: "00:21:32:43:54:65",
    status: "online",
    cpu: 78,
    memory: 82,
    disk: 82,
    battery: 5,
    signal: 92,
    temperature: 65,
  },
  {
    id: "9",
    name: "DEVICE_BACKUP_NAS",
    type: "NAS存储",
    version: "v3.7.1",
    ip: "192.168.1.109",
    mac: "00:22:33:44:55:66",
    status: "online",
    cpu: 23,
    memory: 45,
    disk: 45,
    battery: 95,
    signal: 87,
    temperature: 38,
  },
  {
    id: "10",
    name: "DEVICE_SW_CORE",
    type: "核心交换机",
    version: "v6.1.2",
    ip: "192.168.1.110",
    mac: "00:23:34:45:56:67",
    status: "online",
    cpu: 42,
    memory: 38,
    disk: 38,
    battery: 12,
    signal: 95,
    temperature: 48,
  },
  {
    id: "11",
    name: "DEVICE_ROUTER_MAIN",
    type: "主路由器",
    version: "v5.0.3",
    ip: "192.168.1.111",
    mac: "00:24:35:46:57:68",
    status: "online",
    cpu: 56,
    memory: 41,
    disk: 41,
    battery: 8,
    signal: 98,
    temperature: 52,
  },
]);

// 搜索、筛选、分页相关
const searchQuery = ref("");
const filterStatus = ref("all");
const currentPage = ref(1);
const pageSize = ref(6);

// 弹窗相关
const selectedDevice = ref<Device | null>(null);

// 过滤设备
const filteredDevices = computed(() => {
  return devices.value.filter((device) => {
    const matchesSearch =
      device.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      device.type.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      device.ip.includes(searchQuery.value);

    const matchesStatus =
      filterStatus.value === "all" || device.status === filterStatus.value;

    return matchesSearch && matchesStatus;
  });
});

// 分页计算
const totalPages = computed(() =>
  Math.ceil(filteredDevices.value.length / pageSize.value)
);
const startIndex = computed(() => (currentPage.value - 1) * pageSize.value);
const endIndex = computed(() =>
  Math.min(startIndex.value + pageSize.value, filteredDevices.value.length)
);
const paginatedDevices = computed(() => {
  return filteredDevices.value.slice(startIndex.value, endIndex.value);
});

// 分页控制
const nextPage = () => {
  if (currentPage.value < totalPages.value) currentPage.value++;
};
const prevPage = () => {
  if (currentPage.value > 1) currentPage.value--;
};
const resetPagination = () => {
  currentPage.value = 1;
};

// 弹窗：显示设备详情
const showDetails = (device: Device) => {
  selectedDevice.value = device;
};

const closeModal = () => {
  selectedDevice.value = null;
};

// 将设备对象转换为 { label: value } 形式，用于展示
const displayDeviceData = computed(() => {
  if (!selectedDevice.value) return {};
  const d = selectedDevice.value;
  return {
    名称: d.name,
    类型: d.type,
    版本: d.version,
    IP地址: d.ip,
    MAC地址: d.mac,
    状态: d.status === "online" ? "在线" : "离线",
    CPU使用率: `${d.cpu}%`,
    内存使用率: `${d.memory}%`,
    磁盘使用率: `${d.disk}%`,
    电池电量: `${d.battery}%`,
    信号强度: `${d.signal}%`,
    温度: `${d.temperature}°C`,
  };
});

// 输入框的 label 显示中文
const getLabelText = (key: string) => {
  const labels: Record<string, string> = {
    名称: "名称",
    类型: "类型",
    版本: "版本",
    IP地址: "IP 地址",
    MAC地址: "MAC 地址",
    状态: "状态",
    CPU使用率: "CPU 使用率",
    内存使用率: "内存 使用率",
    磁盘使用率: "磁盘 使用率",
    电池电量: "电池 电量",
    信号强度: "信号 强度",
    温度: "温度",
  };
  return labels[key] || key;
};

// 模拟API获取 & 数据自动更新
const fetchDevices = () => {
  // console.log('获取设备数据...')
};

onMounted(() => {
  fetchDevices();
  setInterval(() => {
    devices.value.forEach((device) => {
      if (device.status === "online") {
        device.cpu = Math.floor(Math.random() * 101);
        device.memory = Math.floor(Math.random() * 101);
        device.battery = Math.floor(Math.random() * 101);
        device.signal = Math.floor(Math.random() * 101);
        device.temperature = Math.floor(Math.random() * 101);
      }
    });
  }, 5000);
});
</script>

<style scoped>
.device-management-container {
  min-height: 100vh;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #333;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding: 20px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.header h1 {
  color: #4a5568;
  font-size: 28px;
}

.controls {
  display: flex;
  gap: 15px;
}

.search-box {
  display: flex;
}

.search-box input {
  padding: 10px 15px;
  border: 1px solid #cbd5e0;
  border-radius: 6px 0 0 6px;
  outline: none;
  width: 250px;
}

.search-btn {
  padding: 10px 15px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 0 6px 6px 0;
  cursor: pointer;
}

.filter-controls {
  display: flex;
  gap: 10px;
}

.filter-controls select {
  padding: 10px;
  border: 1px solid #cbd5e0;
  border-radius: 6px;
  outline: none;
}

.refresh-btn {
  padding: 10px 15px;
  background: #48bb78;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.device-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.device-card {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.device-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.device-card.online {
  border-left: 5px solid #48bb78;
}

.device-card:not(.online) {
  border-left: 5px solid #e53e3e;
  opacity: 0.8;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #e2e8f0;
}

.card-header h3 {
  color: #2d3748;
  font-size: 18px;
  margin: 0;
}

.status-badge {
  padding: 5px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: bold;
}

.status-badge.online {
  background: #c6f6d5;
  color: #22543d;
}

.status-badge.offline {
  background: #fed7d7;
  color: #742a2a;
}

.info-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.info-row .label {
  font-weight: 600;
  color: #4a5568;
}

.info-row .value {
  color: #718096;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin: 20px 0;
}

.metric-item {
  background: #f7fafc;
  padding: 12px;
  border-radius: 8px;
}

.metric-label {
  font-size: 12px;
  color: #718096;
  margin-bottom: 5px;
}

.metric-value {
  font-weight: bold;
  color: #2d3748;
  margin-bottom: 8px;
}

.progress-bar {
  height: 6px;
  background: #e2e8f0;
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #667eea, #764ba2);
  border-radius: 3px;
  transition: width 0.5s ease;
}

.action-buttons {
  display: flex;
  justify-content: space-between;
  margin-top: 15px;
}

.btn-details,
.btn-restart {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s ease;
}

.btn-details {
  background: #667eea;
  color: white;
}

.btn-restart {
  background: #ed8936;
  color: white;
}

.btn-details:hover {
  background: #5a67d8;
}

.btn-restart:hover {
  background: #dd7724;
}

.pagination-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.pagination-info {
  color: #4a5568;
  font-size: 14px;
}

.pagination-buttons {
  display: flex;
  align-items: center;
  gap: 15px;
}

.pagination-btn {
  padding: 8px 16px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.2s ease;
}

.pagination-btn:disabled {
  background: #cbd5e0;
  cursor: not-allowed;
}

.pagination-btn:not(:disabled):hover {
  background: #5a67d8;
}

.page-indicator {
  color: #4a5568;
  font-weight: 600;
}

.page-size-selector {
  display: flex;
  align-items: center;
  gap: 10px;
}

.page-size-selector select {
  padding: 8px;
  border: 1px solid #cbd5e0;
  border-radius: 6px;
  outline: none;
}

/* ========== 弹窗样式 ========== */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #e2e8f0;
}

.modal-header h2 {
  margin: 0;
  color: #2d3748;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #718096;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  color: #2d3748;
}

.modal-body {
  padding: 20px;
}

.detail-row {
  display: flex;
  margin-bottom: 15px;
  align-items: center;
}

.detail-label {
  min-width: 120px;
  font-weight: 600;
  color: #4a5568;
}

.detail-input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #cbd5e0;
  border-radius: 6px;
  background: #f7fafc;
  color: #2d3748;
  font-size: 14px;
  cursor: not-allowed;
}
</style>
