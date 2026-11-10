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

export function getInitialState() {
  const user = getAuthUser();
  return { name: user?.nickName || user?.name || '', avatar: user?.avatar };
}

export async function render(oldRender: () => void) {
  await bootstrapRoutes();
  oldRender();
}

export function patchClientRoutes({ routes }: { routes: ClientRoute[] }) {
  applyDynamicRoutes(routes);
}

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
