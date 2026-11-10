import type { ComponentType } from 'react';

/**
 * 页面组件注册表
 * ------------------------------------------------------------------
 * 动态路由的 component 字段只存 key，真正渲染哪个组件由这里决定。
 * 新增页面时：
 *   1. 在 src/pages 下创建页面
 *   2. 在这里登记一个静态 import 加载函数
 *   3. 接口路由使用对应的 component key
 *
 * 这样后端可以自由调整路径、菜单层级和权限，但不会执行任意前端代码。
 */
/** 页面白名单：接口路由只能引用这里登记过的 key。 */
export const PAGE_LOADERS = {
  Home: () => import('@/pages/Home'),
  Example: () => import('@/pages/Example'),
  'System/User': () => import('@/pages/System/User'),
  'System/Role': () => import('@/pages/System/Role'),
  'System/Permission': () => import('@/pages/System/Permission'),
  'Exception/404': () => import('@/pages/Exception/404'),
  'Exception/500': () => import('@/pages/Exception/500'),
} satisfies Record<string, () => Promise<{ default: ComponentType }>>;

/** 所有合法页面 key 的联合类型。 */
export type PageComponentKey = keyof typeof PAGE_LOADERS;

/** 后端可能返回 './Home' 这类旧格式，统一归一化 */
export function normalizeComponentKey(component?: string): string | undefined {
  return component?.replace(/^\.\//, '');
}

/** 运行时判断接口返回的 component 是否已注册。 */
export function isPageComponentKey(
  component: string,
): component is PageComponentKey {
  return Object.prototype.hasOwnProperty.call(PAGE_LOADERS, component);
}
