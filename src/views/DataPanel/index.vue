<template>
  <div class="dashboard-container">
    <!-- 标题区域 -->
    <div class="header">
      <h1>设备数据采集监控面板</h1>
      <div class="header-controls">
        <span class="update-status">最后更新: {{ lastUpdateTime }}</span>
        <button
          @click="toggleAutoUpdate"
          :class="['refresh-btn', autoUpdate ? 'active' : '']"
        >
          {{ autoUpdate ? "暂停更新" : "开启自动更新" }}
        </button>
      </div>
    </div>

    <!-- 概览数据区域 -->
    <div class="overview-stats">
      <div class="stat-card online">
        <div class="icon">
          <svg viewBox="0 0 24 24">
            <path
              d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z"
            />
          </svg>
        </div>
        <div class="content">
          <h3>在线设备</h3>
          <div class="value">
            {{ overviewData.onlineDevices }}/{{ overviewData.totalDevices }}
          </div>
          <div class="percentage">
            {{
              Math.round(
                (overviewData.onlineDevices / overviewData.totalDevices) * 100
              )
            }}%
          </div>
        </div>
      </div>

      <div class="stat-card data">
        <div class="icon">
          <svg viewBox="0 0 24 24">
            <path d="M3,22V8H7V22H3M10,22V2H14V22H10M17,22V14H21V22H17Z" />
          </svg>
        </div>
        <div class="content">
          <h3>今日数据量</h3>
          <div class="value">
            {{ formatNumber(overviewData.todayDataPoints) }}
          </div>
          <div class="trend positive">+12%</div>
        </div>
      </div>

      <div class="stat-card alert">
        <div class="icon">
          <svg viewBox="0 0 24 24">
            <path d="M13,14H11V10H13M13,18H11V16H13M1,21H23L12,2L1,21Z" />
          </svg>
        </div>
        <div class="content">
          <h3>异常设备</h3>
          <div class="value">{{ overviewData.warningDevices }}</div>
          <div class="trend negative">+2</div>
        </div>
      </div>

      <div class="stat-card efficiency">
        <div class="icon">
          <svg viewBox="0 0 24 24">
            <path
              d="M12,1L21,5V11C21,16.55 17.16,21.74 12,23C6.84,21.74 3,16.55 3,11V5L12,1M12,7C10.9,7 10,7.9 10,9C10,10.1 10.9,11 12,11C13.1,11 14,10.1 14,9C14,7.9 13.1,7 12,7M12,13C9.24,13 7,15.24 7,18H17C17,15.24 14.76,13 12,13Z"
            />
          </svg>
        </div>
        <div class="content">
          <h3>平均运行率</h3>
          <div class="value">{{ overviewData.avgEfficiency }}%</div>
          <div class="trend positive">+3%</div>
        </div>
      </div>
    </div>

    <!-- 设备数据表格 -->
    <div class="data-section">
      <h2>设备实时数据</h2>
      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>设备ID</th>
              <th>设备名称</th>
              <th>状态</th>
              <th>温度(°C)</th>
              <th>湿度(%)</th>
              <th>电压(V)</th>
              <th>运行时间(h)</th>
              <th>最后上报</th>
              <th>IP</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="device in deviceData"
              :key="device.id"
              :class="{ 'warning-row': device.status === 'warning' }"
            >
              <td>{{ device.id }}</td>
              <td>{{ device.name }}</td>
              <td>
                <span class="status-badge" :class="device.status">{{
                  getStatusText(device.status)
                }}</span>
              </td>
              <td :class="getValueClass(device.temperature, 70, 85)">
                {{ device.temperature }}
              </td>
              <td :class="getValueClass(device.humidity, 80, 90)">
                {{ device.humidity }}
              </td>
              <td :class="getValueClass(device.voltage, 210, 250, true)">
                {{ device.voltage }}
              </td>
              <td>{{ device.uptime }}</td>
              <td>{{ device.lastReport }}</td>
              <td>{{ device.ip }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 图表区域 -->
    <div class="charts-section">
      <div class="chart-card">
        <h3>设备温度监控</h3>
        <div ref="temperatureChart" class="chart"></div>
      </div>
      <div class="chart-card">
        <h3>设备状态分布</h3>
        <div ref="statusChart" class="chart"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from "vue";
import * as echarts from "echarts";
import { fetchDashboardData } from "@/api/dashboard";

// ======================
// 📦 类型定义
// ======================
interface DeviceData {
  id: string;
  name: string;
  status: "normal" | "warning" | "offline";
  temperature: number;
  humidity: number;
  voltage: number;
  uptime: number;
  lastReport: string;
  ip: string;
}

interface OverviewData {
  totalDevices: number;
  onlineDevices: number;
  warningDevices: number;
  todayDataPoints: number;
  avgEfficiency: number;
}

// ======================
// 📊 响应式数据
// ======================
const lastUpdateTime = ref<string>("");
const autoUpdate = ref<boolean>(true);
const deviceData = ref<DeviceData[]>([]);
const overviewData = ref<OverviewData>({
  totalDevices: 0,
  onlineDevices: 0,
  warningDevices: 0,
  todayDataPoints: 0,
  avgEfficiency: 0,
});

// ======================
// 📈 图表引用与实例
// ======================
const temperatureChart = ref<HTMLElement | null>(null);
const statusChart = ref<HTMLElement | null>(null);
let temperatureChartInstance: echarts.ECharts | null = null;
let statusChartInstance: echarts.ECharts | null = null;

// ======================
// 🔄 异步获取设备数据
// ======================
const generateDeviceData = async () => {
  try {
    const result = await fetchDashboardData({ num: 20 }); // 你可以改 num
    if (result.success) {
      deviceData.value = result.data || [];
    } else {
      console.error("获取设备数据失败:", result.message);
      deviceData.value = [];
    }
  } catch (error) {
    console.error("调用设备接口异常:", error);
    deviceData.value = [];
  }
};

// ======================
// 📈 更新统计概览
// ======================
const updateOverviewData = (devices: DeviceData[]) => {
  const online = devices.filter((d) => d.status !== "offline").length;
  const warning = devices.filter((d) => d.status === "warning").length;

  overviewData.value = {
    totalDevices: devices.length,
    onlineDevices: online,
    warningDevices: warning,
    todayDataPoints: Math.round(15000 + Math.random() * 5000),
    avgEfficiency: Math.round(85 + Math.random() * 10),
  };
};

// ======================
// 📊 更新图表
// ======================
const updateCharts = () => {
  if (!deviceData.value || deviceData.value.length === 0) {
    console.warn("设备数据为空，无法更新图表");
    return;
  }

  // 柱状图 - 温度
  if (temperatureChartInstance && temperatureChart.value) {
    const option = {
      tooltip: { trigger: "axis" },
      grid: { left: "3%", right: "4%", bottom: "3%", containLabel: true },
      xAxis: {
        type: "category",
        data: deviceData.value.map((d) => d.name),
        axisLabel: { rotate: 45 },
      },
      yAxis: { type: "value", name: "温度(°C)" },
      series: [
        {
          data: deviceData.value.map((d) => d.temperature),
          type: "bar",
          itemStyle: {
            color: (params: any) => {
              if (params.value > 85) return "#ff4d4f";
              if (params.value > 70) return "#faad14";
              return "#52c41a";
            },
          },
        },
      ],
    };
    temperatureChartInstance.setOption(option);
  }

  // 饼图 - 状态
  if (statusChartInstance && statusChart.value) {
    const statusCount = {
      normal: deviceData.value.filter((d) => d.status === "normal").length,
      warning: deviceData.value.filter((d) => d.status === "warning").length,
      offline: deviceData.value.filter((d) => d.status === "offline").length,
    };

    const option = {
      tooltip: { trigger: "item" },
      legend: { orient: "vertical", right: 10, top: "center" },
      series: [
        {
          name: "设备状态",
          type: "pie",
          radius: ["40%", "70%"],
          data: [
            {
              value: statusCount.normal,
              name: "正常",
              itemStyle: { color: "#52c41a" },
            },
            {
              value: statusCount.warning,
              name: "警告",
              itemStyle: { color: "#faad14" },
            },
            {
              value: statusCount.offline,
              name: "离线",
              itemStyle: { color: "#d9d9d9" },
            },
          ],
        },
      ],
    };
    statusChartInstance.setOption(option);
  }
};

// ======================
// 🛠️ 初始化图表
// ======================
const initCharts = () => {
  if (temperatureChart.value)
    temperatureChartInstance = echarts.init(temperatureChart.value);
  if (statusChart.value) statusChartInstance = echarts.init(statusChart.value);
  updateCharts();
};

// ======================
// 🧩 综合更新函数
// ======================
const updateData = async () => {
  try {
    await generateDeviceData();
    updateOverviewData(deviceData.value);
    lastUpdateTime.value = new Date().toLocaleTimeString();
    updateCharts();
  } catch (error) {
    console.error("更新数据失败:", error);
  }
};

// ======================
// ⏱️ 自动更新切换
// ======================
const toggleAutoUpdate = () => {
  autoUpdate.value = !autoUpdate.value;
};

// ======================
// 🧮 工具函数
// ======================
const formatNumber = (num: number): string => {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

const getStatusText = (status: string): string => {
  const map: Record<string, string> = {
    normal: "正常",
    warning: "警告",
    offline: "离线",
  };
  return map[status] || status;
};

const getValueClass = (
  value: number,
  warnThresh: number,
  dangerThresh: number,
  reverse = false
): string => {
  if (reverse) {
    if (value < warnThresh) return "value-danger";
    if (value < dangerThresh) return "value-warning";
    return "value-normal";
  } else {
    if (value > dangerThresh) return "value-danger";
    if (value > warnThresh) return "value-warning";
    return "value-normal";
  }
};

// ======================
// ⚙️ 生命周期 - 顶层同步注册
// ======================
let interval: NodeJS.Timeout | null = null; // ✅ 声明在顶层

onMounted(async () => {
  await updateData();
  await nextTick();
  initCharts();

  window.addEventListener("resize", () => {
    temperatureChartInstance?.resize();
    statusChartInstance?.resize();
  });

  // ✅ 每 5 秒自动更新（如果 autoUpdate 为 true）
  interval = setInterval(() => {
    if (autoUpdate.value) {
      updateData();
    }
  }, 5000);
});

onUnmounted(() => {
  if (interval) clearInterval(interval);
  temperatureChartInstance?.dispose();
  statusChartInstance?.dispose();
  window.removeEventListener("resize", () => {});
});
</script>

<style scoped>
.dashboard-container {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: 100vh;
  font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  background: white;
  padding: 16px 24px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.09);
}

.header h1 {
  margin: 0;
  color: #1f2f3d;
  font-weight: 600;
}

.header-controls {
  display: flex;
  align-items: center;
  gap: 16px;
}

.update-status {
  color: #606266;
  font-size: 14px;
}

.refresh-btn {
  padding: 8px 16px;
  background: #1890ff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
}

.refresh-btn:hover {
  background: #40a9ff;
}

.refresh-btn.active {
  background: #52c41a;
}

.refresh-btn.active:hover {
  background: #73d13d;
}

.overview-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  display: flex;
  align-items: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.09);
  transition: transform 0.3s;
}

