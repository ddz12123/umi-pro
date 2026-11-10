/** 与页面、接口无关的应用配置；修改后重启开发服务。 */
export const appConfig = {
  name: 'Umi 基础框架',
  subtitle: 'UMI STARTER',
  version: '1.0.0',
  storagePrefix: 'umi-starter',
  routing: {
    /** local：使用本地路由；remote：由 services/routes.ts 提供用户路由。 */
    source: 'local' as 'local' | 'remote',
  },
  auth: {
    storage: 'local' as 'local' | 'session',
    header: 'Authorization',
    prefix: 'Bearer ',
  },
  tabs: {
    enabled: true,
    maxCount: 12,
  },
};
