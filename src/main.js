import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import App from './App.vue'
import DocEditor from './views/DocEditor.vue'
import DocList from './views/DocList.vue'
import Login from './views/Login.vue'
import { auth, setupAuthGuard, setupAxiosInterceptors } from './utils/auth.js'

const routes = [
  { path: '/', redirect: '/docs' },
  { path: '/login', component: Login },
  { path: '/docs', component: DocList },
  { path: '/editor/:path?', component: DocEditor, props: true }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 初始化认证状态
auth.init()

// 设置路由守卫
setupAuthGuard(router)

// 设置axios拦截器
setupAxiosInterceptors(router)

const app = createApp(App)

// 注册所有图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.use(ElementPlus)
app.use(router)
app.mount('#app')