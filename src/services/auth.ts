import type { AuthUser } from '@/utils/auth';
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
}

/** 登录接口，后端返回 { code, data: { token, expiresIn, user }, msg } */
export function login(data: LoginParams) {
  return post<LoginResult>('/api/v1/login', data, {
    skipAuth: true,
    skipErrorHandler: true,
  });
}
