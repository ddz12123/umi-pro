import { get } from '@/utils/request';

/**
 * 获取当前用户的动态路由树
 * 后端返回的是「页面注册表 key + 路径/菜单元信息」，不是可执行代码。
 */
export function fetchUserRoutes(signal?: AbortSignal) {
  // 外部数据在 router/normalize.ts 校验；不将类型断言当作运行时校验。
  return get<unknown>('/api/v1/routes', undefined, {
    skipErrorHandler: true,
    signal,
  });
}
