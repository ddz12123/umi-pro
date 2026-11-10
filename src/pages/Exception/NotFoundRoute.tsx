import ExceptionPage from '@/components/ExceptionPage';
import { getLoginUrl, getToken } from '@/utils/auth';
import { Navigate, useLocation } from '@umijs/max';
import React from 'react';

/**
 * 全屏 404 兜底路由（不参与公共布局）
 * 未登录时先回登录页，避免直接访问业务地址时看到 404。
 */
const NotFoundRoute: React.FC = () => {
  const { pathname, search, hash } = useLocation();

  if (!getToken()) {
    return <Navigate to={getLoginUrl(pathname, search, hash)} replace />;
  }

  return <ExceptionPage status={404} />;
};

export default NotFoundRoute;
