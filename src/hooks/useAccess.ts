import accessFactory from '@/access';
import type { AuthRole } from '@/utils/auth';
import { useModel } from '@umijs/max';
import { useMemo } from 'react';

const EMPTY_PERMISSIONS: string[] = [];
const EMPTY_ROLES: AuthRole[] = [];

/**
 * Ant Design Pro 风格的统一权限入口
 * - normalRouteFilter / hasMenuPermission 控制菜单和页面访问
 * - hasPermission 控制页面内的新增、编辑、删除、授权等操作
 */
export function useAccess() {
  const { initialState } = useModel('@@initialState');
  const roles = initialState?.roles ?? EMPTY_ROLES;
  const menuPermissions = initialState?.menuPermissions ?? EMPTY_PERMISSIONS;
  const buttonPermissions =
    initialState?.buttonPermissions ?? EMPTY_PERMISSIONS;

  return useMemo(() => {
    const access = accessFactory({ menuPermissions, buttonPermissions });
    return {
      ...access,
      roles,
      menuPermissions,
      buttonPermissions,
      hasPermission: access.hasButtonAccess,
      hasAnyPermission: (codes: string[]) =>
        codes.some((code) => access.hasButtonAccess(code)),
      hasMenuPermission: access.hasMenuAccess,
    };
  }, [roles, menuPermissions, buttonPermissions]);
}
