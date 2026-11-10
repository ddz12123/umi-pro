import { localRoutes } from './local-routes';
import { normalizeRoutes as normalizeRouteTree } from './normalize';
import { isPageComponentKey } from './page-registry';
import { LOGIN_PATH } from './paths';
import { staticRoutes } from './static-routes';
import type { AppRoute } from './types';

/** 页面配置与接口数据共用校验入口，状态层只保存已验证的数据。 */
export function normalizeRoutes(input: unknown): AppRoute[] {
  return normalizeRouteTree(input, {
    reservedPaths: new Set([
      LOGIN_PATH,
      ...staticRoutes.map((route) => route.path),
    ]),
    isComponent: isPageComponentKey,
  });
}

export function getLocalRoutes(): AppRoute[] {
  return [...staticRoutes, ...normalizeRoutes(localRoutes)];
}
