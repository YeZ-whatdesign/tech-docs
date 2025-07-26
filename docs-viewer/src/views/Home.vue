<template>
  <div class="home-container">
    <!-- 欢迎横幅 -->
    <div class="hero-section">
      <div class="hero-content">
        <h1 class="hero-title">
          几何原本 - 技术文档中心
        </h1>
        <p class="hero-subtitle">
          探索我们的技术文档，获取详细的开发指南和API参考
        </p>
        <div class="hero-search">
          <el-input
            v-model="searchQuery"
            placeholder="搜索文档内容..."
            size="large"
            :prefix-icon="Search"
            clearable
            @keyup.enter="performSearch"
          >
            <template #append>
              <el-button type="primary" @click="performSearch">
                搜索
              </el-button>
            </template>
          </el-input>
        </div>
      </div>
    </div>

    <!-- 文档列表 -->
    <div class="docs-section">
      <div class="section-header">
        <h2>文档列表</h2>
        <p>{{ docs.length }} 个文档</p>
      </div>
      
      <div class="docs-grid">
        <el-card 
          v-for="doc in filteredDocs" 
          :key="doc.path"
          class="doc-card"
          shadow="hover"
          @click="openDoc(doc)"
        >
          <div class="doc-card-content">
            <div class="doc-icon">
              <el-icon><Document /></el-icon>
            </div>
            <div class="doc-info">
              <h3 class="doc-title">{{ doc.title }}</h3>
              <p class="doc-preview">{{ getDocPreview(doc.content) }}</p>
              <div class="doc-meta">
                <span class="doc-date">
                  <el-icon><Clock /></el-icon>
                  {{ formatDate(doc.lastModified) }}
                </span>
                <span class="doc-size">{{ formatSize(doc.size) }}</span>
              </div>
            </div>
          </div>
        </el-card>
      </div>

      <el-empty v-if="filteredDocs.length === 0" description="暂无文档" />
    </div>


  </div>
</template>

<script>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Document, Search, Clock } from '@element-plus/icons-vue'
import axios from 'axios'

