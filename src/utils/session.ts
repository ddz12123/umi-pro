import { LOGIN_PATH, isLoginPath } from '@/router/paths';
import { useTabsStore } from '@/stores/tabs';
import { clearAuth, getLoginUrl } from './auth';

/** 并发失效只退出一次；整页跳转后模块重新加载，标志自然复位。 */
let sessionEnded = false;

/** 统一清理登录态和页签并回到登录页；reason 供登录页展示一次性提示。 */
export function endSession(returnToCurrent = true, reason?: string) {
  if (sessionEnded) return;
  sessionEnded = true;
  const { pathname, search, hash } = window.location;
  clearAuth();
  useTabsStore.getState().reset();
  if (isLoginPath(pathname)) return;

  let target = returnToCurrent
    ? getLoginUrl(pathname, search, hash)
    : LOGIN_PATH;
  if (reason) {
    const url = new URL(target, window.location.origin);
    url.searchParams.set('reason', reason);
    target = url.pathname + url.search;
  }
  window.location.replace(target);
}
