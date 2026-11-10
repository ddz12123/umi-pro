import type { AuthPermissionSet, AuthRole, AuthUser } from '@/utils/auth';
import { post } from '@/utils/request';

export interface LoginParams {
  username: string;
  password: string;
}

export interface LoginResult {
  token: string;
  /** token 有效期，单位秒 */
  expiresIn?: number;
  user?: AuthUser;
  /** 当前账号的角色列表 */
  roles?: AuthRole[];
  /** 菜单权限码 + 按钮权限码 */
  permissions?: AuthPermissionSet;
}

/** 登录接口，后端返回 token、用户、角色、菜单权限与按钮权限 */
export function login(data: LoginParams) {
  return post<LoginResult>('/api/v1/login', data, {
    skipAuth: true,
    skipErrorHandler: true,
  });
}
