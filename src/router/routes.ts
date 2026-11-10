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

/** 为菜单、面包屑、搜索和路由匹配建立一次性索引。 */
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

/** 使用 React Router 的匹配规则解析路径，保证与真实路由行为一致。 */
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

/** 当前地址是否为菜单分组，用于分组地址自动跳到默认子页面。 */
export function findGroupRoute(
  pathname: string,
  routes: AppRoute[] = staticRoutes,
): AppRoute | undefined {
  const matched = resolveRoute(pathname, routes);
  return matched?.route.children?.length ? matched.route : undefined;
}

/** 面包屑链路，过滤掉显式隐藏的层级。 */
export function getBreadcrumbChain(
  pathname: string,
  routes: AppRoute[] = staticRoutes,
): AppRoute[] {
  return (matchRoute(pathname, routes)?.chain ?? []).filter(
    (route) => !route.hideInBreadcrumb,
  );
}

/** 侧边栏需要展开的父级路径。 */
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

/** 固定页签路径，只保留无需参数且布局内可见的页面。 */
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

/** 浏览器标题：页面名称 + 系统名称。 */
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

/** 顶部搜索索引，排除隐藏菜单和带参数的详情页。 */
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