.stat-card:hover {
  transform: translateY(-5px);
}

.stat-card .icon {
  width: 60px;
  height: 60px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
}

.stat-card.online .icon {
  background: #e6f7ff;
}

.stat-card.online svg {
  fill: #1890ff;
}

.stat-card.data .icon {
  background: #f6ffed;
}

.stat-card.data svg {
  fill: #52c41a;
}

.stat-card.alert .icon {
  background: #fff2e8;
}

.stat-card.alert svg {
  fill: #fa8c16;
}

.stat-card.efficiency .icon {
  background: #f9f0ff;
}

.stat-card.efficiency svg {
  fill: #722ed1;
}

.stat-card .content h3 {
  margin: 0 0 8px 0;
  color: #606266;
  font-size: 14px;
  font-weight: normal;
}

.stat-card .content .value {
  font-size: 24px;
  font-weight: bold;
  color: #1f2f3d;
  margin-bottom: 4px;
}

.stat-card .content .percentage,
.stat-card .content .trend {
  font-size: 14px;
}

.stat-card .content .percentage {
  color: #1890ff;
}

.trend.positive {
  color: #52c41a;
}

.trend.negative {
  color: #ff4d4f;
}

.data-section {
  background: white;
  border-radius: 8px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.09);
}

.data-section h2 {
  margin-top: 0;
  color: #1f2f3d;
  font-weight: 600;
  padding-bottom: 16px;
  border-bottom: 1px solid #e8e8e8;
}

