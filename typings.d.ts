import '@umijs/max/typings';

declare global {
  /** 由 .umirc.ts 注入；生产构建始终关闭 Mock 演示入口。 */
  const APP_MOCK_ENABLED: boolean;
  const APP_API_BASE_URL: string;
}
