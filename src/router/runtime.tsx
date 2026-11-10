import { appConfig } from '@/config/app';
import { RouteLoadCancelledError, useRouteStore } from '@/stores/routes';
import { getToken } from '@/utils/auth';
import React from 'react';
import DynamicRoute from './DynamicRoute';
import { staticRoutePaths } from './static-routes';
import { flattenAppRoutes } from './tree';

/** Umi 创建 Router 前取得当前会话的路由；初始化中换号时改为加载新会话。 */
export async function bootstrapRoutes() {
  while (getToken()) {
    const token = getToken();
    try {
      await useRouteStore.getState().loadRoutes();
      return;
    } catch (error) {
      if (
        error instanceof RouteLoadCancelledError &&
        getToken() &&
        getToken() !== token
      )
        continue;
      // error 状态交给页面显示，保证异常时仍能挂载登录和重试入口。
      return;
    }
  }
  useRouteStore.getState().reset();
}

export interface ClientRoute {
  id?: string;
  path?: string;
  index?: boolean;
  element?: React.ReactNode;
  children?: ClientRoute[];
  routes?: ClientRoute[];
}

function isInjected(route: ClientRoute) {
  return (
    route.id?.startsWith('dynamic-page:') ||
    route.id?.startsWith('dynamic-group:')
  );
}

/** 仅移除框架注入的节点，保留 Umi 的静态路由与 wrappers。 */
function withoutInjected(nodes: ClientRoute[]): ClientRoute[] {
  return nodes
    .filter((route) => !isInjected(route))
    .map((route) => {
      if (!route.children) return { ...route };
      const children = withoutInjected(route.children);
      return { ...route, children, routes: children };
    });
}

function findLayout(nodes: ClientRoute[]): ClientRoute | undefined {
  for (const route of nodes) {
    if (route.id === '@@/global-layout') return route;
    const nested = findLayout(route.children ?? []);
    if (nested) return nested;
  }
  return undefined;
}

function pathSignature(path: string) {
  return (
    path
      .replace(/\/+$/, '')
      .toLowerCase()
      .replace(/:[^/]+/g, ':param') || '/'
  );
}

function collectPaths(
  nodes: ClientRoute[],
  parent = '',
  paths = new Set<string>(),
) {
  for (const route of nodes) {
    const path = route.path?.startsWith('/')
      ? route.path
      : parent + '/' + (route.path ?? '');
    if (route.path && route.path !== '*') paths.add(pathSignature(path));
    collectPaths(route.children ?? [], path.replace(/\/+$/, ''), paths);
  }
  return paths;
}

/** 每次基于静态树重新生成接口路由，路径删除、组件变更和布局变更都可正确替换。 */
export function applyDynamicRoutes(routes: ClientRoute[]) {
  const next = withoutInjected(routes);
  const state = useRouteStore.getState();
  const token = getToken();
  if (
    appConfig.routing.source !== 'remote' ||
    !token ||
    !state.ready ||
    state.sessionToken !== token
  ) {
    routes.splice(0, routes.length, ...next);
    return;
  }

  try {
    const layout = findLayout(next);
    if (!layout) throw new Error('未找到 Umi 全局布局，无法注册页面路由');
    const paths = collectPaths(next);
    const children = [...(layout.children ?? [])];
    for (const { route } of flattenAppRoutes(state.routes)) {
      if (staticRoutePaths.has(route.path)) continue;
      if (paths.has(pathSignature(route.path)))
        throw new Error('客户端路由路径冲突：' + route.path);
      paths.add(pathSignature(route.path));
      const group = Boolean(route.children?.length);
      const target = route.fullScreen || group ? next : children;
      target.push({
        id: (group ? 'dynamic-group:' : 'dynamic-page:') + route.path,
        path: route.path,
        element: <DynamicRoute />,
      });
    }
    layout.children = children;
    layout.routes = children;
    routes.splice(0, routes.length, ...next);
  } catch (error) {
    state.setError(error instanceof Error ? error.message : '页面路由注册失败');
    routes.splice(0, routes.length, ...withoutInjected(next));
  }
}
