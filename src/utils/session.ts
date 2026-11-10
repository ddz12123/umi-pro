import { LOGIN_PATH, isLoginPath } from '@/router/paths';
import { useTabsStore } from '@/stores/tabs';
import { clearAuth, getLoginUrl } from './auth';

/**
 * 统一清理登录态和页签，并回到登录页
 */
export function endSession(returnToCurrent = true) {
  const { pathname, search, hash } = window.location;
  clearAuth();
  useTabsStore.getState().reset();
  if (isLoginPath(pathname)) return;

  const target = returnToCurrent
    ? getLoginUrl(pathname, search, hash)
    : LOGIN_PATH;
  window.location.replace(target);
}
