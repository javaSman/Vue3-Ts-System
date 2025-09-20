<template>
  <div class="data-management-container">
    <!-- 顶部标题和操作区 -->
    <div class="header">
      <h1>数据后台管理系统</h1>
      <div class="header-actions">
        <button class="btn btn-primary" @click="refreshData">
          <span class="icon">🔄</span> 刷新数据
        </button>
        <button class="btn btn-success" @click="exportData">
          <span class="icon">📤</span> 导出数据
        </button>
      </div>
    </div>

    <!-- 查询条件区域 -->
    <div class="query-section">
      <div class="query-header">
        <h2>数据查询</h2>
        <div class="query-tools">
          <button class="btn btn-sm" @click="resetQuery">
            <span class="icon">↺</span> 重置
          </button>
          <button class="btn btn-sm" @click="toggleQuerySection">
            {{ showQuerySection ? '收起' : '展开' }}
          </button>
        </div>
      </div>

      <div v-if="showQuerySection" class="query-form">
        <div class="form-row">
          <div class="form-group">
            <label>字段名称</label>
            <input type="text" v-model="queryParams.fieldName" placeholder="输入字段名称" />
          </div>
          <div class="form-group">
            <label>字段类型</label>
            <select v-model="queryParams.fieldType">
              <option value="">全部</option>
              <option value="string">字符串</option>
              <option value="number">数字</option>
              <option value="boolean">布尔值</option>
              <option value="date">日期</option>
            </select>
          </div>
          <div class="form-group">
            <label>创建时间</label>
            <div class="date-range">
              <input type="date" v-model="queryParams.createTimeStart" placeholder="开始时间" />
              <span class="separator">至</span>
              <input type="date" v-model="queryParams.createTimeEnd" placeholder="结束时间" />
            </div>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>状态</label>
            <select v-model="queryParams.status">
              <option value="">全部</option>
              <option value="active">启用</option>
              <option value="inactive">停用</option>
            </select>
          </div>
          <div class="form-group">
            <label>关键字搜索</label>
            <input type="text" v-model="queryParams.keyword" placeholder="输入关键字搜索" />
          </div>
          <div class="form-group">
            <label>&nbsp;</label>
            <button class="btn btn-primary query-btn" @click="handleQuery">
              <span class="icon">🔍</span> 查询
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 数据表格区域 -->
    <div class="table-section">
      <div class="table-header">
        <div class="table-info">
          共 <span class="highlight">{{ pagination.total }}</span> 条记录，
          当前显示第 {{ pagination.currentPage }} 页
        </div>
        <div class="table-actions">
          <div class="page-size-selector">
            <span>每页显示：</span>
            <select v-model="pagination.pageSize" @change="handlePageSizeChange">
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
          </div>
        </div>
      </div>

      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th v-for="column in tableColumns" :key="column.key">
                <div class="th-content">
                  {{ column.title }}
                  <span v-if="column.sortable" class="sort-icon" @click="handleSort(column.key)">
                    {{ getSortIcon(column.key) }}
                  </span>
                </div>
              </th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <template v-if="!loading">
              <tr v-for="item in tableData" :key="item.id">
                <td v-for="column in tableColumns" :key="column.key">
                  {{ item[column.key] }}
                </td>
                <td class="actions">
                  <button class="btn-icon" title="查看" @click="viewItem(item)">
                    👁️
                  </button>
                  <button class="btn-icon" title="编辑" @click="editItem(item)">
                    ✏️
                  </button>
                  <button class="btn-icon" title="删除" @click="deleteItem(item)">
                    🗑️
                  </button>
                </td>
              </tr>
              <tr v-if="!loading && tableData.length === 0">
                <td :colspan="tableColumns.length + 1" class="empty-td">
                  <div class="empty-state">
                    <div class="empty-icon">📊</div>
                    <p>暂无数据</p>
                    <button class="btn btn-primary" @click="resetQuery">重置查询条件</button>
                  </div>
                </td>
              </tr>
            </template>
          </tbody>
        </table>

        <div v-if="loading" class="loading-overlay">
          <div class="loading-indicator">
            <div class="spinner"></div>
            数据加载中...
          </div>
        </div>
      </div>

      <!-- 分页控件 -->
      <div v-if="tableData.length > 0" class="pagination">
        <button class="pagination-btn" :disabled="pagination.currentPage === 1"
          @click="goToPage(pagination.currentPage - 1)">
          上一页
        </button>

        <span v-for="page in pagination.pages" :key="page" class="page-number"
          :class="{ active: page === pagination.currentPage }" @click="goToPage(page)">
          {{ page }}
        </span>

        <button class="pagination-btn" :disabled="pagination.currentPage === pagination.totalPages"
          @click="goToPage(pagination.currentPage + 1)">
          下一页
        </button>

        <div class="page-jump">
          <span>跳至</span>
          <input type="number" v-model="pageJumpInput" min="1" :max="pagination.totalPages" />
          <span>页</span>
          <button class="btn btn-sm" @click="jumpToPage">确定</button>
        </div>
      </div>
    </div>

    <!-- 查看弹窗 -->
    <div v-if="showViewModal" class="modal-overlay">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h2>查看数据详情</h2>
          <button class="modal-close" @click="closeViewModal">×</button>
        </div>
        <div class="modal-body">
          <div class="detail-row" v-for="column in tableColumns" :key="column.key">
            <label>{{ column.title }}：</label>
            <span>{{ selectedItem[column.key as keyof TableItem] }}</span>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-primary" @click="closeViewModal">关闭</button>
        </div>
      </div>
    </div>

    <!-- 编辑弹窗 -->
    <div v-if="showEditModal" class="modal-overlay">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h2>编辑数据</h2>
          <button class="modal-close" @click="closeEditModal">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>字段名称</label>
            <input type="text" v-model="editForm.name" />
          </div>
          <div class="form-group">
            <label>字段类型</label>
            <select v-model="editForm.type">
              <option value="string">字符串</option>
              <option value="number">数字</option>
              <option value="boolean">布尔值</option>
              <option value="date">日期</option>
            </select>
          </div>
          <div class="form-group">
            <label>描述</label>
            <textarea v-model="editForm.description" rows="3"></textarea>
          </div>
          <div class="form-group">
            <label>状态</label>
            <select v-model="editForm.status">
              <option value="active">启用</option>
              <option value="inactive">停用</option>
            </select>
          </div>
          <div class="form-group">
            <label>字段值</label>
            <input type="text" v-model="editForm.value" />
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn" @click="closeEditModal">取消</button>
          <button class="btn btn-primary" @click="saveEdit">保存</button>
        </div>
      </div>
    </div>

    <!-- 删除确认弹窗 -->
    <div v-if="showDeleteModal" class="modal-overlay">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h2>确认删除</h2>
          <button class="modal-close" @click="closeDeleteModal">×</button>
        </div>
        <div class="modal-body">
          <p>确定要删除"{{ deleteItemToConfirm?.name }}"吗？</p>
        </div>
        <div class="modal-footer">
          <button class="btn" @click="closeDeleteModal">取消</button>
          <button class="btn btn-danger" @click="confirmDelete">确定删除</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { fetchDataCenter } from '@/api/dataCenter'
