import type { AppRoute } from '@/router/types';

/** initialState 中参与权限判断的字段 */
export interface AccessInitialState {
  menuPermissions?: string[];
  buttonPermissions?: string[];
}

/**
 * Ant Design Pro 风格的 access 定义
 * ------------------------------------------------------------------
 * - normalRouteFilter：菜单/路由过滤，路由未配置 access 时默认放行
 * - hasMenuAccess：页面级访问判断
 * - hasButtonAccess：页面内按钮权限判断
 */
export default function access(initialState?: AccessInitialState) {
  const menuPermissions = new Set(initialState?.menuPermissions ?? []);
  const buttonPermissions = new Set(initialState?.buttonPermissions ?? []);

  return {
    normalRouteFilter: (route: AppRoute) =>
      !route.access || menuPermissions.has(route.access),
    hasMenuAccess: (code?: string) => !code || menuPermissions.has(code),
    hasButtonAccess: (code?: string) => !code || buttonPermissions.has(code),
  };
}
