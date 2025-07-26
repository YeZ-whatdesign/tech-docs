<template>
  <div class="doc-editor-container">
    <div class="editor-toolbar">
      <div class="toolbar-left">
        <div class="document-info">
          <h3 class="document-title">{{ documentTitle || '未命名文档' }}</h3>
          <el-input
            v-model="fileName"
            placeholder="文件路径"
            style="width: 300px; margin-top: 8px;"
            size="small"
            :prefix-icon="Document"
          />
        </div>
        <div class="toolbar-actions">
          <el-button type="primary" @click="saveDoc" :icon="Check" :loading="saving">
            保存
          </el-button>
          <el-button @click="$router.push('/')" :icon="Back">
            返回列表
          </el-button>
        </div>
      </div>
      <div class="toolbar-right">
        <el-button-group>
          <el-button 
            :type="viewMode === 'edit' ? 'primary' : ''"
            @click="viewMode = 'edit'"
            :icon="Edit"
          >
            编辑
          </el-button>
          <el-button 
            :type="viewMode === 'preview' ? 'primary' : ''"
            @click="viewMode = 'preview'"
            :icon="View"
          >
            预览
          </el-button>
          <el-button 
            :type="viewMode === 'split' ? 'primary' : ''"
            @click="viewMode = 'split'"
            :icon="Grid"
          >
            分屏
          </el-button>
        </el-button-group>
      </div>
    </div>

    <div class="editor-content" :class="viewMode">
      <div v-if="viewMode === 'edit' || viewMode === 'split'" class="editor-panel">
        <div ref="editorRef" class="codemirror-editor"></div>
      </div>
      
      <div v-if="viewMode === 'preview' || viewMode === 'split'" class="preview-panel">
        <div class="preview-content" v-html="previewHtml"></div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Document, Check, Back, Edit, View, Grid } from '@element-plus/icons-vue'
import { EditorView, basicSetup } from 'codemirror'
import { markdown } from '@codemirror/lang-markdown'
import { oneDark } from '@codemirror/theme-one-dark'
import { marked } from 'marked'
import hljs from 'highlight.js'
import 'highlight.js/styles/github.css'
import axios from 'axios'

export default {
  name: 'DocEditor',
  components: {
    Document,
    Check,
    Back,
    Edit,
    View,
    Grid
  },
  props: {
    path: String
  },
  setup(props) {
    const route = useRoute()
    const router = useRouter()
    const editorRef = ref(null)
    const fileName = ref('')
    const content = ref('')
    const documentTitle = ref('') // 新增：文档标题
    const viewMode = ref('split')
    const saving = ref(false)
    const previewHtml = ref('')
    
    let editorView = null

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

    const initEditor = () => {
      if (editorRef.value && !editorView) {
        editorView = new EditorView({
          doc: content.value,
          extensions: [
            basicSetup,
            markdown(),
            EditorView.updateListener.of((update) => {
              if (update.docChanged) {
                content.value = update.state.doc.toString()
                updatePreview()
              }
            }),
            EditorView.theme({
              '&': {
                height: '100%',
                fontSize: '14px'
              },
              '.cm-content': {
                padding: '20px',
                minHeight: '100%'
              },
              '.cm-focused': {
                outline: 'none'
              }
            })
          ],
          parent: editorRef.value
        })
      }
    }

    const updatePreview = () => {
      previewHtml.value = marked(content.value)
      extractDocumentTitle()
    }

    // 从文档内容中提取标题
    const extractDocumentTitle = () => {
      const lines = content.value.split('\n')
      for (const line of lines) {
        const trimmedLine = line.trim()
        if (trimmedLine.startsWith('# ')) {
          documentTitle.value = trimmedLine.substring(2).trim()
          return
        }
      }
      // 如果没有找到 # 标题，使用文件名作为标题
      const pathParts = fileName.value.split('/')
      documentTitle.value = pathParts[pathParts.length - 1].replace('.md', '')
    }

    const loadDoc = async () => {
      if (props.path) {
        try {
          const response = await axios.get(`/api/docs/${encodeURIComponent(props.path)}`)
          content.value = response.data.content
          fileName.value = response.data.path || props.path
          
          if (editorView) {
            editorView.dispatch({
              changes: {
                from: 0,
                to: editorView.state.doc.length,
                insert: content.value
              }
            })
          }
          updatePreview()
        } catch (error) {
          ElMessage.error('加载文档失败')
          console.error(error)
        }
      } else {
        // 新建文档 - 生成唯一名称
        const now = new Date()
        const timestamp = now.toISOString().slice(0, 19).replace(/[T:]/g, '-')
        const dirParam = route.query.dir
        
        if (dirParam) {
          fileName.value = `${dirParam}/新建文档-${timestamp}.md`
        } else {
          fileName.value = `新建文档-${timestamp}.md`
        }
        content.value = '# 新建文档\n\n开始编写你的文档内容...\n'
        updatePreview()
      }
    }

    const saveDoc = async () => {
      if (!fileName.value.trim()) {
        ElMessage.warning('请输入文件路径')
        return
      }

      saving.value = true
      try {
        let docPath = fileName.value
        
        // 确保文件名以.md结尾
        if (!docPath.endsWith('.md')) {
          docPath = docPath + '.md'
        }
        
        // 使用提取的文档标题，如果没有则使用文件名
        const title = documentTitle.value || docPath.split('/').pop().replace('.md', '')
        
        await axios.post('/api/docs', {
          path: docPath,
          content: content.value,
          title: title
        })
        
        ElMessage.success('保存成功')
        
        // 如果是新建文档，跳转到编辑页面
        if (!props.path) {
          router.replace(`/editor/${encodeURIComponent(docPath)}`)
        }
      } catch (error) {
        ElMessage.error('保存失败')
        console.error(error)
      } finally {
        saving.value = false
      }
    }

    watch(() => props.path, () => {
      loadDoc()
    })

    watch(viewMode, async () => {
      await nextTick()
      if ((viewMode.value === 'edit' || viewMode.value === 'split') && !editorView) {
        initEditor()
      }
    })

    onMounted(async () => {
      await loadDoc()
      await nextTick()
      if (viewMode.value === 'edit' || viewMode.value === 'split') {
        initEditor()
      }
    })

    return {
      fileName,
      content,
      viewMode,
      saving,
      previewHtml,
      editorRef,
      saveDoc,
      Document,
      Check,
      Back,
      Edit,
      View,
      Grid
    }
  }
}
</script>

