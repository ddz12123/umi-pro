/**
 * 路由基础数据 / 工具统一出口
 * ------------------------------------------------------------------
 * - types.ts：路由元信息类型
 * - static-routes.ts：静态路由与 Umi 路由配置
 * - routes.ts：菜单/面包屑/页签/标题匹配工具
 *
 * 页面路由全部前端静态声明；接口只返回菜单权限码，
 * src/access.ts + hooks 按权限过滤后供布局、菜单和搜索复用。
 */
export * from './routes';
export * from './static-routes';
export * from './types';
