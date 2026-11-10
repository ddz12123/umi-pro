import { appConfig } from '@/config/app';
import { LOGIN_PATH, isLoginPath } from '@/router/paths';
import { useRouteStore } from '@/stores/routes';
import { useTabsStore } from '@/stores/tabs';
import { history } from '@umijs/max';
import { clearAuth, getLoginUrl } from './auth';

/** 退出、会话失效和跨窗口退出共用同一套清理。 */
export function endSession(returnToCurrent = true) {
  const { pathname, search, hash } = window.location;
  clearAuth();
  useTabsStore.getState().reset();
  useRouteStore.getState().reset();
  if (isLoginPath(pathname)) return;

  const target = returnToCurrent
    ? getLoginUrl(pathname, search, hash)
    : LOGIN_PATH;
  if (appConfig.routing.source === 'remote') {
    // 清除运行时注入的用户路由。
    window.location.replace(target);
  } else {
    history.replace(target);
  }
}
