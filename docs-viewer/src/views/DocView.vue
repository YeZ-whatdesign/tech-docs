<template>
  <div class="doc-view-container">
    <div class="doc-header">
      <div class="doc-breadcrumb">
        <el-breadcrumb separator="/">
          <el-breadcrumb-item @click="$router.push('/')">
            <el-icon><House /></el-icon>
            首页
          </el-breadcrumb-item>
          <el-breadcrumb-item>{{ docTitle }}</el-breadcrumb-item>
        </el-breadcrumb>
      </div>
      <div class="doc-actions">
        <!-- <el-button @click="$router.push('/')" :icon="Back">
          返回首页
        </el-button> -->
        <!-- <el-button type="primary" @click="printDoc" :icon="Printer">
          打印
        </el-button> -->
      </div>
    </div>

    <div class="doc-content-wrapper">
      <article class="doc-content" v-if="docContent">
        <!-- <div class="doc-title-section">
          <h1 class="doc-main-title">{{ docTitle }}</h1>
          <div class="doc-meta-info">
            <span class="meta-item">
              <el-icon><Clock /></el-icon>
              最后更新: {{ formatDate(lastModified) }}
            </span>
            <span class="meta-item">
              <el-icon><Document /></el-icon>
              大小: {{ formatSize(docSize) }}
            </span>
          </div>
        </div> -->
        
        <div class="doc-body" v-html="renderedContent"></div>
      </article>

      <div v-else class="loading-container">
        <el-skeleton :rows="10" animated />
      </div>

      <!-- 目录导航 -->
      <aside class="doc-toc" v-if="tocItems.length > 0">
        <div class="toc-header">
          <h4>目录</h4>
          <button class="toc-toggle" @click="toggleToc" v-show="isMobile">
            <el-icon>
              <ArrowDown v-if="!tocVisible" />
              <ArrowUp v-if="tocVisible" />
            </el-icon>
          </button>
        </div>
        <nav class="toc-nav" v-show="!isMobile || tocVisible">
          <ul class="toc-list">
            <li 
              v-for="item in tocItems" 
              :key="item.id"
              :class="['toc-item', `toc-level-${item.level}`]"
            >
              <a :href="`#${item.id}`" class="toc-link" @click="onTocClick">
                {{ item.text }}
              </a>
            </li>
          </ul>
        </nav>
      </aside>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, computed, onUnmounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { House, Back, Printer, Clock, Document, ArrowDown, ArrowUp } from '@element-plus/icons-vue'
import { marked } from 'marked'
import hljs from 'highlight.js'
import 'highlight.js/styles/github.css'
import axios from 'axios'

export default {
  name: 'DocView',
  components: {
    House,
    Back,
    Printer,
    Clock,
    Document,
    ArrowDown,
    ArrowUp
  },
  props: {
    path: String
  },
  setup(props) {
    const route = useRoute()
    const docContent = ref('')
    const docTitle = ref('')
    const lastModified = ref(0)
    const docSize = ref(0)
    const tocItems = ref([])
    const isMobile = ref(false)
    const tocVisible = ref(false)

    // 检测移动端
    const checkMobile = () => {
      isMobile.value = window.innerWidth <= 768
      if (!isMobile.value) {
        tocVisible.value = true // 桌面端默认显示目录
      } else {
        tocVisible.value = false // 移动端默认隐藏目录
      }
    }

    // 切换目录显示
    const toggleToc = () => {
      tocVisible.value = !tocVisible.value
    }

    // 点击目录链接时在移动端自动收起目录
    const onTocClick = () => {
      if (isMobile.value) {
        tocVisible.value = false
      }
    }

    // 配置marked
    marked.setOptions({
      highlight: function(code, lang) {
        if (lang && hljs.getLanguage(lang)) {
          try {
            return hljs.highlight(code, { language: lang }).value
          } catch (err) {}
        }
        return hljs.highlightAuto(code).value
      },
      breaks: true,
      gfm: true
    })

    const renderedContent = computed(() => {
      if (!docContent.value) return ''
      
      // 渲染markdown并生成目录
      const renderer = new marked.Renderer()
      const toc = []
      
      renderer.heading = function(text, level) {
        const id = text.toLowerCase().replace(/[^\w\u4e00-\u9fa5]+/g, '-')
        toc.push({
          id,
          text,
          level
        })
        return `<h${level} id="${id}">${text}</h${level}>`
      }
      
      marked.setOptions({ renderer })
      const html = marked(docContent.value)
      tocItems.value = toc
      
      return html
    })

    const loadDoc = async () => {
      const docPath = props.path || route.params.path
      if (!docPath) return

      try {
        const response = await axios.get(`/api/docs/${encodeURIComponent(docPath)}`)
        const doc = response.data
        
        docContent.value = doc.content
        docTitle.value = doc.title
        lastModified.value = doc.lastModified
        docSize.value = doc.size
      } catch (error) {
        ElMessage.error('加载文档失败')
        console.error(error)
      }
    }

    const printDoc = () => {
      window.print()
    }

    const formatDate = (timestamp) => {
      return new Date(timestamp).toLocaleString('zh-CN')
    }

    const formatSize = (bytes) => {
      if (bytes === 0) return '0 B'
      const k = 1024
      const sizes = ['B', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
    }

    onMounted(() => {
      loadDoc()
      checkMobile()
      window.addEventListener('resize', checkMobile)
    })

    onUnmounted(() => {
      window.removeEventListener('resize', checkMobile)
    })

    // 监听路由变化，重新加载文档
    watch(() => route.params.path, (newPath, oldPath) => {
      if (newPath !== oldPath) {
        loadDoc()
      }
    })

    // 监听props变化
    watch(() => props.path, (newPath, oldPath) => {
      if (newPath !== oldPath) {
        loadDoc()
      }
    })

    return {
      docContent,
      docTitle,
      lastModified,
      docSize,
      tocItems,
      renderedContent,
      isMobile,
      tocVisible,
      toggleToc,
      onTocClick,
      printDoc,
      formatDate,
      formatSize,
      Back,
      Printer,
      Clock,
      ArrowDown,
      ArrowUp
    }
  }
}
</script>

<style scoped>
.doc-view-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
  min-height: calc(100vh - 60px);
  background: #fafbfc;
}

