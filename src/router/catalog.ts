import { normalizeRoutes as normalizeRouteTree } from './normalize';
import { isPageComponentKey } from './page-registry';
import { LOGIN_PATH } from './paths';
import { staticRoutes } from './static-routes';
import type { AppRoute } from './types';

/**
 * 接口路由的统一校验入口
 * - 登录路径、静态首页和异常页作为保留路径，接口不能再返回
 * - component 必须是 page-registry 中登记过的页面 key
 */
export function normalizeRoutes(input: unknown): AppRoute[] {
  return normalizeRouteTree(input, {
    reservedPaths: new Set([
      LOGIN_PATH,
      ...staticRoutes.map((route) => route.path),
    ]),
    isComponent: isPageComponentKey,
  });
}
