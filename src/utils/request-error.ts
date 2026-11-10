import type { AxiosError } from '@umijs/max';
import { BizError } from './response';

/** HTTP 状态码 -> 用户可读提示。 */
const statusMessages: Record<number, string> = {
  400: '请求参数错误',
  401: '登录已过期，请重新登录',
  403: '没有访问权限',
  404: '请求的资源不存在',
  500: '服务器内部错误',
  502: '网关异常',
  503: '服务暂不可用',
  504: '网关超时',
};

/** 把业务异常、HTTP 状态码、超时和网络错误统一成一句中文提示。 */
export function getRequestErrorMessage(error: unknown): string {
  if (error instanceof BizError) return error.message;
  const value = error as AxiosError | undefined;
  if (value?.response) {
    return (
      statusMessages[value.response.status] ||
      `请求失败（${value.response.status}）`
    );
  }
  if (value?.code === 'ECONNABORTED' || value?.code === 'ETIMEDOUT') {
    return '请求超时，请稍后重试';
  }
  if (value?.request) return '网络异常，请检查网络连接';
  return error instanceof Error ? error.message : '请求失败，请稍后重试';
}
