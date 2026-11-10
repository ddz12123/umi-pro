import ErrorBoundary from '@/components/ErrorBoundary';
import ExceptionPage from '@/components/ExceptionPage';
import PageLoading from '@/components/PageLoading';
import { appConfig } from '@/config/app';
import { useRouteStore } from '@/stores/routes';
import { getLoginUrl, getToken } from '@/utils/auth';
import { Navigate, generatePath, useLocation, useParams } from '@umijs/max';
import type { ComponentType, LazyExoticComponent } from 'react';
import { Suspense, lazy } from 'react';
import type { PageComponentKey } from './page-registry';
import { PAGE_LOADERS, isPageComponentKey } from './page-registry';
import { NOT_FOUND_PATH } from './paths';
import { findGroupRoute, getGroupLandingPath, matchRoute } from './routes';

const components = new Map<
  PageComponentKey,
  LazyExoticComponent<ComponentType>
>();

function getPageComponent(key?: string) {
  if (!key || !isPageComponentKey(key)) return undefined;
  let component = components.get(key);
  if (!component) {
    component = lazy(PAGE_LOADERS[key]);
    components.set(key, component);
  }
  return component;
}

/** 本地与后端页面统一通过已验证的路由元数据渲染，不根据 URL 拼接组件路径。 */
export default function DynamicRoute() {
  const location = useLocation();
  const params = useParams();
  const routes = useRouteStore((state) => state.routes);
  const ready = useRouteStore((state) => state.ready);
  const routeToken = useRouteStore((state) => state.sessionToken);
  const error = useRouteStore((state) => state.error);
  const token = getToken();

  if (!token)
    return (
      <Navigate
        to={getLoginUrl(location.pathname, location.search, location.hash)}
        replace
      />
    );
  if (error)
    return (
      <ExceptionPage
        status={500}
        title="页面配置加载失败"
        description={error}
      />
    );
  if (appConfig.routing.source === 'remote' && (!ready || routeToken !== token))
    return <PageLoading />;

  const group = findGroupRoute(location.pathname, routes);
  if (group) {
    const landing = getGroupLandingPath(group);
    if (!landing) return <Navigate to={NOT_FOUND_PATH} replace />;
    const encodedParams = Object.fromEntries(
      Object.entries(params).map(([key, value]) => [
        key,
        value === undefined ? undefined : encodeURIComponent(value),
      ]),
    );
    const target =
      generatePath(landing, encodedParams) + location.search + location.hash;
    return <Navigate to={target} replace />;
  }

  const Component = getPageComponent(
    matchRoute(location.pathname, routes)?.route.component,
  );
  if (!Component) return <Navigate to={NOT_FOUND_PATH} replace />;

  return (
    <ErrorBoundary
      resetKey={location.pathname + location.search + location.hash}
    >
      <Suspense fallback={<PageLoading />}>
        <Component />
      </Suspense>
    </ErrorBoundary>
  );
}
