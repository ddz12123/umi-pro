/**
 * 路由基础数据 / 工具统一出口
 * ------------------------------------------------------------------
 * - types.ts：路由元信息类型
 * - static-routes.ts：框架保留路由，并生成 Umi 路由配置
 * - local-routes.ts：本地页面配置
 * - routes.ts：菜单/面包屑/页签/标题匹配工具
 *
 * page-registry.ts / DynamicRoute.tsx / runtime.ts 从子路径直接引用，
 * 避免 router -> stores -> router 的 barrel 循环依赖。
 */
export * from './routes';
export * from './static-routes';
export * from './types';
