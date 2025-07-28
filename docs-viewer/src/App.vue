<template>
  <div id="app">
    <el-container class="app-container">
      <!-- 顶部导航 -->
      <el-header class="app-header">
        <div class="header-content">
          <div class="logo-section" @click="$router.push('/')">
            <img src="/images/logo.png" alt="几何原本" class="logo-image" />
          </div>
        </div>
      </el-header>

      <el-container class="main-container">
        <!-- 侧边栏 -->
        <el-aside class="sidebar" width="280px" v-if="showSidebar">
          <div class="sidebar-content">
            <h3 class="sidebar-title">文档导航</h3>
            <el-tree
              :data="treeData"
              :props="treeProps"
              node-key="path"
              :default-expand-all="false"
              :expand-on-click-node="false"
              class="doc-tree"
              @node-click="handleNodeClick"
            >
              <template #default="{ node, data }">
                <div class="tree-node">
                  <el-icon v-if="data.type === 'directory'">
                    <Folder />
                  </el-icon>
                  <el-icon v-else>
                    <Document />
                  </el-icon>
                  <span class="node-label">{{ data.title }}</span>
                </div>
              </template>
            </el-tree>
          </div>
        </el-aside>

        <!-- 主内容区 -->
        <el-main class="app-main">
          <router-view />
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Document, Search, Folder } from '@element-plus/icons-vue'
import axios from 'axios'

export default {
  name: 'App',
  components: {
    Document,
    Search,
    Folder
  },
  setup() {
    const route = useRoute()
    const router = useRouter()
    const docs = ref([])
    const treeData = ref([])
    const searchQuery = ref('')

    const treeProps = {
      children: 'children',
      label: 'title'
    }

    const showSidebar = computed(() => {
      return route.path !== '/'
    })

    const activeMenu = computed(() => {
      if (route.name === 'DocView') {
        return route.params.path
      }
      return ''
    })

    const loadDocs = async () => {
      try {
        const response = await axios.get('/api/docs')
        docs.value = response.data
        treeData.value = response.data
      } catch (error) {
        console.error('加载文档列表失败:', error)
      }
    }

    const handleNodeClick = (data) => {
      if (data.type === 'file') {
        router.push(`/doc/${encodeURIComponent(data.path)}`)
      }
    }

    const handleMenuSelect = (path) => {
      router.push(`/doc/${encodeURIComponent(path)}`)
    }

    onMounted(() => {
      loadDocs()
    })

    return {
      docs,
      treeData,
      treeProps,
      searchQuery,
      showSidebar,
      activeMenu,
      handleNodeClick,
      handleMenuSelect,
      Search
    }
  }
}
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

#app {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
  height: 100vh;
  background: #fafbfc;
  color: #1e2328;
}

.app-container {
  height: 100vh;
}

.app-header {
  background: #ffffff;
  color: #1e2328;
  padding: 0 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border-bottom: 1px solid #e1e5e9;
  z-index: 1000;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 100%;
  max-width: 1200px;
  margin: 0 auto;
}

.logo-section {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  transition: opacity 0.2s ease;
}

.logo-section:hover {
  opacity: 0.8;
}

.logo-image {
  height: 38px;
  width: auto;
  object-fit: contain;
}

.app-title {
  font-size: 20px;
  font-weight: 600;
  color: #1e2328;
  letter-spacing: -0.02em;
}

.main-container {
  height: calc(100vh - 60px);
}

.sidebar {
  background: #ffffff;
  border-right: 1px solid #e1e5e9;
  overflow-y: auto;
}

.sidebar::-webkit-scrollbar {
  width: 6px;
}

.sidebar::-webkit-scrollbar-track {
  background: transparent;
}

.sidebar::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 3px;
}

.sidebar::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}

.sidebar-content {
  padding: 24px 0;
}

.sidebar-title {
  padding: 0 24px 16px;
  color: #1e2328;
  font-size: 14px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 1px solid #e1e5e9;
  margin-bottom: 16px;
}

.doc-tree {
  background: transparent;
  padding: 0 16px;
}

.tree-node {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 0;
  cursor: pointer;
  transition: all 0.2s ease;
  border-radius: 6px;
  margin: 2px 0;
}

.tree-node:hover {
  color: #29abc1;
  background: rgba(41, 171, 193, 0.05);
}

.node-label {
  font-size: 14px;
  flex: 1;
  font-weight: 500;
  line-height: 1.4;
}

.doc-tree .el-tree-node__content {
  padding: 8px 12px;
  border-radius: 6px;
  transition: all 0.2s ease;
  border: none;
  background: transparent;
}

.doc-tree .el-tree-node__content:hover {
  background: rgba(41, 171, 193, 0.05);
}

.doc-tree .el-tree-node__expand-icon {
  color: #6b7280;
  transition: color 0.2s ease;
}

.doc-tree .el-tree-node__expand-icon:hover {
  color: #29abc1;
}

.doc-tree .el-tree-node.is-expanded > .el-tree-node__content .el-tree-node__expand-icon {
  color: #29abc1;
}

.doc-tree .el-icon {
  color: #6b7280;
  transition: color 0.2s ease;
}

.tree-node:hover .el-icon {
  color: #29abc1;
}

.app-main {
  padding: 0;
  overflow-y: auto;
  background: #fafbfc;
}

.app-main::-webkit-scrollbar {
  width: 8px;
}

.app-main::-webkit-scrollbar-track {
  background: transparent;
}

.app-main::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 4px;
}

.app-main::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    gap: 12px;
    padding: 12px 0;
  }
  
  .header-search {
    width: 100%;
  }
  
  .header-search .el-input {
    width: 100% !important;
  }
  
  .sidebar {
    display: none !important;
  }
  
  .main-container {
    flex-direction: column;
  }
  
  .app-main {
    width: 100% !important;
    margin-left: 0 !important;
  }
  
  .app-title {
    font-size: 18px;
  }
}

@media (max-width: 480px) {
  .app-header {
    padding: 0 16px;
  }
  
  .logo-icon {
    font-size: 20px;
  }
  
  .app-title {
    font-size: 16px;
  }
}
</style>