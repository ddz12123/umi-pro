import { appConfig } from '@/config/app';
import { getToken } from '@/utils/auth';
import { showError } from '@/utils/feedback';
import { getRequestErrorMessage } from '@/utils/request-error';
import { BizError, checkBlobResponse, checkResponse } from '@/utils/response';
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
  // 所有请求统一走配置的 API 来源
  baseURL: apiConfig.baseURL,
  timeout: apiConfig.timeout,
  requestInterceptors: [
    // 只给可信 API 追加 token；外部地址或显式 skipAuth 的请求保持原样
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
        // 记录本次请求使用的 token，用于识别“旧请求返回时已经换号”
        config.sessionToken = token;
      }
      return config;
    },
  ],
  responseInterceptors: [
    // 业务信封统一校验；raw 模式不解包，但 JSON Blob 里的业务错误仍要识别
    async (response) => {
      try {
        if ((response.config as RequestOptions).responseMode !== 'raw')
          checkResponse(response.data);
        await checkBlobResponse(response.data);
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
      // 主动取消的请求不提示用户
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

      // 旧 token 发出的请求现在才返回 401，不能误删新登录态
      if (
        unauthorized &&
        config?.sessionToken &&
        currentToken &&
        config.sessionToken !== currentToken
      )
        return;

      // 当前会话确实失效时才统一退出，过期提示由登录页展示
      if (
        unauthorized &&
        !options.skipAuth &&
        !config?.skipAuth &&
        (!currentToken || config?.sessionToken === currentToken) &&
        isTrustedApi(config?.url || '', config?.baseURL)
      ) {
        endSession(true, 'expired');
        return;
      }

      if (options.skipErrorHandler) return;
      showError({ content: getRequestErrorMessage(error) });
    },
  },
};
