import { appConfig } from '@/config/app';
import { getLocalRoutes, normalizeRoutes } from '@/router/catalog';
import { staticRoutes } from '@/router/static-routes';
import type { AppRoute } from '@/router/types';
import { fetchUserRoutes } from '@/services/routes';
import { getToken } from '@/utils/auth';
import { create } from 'zustand';

export { normalizeRoutes } from '@/router/catalog';

export class RouteLoadCancelledError extends Error {
  constructor() {
    super('登录会话已变更');
    this.name = 'RouteLoadCancelledError';
  }
}

function getInitialRoutes(): AppRoute[] {
  return appConfig.routing.source === 'local' ? getLocalRoutes() : staticRoutes;
}

interface RouteState {
  routes: AppRoute[];
  ready: boolean;
  loading: boolean;
  error?: string;
  /** 仅在内存中标记已加载路由所属的会话。 */
  sessionToken?: string;
  loadRoutes: () => Promise<AppRoute[]>;
  setError: (error: string) => void;
  reset: () => void;
}

let inflight: Promise<AppRoute[]> | undefined;
let controller: AbortController | undefined;
let requestToken: string | undefined;
let loadVersion = 0;

function cancelLoading() {
  loadVersion += 1;
  controller?.abort();
  controller = undefined;
  inflight = undefined;
  requestToken = undefined;
}

export const useRouteStore = create<RouteState>((set, get) => ({
  routes: getInitialRoutes(),
  ready: appConfig.routing.source === 'local',
  loading: false,

  loadRoutes: () => {
    if (appConfig.routing.source === 'local')
      return Promise.resolve(get().routes);
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
        if (version !== loadVersion || getToken() !== token)
          throw new RouteLoadCancelledError();
        return fetchUserRoutes(requestController.signal);
      })
      .then((input) => {
        if (version !== loadVersion || getToken() !== token)
          throw new RouteLoadCancelledError();
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
        if (version === loadVersion) {
          inflight = undefined;
          controller = undefined;
          requestToken = undefined;
        }
      });
    inflight = pending;
    return pending;
  },

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

  reset: () => {
    cancelLoading();
    set({
      routes: getInitialRoutes(),
      ready: appConfig.routing.source === 'local',
      loading: false,
      error: undefined,
      sessionToken: undefined,
    });
  },
}));
