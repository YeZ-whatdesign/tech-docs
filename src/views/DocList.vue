<template>
  <div class="doc-list-container">
    <div class="list-header">
      <h2>文档列表</h2>
      <div class="header-actions">
        <el-button type="success" @click="showCreateDirDialog" :icon="FolderAdd">
          新建目录
        </el-button>
        <el-button type="primary" @click="createNewDoc" :icon="Plus">
          新建文档
        </el-button>
        <el-button type="info" @click="handleLogout" :icon="SwitchButton">
          退出登录
        </el-button>
      </div>
    </div>
    
    <div class="search-bar">
      <el-input
        v-model="searchQuery"
        placeholder="搜索文档..."
        :prefix-icon="Search"
        clearable
        @input="filterDocs"
      />
    </div>

    <!-- 目录树视图 -->
    <div v-if="!searchQuery" class="directory-tree">
      <el-tree
        :data="treeData"
        :props="treeProps"
        node-key="path"
        :expand-on-click-node="false"
        :default-expand-all="true"
        @node-click="handleNodeClick"
      >
        <template #default="{ node, data }">
          <div class="tree-node">
            <div class="node-content">
              <el-icon v-if="data.type === 'directory'" class="folder-icon">
                <Folder />
              </el-icon>
              <el-icon v-else class="file-icon">
                <Document />
              </el-icon>
              <span class="node-label">{{ data.title }}</span>
            </div>
            <div class="node-actions" @click.stop>
              <template v-if="data.type === 'file'">
                <el-button 
                  type="primary" 
                  size="small" 
                  :icon="Edit"
                  @click="editDoc(data)"
                  title="编辑"
                />
                <el-button 
                  type="warning" 
                  size="small" 
                  :icon="FolderOpened"
                  @click="moveDoc(data)"
                  title="移动"
                />
                <el-button 
                  type="danger" 
                  size="small" 
                  :icon="Delete"
                  @click="deleteDoc(data)"
                  title="删除"
                />
              </template>
              <template v-else>
                <el-button 
                  type="success" 
                  size="small" 
                  :icon="Plus"
                  @click="createDocInDir(data)"
                  title="在此目录新建文档"
                />
                <el-button 
                  type="warning" 
                  size="small" 
                  :icon="Delete"
                  @click="deleteDir(data)"
                  title="删除目录"
                />
              </template>
            </div>
          </div>
        </template>
      </el-tree>
    </div>

    <!-- 搜索结果视图 -->
    <div v-else class="search-results">
      <div class="docs-grid">
        <el-card 
          v-for="doc in filteredDocs" 
          :key="doc.path"
          class="doc-card"
          shadow="hover"
          @click="openDoc(doc)"
        >
          <template #header>
            <div class="card-header">
              <span class="doc-title">{{ doc.title }}</span>
              <div class="card-actions">
                <el-button 
                  type="primary" 
                  size="small" 
                  :icon="Edit"
                  @click.stop="editDoc(doc)"
                >
                  编辑
                </el-button>
                <el-button 
                  type="warning" 
                  size="small" 
                  :icon="FolderOpened"
                  @click.stop="moveDoc(doc)"
                >
                  移动
                </el-button>
                <el-button 
                  type="danger" 
                  size="small" 
                  :icon="Delete"
                  @click.stop="deleteDoc(doc)"
                >
                  删除
                </el-button>
              </div>
            </div>
          </template>
          <div class="doc-info">
            <p class="doc-path">{{ doc.path }}</p>
            <p class="doc-date">最后修改: {{ formatDate(doc.lastModified) }}</p>
            <p class="doc-size">大小: {{ formatSize(doc.size) }}</p>
          </div>
        </el-card>
      </div>
    </div>

    <el-empty v-if="(searchQuery && filteredDocs.length === 0) || (!searchQuery && treeData.length === 0)" description="暂无文档" />

    <!-- 创建目录对话框 -->
    <el-dialog v-model="createDirDialogVisible" title="新建目录" width="400px">
      <el-form :model="newDirForm" label-width="80px">
        <el-form-item label="目录名称">
          <el-input v-model="newDirForm.name" placeholder="请输入目录名称" />
        </el-form-item>
        <el-form-item label="父目录">
          <el-select v-model="newDirForm.parent" placeholder="选择父目录（可选）" clearable>
            <el-option label="根目录" value="" />
            <el-option 
              v-for="dir in allDirectories" 
              :key="dir.path" 
              :label="dir.path" 
              :value="dir.path" 
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createDirDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="createDirectory">确定</el-button>
      </template>
    </el-dialog>

    <!-- 移动文档对话框 -->
    <el-dialog v-model="moveDocDialogVisible" title="移动文档" width="500px">
      <el-form :model="moveDocForm" label-width="100px">
        <el-form-item label="当前文档">
          <el-input v-model="moveDocForm.currentPath" readonly />
        </el-form-item>
        <el-form-item label="目标目录">
          <el-select 
            v-model="moveDocForm.targetDir" 
            placeholder="选择目标目录" 
            clearable
            filterable
            style="width: 100%"
          >
            <el-option label="根目录" value="" />
            <el-option 
              v-for="dir in availableDirectories" 
              :key="dir.path" 
              :label="dir.path" 
              :value="dir.path" 
            />
          </el-select>
        </el-form-item>
        <el-form-item label="新文件名">
          <el-input 
            v-model="moveDocForm.newFileName" 
            placeholder="可选：修改文件名"
            suffix=".md"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="moveDocDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmMoveDoc" :loading="moving">确定移动</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search, Edit, Delete, Folder, Document, FolderAdd, FolderOpened, SwitchButton } from '@element-plus/icons-vue'
