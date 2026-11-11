import type { ProTableProps } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import styles from './index.less';

/**
 * 列表页表格：内置撑满容器（固定表头 + 数据区滚动）与分页/搜索/滚动默认值。
 * 所有默认值均可通过同名 props 覆盖，业务只关心 columns 与 request。
 */
function PageTable<
  T extends Record<string, any> = Record<string, unknown>,
  U extends Record<string, any> = Record<string, unknown>,
>(props: ProTableProps<T, U>) {
  const { pagination, search, scroll, ...rest } = props;

  return (
    <div className={styles.tableWrap}>
      <ProTable<T, U>
        rowKey="id"
        search={search === false ? false : { labelWidth: 'auto', ...search }}
        pagination={
          pagination === false
            ? false
            : {
                defaultPageSize: 10,
                showSizeChanger: true,
                size: 'middle',
                ...pagination,
              }
        }
        scroll={{ y: 1, ...scroll }}
        {...rest}
      />
    </div>
  );
}

export default PageTable;
