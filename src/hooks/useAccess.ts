import accessFactory from '@/access';
import { useModel } from '@umijs/max';
import { useMemo } from 'react';

const EMPTY_PERMISSIONS: string[] = [];

/**
 * Ant Design Pro 风格的统一权限入口
 * - normalRouteFilter / hasMenuPermission 控制菜单和页面访问
 * - hasPermission 控制页面内的新增、编辑、删除、授权等操作
 */
export function useAccess() {
  const { initialState } = useModel('@@initialState');
  const menuPermissions = initialState?.menuPermissions ?? EMPTY_PERMISSIONS;
  const buttonPermissions =
    initialState?.buttonPermissions ?? EMPTY_PERMISSIONS;
  const access = useMemo(
    () => accessFactory({ menuPermissions, buttonPermissions }),
    [menuPermissions, buttonPermissions],
  );

  return {
    ...access,
    roles: initialState?.roles ?? [],
    menuPermissions,
    buttonPermissions,
    hasPermission: access.hasButtonAccess,
    hasAnyPermission: (codes: string[]) =>
      codes.some((code) => access.hasButtonAccess(code)),
    hasMenuPermission: access.hasMenuAccess,
  };
}