import axios from 'axios'
import { auth } from '../utils/auth.js'

export default {
  name: 'DocList',
  components: {
    Plus,
    Search,
    Edit,
    Delete,
    Folder,
    Document,
    FolderAdd
  },
  setup() {
    const router = useRouter()
    const treeData = ref([])
    const flatDocs = ref([])
    const filteredDocs = ref([])
    const searchQuery = ref('')
    const createDirDialogVisible = ref(false)
    const newDirForm = ref({
      name: '',
      parent: ''
    })
    
    // 移动文档相关数据
    const moveDocDialogVisible = ref(false)
    const moving = ref(false)
    const moveDocForm = ref({
      currentPath: '',
      targetDir: '',
      newFileName: ''
    })

    const treeProps = {
      children: 'children',
      label: 'name'
    }

    // 计算所有目录列表（用于选择父目录）
    const allDirectories = computed(() => {
      const dirs = []
      
      function collectDirs(items, parentPath = '') {
        items.forEach(item => {
          if (item.type === 'directory') {
            const fullPath = parentPath ? `${parentPath}/${item.name}` : item.name
            dirs.push({
              name: item.name,
              path: fullPath
            })
            if (item.children) {
              collectDirs(item.children, fullPath)
            }
          }
        })
      }
      
      collectDirs(treeData.value)
      return dirs
    })
    
    // 计算可用目录列表（用于移动文档）
    const availableDirectories = computed(() => {
      return allDirectories.value
    })

    const loadDocs = async () => {
      try {
        // 加载目录结构
        const treeResponse = await axios.get('/docs/api/docs')
        treeData.value = treeResponse.data
        
        // 加载扁平化文档列表（用于搜索）
        const flatResponse = await axios.get('/docs/api/docs/flat')
        flatDocs.value = flatResponse.data
        filteredDocs.value = flatResponse.data
      } catch (error) {
        ElMessage.error('加载文档列表失败')
        console.error(error)
      }
    }

    const filterDocs = () => {
      if (!searchQuery.value) {
        filteredDocs.value = flatDocs.value
      } else {
        filteredDocs.value = flatDocs.value.filter(doc => 
          doc.title.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
          doc.path.toLowerCase().includes(searchQuery.value.toLowerCase())
        )
      }
    }

    const handleNodeClick = (data) => {
      if (data.type === 'file') {
        openDoc(data)
      }
    }

    const createNewDoc = () => {
      router.push('/editor')
    }

    const createDocInDir = (dirData) => {
      const dirPath = dirData.path.replace(/\\/g, '/')
      router.push(`/editor?dir=${encodeURIComponent(dirPath)}`)
    }

    const openDoc = (doc) => {
      const docPath = doc.path.replace(/\\/g, '/')
      router.push(`/editor/${encodeURIComponent(docPath)}`)
    }

    const editDoc = (doc) => {
      const docPath = doc.path.replace(/\\/g, '/')
      router.push(`/editor/${encodeURIComponent(docPath)}`)
    }

    const deleteDoc = async (doc) => {
      try {
        await ElMessageBox.confirm(
          `确定要删除文档 "${doc.title || doc.name}" 吗？`,
          '确认删除',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning',
          }
        )
        
        const docPath = doc.path.replace(/\\/g, '/')
        await axios.delete(`/docs/api/docs/info?path=${encodeURIComponent(docPath)}`)
        ElMessage.success('文档删除成功')
        loadDocs()
      } catch (error) {
        if (error !== 'cancel') {
          ElMessage.error('删除文档失败')
          console.error(error)
        }
      }
    }

    const showCreateDirDialog = () => {
      newDirForm.value = { name: '', parent: '' }
      createDirDialogVisible.value = true
    }

    const createDirectory = async () => {
      if (!newDirForm.value.name.trim()) {
        ElMessage.warning('请输入目录名称')
        return
      }

      try {
        const dirPath = newDirForm.value.parent 
          ? `${newDirForm.value.parent}/${newDirForm.value.name}`
          : newDirForm.value.name

        await axios.post('/docs/api/directories', { path: dirPath })
        ElMessage.success('目录创建成功')
        createDirDialogVisible.value = false
        loadDocs()
      } catch (error) {
        ElMessage.error(error.response?.data?.error || '创建目录失败')
        console.error(error)
      }
    }

    const deleteDir = async (dirData) => {
      try {
        await ElMessageBox.confirm(
          `确定要删除目录 "${dirData.name}" 吗？（只能删除空目录）`,
          '确认删除',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning',
          }
        )
        
        const dirPath = dirData.path.replace(/\\/g, '/')
        await axios.delete(`/docs/api/directories/${encodeURIComponent(dirPath)}`)
        ElMessage.success('目录删除成功')
        loadDocs()
      } catch (error) {
        if (error !== 'cancel') {
          ElMessage.error(error.response?.data?.error || '删除目录失败')
          console.error(error)
        }
      }
    }

    const formatDate = (timestamp) => {
      return new Date(timestamp).toLocaleString('zh-CN')
    }

    const formatSize = (bytes) => {
      if (bytes === 0) return '0 B'
      const k = 1024
      const sizes = ['B', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }
    
    // 移动文档相关方法
    const moveDoc = (doc) => {
      moveDocForm.value = {
        currentPath: doc.path,
        targetDir: '',
        newFileName: doc.title || doc.name.replace('.md', '')
      }
      moveDocDialogVisible.value = true
    }
    
    const confirmMoveDoc = async () => {
      if (!moveDocForm.value.newFileName.trim()) {
        ElMessage.warning('请输入文件名')
        return
      }
      
      moving.value = true
      try {
        const targetPath = moveDocForm.value.targetDir 
          ? `${moveDocForm.value.targetDir}/${moveDocForm.value.newFileName}.md`
          : `${moveDocForm.value.newFileName}.md`
          
        await axios.post('/docs/api/docs/move', {
          sourcePath: moveDocForm.value.currentPath,
          targetPath: targetPath
        })
        
        ElMessage.success('文档移动成功')
        moveDocDialogVisible.value = false
        loadDocs()
      } catch (error) {
        ElMessage.error(error.response?.data?.error || '移动文档失败')
        console.error(error)
      } finally {
        moving.value = false
      }
    }

    const handleLogout = async () => {
      try {
        await ElMessageBox.confirm(
          '确定要退出登录吗？',
          '确认退出',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning',
          }
        )
        
        auth.logout()
        ElMessage.success('已退出登录')
        router.push('/login')
      } catch (error) {
        // 用户取消操作
      }
    }

    onMounted(() => {
      loadDocs()
    })

    return {
      treeData,
      flatDocs,
      filteredDocs,
      searchQuery,
      createDirDialogVisible,
      newDirForm,
      moveDocDialogVisible,
      moving,
      moveDocForm,
      treeProps,
      allDirectories,
      availableDirectories,
      loadDocs,
      filterDocs,
      handleNodeClick,
      createNewDoc,
      createDocInDir,
      openDoc,
      editDoc,
      deleteDoc,
      moveDoc,
      confirmMoveDoc,
      handleLogout,
      showCreateDirDialog,
      createDirectory,
      deleteDir,
      formatDate,
      formatSize,
      Plus,
      Search,
      Edit,
      Delete,
      Folder,
      Document,
      FolderAdd,
      FolderOpened,
      SwitchButton
    }
  }
}
</script>

