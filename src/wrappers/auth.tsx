import { useMenuRoutes } from '@/hooks/useMenuRoutes';
import { DEFAULT_ROUTE_PATH, matchRoute, staticRoutes } from '@/router';
import { getLoginUrl, getToken } from '@/utils/auth';
import { Navigate, Outlet, history, useLocation } from '@umijs/max';
import { Button, Result } from 'antd';

/** 同时保护布局内页面和全屏页面，并按 access 过滤结果校验页面权限。 */
export default function AuthWrapper() {
  const { pathname, search, hash } = useLocation();
  const menuRoutes = useMenuRoutes();

  if (!getToken()) {
    return <Navigate to={getLoginUrl(pathname, search, hash)} replace />;
  }

  // 路由存在但不在当前账号的 access 过滤结果里：直接展示 403
  if (matchRoute(pathname, staticRoutes) && !matchRoute(pathname, menuRoutes)) {
    return (
      <Result
        status="403"
        title="403"
        subTitle="当前账号没有访问该页面的权限，请联系管理员开通。"
        extra={
          <Button
            type="primary"
            onClick={() => history.push(DEFAULT_ROUTE_PATH)}
          >
            返回首页
          </Button>
        }
      />
    );
  }

  return <Outlet />;
}
