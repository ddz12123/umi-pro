import {
  ConfirmButton,
  ExportButton,
  FormModal,
  StatusTag,
} from '@/components';
import {
  createUser,
  ExampleUser,
  queryUsers,
  removeUser,
  updateUser,
} from '@/services/example';
import { ActionType, ProColumns, ProTable } from '@ant-design/pro-components';
import { App, Button, Form, Input, Select } from 'antd';
import React, { useRef, useState } from 'react';
import styles from './index.less';

/** 示例：把列表数据转成 CSV Blob；接真实导出接口时直接返回接口 Blob 即可 */
function toCsvBlob(list: ExampleUser[]): Blob {
  const rows = [
    ['姓名', '昵称', '邮箱', '性别', '状态', '创建时间'],
    ...list.map((item) => [
      item.name,
      item.nickName ?? '',
      item.email ?? '',
      item.gender === 'MALE' ? '男' : item.gender === 'FEMALE' ? '女' : '',
      item.status === 'active'
        ? '启用'
        : item.status === 'disabled'
        ? '禁用'
        : '',
      item.createdAt ?? '',
    ]),
  ];
  const csv = rows
    .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(','))
    .join('\r\n');
  return new Blob([`\ufeff${csv}`], { type: 'text/csv' });
}

/**
 * 示例页面：mock 接口 + 请求封装 + ProTable 的标准 CRUD 写法
 * 搜索卡片、表格卡片、分页全部使用 ProTable 自带实现，布局只由 CSS 控制
 */
const ExamplePage: React.FC = () => {
  const { message } = App.useApp();
  const actionRef = useRef<ActionType>();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ExampleUser>();

  const openCreate = () => {
    setEditing(undefined);
    setModalOpen(true);
  };

  const openEdit = (record: ExampleUser) => {
    setEditing(record);
    setModalOpen(true);
  };

  const handleSubmit = async (values: Partial<ExampleUser>) => {
    if (editing) {
      await updateUser(editing.id, values);
      message.success('更新成功');
    } else {
      await createUser(values as Omit<ExampleUser, 'id' | 'createdAt'>);
      message.success('创建成功');
    }
  };

  const handleDelete = async (record: ExampleUser) => {
    await removeUser(record.id);
    message.success('删除成功');
    actionRef.current?.reload();
  };

  /** 示例导出：拉取列表数据在前端生成 CSV，真实项目换成后端导出接口 */
  const handleExport = async () => {
    const result = await queryUsers({ current: 1, pageSize: 100 });
    return toCsvBlob(result.list);
  };

  const columns: ProColumns<ExampleUser>[] = [
    {
      title: '姓名',
      dataIndex: 'name',
      width: 140,
      formItemProps: {
        rules: [{ required: true, message: '请输入姓名' }],
      },
    },
    {
      title: '昵称',
      dataIndex: 'nickName',
      width: 120,
      search: false,
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      copyable: true,
      search: false,
    },
    {
      title: '性别',
      dataIndex: 'gender',
      width: 100,
      valueEnum: {
        MALE: { text: '男' },
        FEMALE: { text: '女' },
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      valueEnum: {
        active: { text: '启用', status: 'Success' },
        disabled: { text: '禁用', status: 'Default' },
      },
      render: (_, record) => <StatusTag value={record.status} />,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      valueType: 'dateTime',
      width: 180,
      search: false,
    },
    {
      title: '操作',
      valueType: 'option',
      width: 120,
      render: (_, record) => [
        <Button
          key="edit"
          type="link"
          size="small"
          onClick={() => openEdit(record)}
        >
          编辑
        </Button>,
        <ConfirmButton
          key="delete"
          type="link"
          danger
          size="small"
          confirmTitle="确认删除该用户？"
          confirmProps={{ okText: '删除', cancelText: '取消' }}
          onConfirm={() => handleDelete(record)}
        >
          删除
        </ConfirmButton>,
      ],
    },
  ];

  return (
    <>
      <div className={styles.tableWrap}>
        <ProTable<ExampleUser>
          headerTitle="列表示例"
          rowKey="id"
          actionRef={actionRef}
          columns={columns}
          search={{ labelWidth: 'auto' }}
          pagination={{
            defaultPageSize: 10,
            showSizeChanger: true,
            // ProTable 默认随表格尺寸把分页降为 small
            size: 'middle',
          }}
          toolBarRender={() => [
            <ExportButton key="export" onExport={handleExport} />,
            <Button key="create" type="primary" onClick={openCreate}>
              新建用户
            </Button>,
          ]}
          // 传 scroll.y 让 antd 拆出独立表头(.ant-table-header)和数据区(.ant-table-body)，
          // 滚动条只出现在数据区。y 值只是开关，实际高度由 src/styles/table-layout.less 接管
          scroll={{ y: 1 }}
          request={async (params) => {
            try {
              const { current, pageSize, name, gender, status } = params;
              const result = await queryUsers({
                current,
                pageSize,
                keyword: name as string,
                gender: gender as string,
                status: status as string,
              });
              return {
                data: result.list,
                total: result.total,
                success: true,
              };
            } catch {
              return { data: [], total: 0, success: false };
            }
          }}
        />
      </div>

      <FormModal<Partial<ExampleUser>>
        title={editing ? '编辑用户' : '新建用户'}
        open={modalOpen}
        onSubmit={handleSubmit}
        onCancel={() => setModalOpen(false)}
        onSuccess={() => actionRef.current?.reload()}
        initialValues={editing ?? {}}
        width={520}
      >
        <Form.Item
          name="name"
          label="姓名"
          rules={[{ required: true, message: '请输入姓名' }]}
        >
          <Input placeholder="请输入姓名" />
        </Form.Item>
        <Form.Item name="nickName" label="昵称">
          <Input placeholder="请输入昵称" />
        </Form.Item>
        <Form.Item
          name="email"
          label="邮箱"
          rules={[{ type: 'email', message: '邮箱格式不正确' }]}
        >
          <Input placeholder="请输入邮箱" />
        </Form.Item>
        <Form.Item name="gender" label="性别">
          <Select
            placeholder="请选择性别"
            options={[
              { value: 'MALE', label: '男' },
              { value: 'FEMALE', label: '女' },
            ]}
          />
        </Form.Item>
        <Form.Item name="status" label="状态">
          <Select
            placeholder="请选择状态"
            options={[
              { value: 'active', label: '启用' },
              { value: 'disabled', label: '禁用' },
            ]}
          />
        </Form.Item>
      </FormModal>
    </>
  );
};

export default ExamplePage;
