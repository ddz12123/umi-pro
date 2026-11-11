import { appConfig } from '@/config/app';
import { isLoginPath } from '@/router/paths';
import { useTabsStore } from '@/stores/tabs';
import { AUTH_STORAGE_KEY, getToken } from '@/utils/auth';
import { endSession } from '@/utils/session';
import { useEffect } from 'react';

/** 会话属于应用，全屏页面和登录页面也参与跨窗口同步。 */
export default function SessionSync() {
  useEffect(() => {
    const checkExpiry = () => {
      if (!getToken() && !isLoginPath(window.location.pathname))
        endSession(true, 'expired');
    };
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== AUTH_STORAGE_KEY && event.key !== null) return;
      try {
        const storage =
          appConfig.auth.storage === 'local'
            ? window.localStorage
            : window.sessionStorage;
        if (event.storageArea !== storage) return;
      } catch {
        return;
      }
      if (!getToken()) {
        endSession();
      } else if (event.oldValue !== event.newValue) {
        useTabsStore.getState().reset();
        // 另一个窗口换号后整页刷新，按新账号权限重建菜单
        window.location.reload();
      }
    };
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') checkExpiry();
    };
    window.addEventListener('storage', handleStorage);
    document.addEventListener('visibilitychange', handleVisibility);
    const timer = window.setInterval(checkExpiry, 30_000);
    return () => {
      window.removeEventListener('storage', handleStorage);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.clearInterval(timer);
    };
  }, []);
  return null;
}
