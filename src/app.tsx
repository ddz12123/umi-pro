import ErrorBoundary from '@/components/ErrorBoundary';
import GlobalFeedback from '@/components/GlobalFeedback';
import SessionSync from '@/components/SessionSync';
import { appTheme } from '@/config/theme';
import { SYSTEM_NAME } from '@/constants/app';
import { getRouteTitle, matchRoute } from '@/router';
import { isLoginPath } from '@/router/paths';
import type { ClientRoute } from '@/router/runtime';
import { applyDynamicRoutes, bootstrapRoutes } from '@/router/runtime';
import { useRouteStore } from '@/stores/routes';
import { getAuthUser } from '@/utils/auth';
import { App, ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import React from 'react';

export { request } from '@/config/request';

/** Umi 初始状态：恢复用户信息、角色以及菜单/按钮两类权限。 */
export function getInitialState() {
  const user = getAuthUser();
  return {
    name: user?.nickName || user?.name || '',
    avatar: user?.avatar,
    roles: user?.roles ?? [],
    menuPermissions: user?.permissions?.menus ?? [],
    buttonPermissions: user?.permissions?.buttons ?? [],
  };
}

/**
 * Umi 渲染前钩子
 * 先取得当前账号的接口路由，patchClientRoutes 才能同步拿到完整路由树。
 */
export async function render(oldRender: () => void) {
  await bootstrapRoutes();
  oldRender();
}

/** Umi 客户端路由补丁：把接口业务路由挂到公共 Layout 下。 */
export function patchClientRoutes({ routes }: { routes: ClientRoute[] }) {
  applyDynamicRoutes(routes);
}

/** 根级 Provider：主题、中文语言包、全局反馈和异常兜底。 */
export function rootContainer(container: React.ReactNode) {
  return (
    <ConfigProvider locale={zhCN} theme={appTheme}>
      <App style={{ height: '100%' }}>
        <GlobalFeedback />
        <ErrorBoundary>
          <SessionSync />
          {container}
        </ErrorBoundary>
      </App>
    </ConfigProvider>
  );
}

/** 路由变化时同步浏览器标题：登录页、业务页、未知页分别处理。 */
export function onRouteChange({
  location,
}: {
  location: { pathname: string };
}) {
  const { pathname } = location;
  const routes = useRouteStore.getState().routes;
  const title = isLoginPath(pathname)
    ? '登录'
    : matchRoute(pathname, routes)
    ? undefined
    : '页面不存在';
  document.title = title
    ? title + ' · ' + SYSTEM_NAME
    : getRouteTitle(pathname, routes);
}
