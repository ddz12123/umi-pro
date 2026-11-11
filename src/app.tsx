import ErrorBoundary from '@/components/ErrorBoundary';
import GlobalFeedback from '@/components/GlobalFeedback';
import SessionSync from '@/components/SessionSync';
import { appTheme } from '@/config/theme';
import { SYSTEM_NAME } from '@/constants/app';
import { getRouteTitle, matchRoute, staticRoutes } from '@/router';
import { isLoginPath } from '@/router/paths';
import { applyThemeCssVars, useThemeStore } from '@/stores/theme';
import { clearAuth, getAuthUser, isLogin } from '@/utils/auth';
import { startProgress } from '@/utils/progress';
import { App, ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import React from 'react';

export { request } from '@/config/request';

/** Umi 初始状态：恢复用户信息、角色以及菜单/按钮两类权限。 */
export function getInitialState() {
  const user = getAuthUser();
  // token 在但用户缓存损坏/丢失时清空登录态，避免陷入空权限死状态
  if (!user && isLogin()) clearAuth();
  return {
    name: user?.nickName || user?.name || '',
    avatar: user?.avatar,
    roles: user?.roles ?? [],
    menuPermissions: user?.permissions?.menus ?? [],
    buttonPermissions: user?.permissions?.buttons ?? [],
  };
}

/** 主题 Provider：把用户选择的主题色同步给 Ant Design 和自定义样式。 */
const AppProviders: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const primaryColor = useThemeStore((state) => state.primaryColor);

  React.useEffect(() => {
    applyThemeCssVars(primaryColor);
  }, [primaryColor]);

  const theme = React.useMemo(
    () => ({
      ...appTheme,
      token: {
        ...appTheme.token,
        colorPrimary: primaryColor,
        colorInfo: primaryColor,
        colorLink: primaryColor,
      },
    }),
    [primaryColor],
  );

  return (
    <ConfigProvider locale={zhCN} theme={theme}>
      <App style={{ height: '100%' }}>
        <GlobalFeedback />
        <ErrorBoundary>
          <SessionSync />
          {children}
        </ErrorBoundary>
      </App>
    </ConfigProvider>
  );
};

/** 根级 Provider：主题、中文语言包、全局反馈和异常兜底。 */
export function rootContainer(container: React.ReactNode) {
  return <AppProviders>{container}</AppProviders>;
}

/** 路由变化时同步浏览器标题：登录页、业务页、未知页分别处理。 */
export function onRouteChange({
  location,
}: {
  location: { pathname: string };
}) {
  const { pathname } = location;
  startProgress();
  if (isLoginPath(pathname)) {
    document.title = `登录 · ${SYSTEM_NAME}`;
    return;
  }
  document.title = matchRoute(pathname, staticRoutes)
    ? getRouteTitle(pathname, staticRoutes)
    : `页面不存在 · ${SYSTEM_NAME}`;
}