.doc-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
  padding: 24px;
  background: #ffffff;
  border-radius: 12px;
  border: 1px solid #e1e5e9;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.doc-breadcrumb .el-breadcrumb__inner {
  color: #6b7280;
  font-weight: 500;
  cursor: pointer;
}

.doc-breadcrumb .el-breadcrumb__inner:hover {
  color: #29abc1;
}

.doc-actions {
  display: flex;
  gap: 12px;
}

.doc-actions .el-button {
  border-radius: 8px;
  font-weight: 500;
}

.doc-content-wrapper {
  display: grid;
  grid-template-columns: 1fr 280px;
  gap: 32px;
  align-items: start;
}

.doc-content {
  background: #ffffff;
  border-radius: 12px;
  padding: 48px;
  border: 1px solid #e1e5e9;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  line-height: 1.7;
  overflow-wrap: break-word;
  word-wrap: break-word;
  word-break: break-word;
  max-width: 100%;
  box-sizing: border-box;
}

/* 文档内容元素溢出处理 */
.doc-content :deep(*) {
  max-width: 100%;
  box-sizing: border-box;
}

.doc-content :deep(pre) {
  overflow-x: auto;
  white-space: pre-wrap;
  word-wrap: break-word;
  -webkit-overflow-scrolling: touch;
}

.doc-content :deep(code) {
  word-break: break-all;
  overflow-wrap: break-word;
}

.doc-content :deep(table) {
  width: 100%;
  table-layout: fixed;
  overflow-x: auto;
  display: block;
  white-space: nowrap;
}

.doc-content :deep(img) {
  max-width: 100%;
  height: auto;
}

.doc-content :deep(iframe) {
  max-width: 100%;
}

.doc-content :deep(h1),
.doc-content :deep(h2),
.doc-content :deep(h3),
.doc-content :deep(h4),
.doc-content :deep(h5),
.doc-content :deep(h6) {
  word-break: break-word;
  overflow-wrap: break-word;
}

.doc-content :deep(p) {
  word-break: break-word;
  overflow-wrap: break-word;
}

.doc-title-section {
  margin-bottom: 48px;
  padding-bottom: 24px;
  border-bottom: 1px solid #e1e5e9;
}

.doc-main-title {
  font-size: 2.5rem;
  color: #1e2328;
  margin-bottom: 16px;
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.2;
}

.doc-meta-info {
  display: flex;
  gap: 24px;
  color: #6b7280;
  font-size: 14px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 500;
}

.meta-item .el-icon {
  color: #9ca3af;
}

.loading-container {
  background: #ffffff;
  border-radius: 12px;
  padding: 48px;
  border: 1px solid #e1e5e9;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.doc-toc {
  position: sticky;
  top: 24px;
  background: #ffffff;
  border-radius: 12px;
  padding: 24px;
  border: 1px solid #e1e5e9;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  max-height: calc(100vh - 120px);
  overflow-y: auto;
}

.doc-toc::-webkit-scrollbar {
  width: 4px;
}

.doc-toc::-webkit-scrollbar-track {
  background: transparent;
}

.doc-toc::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 2px;
}

.doc-toc::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}

.toc-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.toc-header h4 {
  margin: 0;
  color: #1e2328;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: -0.01em;
}

