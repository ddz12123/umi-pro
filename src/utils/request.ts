import type { RequestOptions } from '@umijs/max';
import { request } from '@umijs/max';
import { unwrapResponse } from './response';

export { BizError } from './response';
export type { ApiResult } from './response';

export type HttpOptions = Omit<RequestOptions, 'url' | 'getResponse'> & {
  /** 登录接口、第三方接口不自动附加 token。 */
  skipAuth?: boolean;
  /** raw 跳过业务状态检查和解包，适用于文件下载与独立协议。 */
  responseMode?: 'envelope' | 'raw';
  /** 完整 Axios 响应请使用 rawRequest。 */
  getResponse?: never;
};

export async function http<T = unknown>(
  url: string,
  options: HttpOptions = {},
): Promise<T> {
  const result = await request<unknown>(url, {
    ...options,
    getResponse: false,
  });
  return options.responseMode === 'raw'
    ? (result as T)
    : unwrapResponse<T>(result);
}

export function get<T = unknown>(
  url: string,
  params?: object,
  options: HttpOptions = {},
): Promise<T> {
  return http<T>(url, { ...options, method: 'GET', params });
}

export function post<T = unknown>(
  url: string,
  data?: unknown,
  options: HttpOptions = {},
): Promise<T> {
  return http<T>(url, { ...options, method: 'POST', data });
}

export function put<T = unknown>(
  url: string,
  data?: unknown,
  options: HttpOptions = {},
): Promise<T> {
  return http<T>(url, { ...options, method: 'PUT', data });
}

export function patch<T = unknown>(
  url: string,
  data?: unknown,
  options: HttpOptions = {},
): Promise<T> {
  return http<T>(url, { ...options, method: 'PATCH', data });
}

export function del<T = unknown>(
  url: string,
  params?: object,
  options: HttpOptions = {},
): Promise<T> {
  return http<T>(url, { ...options, method: 'DELETE', params });
}

export { request as rawRequest };
