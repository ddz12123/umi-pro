import type { PageComponentKey } from './page-registry';
import { getPathParameters, isConcretePath } from './tree';
import type { AppRoute, RouteIcon } from './types';
import { routeIconKeys } from './types';

/** 图标白名单：后端返回未知图标时忽略，而不是把字符串直接渲染。 */
const icons = new Set<string>(routeIconKeys);
/** 允许从接口透传的布尔开关。 */
const flags = [
  'affix',
  'hideInMenu',
  'hideInBreadcrumb',
  'hideInTabs',
  'fullScreen',
] as const;

interface NormalizeOptions {
  /** 已被框架占用的路径，接口不能重复注册。 */
  reservedPaths: Set<string>;
  /** 页面组件 key 是否已在前端注册表中登记。 */
  isComponent: (key: string) => boolean;
}

/** 不接受任意组件路径；无效、冲突节点直接拒绝，避免渲染不完整的权限菜单。 */
export function normalizeRoutes(
  input: unknown,
  { reservedPaths, isComponent }: NormalizeOptions,
): AppRoute[] {
  if (!Array.isArray(input)) throw new Error('路由接口必须返回数组');
  /** 路径签名：参数名不同但结构相同的路径也视为冲突。 */
  const signature = (path: string) =>
    path.toLowerCase().replace(/:[^/]+/g, ':param');
  /** 已占用路径集合，静态路由和接口路由共用。 */
  const paths = new Set([...reservedPaths].map(signature));

  /** 递归校验并复制节点，任何非法数据直接拒绝整个响应。 */
  const walk = (
    nodes: unknown[],
    parent = '',
    depth = 0,
    parentFullScreen = false,
  ): AppRoute[] => {
    if (depth > 20) throw new Error('路由层级超过限制');
    return nodes
      .map((value): AppRoute => {
        if (!value || typeof value !== 'object' || Array.isArray(value)) {
          throw new Error('路由节点必须是对象');
        }
        const node = value as Record<string, unknown>;
        if (typeof node.name !== 'string' || !node.name.trim()) {
          throw new Error('路由缺少有效名称');
        }
        if (
          typeof node.path !== 'string' ||
          !node.path ||
          /[\\%?#\s\u0000-\u001f\u007f]/.test(node.path) ||
          node.path.includes('//') ||
          /(^|\/)\.{1,2}(\/|$)/.test(node.path)
        ) {
          throw new Error(`路由「${node.name}」路径无效`);
        }
        const path =
          (node.path.startsWith('/')
            ? node.path
            : `${parent}/${node.path}`
          ).replace(/\/+$/, '') || '/';
        if (path === '/' || path.includes('*') || paths.has(signature(path))) {
          throw new Error(`路由路径冲突或被保留：${path}`);
        }
        const segments = path.split('/').filter(Boolean);
        if (
          segments.some(
            (segment) =>
              segment.includes(':') &&
              !/^:[A-Za-z_][A-Za-z0-9_]*$/.test(segment),
          )
        ) {
          throw new Error(`路由 ${path} 的参数格式无效`);
        }
        const parameters = getPathParameters(path);
        if (parameters.length !== new Set(parameters).size) {
          throw new Error(`路由 ${path} 的参数名称重复`);
        }
        paths.add(signature(path));

        // 只复制白名单字段，避免把接口返回的任意属性带进运行时
        const route: AppRoute = {
          name: node.name.trim(),
          path,
          fullScreen:
            typeof node.fullScreen === 'boolean'
              ? node.fullScreen
              : parentFullScreen,
        };
        if (node.children !== undefined && !Array.isArray(node.children)) {
          throw new Error(`路由 ${path} 的 children 必须是数组`);
        }
        if (Array.isArray(node.children) && node.children.length) {
          // 分组只负责导航层级，不能同时渲染页面组件
          if (node.component)
            throw new Error(`路由 ${path} 不能同时是分组和页面`);
          route.children = walk(
            node.children,
            path,
            depth + 1,
            route.fullScreen,
          );
        } else {
          const key =
            typeof node.component === 'string'
              ? node.component.replace(/^\.\//, '')
              : '';
          if (!key || !isComponent(key)) {
            throw new Error(`路由 ${path} 的页面组件未注册`);
          }
          route.component = key as PageComponentKey;
        }

        if (icons.has(node.icon as RouteIcon))
          route.icon = node.icon as RouteIcon;
        if (node.layoutMode === 'page' || node.layoutMode === 'fill') {
          route.layoutMode = node.layoutMode;
        }
        if (typeof node.order === 'number' && Number.isFinite(node.order)) {
          route.order = node.order;
        }
        if (
          typeof node.activeMenu === 'string' &&
          node.activeMenu.startsWith('/')
        ) {
          route.activeMenu = node.activeMenu;
        }
        flags.forEach((flag) => {
          if (typeof node[flag] === 'boolean') route[flag] = node[flag];
        });
        // 固定页签必须是无参数、布局内可见、可关闭性受控的真实页面
        if (
          route.affix &&
          (!route.component ||
            !isConcretePath(path) ||
            route.fullScreen ||
            route.hideInTabs)
        ) {
          throw new Error(
            `固定页签 ${path} 必须是布局内可显示页签且无需参数的页面`,
          );
        }
        return route;
      })
      .sort((a, b) => (a.order ?? Infinity) - (b.order ?? Infinity));
  };

  return walk(input);
}
