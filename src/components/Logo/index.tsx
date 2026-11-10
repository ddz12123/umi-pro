import React from 'react';
import styles from './index.less';

interface LogoProps {
  size?: number;
  className?: string;
}

/** 纯 CSS + SVG 的品牌标识，避免依赖外链图片导致加载失败 */
const Logo: React.FC<LogoProps> = ({ size = 32, className }) => (
  <span
    aria-hidden
    className={[styles.logo, className].filter(Boolean).join(' ')}
    style={{ width: size, height: size, borderRadius: size * 0.28 }}
  >
    <svg viewBox="0 0 32 32" width="100%" height="100%">
      <rect x="8" y="8" width="7" height="7" rx="2" fill="#fff" />
      <rect
        x="17"
        y="8"
        width="7"
        height="7"
        rx="2"
        fill="#fff"
        opacity="0.55"
      />
      <rect
        x="8"
        y="17"
        width="7"
        height="7"
        rx="2"
        fill="#fff"
        opacity="0.55"
      />
      <rect
        x="17"
        y="17"
        width="7"
        height="7"
        rx="2"
        fill="#fff"
        opacity="0.85"
      />
    </svg>
  </span>
);

export default Logo;