import { Document, Paragraph, TextRun, Table, TableRow, TableCell, Packer, HeadingLevel } from 'docx'
import { saveAs } from 'file-saver'
import { request } from 'http'

// 类型定义
interface QueryParams {
  fieldName: string
  fieldType: string
  createTimeStart: string
  createTimeEnd: string
  status: string
  keyword: string
}

// 定义 TableItem 类型
interface TableItem {
  id: number
  name: string
  type: string
  description: string
  createTime: string
  status: string
  value: string
}

// 确保 TableColumn 的 key 只能是 TableItem 的键
interface TableColumn {
  key: keyof TableItem
  title: string
  sortable?: boolean
}

interface Pagination {
  currentPage: number
  pageSize: number
  total: number
  totalPages: number
  pages: number[]
}

interface EditForm {
  id: number
  name: string
  type: string
  description: string
  status: string
  value: string
}

// 响应式数据
const showQuerySection = ref(true)
const loading = ref(false)
const tableData = ref<TableItem[]>([])
const sortField = ref<keyof TableItem>('id')
const sortDirection = ref<'asc' | 'desc'>('asc')
const pageJumpInput = ref<number | null>(null)
const showViewModal = ref(false)
const showEditModal = ref(false)
const showDeleteModal = ref(false)
const selectedItem = ref<TableItem>({} as TableItem)
const deleteItemToConfirm = ref<TableItem | null>(null)

