/** 不依赖页面、路由生成器或状态管理的框架路径。 */
export const LOGIN_PATH = '/login';
export const DEFAULT_ROUTE_PATH = '/home';
export const NOT_FOUND_PATH = '/exception/404';

export function isLoginPath(pathname: string) {
  return pathname.replace(/\/+$/, '').toLowerCase() === LOGIN_PATH;
}
