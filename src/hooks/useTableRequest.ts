import type { PageResult } from '@/services/types';
import { useMemoizedFn } from 'ahooks';

/** ProTable request 入参：分页 + 任意搜索字段 */
export interface TableParams {
  current?: number;
  pageSize?: number;
  [key: string]: unknown;
}

/** ProTable request 适配器：分页映射与失败兜底，业务只提供分页 service */
export function useTableRequest<T, P = TableParams>(
  service: (params: P) => Promise<PageResult<T>>,
  mapParams?: (params: TableParams) => P,
) {
  return useMemoizedFn(async (params: TableParams) => {
    try {
      const result = await service(
        mapParams ? mapParams(params) : (params as P),
      );
      return { data: result.list, total: result.total, success: true };
    } catch {
      // 接口异常已由全局 errorHandler 提示，表格展示空态
      return { data: [], total: 0, success: false };
    }
  });
}
