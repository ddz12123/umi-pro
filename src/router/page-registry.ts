import type { ComponentType } from 'react';

/**
 * 页面组件注册表
 * ------------------------------------------------------------------
 * 动态路由的 component 字段只存 key，真正渲染哪个组件由这里决定。
 * 新增页面时：
 *   1. 在 src/pages 下创建页面
 *   2. 在这里登记一个静态 import 加载函数
 *   3. 本地配置或后端路由使用对应的 component key
 *
 * 这样后端可以自由调整路径、菜单层级和权限，但不会执行任意前端代码。
 */
export const PAGE_LOADERS = {
  Home: () => import('@/pages/Home'),
  Example: () => import('@/pages/Example'),
  'Exception/404': () => import('@/pages/Exception/404'),
  'Exception/500': () => import('@/pages/Exception/500'),
} satisfies Record<string, () => Promise<{ default: ComponentType }>>;

export type PageComponentKey = keyof typeof PAGE_LOADERS;

/** 后端可能返回 './Home' 这类旧格式，统一归一化 */
export function normalizeComponentKey(component?: string): string | undefined {
  return component?.replace(/^\.\//, '');
}

export function isPageComponentKey(
  component: string,
): component is PageComponentKey {
  return Object.prototype.hasOwnProperty.call(PAGE_LOADERS, component);
}