.toc-toggle {
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.toc-toggle:hover {
  background: rgba(41, 171, 193, 0.1);
  color: #29abc1;
}

.toc-nav {
  overflow: hidden;
}

.toc-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.toc-item {
  margin: 2px 0;
}

.toc-level-1 {
  margin-left: 0;
}

.toc-level-2 {
  margin-left: 16px;
}

.toc-level-3 {
  margin-left: 32px;
}

.toc-level-4 {
  margin-left: 48px;
}

.toc-link {
  display: block;
  padding: 8px 12px;
  color: #6b7280;
  text-decoration: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
  line-height: 1.4;
}

.toc-link:hover {
  background: rgba(41, 171, 193, 0.05);
  color: #29abc1;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .doc-content-wrapper {
    grid-template-columns: 1fr;
  }
  
  .doc-toc {
    order: -1;
    position: static;
    max-height: none;
  }
}

@media (max-width: 768px) {
  .doc-view-container {
    padding: 16px;
  }
  
  .doc-content {
    padding: 32px 24px;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }
  
  .doc-main-title {
    font-size: 2rem;
    word-break: break-word;
    overflow-wrap: break-word;
  }
  
  .doc-meta-info {
    flex-direction: column;
    gap: 12px;
  }
  
  .doc-title-section {
    margin-bottom: 32px;
    padding-bottom: 20px;
  }
  
  .doc-toc {
    display: none !important;
  }
}

@media (max-width: 480px) {
  .doc-view-container {
    padding: 12px;
    overflow-x: hidden;
  }
  
  .doc-content {
    padding: 24px 16px;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    min-width: 0;
  }
  
  .doc-main-title {
    font-size: 1.75rem;
    word-break: break-word;
    overflow-wrap: break-word;
    hyphens: auto;
  }
  
  .doc-header {
    padding: 16px;
    overflow-x: auto;
  }
}

/* 打印样式 */
@media print {
  /* 隐藏不需要打印的元素 */
  .doc-header,
  .doc-toc,
  .doc-actions,
  .doc-breadcrumb,
  .doc-meta-info {
    display: none !important;
  }
  
  /* 页面布局优化 */
  .doc-view-container {
    background: white !important;
    padding: 0 !important;
    margin: 0 !important;
    max-width: none !important;
    min-height: auto !important;
  }
  
  .doc-content-wrapper {
    grid-template-columns: 1fr !important;
    gap: 0 !important;
  }
  
  .doc-content {
    box-shadow: none !important;
    padding: 20px !important;
    border: none !important;
    border-radius: 0 !important;
    background: white !important;
    margin: 0 !important;
  }
  
  /* 标题优化 */
  .doc-title-section {
    margin-bottom: 30px !important;
    padding-bottom: 15px !important;
    border-bottom: 2px solid #000 !important;
  }
  
  .doc-main-title {
    font-size: 24pt !important;
    color: #000 !important;
    margin-bottom: 10px !important;
    page-break-after: avoid !important;
  }
  
  /* 文档内容打印优化 */
  .doc-body {
    color: #000 !important;
    line-height: 1.6 !important;
  }
  
  .doc-body h1,
  .doc-body h2,
  .doc-body h3,
  .doc-body h4,
  .doc-body h5,
  .doc-body h6 {
    color: #000 !important;
    page-break-after: avoid !important;
    margin-top: 20px !important;
    margin-bottom: 10px !important;
  }
  
  .doc-body h1 {
    font-size: 18pt !important;
    border-bottom: 1px solid #000 !important;
  }
  
  .doc-body h2 {
    font-size: 16pt !important;
    border-bottom: 1px solid #666 !important;
  }
  
  .doc-body h3 {
    font-size: 14pt !important;
  }
  
  .doc-body h4 {
    font-size: 12pt !important;
  }
  
  .doc-body p {
    margin: 8px 0 !important;
    color: #000 !important;
    orphans: 3 !important;
    widows: 3 !important;
  }
  
  /* 代码块优化 */
  .doc-body code {
    background: #f5f5f5 !important;
    border: 1px solid #ddd !important;
    color: #000 !important;
    padding: 2px 4px !important;
  }
  
  .doc-body pre {
    background: #f8f8f8 !important;
    border: 1px solid #ddd !important;
    padding: 10px !important;
    margin: 10px 0 !important;
    page-break-inside: avoid !important;
    overflow: visible !important;
  }
  
  .doc-body pre code {
    background: none !important;
    border: none !important;
    color: #000 !important;
  }
  
  /* 引用块优化 */
  .doc-body blockquote {
    border-left: 3px solid #000 !important;
    background: #f9f9f9 !important;
    color: #000 !important;
    margin: 10px 0 !important;
    padding: 10px 15px !important;
    page-break-inside: avoid !important;
  }
  
  /* 表格优化 */
  .doc-body table {
    border-collapse: collapse !important;
    border: 1px solid #000 !important;
    margin: 10px 0 !important;
    page-break-inside: avoid !important;
  }
  
  .doc-body table th,
  .doc-body table td {
    border: 1px solid #000 !important;
    padding: 6px 8px !important;
    color: #000 !important;
  }
  
  .doc-body table th {
    background: #f0f0f0 !important;
    font-weight: bold !important;
  }
  
  /* 列表优化 */
  .doc-body ul,
  .doc-body ol {
    margin: 8px 0 !important;
    padding-left: 20px !important;
  }
  
  .doc-body li {
    margin: 4px 0 !important;
    color: #000 !important;
  }
  
  /* 图片优化 */
  .doc-body img {
    max-width: 100% !important;
    height: auto !important;
    border: 1px solid #ddd !important;
    margin: 10px 0 !important;
    page-break-inside: avoid !important;
  }
  
  /* 链接优化 */
  .doc-body a {
    color: #000 !important;
    text-decoration: underline !important;
  }
  
  .doc-body a:after {
    content: " (" attr(href) ")" !important;
    font-size: 10pt !important;
    color: #666 !important;
  }
  
  /* 分隔线优化 */
  .doc-body hr {
    border: none !important;
    border-top: 1px solid #000 !important;
    margin: 15px 0 !important;
  }
  
  /* 强调文本优化 */
  .doc-body strong {
    color: #000 !important;
    font-weight: bold !important;
  }
  
  .doc-body em {
    color: #000 !important;
    font-style: italic !important;
  }
  
  /* 分页控制 */
  .doc-body h1,
  .doc-body h2 {
    page-break-before: auto !important;
  }
  
  .doc-body table,
  .doc-body pre,
  .doc-body blockquote {
    page-break-inside: avoid !important;
  }
}
</style>

