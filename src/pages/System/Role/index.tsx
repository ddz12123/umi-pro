import { ConfirmButton, FormModal, StatusTag } from '@/components';
import { useAccess } from '@/hooks/useAccess';
import type {
  RolePayload,
  SystemPermission,
  SystemRole,
} from '@/services/system';
import {
  createSystemRole,
  querySystemPermissions,
  querySystemRolePermissions,
  querySystemRoles,
  removeSystemRole,
  updateSystemRole,
  updateSystemRolePermissions,
} from '@/services/system';
import { ActionType, ProColumns, ProTable } from '@ant-design/pro-components';
import { App, Button, Form, Input, Modal, Select, Spin, Tag, Tree } from 'antd';
import type { DataNode } from 'antd/es/tree';
import React, { useRef, useState } from 'react';
import styles from '../index.less';

/** 权限树转 antd Tree，菜单权限和按钮权限同时展示权限标识 */
const toPermissionTree = (permissions: SystemPermission[]): DataNode[] =>
  permissions.map((permission) => {
    const children = permission.children?.length
      ? toPermissionTree(permission.children)
      : undefined;
    return {
      key: permission.id,
      title: (
        <span className={styles.permissionNode}>
          {permission.name}
          <span className={styles.permissionType}>
            {permission.type === 'button'
              ? '按钮'
              : permission.type === 'directory'
              ? '目录'
              : '菜单'}
          </span>
          {permission.permission ? (
            <span className={styles.permissionCode}>
              {permission.permission}
            </span>
          ) : null}
        </span>
      ),
      children,
    };
  });

