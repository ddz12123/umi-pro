/** 接口适配点：更换后端时只改这里，不动布局或页面。 */
export const apiConfig = {
  /** API 根地址，由构建环境注入 */
  baseURL: APP_API_BASE_URL,
  timeout: 15_000,
  response: {
    /** 业务信封字段名 */
    codeField: 'code',
    dataField: 'data',
    messageField: 'msg',
    /** 视为成功的业务码 */
    successCodes: [0, '0'] as Array<string | number>,
    /** 需要清理登录态的业务码 */
    unauthorizedCodes: [401, '401', 40100, '40100'] as Array<string | number>,
  },
};
