import { staticRoutes } from '@/router/static-routes';
import { filterRoutesByAccess } from '@/router/tree';
import type { AppRoute } from '@/router/types';
import { useMemo } from 'react';
import { useAccess } from './useAccess';

/** 按 access 过滤后的菜单路由，布局、搜索、首页等统一消费。 */
export function useMenuRoutes(): AppRoute[] {
  const { normalRouteFilter } = useAccess();

  return useMemo(
    () => filterRoutesByAccess(staticRoutes, normalRouteFilter),
    [normalRouteFilter],
  );
}
