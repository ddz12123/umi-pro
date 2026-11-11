import { apiConfig } from '@/config/api';

/** 后端统一业务信封。 */
export interface ApiResult<T = unknown> {
  code: string | number;
  data: T;
  msg?: string;
}

/** 业务码失败时抛出的异常，保留原始请求配置用于判断会话是否过期。 */
export class BizError extends Error {
  requestConfig?: {
    url?: string;
    baseURL?: string;
    skipAuth?: boolean;
    sessionToken?: string;
  };

  constructor(
    message: string,
    public code?: string | number,
    public data?: unknown,
  ) {
    super(message);
    this.name = 'BizError';
  }
}

/** 判断响应是否属于配置中的业务信封。 */
export function isApiResult(value: unknown): value is Record<string, unknown> {
  return (
    value !== null &&
    typeof value === 'object' &&
    Object.prototype.hasOwnProperty.call(value, apiConfig.response.codeField)
  );
}

/** 校验业务码；失败时统一抛 BizError。 */
export function checkResponse(value: unknown): void {
  if (!isApiResult(value)) return;
  const { codeField, dataField, messageField, successCodes } =
    apiConfig.response;
  const code = value[codeField];
  if (!successCodes.some((item) => item === code)) {
    throw new BizError(
      typeof value[messageField] === 'string'
        ? value[messageField]
        : '请求失败',
      typeof code === 'string' || typeof code === 'number' ? code : undefined,
      value[dataField],
    );
  }
}

/** 导出等场景后端可能用 JSON Blob 返回业务错误，解析后并入统一校验。 */
export async function checkBlobResponse(value: unknown): Promise<void> {
  if (!(value instanceof Blob) || !value.type.includes('json')) return;
  let parsed: unknown;
  try {
    parsed = JSON.parse(await value.text());
  } catch {
    return;
  }
  checkResponse(parsed);
}

/** 普通 JSON、数组、Blob 等保持原样；仅解包已识别的接口信封。 */
export function unwrapResponse<T>(value: unknown): T {
  return (
    isApiResult(value) ? value[apiConfig.response.dataField] : value
  ) as T;
}
