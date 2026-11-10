import { normalizeRoutes } from '@/router/catalog';
import { staticRoutes } from '@/router/static-routes';
import type { AppRoute } from '@/router/types';
import { fetchUserRoutes } from '@/services/routes';
import { getToken } from '@/utils/auth';
import { create } from 'zustand';

/** 请求过程中登录态发生变化时抛出，用于丢弃旧会话的路由结果。 */
export class RouteLoadCancelledError extends Error {
  constructor() {
    super('登录会话已变更');
    this.name = 'RouteLoadCancelledError';
  }
}

interface RouteState {
  /** 当前账号可见的路由树：静态首页/异常页 + 接口业务路由 */
  routes: AppRoute[];
  /** 接口路由是否已加载完成 */
  ready: boolean;
  loading: boolean;
  error?: string;
  /** 当前路由树所属的 token，防止换号后复用了上一个账号的菜单 */
  sessionToken?: string;
  loadRoutes: () => Promise<AppRoute[]>;
  setError: (error: string) => void;
  reset: () => void;
}

/** 同一 token 的并发请求只发一次 */
let inflight: Promise<AppRoute[]> | undefined;
/** 用于切换账号或卸载时中止上一次请求 */
let controller: AbortController | undefined;
/** inflight 对应的 token */
let requestToken: string | undefined;
/** 每次取消/重置自增，异步回调据此判断结果是否已过期 */
let loadVersion = 0;

/** 取消当前加载，并让所有旧异步回调失效 */
function cancelLoading() {
  loadVersion += 1;
  controller?.abort();
  controller = undefined;
  inflight = undefined;
  requestToken = undefined;
}

export const useRouteStore = create<RouteState>((set, get) => ({
  // 初始只展示静态首页和异常页，业务菜单等待接口下发
  routes: staticRoutes,
  ready: false,
  loading: false,

  /**
   * 加载当前用户的路由
   * - 同 token 已有请求时复用
   * - 换号时中止旧请求，避免旧账号路由覆盖新账号
   * - 失败时保留静态路由，并通过 error 让页面展示可重试的错误
   */
  loadRoutes: () => {
    const token = getToken();
    if (get().ready && get().sessionToken === token)
      return Promise.resolve(get().routes);
    if (inflight && requestToken === token) return inflight;

    cancelLoading();
    const version = loadVersion;
    const requestController = new AbortController();
    controller = requestController;
    requestToken = token;
    set({
      routes: staticRoutes,
      ready: false,
      loading: true,
      error: undefined,
      sessionToken: undefined,
    });

    const pending = Promise.resolve()
      .then(() => {
        // 发起请求前再次校验会话，避免退出登录后仍发出请求
        if (version !== loadVersion || getToken() !== token)
          throw new RouteLoadCancelledError();
        return fetchUserRoutes(requestController.signal);
      })
      .then((input) => {
        if (version !== loadVersion || getToken() !== token)
          throw new RouteLoadCancelledError();
        // 接口数据必须经过校验和页面注册表白名单
        const routes = [...staticRoutes, ...normalizeRoutes(input)];
        set({ routes, ready: true, loading: false, sessionToken: token });
        return routes;
      })
      .catch((error: unknown) => {
        const cancelled =
          version !== loadVersion ||
          requestController.signal.aborted ||
          getToken() !== token;
        if (version === loadVersion) {
          set({
            routes: staticRoutes,
            ready: false,
            loading: false,
            sessionToken: undefined,
            error: cancelled
              ? undefined
              : error instanceof Error
              ? error.message
              : '路由加载失败，请重试',
          });
        }
        throw cancelled ? new RouteLoadCancelledError() : error;
      })
      .finally(() => {
        // 只有最新一次请求才能清理共享状态
        if (version === loadVersion) {
          inflight = undefined;
          controller = undefined;
          requestToken = undefined;
        }
      });

    inflight = pending;
    return pending;
  },

  /** 路由注入失败等场景：回到静态路由并记录错误，页面可展示重试入口 */
  setError: (error) => {
    cancelLoading();
    set({
      routes: staticRoutes,
      ready: false,
      loading: false,
      error,
      sessionToken: undefined,
    });
  },

  /** 退出登录 / 换号时恢复静态初始状态 */
  reset: () => {
    cancelLoading();
    set({
      routes: staticRoutes,
      ready: false,
      loading: false,
      error: undefined,
      sessionToken: undefined,
    });
  },
}));
