import { apiConfig } from '@/config/api';

export interface ApiResult<T = unknown> {
  code: string | number;
  data: T;
  msg?: string;
}

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

export function isApiResult(value: unknown): value is Record<string, unknown> {
  return (
    value !== null &&
    typeof value === 'object' &&
    Object.prototype.hasOwnProperty.call(value, apiConfig.response.codeField)
  );
}

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

/** 普通 JSON、数组、Blob 等保持原样；仅解包已识别的接口信封。 */
export function unwrapResponse<T>(value: unknown): T {
  return (
    isApiResult(value) ? value[apiConfig.response.dataField] : value
  ) as T;
}
