import type { AppRoute } from './types';

export interface RouteEntry {
  route: AppRoute;
  chain: AppRoute[];
}

/** 菜单层级只描述导航关系，注册时使用归一化后的完整路径。 */
export function flattenAppRoutes(
  routes: AppRoute[],
  parents: AppRoute[] = [],
): RouteEntry[] {
  return routes.flatMap((route) => {
    const chain = [...parents, route];
    return [{ route, chain }, ...flattenAppRoutes(route.children ?? [], chain)];
  });
}

/** 提取路径中的动态参数名，例如 /user/:id -> ['id']。 */
export function getPathParameters(path: string): string[] {
  return path
    .split('/')
    .filter((segment) => segment.startsWith(':'))
    .map((segment) => segment.slice(1));
}

/** 是否为无通配符、无动态参数、可直接访问的路径。 */
export function isConcretePath(path: string): boolean {
  return !path.includes('*') && getPathParameters(path).length === 0;
}

/** 分组只跳转到无需额外参数的页面，优先选择可见菜单。 */
export function getGroupLandingPath(group: AppRoute): string | undefined {
  const parameters = new Set(getPathParameters(group.path));
  const leaves = flattenAppRoutes(group.children ?? []).filter(
    ({ route }) =>
      route.component &&
      !route.children?.length &&
      getPathParameters(route.path).every((name) => parameters.has(name)),
  );
  return (
    leaves.find(({ chain }) => !chain.some((route) => route.hideInMenu)) ??
    leaves[0]
  )?.route.path;
}

/** 按 access 规则递归过滤路由；子节点全部被过滤时，分组也一并移除。 */
export function filterRoutesByAccess(
  routes: AppRoute[],
  canAccess: (route: AppRoute) => boolean,
): AppRoute[] {
  return routes.flatMap((route) => {
    if (!canAccess(route)) return [];
    if (!route.children?.length) return [route];
    const children = filterRoutesByAccess(route.children, canAccess);
    return children.length ? [{ ...route, children }] : [];
  });
}
