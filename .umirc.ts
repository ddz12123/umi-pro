import { defineConfig } from '@umijs/max';
import { SYSTEM_NAME } from './src/constants/app';
import { umiRoutes } from './src/router/static-routes';

export default defineConfig({
  title: SYSTEM_NAME,
  favicons: ['/favicon.svg'],
  // 首屏关键 CSS，先于 JS 加载，避免刷新瞬间白屏
  links: [{ rel: 'stylesheet', href: '/boot.css' }],
  antd: {},
  // initialState 依赖 model 插件提供 useModel，不能去掉
  model: {},
  initialState: {},
  request: {},
  mock:
    process.env.NODE_ENV !== 'production' &&
    process.env.UMI_APP_MOCK !== 'false'
      ? {}
      : false,
  define: {
    APP_API_BASE_URL: process.env.UMI_APP_API_BASE_URL || '',
    APP_MOCK_ENABLED:
      process.env.NODE_ENV !== 'production' &&
      process.env.UMI_APP_MOCK !== 'false',
  },
  hash: true,
  // 可为 CI 指定独立产物目录。
  outputPath: process.env.UMI_BUILD_OUTPUT_PATH || 'dist',
  // 静态路由统一在 src/router/static-routes.ts 维护，这里只消费配置
  routes: umiRoutes,
  npmClient: 'pnpm',
  utoopack: {},
});
