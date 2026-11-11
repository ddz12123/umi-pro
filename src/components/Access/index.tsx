import { useAccess } from '@/hooks/useAccess';
import React from 'react';

export interface AccessProps {
  /** 按钮权限码，有权限时渲染 children */
  code?: string;
  /** 多个权限码，配合 every 决定组合方式 */
  codes?: string[];
  /** true 要求全部命中，默认任一命中 */
  every?: boolean;
  /** 无权限时渲染的内容 */
  fallback?: React.ReactNode;
  children?: React.ReactNode;
}

/** 声明式权限门：无权限直接隐藏（或渲染 fallback），不做禁用降级 */
const Access: React.FC<AccessProps> = ({
  code,
  codes,
  every = false,
  fallback = null,
  children,
}) => {
  const { hasPermission, hasAnyPermission } = useAccess();
  const accessible = codes?.length
    ? every
      ? codes.every((item) => hasPermission(item))
      : hasAnyPermission(codes)
    : hasPermission(code);

  return <>{accessible ? children : fallback}</>;
};

export default Access;
