import type { PageComponentKey } from './page-registry';

/** 页面布局模式：fill 撑满（表格页），page 自身滚动（工作台/详情页） */
export type LayoutMode = 'fill' | 'page';

/** 图标 key 白名单，统一在 src/layouts/components/menu-icons.tsx 中映射。 */
export const routeIconKeys = [
  'dashboard',
  'table',
  'system',
  'user',
  'role',
  'menu',
] as const;
export type RouteIcon = (typeof routeIconKeys)[number];

export interface AppRoute {
  /** 菜单、面包屑、页签、浏览器标题统一使用的名称 */
  name: string;
  /** 绝对路径 */
  path: string;
  /**
   * 页面组件注册表 key（见 src/router/page-registry.ts）
   * 动态路由只传 key，真正渲染哪个组件由前端注册表决定
   */
  component?: PageComponentKey;
  icon?: RouteIcon;
  layoutMode?: LayoutMode;
  /** 菜单排序，数字越小越靠前；不传时保持后端返回顺序 */
  order?: number;
  /** 详情页等隐藏路由需要高亮的菜单路径 */
  activeMenu?: string;
  /** 固定页签，不可关闭（如工作台） */
  affix?: boolean;
  /** 不在侧边栏展示 */
  hideInMenu?: boolean;
  /** 不在面包屑展示 */
  hideInBreadcrumb?: boolean;
  /** 不生成页签 */
  hideInTabs?: boolean;
  /** 不进入公共布局；分组设置后默认传递给子节点，子节点可以显式覆盖。 */
  fullScreen?: boolean;
  children?: AppRoute[];
}

/** 静态路由生成给 Umi 的配置结构 */
export interface UmiRouteConfig {
  path: string;
  name?: string;
  component?: string;
  redirect?: string;
  layout?: boolean;
  wrappers?: string[];
}
