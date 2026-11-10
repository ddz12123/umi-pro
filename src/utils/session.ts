import { LOGIN_PATH, isLoginPath } from '@/router/paths';
import { useRouteStore } from '@/stores/routes';
import { useTabsStore } from '@/stores/tabs';
import { clearAuth, getLoginUrl } from './auth';

/**
 * 统一清理登录态、页签和动态路由，并回到登录页
 * 动态路由已经注入 React Router，整页跳转才能彻底重建路由表。
 */
export function endSession(returnToCurrent = true) {
  const { pathname, search, hash } = window.location;
  clearAuth();
  useTabsStore.getState().reset();
  useRouteStore.getState().reset();
  if (isLoginPath(pathname)) return;

  const target = returnToCurrent
    ? getLoginUrl(pathname, search, hash)
    : LOGIN_PATH;
  window.location.replace(target);
}
