/** 接口适配点：更换后端时在这里调整，不改布局或页面。 */
export const apiConfig = {
  baseURL: APP_API_BASE_URL,
  timeout: 15_000,
  response: {
    codeField: 'code',
    dataField: 'data',
    messageField: 'msg',
    successCodes: [0, '0'] as Array<string | number>,
    unauthorizedCodes: [401, '401', 40100, '40100'] as Array<string | number>,
  },
};
