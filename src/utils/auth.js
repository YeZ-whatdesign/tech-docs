import axios from 'axios'
import { ElMessage } from 'element-plus'

// 认证状态管理
export const auth = {
  // 检查是否已登录
  isAuthenticated() {
    const token = localStorage.getItem('auth_token')
    return !!token
  },

  // 获取token
  getToken() {
    return localStorage.getItem('auth_token')
  },

  // 设置token
  setToken(token) {
    localStorage.setItem('auth_token', token)
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
  },

  // 清除认证信息
  logout() {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('remember_me')
    delete axios.defaults.headers.common['Authorization']
  },

  // 初始化认证状态
  init() {
    const token = this.getToken()
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
    }
  }
}

// 路由守卫
export function setupAuthGuard(router) {
  router.beforeEach((to, from, next) => {
    // 登录页面不需要认证
    if (to.path === '/login') {
      // 如果已经登录，重定向到文档列表
      if (auth.isAuthenticated()) {
        next('/docs')
      } else {
        next()
      }
      return
    }

    // 其他页面需要认证
    if (!auth.isAuthenticated()) {
      next({
        path: '/login',
        query: { redirect: to.fullPath }
      })
    } else {
      next()
    }
  })
}

// axios 响应拦截器，处理认证失败
export function setupAxiosInterceptors(router) {
  axios.interceptors.response.use(
    response => response,
    error => {
      if (error.response?.status === 401) {
        // token过期或无效
        auth.logout()
        ElMessage.error('登录已过期，请重新登录')
        router.push('/login')
      }
      return Promise.reject(error)
    }
  )
}