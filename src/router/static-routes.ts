import { DEFAULT_ROUTE_PATH, LOGIN_PATH, NOT_FOUND_PATH } from './paths';
import type { AppRoute, UmiRouteConfig } from './types';

export { DEFAULT_ROUTE_PATH, LOGIN_PATH, NOT_FOUND_PATH } from './paths';

/**
 * 全量静态路由
 * ------------------------------------------------------------------
 * 页面路由全部在前端声明，构建期确定；
 * 接口只返回菜单权限码，前端通过 access.ts 过滤菜单和访问权限。
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
    name: '系统管理',
    path: '/system',
    icon: 'system',
    order: 10,
    children: [
      {
        name: '用户管理',
        path: '/system/user',
        component: 'System/User',
        icon: 'user',
        layoutMode: 'fill',
        access: 'system:user:list',
        order: 1,
      },
      {
        name: '角色管理',
        path: '/system/role',
        component: 'System/Role',
        icon: 'role',
        layoutMode: 'fill',
        access: 'system:role:list',
        order: 2,
      },
      {
        name: '权限管理',
        path: '/system/permission',
        component: 'System/Permission',
        icon: 'menu',
        layoutMode: 'fill',
        access: 'system:permission:list',
        order: 3,
      },
    ],
  },
  {
    name: '列表示例',
    path: '/example',
    component: 'Example',
    icon: 'table',
    layoutMode: 'fill',
    access: 'example:list',
    order: 20,
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
 * AppRoute -> Umi 配置（分组会递归展开子路由）
 * - 普通页面直接指向真实组件，由 Umi 按路由懒加载
 * - 分组没有自己的页面，交给 GroupRedirect 跳到默认子页面
 * - 全屏异常页不套公共 Layout
 */
function toUmiRoutes(route: AppRoute): UmiRouteConfig[] {
  if (route.children?.length) {
    return [
      {
        path: route.path,
        name: route.name,
        component: '@/router/GroupRedirect',
        wrappers: ['@/wrappers/auth'],
      },
      ...route.children.flatMap(toUmiRoutes),
    ];
  }

  const config: UmiRouteConfig = {
    path: route.path,
    name: route.name,
    component: `./${route.component}`,
    wrappers: ['@/wrappers/auth'],
  };
  if (route.fullScreen) config.layout = false;
  return [config];
}

/** 交给 .umirc.ts 的静态路由配置：登录 + 业务页面 + 根重定向 + 全屏兜底 */
export const umiRoutes: UmiRouteConfig[] = [
  {
    path: LOGIN_PATH,
    component: './Login',
    layout: false,
  },
  ...staticRoutes.flatMap(toUmiRoutes),
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
