import React from 'react';
import styles from './index.less';

interface PageHeaderProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  extra?: React.ReactNode;
  className?: string;
}

/** 页面级标题区，统一各业务页的间距与字号 */
const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  extra,
  className,
}) => (
  <div className={[styles.header, className].filter(Boolean).join(' ')}>
    <div className={styles.content}>
      <h2 className={styles.title}>{title}</h2>
      {description ? <p className={styles.description}>{description}</p> : null}
    </div>
    {extra ? <div className={styles.extra}>{extra}</div> : null}
  </div>
);

export default PageHeader;