// 查询参数
const queryParams = reactive<QueryParams>({
  fieldName: '',
  fieldType: '',
  createTimeStart: '',
  createTimeEnd: '',
  status: '',
  keyword: ''
})

// 编辑表单
const editForm = reactive<EditForm>({
  id: 0,
  name: '',
  type: 'string',
  description: '',
  status: 'active',
  value: ''
})

// 分页信息
const pagination = reactive<Pagination>({
  currentPage: 1,
  pageSize: 10,
  total: 0,
  totalPages: 0,
  pages: []
})

// 表格列定义 - 确保所有 key 都是 TableItem 的有效属性
const tableColumns: TableColumn[] = [
  { key: 'id', title: 'ID', sortable: true },
  { key: 'name', title: '字段名称', sortable: true },
  { key: 'type', title: '字段类型' },
  { key: 'description', title: '描述' },
  { key: 'createTime', title: '创建时间', sortable: true },
  { key: 'status', title: '状态' },
  { key: 'value', title: '字段值' }
]

// 方法
const toggleQuerySection = () => {
  showQuerySection.value = !showQuerySection.value
  sessionStorage.setItem('showQuerySection', JSON.stringify(showQuerySection.value))
}

const resetQuery = () => {
  Object.assign(queryParams, {
    fieldName: '',
    fieldType: '',
    createTimeStart: '',
    createTimeEnd: '',
    status: '',
    keyword: ''
  })
  // 重置排序
  sortField.value = 'id'
  sortDirection.value = 'asc'
  handleQuery()
}

const handleQuery = () => {
  pagination.currentPage = 1
  fetchData()
}

const handleSort = (field: keyof TableItem) => {
  if (sortField.value === field) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortField.value = field
    sortDirection.value = 'asc'
  }
  // 排序后重新获取数据
  pagination.currentPage = 1
  fetchData()
}

const getSortIcon = (field: keyof TableItem) => {
  if (sortField.value !== field) return '↕️'
  return sortDirection.value === 'asc' ? '↑' : '↓'
}

const refreshData = () => {
  fetchData()
}

const exportData = async () => {
  try {
    loading.value = true

    // 获取所有数据（不分页）
    const requestParams: any = {}
    Object.keys(queryParams).forEach(key => {
      const value = queryParams[key as keyof QueryParams]
      if (value !== '' && value !== null && value !== undefined) {
        requestParams[key] = value
      }
    })

    // 添加排序参数到导出请求
    requestParams.sortField = sortField.value
    requestParams.sortOrder = sortDirection.value

    const result = await fetchDataCenter({ ...requestParams, pageSize: pagination.total })

    if (!result.success) throw new Error(result.message || '获取导出数据失败')

    const allData = result.data

    // 创建Word文档
    const doc = new Document({
      sections: [
        {
          children: [
            new Paragraph({
              text: "数据后台管理系统导出数据",
              heading: HeadingLevel.HEADING_1,
              spacing: { after: 200 }
            }),
            new Paragraph({
              text: `导出时间: ${new Date().toLocaleString()}`,
              spacing: { after: 400 }
            }),
            createDataTable(allData),
            new Paragraph({
              text: `共导出 ${allData.length} 条记录`,
              spacing: { before: 400 }
            })
          ]
        }
      ]
    })

    // 生成Word文档并下载
    Packer.toBlob(doc).then(blob => {
      saveAs(blob, `数据导出_${new Date().toISOString().slice(0, 10)}.docx`)
    })

  } catch (error) {
    console.error('导出数据失败:', error)
    alert('导出数据失败，请稍后再试')
  } finally {
    loading.value = false
  }
}

const createDataTable = (data: TableItem[]) => {
  // 表头行
  const headerCells = tableColumns.map(column =>
    new TableCell({
      children: [
        new Paragraph({
          children: [
            new TextRun({
              text: column.title,
              bold: true
            })
          ]
        })
      ]
    })
  )

  // 添加操作列标题
  headerCells.push(
    new TableCell({
      children: [
        new Paragraph({
          children: [
            new TextRun({
              text: '操作',
              bold: true
            })
          ]
        })
      ]
    })
  )

  const headerRow = new TableRow({
    children: headerCells
  })

  // 数据行
  const dataRows = data.map(item => {
    const cells = tableColumns.map(column =>
      new TableCell({
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: String(item[column.key])
              })
            ]
          })
        ]
      })
    )

    // 添加操作列
    cells.push(
      new TableCell({
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: '查看/编辑/删除'
              })
            ]
          })
        ]
      })
    )

    return new TableRow({
      children: cells
    })
  })

  return new Table({
    rows: [headerRow, ...dataRows],
    width: {
      size: 100,
      type: 'pct'
    }
  })
}

