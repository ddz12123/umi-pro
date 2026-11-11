import { useMenuRoutes } from '@/hooks/useMenuRoutes';
import { FORBIDDEN_PATH, matchRoute, staticRoutes } from '@/router';
import { getLoginUrl, getToken } from '@/utils/auth';
import { Navigate, Outlet, useLocation } from '@umijs/max';

/** 同时保护布局内页面和全屏页面，并按 access 过滤结果校验页面权限。 */
export default function AuthWrapper() {
  const { pathname, search, hash } = useLocation();
  const menuRoutes = useMenuRoutes();

  if (!getToken()) {
    return <Navigate to={getLoginUrl(pathname, search, hash)} replace />;
  }

  // 路由存在但不在当前账号的 access 过滤结果里：跳到全屏 403 页面
  if (matchRoute(pathname, staticRoutes) && !matchRoute(pathname, menuRoutes)) {
    return <Navigate to={FORBIDDEN_PATH} replace />;
  }

  return <Outlet />;
}
