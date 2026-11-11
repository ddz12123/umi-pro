import React, { useId } from 'react';
import styles from './index.less';

interface LogoProps {
  size?: number;
  className?: string;
}

/** 品牌标识：U 形容器 + 波浪 + 悬浮珍珠，渐变跟随主题色 */
const Logo: React.FC<LogoProps> = ({ size = 32, className }) => {
  const gradientId = useId();
  return (
    <span
      aria-hidden
      className={[styles.logo, className].filter(Boolean).join(' ')}
      style={{ width: size, height: size, borderRadius: size * 0.3 }}
    >
      <svg viewBox="0 0 48 48" width="100%" height="100%">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fff" />
            <stop offset="1" stopColor="#fff" stopOpacity="0.78" />
          </linearGradient>
        </defs>
        <path
          d="M15 14v10.6c0 5.9 4.1 9.9 9 9.9s9-4 9-9.9V14"
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth="5"
          strokeLinecap="round"
        />
        <path
          className={styles.wave}
          d="M18.7 26.2c1.8-2.1 3.6-2.1 5.3 0s3.5 2.1 5.3 0"
          fill="none"
          stroke="#fff"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
        <circle className={styles.pearl} cx="24" cy="13" r="3.1" fill="#fff" />
      </svg>
    </span>
  );
};

export default Logo;
