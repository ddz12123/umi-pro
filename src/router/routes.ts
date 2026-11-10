import { matchRoutes } from '@umijs/max';
import { SYSTEM_NAME } from '../constants/app';
import { staticRoutes } from './static-routes';
import { flattenAppRoutes, getGroupLandingPath, isConcretePath } from './tree';
import type { AppRoute } from './types';

export { getGroupLandingPath } from './tree';

/** 菜单、面包屑、页签与实际注册路由共用同一份索引和 Router 匹配规则。 */
export interface RouteMatch {
  route: AppRoute;
  chain: AppRoute[];
}

function buildRouteIndex(routes: AppRoute[]) {
  const entries = flattenAppRoutes(routes);
  return {
    entries,
    leaves: entries.filter(
      ({ route }) => route.component && !route.children?.length,
    ),
    records: entries.map((entry) => ({ path: entry.route.path })),
    byPath: new Map(entries.map((entry) => [entry.route.path, entry] as const)),
  };
}

const routeIndexCache = new WeakMap<
  AppRoute[],
  ReturnType<typeof buildRouteIndex>
>();

function getRouteIndex(routes: AppRoute[]) {
  let index = routeIndexCache.get(routes);
  if (!index) {
    index = buildRouteIndex(routes);
    routeIndexCache.set(routes, index);
  }
  return index;
}

function resolveRoute(
  path: string,
  routes: AppRoute[],
): RouteMatch | undefined {
  const pathname = path.split(/[?#]/)[0] || '/';
  const index = getRouteIndex(routes);
  const matches = matchRoutes(index.records, { pathname });
  const matchedPath = matches?.[matches.length - 1]?.route.path;
  return matchedPath ? index.byPath.get(matchedPath) : undefined;
}

/** Router 负责大小写、URL 编码与参数匹配；分组地址映射到其默认页面。 */
export function matchRoute(
  pathname: string,
  routes: AppRoute[] = staticRoutes,
): RouteMatch | undefined {
  const matched = resolveRoute(pathname, routes);
  if (!matched?.route.children?.length) return matched;
  const landing = getGroupLandingPath(matched.route);
  return getRouteIndex(routes).leaves.find(
    ({ route }) => route.path === landing,
  );
}

export function findGroupRoute(
  pathname: string,
  routes: AppRoute[] = staticRoutes,
): AppRoute | undefined {
  const matched = resolveRoute(pathname, routes);
  return matched?.route.children?.length ? matched.route : undefined;
}

export function getBreadcrumbChain(
  pathname: string,
  routes: AppRoute[] = staticRoutes,
): AppRoute[] {
  return (matchRoute(pathname, routes)?.chain ?? []).filter(
    (route) => !route.hideInBreadcrumb,
  );
}

export function getParentPaths(
  pathname: string,
  routes: AppRoute[] = staticRoutes,
): string[] {
  return (matchRoute(pathname, routes)?.chain ?? [])
    .slice(0, -1)
    .filter((route) => Boolean(route.children?.length))
    .map((route) => route.path);
}

/** 导航快捷入口只返回可直接访问的地址，详情页面由调用方填入参数。 */
export function findRouteByComponent(
  component: string,
  routes: AppRoute[] = staticRoutes,
): AppRoute | undefined {
  const key = component.replace(/^\.\//, '');
  return getRouteIndex(routes).leaves.find(
    ({ route }) => route.component === key && isConcretePath(route.path),
  )?.route;
}

export function getAffixPaths(routes: AppRoute[] = staticRoutes): string[] {
  return getRouteIndex(routes)
    .leaves.filter(
      ({ route }) =>
        route.affix &&
        isConcretePath(route.path) &&
        !route.fullScreen &&
        !route.hideInTabs,
    )
    .map(({ route }) => route.path);
}

export function getRouteTitle(
  pathname: string,
  routes: AppRoute[] = staticRoutes,
): string {
  const route = matchRoute(pathname, routes)?.route;
  return route ? route.name + ' · ' + SYSTEM_NAME : SYSTEM_NAME;
}

export interface SearchEntry {
  path: string;
  name: string;
  trail: string[];
}

export function getSearchEntries(
  routes: AppRoute[] = staticRoutes,
): SearchEntry[] {
  return getRouteIndex(routes)
    .leaves.filter(
      ({ route, chain }) =>
        !chain.some((node) => node.hideInMenu) && isConcretePath(route.path),
    )
    .map(({ route, chain }) => ({
      path: route.path,
      name: route.name,
      trail: chain.slice(0, -1).map((parent) => parent.name),
    }));
}
