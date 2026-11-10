import { getLoginUrl, getToken } from '@/utils/auth';
import { Navigate, Outlet, useLocation } from '@umijs/max';

/** 同时保护布局内页面和全屏页面。 */
export default function AuthWrapper() {
  const { pathname, search, hash } = useLocation();
  return getToken() ? (
    <Outlet />
  ) : (
    <Navigate to={getLoginUrl(pathname, search, hash)} replace />
  );
}
