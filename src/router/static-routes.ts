import { DEFAULT_ROUTE_PATH, LOGIN_PATH, NOT_FOUND_PATH } from './paths';
import type { AppRoute, UmiRouteConfig } from './types';

export { DEFAULT_ROUTE_PATH, LOGIN_PATH, NOT_FOUND_PATH } from './paths';

/**
 * 静态路由：框架保留的首页和异常页
 * ------------------------------------------------------------------
 * - 首页固定存在，作为登录后的默认落点
 * - 异常页全屏展示，hideInMenu 保证不出现在侧边栏
 * - 其他业务页面全部由 /api/v1/routes 动态下发，不在这里维护
 */
export const staticRoutes: AppRoute[] = [
  {
    name: '首页',
    path: DEFAULT_ROUTE_PATH,
    component: 'Home',
    icon: 'dashboard',
    layoutMode: 'page',
    affix: true,
    order: 1,
  },
  {
    name: '404 页面',
    path: NOT_FOUND_PATH,
    component: 'Exception/404',
    layoutMode: 'page',
    hideInMenu: true,
    hideInTabs: true,
    fullScreen: true,
  },
  {
    name: '500 页面',
    path: '/exception/500',
    component: 'Exception/500',
    layoutMode: 'page',
    hideInMenu: true,
    hideInTabs: true,
    fullScreen: true,
  },
];

/**
 * AppRoute -> Umi 配置
 * 所有页面统一交给 DynamicRoute 渲染：它负责鉴权、等待接口路由、
 * 分组重定向和按 component key 懒加载真实页面。
 */
function toUmiRoute(route: AppRoute): UmiRouteConfig {
  const config: UmiRouteConfig = {
    path: route.path,
    name: route.name,
    component: '@/router/DynamicRoute',
    wrappers: ['@/wrappers/auth'],
  };

  // 全屏异常页和菜单分组不能套公共 Layout
  if (route.fullScreen || route.children?.length) config.layout = false;

  return config;
}

/** 交给 .umirc.ts 的静态路由配置：登录 + 首页/异常页 + 根重定向 + 全屏兜底 */
export const umiRoutes: UmiRouteConfig[] = [
  {
    path: LOGIN_PATH,
    component: './Login',
    layout: false,
  },
  ...staticRoutes.map(toUmiRoute),
  {
    path: '/',
    redirect: DEFAULT_ROUTE_PATH,
  },
  {
    path: '*',
    component: './Exception/NotFoundRoute',
    layout: false,
  },
];

/** 动态路由注入时用于跳过静态路由，避免同一路径被注册两次 */
export const staticRoutePaths = new Set([
  LOGIN_PATH,
  ...staticRoutes.map((route) => route.path),
]);
