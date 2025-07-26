<template>
  <div id="app">
    <el-container class="app-container">
      <el-header class="app-header">
        <div class="header-content">
          <h1 class="app-title">
            几何原本 - 技术文档编辑器
          </h1>
          <div class="header-actions">
            <el-button 
              type="primary" 
              @click="$router.push('/docs')"
              :icon="List"
            >
              文档列表
            </el-button>
            <el-button 
              type="success" 
              @click="$router.push('/editor')"
              :icon="EditPen"
            >
              新建文档
            </el-button>
          </div>
        </div>
      </el-header>
      <el-main class="app-main">
        <router-view />
      </el-main>
    </el-container>
  </div>
</template>

<script>
import { Document, List, EditPen } from '@element-plus/icons-vue'

export default {
  name: 'App',
  components: {
    Document,
    List,
    EditPen
  },
  setup() {
    return {
      List,
      EditPen
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
  font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', '微软雅黑', Arial, sans-serif;
  height: 100vh;
}

.app-container {
  height: 100vh;
}

.app-header {
  background: linear-gradient(135deg, #29abc1 0%, #3bb8d1 100%);
  color: white;
  padding: 0 20px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 100%;
}

.app-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 24px;
  font-weight: 600;
}

.logo-image {
  height: 38px;
  width: auto;
  object-fit: contain;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.app-main {
  padding: 0;
  height: calc(100vh - 60px);
  overflow: hidden;
}

.el-button {
  border-radius: 6px;
}
</style>