<style scoped>
.doc-list-container {
  padding: 20px;
  height: 100%;
  overflow-y: auto;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.list-header h2 {
  color: #303133;
  font-size: 24px;
  font-weight: 600;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.search-bar {
  margin-bottom: 20px;
}

.directory-tree {
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.tree-node {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: 4px 0;
}

.node-content {
  display: flex;
  align-items: center;
  flex: 1;
}

.folder-icon {
  color: #E6A23C;
  margin-right: 8px;
}

.file-icon {
  color: #29abc1;
  margin-right: 8px;
}

.node-label {
  font-size: 14px;
  color: #303133;
}

.node-actions {
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s;
}

.tree-node:hover .node-actions {
  opacity: 1;
}

.search-results .docs-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.doc-card {
  cursor: pointer;
  transition: transform 0.2s;
}

.doc-card:hover {
  transform: translateY(-2px);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.doc-title {
  font-weight: 600;
  color: #303133;
}

.card-actions {
  display: flex;
  gap: 8px;
}

.doc-info {
  color: #606266;
  font-size: 14px;
}

.doc-info p {
  margin: 5px 0;
}

.doc-path {
  color: #909399;
  font-family: monospace;
}

.doc-date, .doc-size {
  color: #C0C4CC;
}

:deep(.el-tree-node__content) {
  height: auto;
  padding: 8px 0;
}

:deep(.el-tree-node__expand-icon) {
  color: #C0C4CC;
}

/* 移动端响应式样式 */
@media (max-width: 768px) {
  .doc-list-container {
    padding: 16px;
  }
  
  .list-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
    margin-bottom: 16px;
  }
  
  .list-header h2 {
    font-size: 20px;
    margin-bottom: 0;
  }
  
  .header-actions {
    width: 100%;
    flex-wrap: wrap;
    gap: 8px;
  }
  
  .header-actions .el-button {
    flex: 1;
    min-width: 0;
    font-size: 12px;
    padding: 8px 12px;
  }
  
  .search-bar {
    margin-bottom: 16px;
  }
  
  .directory-tree {
    padding: 12px;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }
  
  /* Element Plus 树组件移动端优化 */
  :deep(.el-tree) {
    overflow-x: visible;
    min-width: 100%;
    background: transparent;
  }
  
  :deep(.el-tree-node) {
    margin-bottom: 12px;
    background: #f8f9fa;
    border-radius: 8px;
    padding: 8px;
    border: 1px solid #e9ecef;
  }
  
  :deep(.el-tree-node__content) {
    height: auto !important;
    padding: 8px !important;
    min-height: auto;
    display: flex;
    align-items: flex-start;
    flex-direction: column;
    background: transparent;
    border-radius: 0;
    margin-bottom: 0;
    position: relative;
  }
  
  :deep(.el-tree-node__expand-icon) {
    position: absolute;
    top: 8px;
    left: 8px;
    padding: 4px;
    margin-right: 0;
    flex-shrink: 0;
    z-index: 2;
  }
  
  :deep(.el-tree-node__label) {
    display: none; /* 隐藏原生标签，使用自定义的 */
  }
  
  /* 自定义树节点样式 */
  .tree-node {
    display: flex;
    flex-direction: column;
    width: 100%;
    padding-left: 32px; /* 左侧留出展开图标空间 */
    min-width: 0;
    gap: 12px;
  }
  
  .node-content {
    width: 100%;
    display: flex;
    align-items: center;
    min-width: 0;
    flex-wrap: nowrap;
    padding: 8px;
    background: white;
    border-radius: 6px;
    border: 1px solid #dee2e6;
  }
  
  .node-label {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 14px;
    line-height: 1.4;
    font-weight: 500;
    color: #495057;
  }
  
  .folder-icon,
  .file-icon {
    flex-shrink: 0;
    margin-right: 8px;
    font-size: 16px;
  }
  
  .folder-icon {
    color: #ffc107;
  }
  
  .file-icon {
    color: #17a2b8;
  }
  
  .node-actions {
    width: 100%;
    display: flex;
    justify-content: flex-start;
    flex-wrap: wrap;
    gap: 8px;
    padding: 0 8px;
  }
  
  .node-actions .el-button {
    font-size: 11px;
    padding: 6px 12px;
    flex: 1;
    min-width: 0;
    height: 32px;
    border-radius: 6px;
    font-weight: 500;
  }
  
  /* 文件节点按钮样式 */
  .node-actions .el-button--primary {
    background: #007bff;
    border-color: #007bff;
  }
  
  .node-actions .el-button--warning {
    background: #ffc107;
    border-color: #ffc107;
    color: #212529;
  }
  
  .node-actions .el-button--danger {
    background: #dc3545;
    border-color: #dc3545;
  }
  
  .node-actions .el-button--success {
    background: #28a745;
    border-color: #28a745;
  }
  
  .search-results .docs-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .card-actions {
    width: 100%;
    justify-content: flex-end;
    flex-wrap: wrap;
    gap: 6px;
  }
  
  .card-actions .el-button {
    font-size: 12px;
    padding: 4px 8px;
  }
}

@media (max-width: 480px) {
  .doc-list-container {
    padding: 12px;
  }
  
  .list-header h2 {
    font-size: 18px;
  }
  
  .header-actions {
    gap: 6px;
  }
  
  .header-actions .el-button {
    font-size: 11px;
    padding: 6px 10px;
  }
  
  .directory-tree {
    padding: 8px;
  }
  
  :deep(.el-tree-node) {
    margin-bottom: 10px;
    padding: 6px;
  }
  
  :deep(.el-tree-node__content) {
    padding: 6px !important;
  }
  
  :deep(.el-tree-node__expand-icon) {
    top: 6px;
    left: 6px;
    padding: 2px;
  }
  
  .tree-node {
    padding-left: 28px; /* 减少左侧空间 */
    gap: 10px;
  }
  
  .node-content {
    padding: 6px;
  }
  
  .node-label {
    font-size: 13px;
  }
  
  .folder-icon,
  .file-icon {
    font-size: 14px;
    margin-right: 6px;
  }
  
  .node-actions {
    gap: 6px;
    padding: 0 6px;
  }
  
  .node-actions .el-button {
    font-size: 10px;
    padding: 5px 8px;
    height: 28px;
    border-radius: 4px;
  }
  
  .card-actions .el-button {
    font-size: 11px;
    padding: 3px 6px;
  }
}
</style>