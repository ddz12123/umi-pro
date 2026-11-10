import accessFactory from '@/access';
import { staticRoutes } from '@/router/static-routes';
import { filterRoutesByAccess } from '@/router/tree';
import type { AppRoute } from '@/router/types';
import { useModel } from '@umijs/max';
import { useMemo } from 'react';

const EMPTY_PERMISSIONS: string[] = [];

/** 按 access 过滤后的菜单路由，布局、搜索、首页等统一消费。 */
export function useMenuRoutes(): AppRoute[] {
  const { initialState } = useModel('@@initialState');
  const menuPermissions = initialState?.menuPermissions ?? EMPTY_PERMISSIONS;
  const buttonPermissions =
    initialState?.buttonPermissions ?? EMPTY_PERMISSIONS;

  return useMemo(() => {
    const access = accessFactory({ menuPermissions, buttonPermissions });
    return filterRoutesByAccess(staticRoutes, access.normalRouteFilter);
  }, [menuPermissions, buttonPermissions]);
}
