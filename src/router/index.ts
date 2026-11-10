/**
 * 路由基础数据 / 工具统一出口
 * ------------------------------------------------------------------
 * - types.ts：路由元信息类型
 * - static-routes.ts：框架静态路由，并生成 Umi 路由配置
 * - routes.ts：菜单/面包屑/页签/标题匹配工具
 *
 * catalog / page-registry / DynamicRoute / runtime 从子路径直接引用，
 * 避免 router -> stores -> router 的 barrel 循环依赖。
 */
export * from './routes';
export * from './static-routes';
export * from './types';