.table-container {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th {
  background-color: #fafafa;
  padding: 12px 16px;
  text-align: left;
  font-weight: 600;
  color: #1f2f3d;
  border-bottom: 1px solid #e8e8e8;
}

.data-table td {
  padding: 12px 16px;
  border-bottom: 1px solid #e8e8e8;
}

.data-table tr:hover {
  background-color: #fafafa;
}

.warning-row {
  background-color: #fff2e8;
}

.warning-row:hover {
  background-color: #ffe7d6;
}

.status-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.status-badge.normal {
  background: #f6ffed;
  color: #52c41a;
  border: 1px solid #b7eb8f;
}

.status-badge.warning {
  background: #fff2e8;
  color: #fa8c16;
  border: 1px solid #ffd591;
}

.status-badge.offline {
  background: #fafafa;
  color: #8c8c8c;
  border: 1px solid #d9d9d9;
}

.value-normal {
  color: #52c41a;
  font-weight: 500;
}

.value-warning {
  color: #fa8c16;
  font-weight: 500;
}

.value-danger {
  color: #ff4d4f;
  font-weight: 500;
}

.charts-section {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.chart-card {
  background: white;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.09);
}

.chart-card h3 {
  margin-top: 0;
  color: #1f2f3d;
  font-weight: 600;
  padding-bottom: 16px;
  border-bottom: 1px solid #e8e8e8;
}

.chart {
  height: 300px;
  width: 100%;
}

@media (max-width: 1200px) {
  .overview-stats {
    grid-template-columns: repeat(2, 1fr);
  }

  .charts-section {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .overview-stats {
    grid-template-columns: 1fr;
  }
}
</style>
