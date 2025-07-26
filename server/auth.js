const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const fs = require('fs-extra')
const path = require('path')

// 加载配置
const configPath = path.join(__dirname, '../config.json')
let config = {}

try {
  config = require(configPath)
} catch (error) {
  console.error('无法加载配置文件:', error)
  process.exit(1)
}

// 验证用户凭据
const validateUser = async (username, password) => {
  const users = config.auth.users || []
  const user = users.find(u => u.username === username)
  
  if (!user) {
    return null
  }
  
  // 简单的密码比较（在生产环境中应该使用bcrypt）
  if (user.password === password) {
    return {
      username: user.username,
      role: user.role
    }
  }
  
  return null
}

// 生成JWT token
const generateToken = (user) => {
  return jwt.sign(
    { 
      username: user.username, 
      role: user.role 
    },
    config.auth.jwtSecret,
    { 
      expiresIn: config.auth.tokenExpiry || '24h' 
    }
  )
}

// 验证JWT token
const verifyToken = (token) => {
  try {
    return jwt.verify(token, config.auth.jwtSecret)
  } catch (error) {
    return null
  }
}

// 认证中间件（已禁用，所有接口都不需要认证）
const authMiddleware = (req, res, next) => {
  // 跳过所有认证检查，直接通过
  next()
}

// 登录接口
const loginHandler = async (req, res) => {
  try {
    const { username, password } = req.body
    
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: '用户名和密码不能为空'
      })
    }
    
    const user = await validateUser(username, password)
    if (!user) {
      return res.status(401).json({
        success: false,
        message: '用户名或密码错误'
      })
    }
    
    const token = generateToken(user)
    
    res.json({
      success: true,
      message: '登录成功',
      token,
      user: {
        username: user.username,
        role: user.role
      }
    })
  } catch (error) {
    console.error('登录错误:', error)
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    })
  }
}

// 获取用户信息接口
const getUserInfoHandler = (req, res) => {
  res.json({
    success: true,
    user: req.user
  })
}

// 更新配置
const updateConfig = async (newConfig) => {
  try {
    config = { ...config, ...newConfig }
    await fs.writeFile(configPath, JSON.stringify(config, null, 2))
    return true
  } catch (error) {
    console.error('更新配置失败:', error)
    return false
  }
}

// 添加用户
const addUser = async (username, password, role = 'user') => {
  try {
    const users = config.auth.users || []
    
    // 检查用户是否已存在
    if (users.find(u => u.username === username)) {
      return { success: false, message: '用户已存在' }
    }
    
    // 添加新用户
    users.push({ username, password, role })
    
    const success = await updateConfig({
      auth: { ...config.auth, users }
    })
    
    if (success) {
      return { success: true, message: '用户添加成功' }
    } else {
      return { success: false, message: '保存配置失败' }
    }
  } catch (error) {
    console.error('添加用户失败:', error)
    return { success: false, message: '添加用户失败' }
  }
}

// 删除用户
const deleteUser = async (username) => {
  try {
    const users = config.auth.users || []
    const filteredUsers = users.filter(u => u.username !== username)
    
    if (filteredUsers.length === users.length) {
      return { success: false, message: '用户不存在' }
    }
    
    const success = await updateConfig({
      auth: { ...config.auth, users: filteredUsers }
    })
    
    if (success) {
      return { success: true, message: '用户删除成功' }
    } else {
      return { success: false, message: '保存配置失败' }
    }
  } catch (error) {
    console.error('删除用户失败:', error)
    return { success: false, message: '删除用户失败' }
  }
}

module.exports = {
  authMiddleware,
  loginHandler,
  getUserInfoHandler,
  addUser,
  deleteUser,
  config
}