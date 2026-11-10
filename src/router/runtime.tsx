import { RouteLoadCancelledError, useRouteStore } from '@/stores/routes';
import { getToken } from '@/utils/auth';
import React from 'react';
import DynamicRoute from './DynamicRoute';
import { staticRoutePaths } from './static-routes';
import { flattenAppRoutes } from './tree';

/**
 * Umi 创建 Router 前取得当前会话的路由
 * 如果加载过程中登录态切换，会放弃旧结果并继续加载新会话。
 */
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

/** Umi 注入后的 React Router 路由节点（只声明这里会用到的字段）。 */
export interface ClientRoute {
  id?: string;
  path?: string;
  index?: boolean;
  element?: React.ReactNode;
  children?: ClientRoute[];
  routes?: ClientRoute[];
}

/** 判断节点是否由本文件注入，重复渲染时先移除再重新生成。 */
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

/** 路径签名：忽略大小写、尾斜杠和动态参数名，用于冲突检测。 */
function pathSignature(path: string) {
  return (
    path
      .replace(/\/+$/, '')
      .toLowerCase()
      .replace(/:[^/]+/g, ':param') || '/'
  );
}

/** 收集现有客户端路由的完整路径，防止接口路由与静态路由冲突。 */
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
  // 先恢复 Umi 原始路由树，再基于它重新生成接口路由
  const next = withoutInjected(routes);
  const state = useRouteStore.getState();
  const token = getToken();
  // 没有登录态、接口路由未就绪或登录已换号时，只保留 Umi 静态路由
  if (!token || !state.ready || state.sessionToken !== token) {
    routes.splice(0, routes.length, ...next);
    return;
  }

  try {
    // 普通页面必须挂在全局 Layout 下，异常/全屏页则挂根层
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
      // 分组和全屏页放根层，普通页面放 Layout children
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