/** 角色管理：角色 CRUD + 菜单/按钮权限分配 */
const SystemRolePage: React.FC = () => {
  const { message } = App.useApp();
  const { hasPermission } = useAccess();
  const canCreate = hasPermission('system:role:create');
  const canUpdate = hasPermission('system:role:update');
  const canDelete = hasPermission('system:role:delete');
  const canPermission = hasPermission('system:role:permission');
  const actionRef = useRef<ActionType>();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<SystemRole>();

  const [permissionOpen, setPermissionOpen] = useState(false);
  const [permissionRole, setPermissionRole] = useState<SystemRole>();
  const [permissionTree, setPermissionTree] = useState<DataNode[]>([]);
  const [checkedKeys, setCheckedKeys] = useState<React.Key[]>([]);
  const [permissionLoading, setPermissionLoading] = useState(false);
  const [permissionSaving, setPermissionSaving] = useState(false);

  const openCreate = () => {
    setEditing(undefined);
    setModalOpen(true);
  };

  const openEdit = (record: SystemRole) => {
    setEditing(record);
    setModalOpen(true);
  };

  const handleSubmit = async (values: RolePayload) => {
    if (editing) {
      await updateSystemRole(editing.id, values);
      message.success('角色更新成功');
    } else {
      await createSystemRole(values);
      message.success('角色创建成功');
    }
  };

  const handleDelete = async (record: SystemRole) => {
    await removeSystemRole(record.id);
    message.success('角色删除成功');
    actionRef.current?.reload();
  };

  /** 打开弹窗时的回填数据 */
  const initialValues: Partial<RolePayload> = editing
    ? {
        name: editing.name,
        code: editing.code,
        description: editing.description,
        status: editing.status,
      }
    : { status: 'active' };

  /** 打开权限弹窗时同时加载菜单树和角色已有权限 */
  const openPermission = async (record: SystemRole) => {
    setPermissionRole(record);
    setPermissionOpen(true);
    setPermissionLoading(true);
    setPermissionTree([]);
    setCheckedKeys([]);
    try {
      const [permissions, permission] = await Promise.all([
        querySystemPermissions(),
        querySystemRolePermissions(record.id),
      ]);
      setPermissionTree(toPermissionTree(permissions));
      setCheckedKeys(permission.permissionIds);
    } catch {
      // 全局 errorHandler 已提示
    } finally {
      setPermissionLoading(false);
    }
  };

  const handleSavePermission = async () => {
    if (!permissionRole) return;
    try {
      setPermissionSaving(true);
      await updateSystemRolePermissions(
        permissionRole.id,
        checkedKeys.map(String),
      );
      message.success('权限保存成功，相关账号重新登录后生效');
      setPermissionOpen(false);
    } catch {
      // 已由全局 errorHandler 提示
    } finally {
      setPermissionSaving(false);
    }
  };

  const columns: ProColumns<SystemRole>[] = [
    {
      title: '角色名称',
      dataIndex: 'name',
      width: 170,
      formItemProps: {
        rules: [{ required: true, message: '请输入角色名称' }],
      },
    },
    {
      title: '角色编码',
      dataIndex: 'code',
      width: 180,
      search: false,
      render: (_, record) => <Tag>{record.code}</Tag>,
    },
    {
      title: '描述',
      dataIndex: 'description',
      ellipsis: true,
      search: false,
    },
    {
      title: '用户数',
      dataIndex: 'userCount',
      width: 100,
      search: false,
      render: (_, record) => record.userCount ?? 0,
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
      width: 180,
      valueType: 'dateTime',
      search: false,
    },
    {
      title: '操作',
      valueType: 'option',
      width: 210,
      render: (_, record) => {
        const actions: React.ReactNode[] = [];
        if (canUpdate) {
          actions.push(
            <Button
              key="edit"
              type="link"
              size="small"
              onClick={() => openEdit(record)}
            >
              编辑
            </Button>,
          );
        }
        if (canPermission) {
          actions.push(
            <Button
              key="permission"
              type="link"
              size="small"
              disabled={record.code === 'SUPER_ADMIN'}
              onClick={() => openPermission(record)}
            >
              权限
            </Button>,
          );
        }
        if (canDelete) {
          actions.push(
            <ConfirmButton
              key="delete"
              type="link"
              danger
              size="small"
              disabled={record.code === 'SUPER_ADMIN'}
              confirmTitle={`确认删除角色「${record.name}」？`}
              confirmProps={{ okText: '删除', cancelText: '取消' }}
              onConfirm={() => handleDelete(record)}
            >
              删除
            </ConfirmButton>,
          );
        }
        return actions.length ? actions : '-';
      },
    },
  ];

  return (
    <>
      <div className={styles.tableWrap}>
        <ProTable<SystemRole>
          headerTitle="角色管理"
          rowKey="id"
          actionRef={actionRef}
          columns={columns}
          search={{ labelWidth: 'auto' }}
          pagination={{
            defaultPageSize: 10,
            showSizeChanger: true,
            size: 'middle',
          }}
          toolBarRender={() =>
            canCreate
              ? [
                  <Button key="create" type="primary" onClick={openCreate}>
                    新建角色
                  </Button>,
                ]
              : []
          }
          scroll={{ y: 1 }}
          request={async (params) => {
            try {
              const { current, pageSize, name, status } = params;
              const result = await querySystemRoles({
                current,
                pageSize,
                keyword: name as string,
                status: status as string,
              });
              return { data: result.list, total: result.total, success: true };
            } catch {
              return { data: [], total: 0, success: false };
            }
          }}
        />
      </div>

      <FormModal<RolePayload>
        title={editing ? '编辑角色' : '新建角色'}
        open={modalOpen}
        onSubmit={handleSubmit}
        onCancel={() => setModalOpen(false)}
        onSuccess={() => actionRef.current?.reload()}
        initialValues={initialValues}
        width={540}
      >
        <Form.Item
          name="name"
          label="角色名称"
          rules={[{ required: true, message: '请输入角色名称' }]}
        >
          <Input placeholder="例如：运营管理员" />
        </Form.Item>
        <Form.Item
          name="code"
          label="角色编码"
          rules={[
            { required: true, message: '请输入角色编码' },
            {
              pattern: /^[A-Z][A-Z0-9_]*$/,
              message: '只能包含大写字母、数字和下划线',
            },
          ]}
        >
          <Input placeholder="例如：OPS_ADMIN" disabled={Boolean(editing)} />
        </Form.Item>
        <Form.Item name="description" label="描述">
          <Input.TextArea rows={3} placeholder="请输入角色职责说明" />
        </Form.Item>
        <Form.Item name="status" label="状态">
          <Select
            options={[
              { value: 'active', label: '启用' },
              { value: 'disabled', label: '禁用' },
            ]}
          />
        </Form.Item>
      </FormModal>

      <Modal
        title={`角色权限${permissionRole ? `：${permissionRole.name}` : ''}`}
        open={permissionOpen}
        onOk={handleSavePermission}
        onCancel={() => setPermissionOpen(false)}
        confirmLoading={permissionSaving}
        okButtonProps={{ disabled: permissionLoading }}
        destroyOnHidden
        width={620}
      >
        {permissionLoading ? (
          <div style={{ padding: '64px 0', textAlign: 'center' }}>
            <Spin />
          </div>
        ) : (
          <div className={styles.permissionTree}>
            <Tree
              key={permissionRole?.id}
              checkable
              defaultExpandAll
              treeData={permissionTree}
              checkedKeys={checkedKeys}
              onCheck={(keys) =>
                setCheckedKeys(
                  Array.isArray(keys)
                    ? keys
                    : [...keys.checked, ...keys.halfChecked],
                )
              }
            />
          </div>
        )}
      </Modal>
    </>
  );
};

export default SystemRolePage;
