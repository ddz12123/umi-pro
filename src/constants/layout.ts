import { appConfig } from '../config/app';

/** 侧边栏折叠状态持久化 key */
export const SIDER_COLLAPSED_KEY = `${appConfig.storagePrefix}:sider-collapsed`;

/** 移动端断点，与布局样式中的媒体查询保持一致 */
export const MOBILE_MEDIA_QUERY = '(max-width: 767px)';
