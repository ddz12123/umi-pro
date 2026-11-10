import { appConfig } from '@/config/app';
import { getToken } from '@/utils/auth';
import { showError } from '@/utils/feedback';
import { getRequestErrorMessage } from '@/utils/request-error';
import { BizError, checkResponse } from '@/utils/response';
import { endSession } from '@/utils/session';
import type { AxiosError, RequestConfig, RequestOptions } from '@umijs/max';
import { apiConfig } from './api';

export { getRequestErrorMessage } from '@/utils/request-error';

/** 只向配置的 API 来源附加登录信息，独立外部请求使用 skipAuth。 */
export function isTrustedApi(
  url: string,
  baseURL = apiConfig.baseURL,
): boolean {
  try {
    const origin = window.location.origin;
    const api = new URL(apiConfig.baseURL || '/', origin);
    const base = new URL(baseURL || '/', origin);
    const target = new URL(
      url,
      base.href.endsWith('/') ? base : `${base.href}/`,
    );
    return target.origin === api.origin;
  } catch {
    return false;
  }
}

export const request: RequestConfig = {
  baseURL: apiConfig.baseURL,
  timeout: apiConfig.timeout,
  requestInterceptors: [
    (config: RequestOptions) => {
      if (config.skipAuth || !isTrustedApi(config.url || '', config.baseURL))
        return config;
      const token = getToken();
      const headers = config.headers || {};
      const hasAuthorization = Object.keys(headers).some(
        (key) => key.toLowerCase() === appConfig.auth.header.toLowerCase(),
      );
      if (token && !hasAuthorization) {
        config.headers = {
          ...headers,
          [appConfig.auth.header]: `${appConfig.auth.prefix}${token}`,
        };
        config.sessionToken = token;
      }
      return config;
    },
  ],
  responseInterceptors: [
    (response) => {
      try {
        if ((response.config as RequestOptions).responseMode !== 'raw')
          checkResponse(response.data);
      } catch (error) {
        if (error instanceof BizError) error.requestConfig = response.config;
        throw error;
      }
      return response;
    },
  ],
  errorConfig: {
    errorHandler: (error, options) => {
      const value = error as AxiosError;
      if (value.code === 'ERR_CANCELED' || error.name === 'AbortError') return;
      const unauthorized =
        value.response?.status === 401 ||
        (error instanceof BizError &&
          apiConfig.response.unauthorizedCodes.some(
            (code) => code === error.code,
          ));
      const config = (
        error instanceof BizError ? error.requestConfig : value.config
      ) as RequestOptions | undefined;
      const currentToken = getToken();
      if (
        unauthorized &&
        config?.sessionToken &&
        currentToken &&
        config.sessionToken !== currentToken
      )
        return;
      if (
        unauthorized &&
        !options.skipAuth &&
        !config?.skipAuth &&
        (!currentToken || config?.sessionToken === currentToken) &&
        isTrustedApi(config?.url || '', config?.baseURL)
      )
        endSession();
      if (options.skipErrorHandler) return;
      showError({
        key: unauthorized ? 'session-expired' : undefined,
        content: getRequestErrorMessage(error),
      });
    },
  },
};
