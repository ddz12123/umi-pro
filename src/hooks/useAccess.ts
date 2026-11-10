import { useModel } from '@umijs/max';

/**
 * 权限判断：
 * - menuPermissions 控制可访问的菜单/页面
 * - buttonPermissions 控制页面内的新增、编辑、删除、授权等操作
 */
export function useAccess() {
  const { initialState } = useModel('@@initialState');
  const menuPermissions = initialState?.menuPermissions ?? [];
  const buttonPermissions = initialState?.buttonPermissions ?? [];
  const buttons = new Set(buttonPermissions);

  return {
    roles: initialState?.roles ?? [],
    menuPermissions,
    buttonPermissions,
    hasPermission: (code: string) => buttons.has(code),
    hasAnyPermission: (codes: string[]) =>
      codes.some((code) => buttons.has(code)),
    hasMenuPermission: (code: string) => menuPermissions.includes(code),
  };
}