<style scoped>
.doc-editor-container {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.editor-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 15px 20px;
  background: #f5f7fa;
  border-bottom: 1px solid #e4e7ed;
  min-height: 80px;
}

.toolbar-left {
  display: flex;
  align-items: flex-start;
  gap: 20px;
  flex: 1;
}

.document-info {
  flex: 1;
  max-width: 400px;
}

.document-title {
  margin: 0 0 8px 0;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  line-height: 1.2;
  word-break: break-word;
}

.toolbar-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 8px;
}

.toolbar-right {
  display: flex;
  align-items: center;
  margin-top: 8px;
}

.editor-content {
  flex: 1;
  display: flex;
  height: calc(100% - 70px);
}

.editor-content.edit {
  .preview-panel {
    display: none;
  }
}

.editor-content.preview {
  .editor-panel {
    display: none;
  }
}

.editor-panel {
  flex: 1;
  border-right: 1px solid #e4e7ed;
}

.codemirror-editor {
  height: 100%;
  overflow: auto;
}

.preview-panel {
  flex: 1;
  overflow-y: auto;
  background: white;
}

.preview-content {
  padding: 20px;
  max-width: none;
  line-height: 1.6;
}

/* Markdown样式 */
.preview-content h1,
.preview-content h2,
.preview-content h3,
.preview-content h4,
.preview-content h5,
.preview-content h6 {
  margin: 20px 0 10px 0;
  font-weight: 600;
  line-height: 1.25;
}

.preview-content h1 {
  font-size: 2em;
  border-bottom: 1px solid #eaecef;
  padding-bottom: 10px;
}

.preview-content h2 {
  font-size: 1.5em;
  border-bottom: 1px solid #eaecef;
  padding-bottom: 8px;
}

.preview-content h3 {
  font-size: 1.25em;
}

.preview-content p {
  margin: 16px 0;
}

.preview-content code {
  background: #f6f8fa;
  padding: 2px 4px;
  border-radius: 3px;
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
  font-size: 85%;
}

.preview-content pre {
  background: #f6f8fa;
  padding: 16px;
  border-radius: 6px;
  overflow-x: auto;
  margin: 16px 0;
}

.preview-content pre code {
  background: none;
  padding: 0;
}

.preview-content blockquote {
  border-left: 4px solid #29abc1;
  padding: 0 16px;
  color: #6a737d;
  margin: 16px 0;
}

.preview-content table {
  border-collapse: collapse;
  width: 100%;
  margin: 16px 0;
}

.preview-content table th,
.preview-content table td {
  border: 1px solid #dfe2e5;
  padding: 8px 12px;
  text-align: left;
}

.preview-content table th {
  background: #f6f8fa;
  font-weight: 600;
}

.preview-content ul,
.preview-content ol {
  margin: 16px 0;
  padding-left: 32px;
}

.preview-content li {
  margin: 4px 0;
}
</style>