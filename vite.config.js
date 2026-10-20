import { defineConfig } from 'vite'

// base: './' —— 打包后使用相对路径，双击 dist/index.html 也不会丢样式
export default defineConfig({
  base: './',
  server: {
    port: 5173,
    open: true
  }
})
