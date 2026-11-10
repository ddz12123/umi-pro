/** 与页面、接口无关的应用配置；修改后重启开发服务。 */
export const appConfig = {
  name: 'Umi 基础框架',
  subtitle: 'UMI STARTER',
  version: '1.0.0',
  /** 浏览器存储 key 前缀，避免同域多项目互相覆盖 */
  storagePrefix: 'umi-starter',
  auth: {
    /** local：关闭浏览器后仍保留登录态；session：关闭标签页即失效 */
    storage: 'local' as 'local' | 'session',
    /** 请求头名称与 token 前缀 */
    header: 'Authorization',
    prefix: 'Bearer ',
  },
  tabs: {
    /** 是否启用多页签 */
    enabled: true,
    /** 最多保留的页签数量，超出后淘汰最早的非固定页签 */
    maxCount: 12,
  },
};
