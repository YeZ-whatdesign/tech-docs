const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const fs = require('fs-extra')
const path = require('path')
const chokidar = require('chokidar')
const { authMiddleware, loginHandler, getUserInfoHandler } = require('./auth')

const app = express()
const PORT = 3006

// 中间件
app.use(cors())
app.use(bodyParser.json({ limit: '10mb' }))
app.use(bodyParser.urlencoded({ extended: true }))

// 认证路由（在认证中间件之前）
app.post('/api/auth/login', loginHandler)
app.get('/api/auth/user', authMiddleware, getUserInfoHandler)

// 应用认证中间件到所有API路由
app.use('/api', authMiddleware)

// 文档存储目录
const DOCS_DIR = path.join(__dirname, '../docs')

// 确保文档目录存在
fs.ensureDirSync(DOCS_DIR)

// 递归获取目录结构
async function getDirectoryStructure(dirPath, basePath = '') {
  const items = []
  const files = await fs.readdir(dirPath)
  
  for (const file of files) {
    const fullPath = path.join(dirPath, file)
    const relativePath = path.join(basePath, file)
    const stats = await fs.stat(fullPath)
    
    if (stats.isDirectory()) {
      // 递归获取子目录
      const children = await getDirectoryStructure(fullPath, relativePath)
      items.push({
        name: file,
        path: relativePath,
        type: 'directory',
        title: file, // 添加title属性用于显示
        children,
        lastModified: stats.mtime.getTime()
      })
    } else if (file.endsWith('.md')) {
      // 读取markdown文件
      const content = await fs.readFile(fullPath, 'utf-8')
      const lines = content.split('\n')
      let title = file.replace('.md', '')
      
      // 提取标题
      for (const line of lines) {
        if (line.startsWith('# ')) {
          title = line.substring(2).trim()
          break
        }
      }
      
      items.push({
        name: file,
        path: relativePath,
        type: 'file',
        title,
        lastModified: stats.mtime.getTime(),
        size: stats.size,
        content: content.substring(0, 200) + (content.length > 200 ? '...' : '')
      })
    }
  }
  
  // 排序：目录在前，文件在后，按名称排序
  items.sort((a, b) => {
    if (a.type !== b.type) {
      return a.type === 'directory' ? -1 : 1
    }
    return a.name.localeCompare(b.name)
  })
  
  return items
}

// 获取文档列表（支持目录结构）
app.get('/api/docs', async (req, res) => {
  try {
    const structure = await getDirectoryStructure(DOCS_DIR)
    res.json(structure)
  } catch (error) {
    console.error('获取文档列表失败:', error)
    res.status(500).json({ error: '获取文档列表失败' })
  }
})

// 获取扁平化的文档列表（用于搜索）
app.get('/api/docs/flat', async (req, res) => {
  try {
    const docs = []
    
    async function collectFiles(dirPath, basePath = '') {
      const files = await fs.readdir(dirPath)
      
      for (const file of files) {
        const fullPath = path.join(dirPath, file)
        const relativePath = path.join(basePath, file)
        const stats = await fs.stat(fullPath)
        
        if (stats.isDirectory()) {
          await collectFiles(fullPath, relativePath)
        } else if (file.endsWith('.md')) {
          const content = await fs.readFile(fullPath, 'utf-8')
          const lines = content.split('\n')
          let title = file.replace('.md', '')
          
          for (const line of lines) {
            if (line.startsWith('# ')) {
              title = line.substring(2).trim()
              break
            }
          }
          
          docs.push({
            path: relativePath.replace(/\\/g, '/'), // 统一使用正斜杠
            title,
            lastModified: stats.mtime.getTime(),
            size: stats.size,
            content: content.substring(0, 200) + (content.length > 200 ? '...' : '')
          })
        }
      }
    }
    
    await collectFiles(DOCS_DIR)
    
    // 按修改时间排序
    docs.sort((a, b) => b.lastModified - a.lastModified)
    
    res.json(docs)
  } catch (error) {
    console.error('获取文档列表失败:', error)
    res.status(500).json({ error: '获取文档列表失败' })
  }
})

// 获取单个文档
app.get('/api/docs/info', async (req, res) => {
  try {
    const docPath = decodeURIComponent(req.query.path)
    const filePath = path.join(DOCS_DIR, docPath)
    
    // 安全检查，防止路径遍历攻击
    if (!filePath.startsWith(DOCS_DIR)) {
      return res.status(400).json({ error: '无效的文件路径' })
    }
    
    if (!await fs.pathExists(filePath)) {
      return res.status(404).json({ error: '文档不存在' })
    }
    
    const content = await fs.readFile(filePath, 'utf-8')
    const stats = await fs.stat(filePath)
    
    // 提取标题
    const lines = content.split('\n')
    let title = docPath.replace('.md', '')
    for (const line of lines) {
      if (line.startsWith('# ')) {
        title = line.substring(2).trim()
        break
      }
    }
    
    res.json({
      path: docPath,
      title,
      content,
      lastModified: stats.mtime.getTime(),
      size: stats.size
    })
  } catch (error) {
    console.error('获取文档失败:', error)
    res.status(500).json({ error: '获取文档失败' })
  }
})