export default {
  name: 'Home',
  components: {
    Document,
    Search,
    Clock
  },
  setup() {
    const router = useRouter()
    const docs = ref([])
    const searchQuery = ref('')

    const filteredDocs = computed(() => {
      if (!searchQuery.value) {
        return docs.value
      }
      return docs.value.filter(doc => 
        doc.title.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
        doc.content.toLowerCase().includes(searchQuery.value.toLowerCase())
      )
    })

    const loadDocs = async () => {
      try {
        // 使用扁平化API获取所有文档
        const response = await axios.get('/api/docs/flat')
        docs.value = response.data
      } catch (error) {
        console.error('加载文档列表失败:', error)
      }
    }

    const openDoc = (doc) => {
      router.push(`/doc/${encodeURIComponent(doc.path)}`)
    }

    const performSearch = () => {
      // 搜索功能已通过computed实现
    }

    const getDocPreview = (content) => {
      if (!content) return '暂无预览'
      // 移除markdown标记并截取前100个字符
      const plainText = content.replace(/[#*`\[\]]/g, '').trim()
      return plainText.length > 100 ? plainText.substring(0, 100) + '...' : plainText
    }

    const formatDate = (timestamp) => {
      return new Date(timestamp).toLocaleDateString('zh-CN')
    }

    const formatSize = (bytes) => {
      if (bytes === 0) return '0 B'
      const k = 1024
      const sizes = ['B', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
    }

    onMounted(() => {
      loadDocs()
    })

    return {
      docs,
      filteredDocs,
      searchQuery,
      openDoc,
      performSearch,
      getDocPreview,
      formatDate,
      formatSize,
      Search,
      Clock
    }
  }
}
</script>

<style scoped>
.home-container {
  min-height: 100vh;
  background: #fafbfc;
}

.hero-section {
  background: linear-gradient(135deg, #29abc1 0%, #3bb8d1 100%);
  color: white;
  padding: 80px 24px 100px;
  text-align: center;
  position: relative;
  overflow: hidden;
}

.hero-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse"><path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="0.5"/></pattern></defs><rect width="100" height="100" fill="url(%23grid)"/></svg>');
  opacity: 0.3;
}

.hero-content {
  max-width: 800px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
}

.hero-title {
  font-size: 3.2rem;
  font-weight: 700;
  margin-bottom: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  letter-spacing: -0.02em;
  line-height: 1.1;
}

.hero-logo {
  height: 48px;
  width: auto;
  object-fit: contain;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1));
}

.hero-subtitle {
  font-size: 1.25rem;
  margin-bottom: 40px;
  opacity: 0.9;
  line-height: 1.6;
  font-weight: 400;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}

.hero-search {
  max-width: 500px;
  margin: 0 auto;
}

.hero-search .el-input {
  border-radius: 12px;
}

.hero-search .el-input__wrapper {
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  backdrop-filter: blur(10px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  padding: 12px 16px;
  font-size: 16px;
}

.hero-search .el-input__wrapper:hover {
  border-color: rgba(255, 255, 255, 0.4);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
}

.hero-search .el-input__wrapper.is-focus {
  border-color: rgba(255, 255, 255, 0.6);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.2);
}

.docs-section {
  padding: 80px 24px;
  max-width: 1200px;
  margin: 0 auto;
  position: relative;
  margin-top: -40px;
  z-index: 2;
}

.section-header {
  text-align: center;
  margin-bottom: 48px;
}

.section-header h2 {
  font-size: 2.5rem;
  color: #1e2328;
  margin-bottom: 16px;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.section-header p {
  color: #6b7280;
  font-size: 1.125rem;
  line-height: 1.6;
  max-width: 600px;
  margin: 0 auto;
}

.docs-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
  gap: 24px;
  margin-bottom: 40px;
}

.doc-card {
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 16px;
  overflow: hidden;
  background: #ffffff;
  border: 1px solid #e1e5e9;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.doc-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  border-color: #29abc1;
}

.doc-card-content {
  display: flex;
  gap: 16px;
  padding: 24px;
}

.doc-icon {
  flex-shrink: 0;
  width: 56px;
  height: 56px;
  background: linear-gradient(135deg, #29abc1 0%, #1e9bb3 100%);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 24px;
  box-shadow: 0 4px 12px rgba(41, 171, 193, 0.3);
}

.doc-info {
  flex: 1;
  min-width: 0;
}

.doc-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1e2328;
  margin-bottom: 8px;
  line-height: 1.4;
  letter-spacing: -0.01em;
}

.doc-preview {
  color: #6b7280;
  font-size: 0.9rem;
  line-height: 1.6;
  margin-bottom: 16px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.doc-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.8rem;
  color: #9ca3af;
  padding-top: 12px;
  border-top: 1px solid #f3f4f6;
}

.doc-date {
  display: flex;
  align-items: center;
  gap: 4px;
  font-weight: 500;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .hero-section {
    padding: 60px 16px 80px;
  }
  
  .hero-title {
    font-size: 2.5rem;
    flex-direction: column;
    gap: 12px;
  }
  
  .hero-logo {
    height: 40px;
  }
  
  .hero-subtitle {
    font-size: 1.125rem;
  }
  
  .docs-section {
    padding: 60px 16px;
    margin-top: -30px;
  }
  
  .section-header h2 {
    font-size: 2rem;
  }
  
  .docs-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .doc-card-content {
    padding: 20px;
  }
  
  .doc-icon {
    width: 48px;
    height: 48px;
    font-size: 20px;
  }
}

@media (max-width: 480px) {
  .hero-title {
    font-size: 2rem;
  }
  
  .hero-logo {
    height: 32px;
  }
  
  .hero-subtitle {
    font-size: 1rem;
  }
  
  .section-header h2 {
    font-size: 1.75rem;
  }
  
  .doc-card-content {
    padding: 16px;
  }
}
</style>