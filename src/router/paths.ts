/** 不依赖页面、路由生成器或状态管理的框架路径。 */
export const LOGIN_PATH = '/login';
/** 登录后的默认落点。 */
export const DEFAULT_ROUTE_PATH = '/home';
/** 页面不存在时的全屏兜底地址。 */
export const NOT_FOUND_PATH = '/exception/404';
/** 无权限时的全屏异常页地址。 */
export const FORBIDDEN_PATH = '/exception/403';

/** 忽略尾斜杠和大小写判断是否登录页，避免重定向死循环。 */
export function isLoginPath(pathname: string) {
  return pathname.replace(/\/+$/, '').toLowerCase() === LOGIN_PATH;
}