const fetchData = async () => {
  loading.value = true;
  try {
    // 构建请求参数对象
    const requestParams: any = {
      page: pagination.currentPage,
      pageSize: Number(pagination.pageSize),
      sortField: sortField.value,
      sortOrder: sortDirection.value,
      value: 50
    };

    // 只添加有值的查询参数
    Object.keys(queryParams).forEach((key) => {
      const value = queryParams[key as keyof QueryParams];
      if (value !== '' && value !== null && value !== undefined) {
        requestParams[key] = value;
      }
    });

    // ✅ 构造 updateData 对象（如果用户在编辑表单中输入了内容，并且有 id）
    const updateDataObj: any = {};

    if (editForm.id) {
      updateDataObj.id = editForm.id; // ✅ 必须有 id，用于定位要更新的记录
      updateDataObj.name = editForm.name || undefined;         // ✅ 要更新的字段（根据你的实际表单字段调整）
      updateDataObj.status = editForm.status || undefined;
      updateDataObj.description = editForm.description || undefined;
      updateDataObj.type = editForm.type || undefined;
      updateDataObj.value = editForm.value || undefined;
    }

    // ✅ 如果有要更新的数据对象，则加入请求参数
    if (updateDataObj) {
      requestParams.updateData = updateDataObj;
    }
    // ✅ 调用封装好的 API 请求函数，传入完整参数（包括可能的 updateData）
    const result = await fetchDataCenter(requestParams);

    if (!result.success) {
      throw new Error(result.message || '获取数据失败');
    }

    // ✅ 更新前端表格数据以及分页信息
    tableData.value = result.data;
    pagination.total = result.total || 0;
    pagination.totalPages = Math.ceil(pagination.total / pagination.pageSize);

    // 生成页码数组（UI 分页控件用）
    const maxVisiblePages = 10;
    let startPage = Math.max(1, pagination.currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(pagination.totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    pagination.pages = Array.from(
      { length: endPage - startPage + 1 },
      (_, i) => startPage + i
    );

  } catch (error) {
    console.error('获取数据失败:', error);
    // 可以在这里加一个用户提示，比如使用 ElMessage 或 Toast
  } finally {
    loading.value = false;
  }
};

const handlePageSizeChange = () => {
  pagination.currentPage = 1
  fetchData()
}

const goToPage = (page: number) => {
  if (page < 1 || page > pagination.totalPages) return
  pagination.currentPage = page
  fetchData()
}

const jumpToPage = () => {
  if (!pageJumpInput.value) return
  goToPage(pageJumpInput.value)
  pageJumpInput.value = null
}

const viewItem = (item: TableItem) => {
  selectedItem.value = { ...item }
  showViewModal.value = true
}

const editItem = (item: TableItem) => {
  Object.assign(editForm, {
    id: item.id,
    name: item.name,
    type: item.type,
    description: item.description,
    status: item.status,
    value: item.value
  })
  showEditModal.value = true
}

const deleteItem = (item: TableItem) => {
  deleteItemToConfirm.value = item
  showDeleteModal.value = true
}

const confirmDelete = () => {
  if (deleteItemToConfirm.value) {
    // 这里应该是实际的删除API调用
    console.log(`已删除: ${deleteItemToConfirm.value.name}`)
    showDeleteModal.value = false
    deleteItemToConfirm.value = null
    fetchData() // 刷新数据
  }
}

const closeDeleteModal = () => {
  showDeleteModal.value = false
  deleteItemToConfirm.value = null
}

const closeViewModal = () => {
  showViewModal.value = false
}

const closeEditModal = () => {
  showEditModal.value = false
}

const saveEdit = () => {
  // alert(`保存成功: ${editForm.name}`)
  fetchData() // 刷新数据
  showEditModal.value = false
  editForm.id = 0
}

onMounted(() => {
  fetchData()
  showQuerySection.value = JSON.parse(sessionStorage.getItem('showQuerySection') || 'true')
})
</script>
<style scoped>
.data-management-container {
  padding: 20px;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  color: #333;
  background-color: #f5f7fa;
  min-height: 100vh;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 15px 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.header h1 {
  margin: 0;
  color: #2c3e50;
  font-weight: 600;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.query-section {
  background: white;
  border-radius: 8px;
  margin-bottom: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.query-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid #eee;
}

.query-header h2 {
  margin: 0;
  font-size: 18px;
  color: #2c3e50;
}

.query-tools {
  display: flex;
  gap: 10px;
}

.query-form {
  padding: 20px;
}

.form-row {
  display: flex;
  gap: 20px;
  margin-bottom: 15px;
}

.form-group {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.form-group label {
  margin-bottom: 8px;
  font-weight: 500;
  color: #555;
}

.form-group input,
.form-group select,
.form-group textarea {
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.date-range {
  display: flex;
  align-items: center;
  gap: 10px;
}

.date-range .separator {
  color: #888;
}

.query-btn {
  align-self: flex-end;
  padding: 10px 20px;
}

.table-section {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.table-info {
  color: #666;
}

.highlight {
  color: #409eff;
  font-weight: 600;
}

.table-actions {
  display: flex;
  align-items: center;
  gap: 15px;
}

.page-size-selector {
  display: flex;
  align-items: center;
  gap: 8px;
}

.page-size-selector select {
  padding: 5px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.table-container {
  position: relative;
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th,
.data-table td {
  padding: 12px 15px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.data-table th {
  background-color: #f8f9fa;
  font-weight: 600;
  color: #495057;
}

.data-table tbody tr:hover {
  background-color: #f1f7ff;
}

.th-content {
  display: flex;
  align-items: center;
  gap: 5px;
}

.sort-icon {
  cursor: pointer;
  user-select: none;
}

.actions {
  display: flex;
  gap: 8px;
}

.empty-td {
  height: 300px;
  vertical-align: middle;
  text-align: center;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: #999;
}

.empty-icon {
  font-size: 40px;
  margin-bottom: 15px;
}

.empty-state p {
  margin: 0 0 15px;
  font-size: 16px;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
}

.btn:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

.btn:active {
  transform: translateY(0);
}

.btn-sm {
  padding: 5px 10px;
  font-size: 12px;
}

.btn-primary {
  background-color: #409eff;
  color: white;
}

.btn-success {
  background-color: #67c23a;
  color: white;
}

.btn-danger {
  background-color: #f56c6c;
  color: white;
}

.btn-icon {
  padding: 5px;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 16px;
  border-radius: 4px;
}

.btn-icon:hover {
  background-color: #f5f7fa;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: rgba(255, 255, 255, 0.8);
  z-index: 10;
}

.loading-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  color: #666;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #409eff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 15px;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #eee;
}

.pagination-btn {
  padding: 8px 12px;
  border: 1px solid #ddd;
  background: white;
  border-radius: 4px;
  cursor: pointer;
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-number {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  user-select: none;
}

.page-number.active {
  background-color: #409eff;
  color: white;
  border-color: #409eff;
}

.page-jump {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: 15px;
}

.page-jump input {
  width: 60px;
  padding: 5px;
  border: 1px solid #ddd;
  border-radius: 4px;
  text-align: center;
}

/* 模态框样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal {
  background: white;
  border-radius: 8px;
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #eee;
}

.modal-header h2 {
  margin: 0;
  color: #2c3e50;
}

.modal-close {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #999;
}

.modal-close:hover {
  color: #333;
}

.modal-body {
  padding: 20px;
}

.modal-body p {
  margin: 0;
  font-size: 16px;
  color: #555;
}

.modal-footer {
  padding: 15px 20px;
  border-top: 1px solid #eee;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.detail-row {
  display: flex;
  margin-bottom: 15px;
}

.detail-row label {
  font-weight: 600;
  min-width: 100px;
  color: #555;
}

@media (max-width: 768px) {
  .header {
    flex-direction: column;
    gap: 15px;
    align-items: flex-start;
  }

  .form-row {
    flex-direction: column;
    gap: 15px;
  }

  .table-header {
    flex-direction: column;
    gap: 15px;
    align-items: flex-start;
  }

  .pagination {
    flex-wrap: wrap;
  }

  .modal {
    width: 95%;
    margin: 10px;
  }

  .detail-row {
    flex-direction: column;
    margin-bottom: 20px;
  }

  .detail-row label {
    margin-bottom: 5px;
  }
}
</style>