// 创建目录
app.post('/api/directories', async (req, res) => {
  try {
    const { path: dirPath } = req.body
    
    if (!dirPath) {
      return res.status(400).json({ error: '缺少目录路径' })
    }
    
    const fullPath = path.join(DOCS_DIR, dirPath)
    
    // 安全检查
    if (!fullPath.startsWith(DOCS_DIR)) {
      return res.status(400).json({ error: '无效的目录路径' })
    }
    
    // 检查目录是否已存在
    if (await fs.pathExists(fullPath)) {
      return res.status(400).json({ error: '目录已存在' })
    }
    
    // 创建目录
    await fs.ensureDir(fullPath)
    
    res.json({ 
      message: '目录创建成功',
      path: dirPath
    })
  } catch (error) {
    console.error('创建目录失败:', error)
    res.status(500).json({ error: '创建目录失败' })
  }
})

// 删除目录
app.delete('/api/directories/:path(*)', async (req, res) => {
  try {
    const dirPath = decodeURIComponent(req.params.path)
    const fullPath = path.join(DOCS_DIR, dirPath)
    
    // 安全检查
    if (!fullPath.startsWith(DOCS_DIR) || fullPath === DOCS_DIR) {
      return res.status(400).json({ error: '无效的目录路径' })
    }
    
    if (!await fs.pathExists(fullPath)) {
      return res.status(404).json({ error: '目录不存在' })
    }
    
    const stats = await fs.stat(fullPath)
    if (!stats.isDirectory()) {
      return res.status(400).json({ error: '指定路径不是目录' })
    }
    
    // 检查目录是否为空
    const files = await fs.readdir(fullPath)
    if (files.length > 0) {
      return res.status(400).json({ error: '目录不为空，无法删除' })
    }
    
    await fs.remove(fullPath)
    
    res.json({ message: '目录删除成功' })
  } catch (error) {
    console.error('删除目录失败:', error)
    res.status(500).json({ error: '删除目录失败' })
  }
})
app.post('/api/docs', async (req, res) => {
  try {
    const { path: docPath, content, title } = req.body
    
    if (!docPath || !content) {
      return res.status(400).json({ error: '缺少必要参数' })
    }
    
    const filePath = path.join(DOCS_DIR, docPath)
    
    // 安全检查
    if (!filePath.startsWith(DOCS_DIR)) {
      return res.status(400).json({ error: '无效的文件路径' })
    }
    
    // 确保目录存在
    await fs.ensureDir(path.dirname(filePath))
    
    // 保存文件
    await fs.writeFile(filePath, content, 'utf-8')
    
    res.json({ 
      message: '保存成功',
      path: docPath,
      title: title || docPath.replace('.md', '')
    })
  } catch (error) {
    console.error('保存文档失败:', error)
    res.status(500).json({ error: '保存文档失败' })
  }
})

// 删除文档
app.delete('/api/docs/:path', async (req, res) => {
  try {
    const docPath = decodeURIComponent(req.params.path)
    const filePath = path.join(DOCS_DIR, docPath)
    
    // 安全检查
    if (!filePath.startsWith(DOCS_DIR)) {
      return res.status(400).json({ error: '无效的文件路径' })
    }
    
    if (!await fs.pathExists(filePath)) {
      return res.status(404).json({ error: '文档不存在' })
    }
    
    await fs.remove(filePath)
    
    res.json({ message: '删除成功' })
  } catch (error) {
    console.error('删除文档失败:', error)
    res.status(500).json({ error: '删除文档失败' })
  }
})

// 移动文档
app.post('/api/docs/move', async (req, res) => {
  try {
    const { sourcePath, targetPath } = req.body
    
    if (!sourcePath || !targetPath) {
      return res.status(400).json({ error: '缺少源路径或目标路径' })
    }
    
    const sourceFilePath = path.join(DOCS_DIR, sourcePath)
    const targetFilePath = path.join(DOCS_DIR, targetPath)
    
    // 安全检查
    if (!sourceFilePath.startsWith(DOCS_DIR) || !targetFilePath.startsWith(DOCS_DIR)) {
      return res.status(400).json({ error: '无效的文件路径' })
    }
    
    // 检查源文件是否存在
    if (!await fs.pathExists(sourceFilePath)) {
      return res.status(404).json({ error: '源文档不存在' })
    }
    
    // 检查目标文件是否已存在
    if (await fs.pathExists(targetFilePath)) {
      return res.status(400).json({ error: '目标位置已存在同名文件' })
    }
    
    // 确保目标目录存在
    await fs.ensureDir(path.dirname(targetFilePath))
    
    // 移动文件
    await fs.move(sourceFilePath, targetFilePath)
    
    res.json({ 
      message: '文档移动成功',
      sourcePath,
      targetPath
    })
  } catch (error) {
    console.error('移动文档失败:', error)
    res.status(500).json({ error: '移动文档失败' })
  }
})

// 文件监听（可选功能，用于实时同步）
const watcher = chokidar.watch(DOCS_DIR, {
  ignored: /(^|[\/\\])\../, // 忽略隐藏文件
  persistent: true
})

watcher.on('change', (filePath) => {
  console.log(`文档已更新: ${path.relative(DOCS_DIR, filePath)}`)
  // 这里可以添加WebSocket通知前端更新
})

// 错误处理中间件
app.use((error, req, res, next) => {
  console.error('服务器错误:', error)
  res.status(500).json({ error: '服务器内部错误' })
})

// 启动服务器
app.listen(PORT, () => {
  console.log(`技术文档服务器运行在 http://localhost:${PORT}`)
  console.log(`文档存储目录: ${DOCS_DIR}`)
})

module.exports = app