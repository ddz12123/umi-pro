import { appConfig } from '../config/app';
import { localRoutes } from './local-routes';
import { normalizeRoutes } from './normalize';
import { DEFAULT_ROUTE_PATH, LOGIN_PATH, NOT_FOUND_PATH } from './paths';
import { flattenAppRoutes } from './tree';
import type { AppRoute, UmiRouteConfig } from './types';

export { DEFAULT_ROUTE_PATH, LOGIN_PATH, NOT_FOUND_PATH } from './paths';

/**
 * 框架保留路由。页面接入在 local-routes.ts，接口路由由 services/routes.ts 提供。
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

function toUmiRoute(route: AppRoute): UmiRouteConfig {
  const config: UmiRouteConfig = {
    path: route.path,
    name: route.name,
    // 本地与接口页面共用注册表，组件 key 可以独立于目录名。
    component: '@/router/DynamicRoute',
    wrappers: ['@/wrappers/auth'],
  };

  if (route.fullScreen || route.children?.length) config.layout = false;

  return config;
}

/** 本地路由在构建时注册，普通登录和退出不需要重载整个应用。 */
function flattenRoutes(routes: AppRoute[]): UmiRouteConfig[] {
  return flattenAppRoutes(routes).map(({ route }) => toUmiRoute(route));
}

const localUmiRoutes =
  appConfig.routing.source === 'local'
    ? flattenRoutes(
        normalizeRoutes(localRoutes, {
          reservedPaths: new Set([
            LOGIN_PATH,
            ...staticRoutes.map((route) => route.path),
          ]),
          isComponent: (key) => Boolean(key),
        }),
      )
    : [];

/** 登录 + 框架页面 + 可选本地页面 + 根重定向 + 全屏兜底。 */
export const umiRoutes: UmiRouteConfig[] = [
  {
    path: LOGIN_PATH,
    component: './Login',
    layout: false,
  },
  ...staticRoutes.map(toUmiRoute),
  ...localUmiRoutes,
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

/** 动态路由注入时用于跳过静态路由，避免重复挂载 */
export const staticRoutePaths = new Set([
  LOGIN_PATH,
  ...staticRoutes.map((route) => route.path),
  ...localUmiRoutes.map((route) => route.path),
]);
