/** 统一分页响应契约，各业务 service 共用。 */
export interface PageResult<T> {
  list: T[];
  total: number;
  current: number;
  pageSize: number;
}

/** 统一分页查询参数，业务筛选字段通过扩展追加。 */
export interface PageQueryParams {
  current?: number;
  pageSize?: number;
  keyword?: string;
}
