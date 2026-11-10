import { useMenuRoutes } from '@/hooks/useMenuRoutes';
import { Navigate, useLocation } from '@umijs/max';
import React from 'react';
import { NOT_FOUND_PATH } from './paths';
import { findGroupRoute } from './routes';
import { getGroupLandingPath } from './tree';

/** 分组路径没有自己的页面，按当前账号可见的子菜单跳到默认页面。 */
const GroupRedirect: React.FC = () => {
  const { pathname, search, hash } = useLocation();
  const routes = useMenuRoutes();
  const group = findGroupRoute(pathname, routes);
  const landing = group ? getGroupLandingPath(group) : undefined;

  return <Navigate to={(landing ?? NOT_FOUND_PATH) + search + hash} replace />;
};

export default GroupRedirect;