<style>
/* 文档内容样式 */
.doc-body h1,
.doc-body h2,
.doc-body h3,
.doc-body h4,
.doc-body h5,
.doc-body h6 {
  margin: 32px 0 16px 0;
  font-weight: 600;
  line-height: 1.25;
  color: #1e2328;
  letter-spacing: -0.01em;
}

.doc-body h1 {
  font-size: 2em;
  border-bottom: 1px solid #e1e5e9;
  padding-bottom: 12px;
  margin-top: 0;
}

.doc-body h2 {
  font-size: 1.5em;
  border-bottom: 1px solid #e1e5e9;
  padding-bottom: 10px;
}

.doc-body h3 {
  font-size: 1.25em;
}

.doc-body h4 {
  font-size: 1.1em;
}

.doc-body p {
  margin: 16px 0;
  color: #374151;
  line-height: 1.7;
}

.doc-body code {
  background: #f3f4f6;
  padding: 3px 6px;
  border-radius: 4px;
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
  font-size: 85%;
  color: #dc2626;
  border: 1px solid #e5e7eb;
}

.doc-body pre {
  background: #f8fafc;
  padding: 20px;
  border-radius: 8px;
  overflow-x: auto;
  margin: 20px 0;
  border: 1px solid #e1e5e9;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.doc-body pre code {
  background: none;
  padding: 0;
  color: #374151;
  border: none;
  font-size: 14px;
}

.doc-body blockquote {
  border-left: 4px solid #29abc1;
  padding: 16px 20px;
  color: #6b7280;
  margin: 20px 0;
  background: #f8fafc;
  border-radius: 0 8px 8px 0;
  font-style: italic;
}

.doc-body blockquote p {
  margin: 0;
}

.doc-body table {
  border-collapse: collapse;
  width: 100%;
  margin: 20px 0;
  border: 1px solid #e1e5e9;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.doc-body table th,
.doc-body table td {
  border: 1px solid #e1e5e9;
  padding: 12px 16px;
  text-align: left;
}

.doc-body table th {
  background: #f8fafc;
  font-weight: 600;
  color: #374151;
}

.doc-body table tr:nth-child(even) {
  background: #fafbfc;
}

.doc-body ul,
.doc-body ol {
  margin: 16px 0;
  padding-left: 24px;
}

.doc-body li {
  margin: 6px 0;
  line-height: 1.6;
}

.doc-body img {
  max-width: 100%;
  height: auto;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  margin: 20px 0;
  border: 1px solid #e1e5e9;
}

.doc-body a {
  color: #29abc1;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s ease;
}

.doc-body a:hover {
  color: #1e8a9b;
  text-decoration: underline;
}

.doc-body hr {
  border: none;
  height: 1px;
  background: #e1e5e9;
  margin: 32px 0;
}

.doc-body strong {
  font-weight: 600;
  color: #1e2328;
}

.doc-body em {
  font-style: italic;
  color: #6b7280;
}
</style>