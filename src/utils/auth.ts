import { appConfig } from '@/config/app';
import { LOGIN_PATH, isLoginPath } from '@/router/paths';
import { local, session } from './storage';

export interface AuthRole {
  id: string;
  name: string;
  code: string;
}

/** 登录接口返回的两类权限：菜单权限决定路由，按钮权限决定页面操作 */
export interface AuthPermissionSet {
  menus: string[];
  buttons: string[];
}

export interface AuthUser {
  id?: string;
  name?: string;
  nickName?: string;
  avatar?: string;
  roles?: AuthRole[];
  permissions?: AuthPermissionSet;
}

/** token 存储 key；SessionSync 也用它监听跨窗口登录态变化。 */
export const AUTH_STORAGE_KEY = `${appConfig.storagePrefix}:token`;
const USER_KEY = `${appConfig.storagePrefix}:user`;
const EXPIRE_AT_KEY = `${appConfig.storagePrefix}:expire-at`;
/** 根据配置选择 localStorage / sessionStorage，读写都走同一适配器。 */
const storage = appConfig.auth.storage === 'local' ? local : session;

/** 登录成功后写入 token、过期时间与用户信息 */
export function setAuth(token: string, expiresIn?: number, user?: AuthUser) {
  if (typeof token !== 'string' || !token.trim())
    throw new Error('登录接口未返回有效的 token');
  if (
    expiresIn !== undefined &&
    (!Number.isFinite(expiresIn) || expiresIn <= 0)
  ) {
    throw new Error('登录凭证有效期无效，请重新登录');
  }
  if (expiresIn !== undefined && Number.isFinite(expiresIn)) {
    storage.setItem(EXPIRE_AT_KEY, String(Date.now() + expiresIn * 1000));
  } else {
    storage.removeItem(EXPIRE_AT_KEY);
  }
  if (user) {
    storage.setItem(USER_KEY, JSON.stringify(user));
  } else {
    storage.removeItem(USER_KEY);
  }
  // 最后更新 token，让其他窗口收到通知时能读到完整的新用户信息。
  storage.setItem(AUTH_STORAGE_KEY, token);
}

/** 清空 token、用户信息和过期时间，供退出登录和会话失效共用。 */
export function clearAuth() {
  storage.removeItem(AUTH_STORAGE_KEY);
  storage.removeItem(USER_KEY);
  storage.removeItem(EXPIRE_AT_KEY);
}

/** 仅在本地存了过期时间时才判断，没有过期时间视为长期有效 */
export function isExpired(): boolean {
  const raw = storage.getItem(EXPIRE_AT_KEY);
  if (raw === null) return false;
  const expireAt = Number(raw);
  return !Number.isFinite(expireAt) || Date.now() >= expireAt;
}

/** 取 token，过期会顺手清空本地登录态并返回空字符串 */
export function getToken(): string {
  const token = storage.getItem(AUTH_STORAGE_KEY) || '';
  if (!token) return '';
  if (isExpired()) {
    clearAuth();
    return '';
  }
  return token;
}

/** 读取缓存的登录用户；数据损坏或未登录时返回 undefined。 */
export function getAuthUser(): AuthUser | undefined {
  if (!getToken()) return undefined;
  const raw = storage.getItem(USER_KEY);
  if (!raw) return undefined;
  try {
    const user: unknown = JSON.parse(raw);
    if (!user || typeof user !== 'object' || Array.isArray(user))
      return undefined;
    const value = user as Record<string, unknown>;
    const rawRoles = Array.isArray(value.roles) ? value.roles : [];
    const roles: AuthRole[] = rawRoles.flatMap((item) => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) return [];
      const role = item as Record<string, unknown>;
      if (
        typeof role.id !== 'string' ||
        typeof role.name !== 'string' ||
        typeof role.code !== 'string'
      ) {
        return [];
      }
      return [{ id: role.id, name: role.name, code: role.code }];
    });
    const rawPermissions =
      value.permissions &&
      typeof value.permissions === 'object' &&
      !Array.isArray(value.permissions)
        ? (value.permissions as Record<string, unknown>)
        : undefined;
    const permissions = rawPermissions
      ? {
          menus: Array.isArray(rawPermissions.menus)
            ? rawPermissions.menus.filter(
                (item): item is string => typeof item === 'string',
              )
            : [],
          buttons: Array.isArray(rawPermissions.buttons)
            ? rawPermissions.buttons.filter(
                (item): item is string => typeof item === 'string',
              )
            : [],
        }
      : undefined;
    return {
      id: typeof value.id === 'string' ? value.id : undefined,
      name: typeof value.name === 'string' ? value.name : undefined,
      nickName: typeof value.nickName === 'string' ? value.nickName : undefined,
      avatar: typeof value.avatar === 'string' ? value.avatar : undefined,
      roles,
      permissions,
    };
  } catch {
    return undefined;
  }
}

/** 是否处于登录态（会顺带校验 token 过期时间）。 */
export function isLogin(): boolean {
  return !!getToken();
}

/**
 * 校验登录后的回跳地址，防止开放重定向
 * 只允许站内绝对路径，拦截 //evil.com、/\evil.com、反斜杠和登录页自身
 */
export function getSafeRedirect(value: unknown): string | undefined {
  const redirect = Array.isArray(value) ? value[0] : value;
  if (typeof redirect !== 'string') return undefined;
  let decoded: string;
  try {
    decoded = decodeURIComponent(redirect);
  } catch {
    return undefined;
  }
  if (
    !redirect.startsWith('/') ||
    /^\/\//.test(decoded) ||
    /[\\\u0000-\u001f\u007f]/.test(decoded)
  ) {
    return undefined;
  }
  const base = 'https://app.invalid';
  const url = new URL(decoded, base);
  if (url.origin !== base || isLoginPath(url.pathname)) return undefined;
  return redirect;
}

/** 生成带 redirect 参数的登录页地址，登录后可跳回原页面 */
export function getLoginUrl(pathname?: string, search = '', hash = ''): string {
  const redirect = getSafeRedirect(`${pathname || ''}${search}${hash}`);
  if (!redirect) return LOGIN_PATH;
  return `${LOGIN_PATH}?redirect=${encodeURIComponent(redirect)}`;
}
