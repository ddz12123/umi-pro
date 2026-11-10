import { useAccess } from '@/hooks/useAccess';
import { routeIconKeys } from '@/router';
import type {
  PermissionPayload,
  PermissionType,
  SystemPermission,
} from '@/services/system';
import {
  createSystemPermission,
  querySystemPermissions,
  removeSystemPermission,
  updateSystemPermission,
} from '@/services/system';
import { ActionType, ProColumns, ProTable } from '@ant-design/pro-components';
import {
  App,
  Button,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Select,
  TreeSelect,
} from 'antd';
import React, { useMemo, useRef, useState } from 'react';
import styles from '../index.less';

const ICON_TEXT: Record<string, string> = {
  dashboard: '仪表盘',
  table: '表格',
  system: '系统',
  user: '用户',
  role: '角色',
  menu: '菜单',
};

interface ParentTreeNode {
  value: string;
  title: string;
  children?: ParentTreeNode[];
}

/** 父级选择器：按钮只能挂菜单，目录/菜单只能挂目录 */
function buildParentTree(
  permissions: SystemPermission[],
  type: PermissionType | undefined,
  excludedId?: string,
): ParentTreeNode[] {
  if (!type) return [];
  return permissions.flatMap((permission) => {
    if (permission.id === excludedId) return [];
    if (permission.type !== (type === 'button' ? 'menu' : 'directory')) {
      return [];
    }
    const children = buildParentTree(
      permission.children ?? [],
      type,
      excludedId,
    );
    return [
      {
        value: permission.id,
        title: permission.name,
        children: children.length ? children : undefined,
      },
    ];
  });
}

/** 权限管理：维护菜单权限和按钮权限，作为角色授权和菜单可见性的数据源 */
const SystemPermissionPage: React.FC = () => {
  const { message } = App.useApp();
  const { hasPermission } = useAccess();
  const canCreate = hasPermission('system:permission:create');
  const canUpdate = hasPermission('system:permission:update');
  const canDelete = hasPermission('system:permission:delete');
  const actionRef = useRef<ActionType>();
  const [form] = Form.useForm<PermissionPayload>();
  const permissionType = Form.useWatch('type', form);
  const [permissionTree, setPermissionTree] = useState<SystemPermission[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<SystemPermission>();
  const [createParent, setCreateParent] = useState<SystemPermission>();
  const [submitting, setSubmitting] = useState(false);

  const parentTreeData = useMemo(
    () => buildParentTree(permissionTree, permissionType, editing?.id),
    [editing?.id, permissionTree, permissionType],
  );

  const openCreate = (parent?: SystemPermission) => {
    setEditing(undefined);
    setCreateParent(parent);
    setModalOpen(true);
  };

  const openEdit = (record: SystemPermission) => {
    setEditing(record);
    setCreateParent(undefined);
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const payload: PermissionPayload = {
        ...values,
        parentId: values.parentId ?? null,
        order: Number(values.order) || 1,
      };
      setSubmitting(true);
      if (editing) {
        await updateSystemPermission(editing.id, payload);
        message.success('权限更新成功，刷新或重新登录后生效');
      } else {
        await createSystemPermission(payload);
        message.success('权限创建成功，刷新或重新登录后生效');
      }
      setModalOpen(false);
      actionRef.current?.reload();
    } catch {
      // 表单校验失败或接口异常，接口异常已由全局 errorHandler 提示
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (record: SystemPermission) => {
    try {
      await removeSystemPermission(record.id);
      message.success('权限删除成功，刷新或重新登录后生效');
      actionRef.current?.reload();
    } catch {
      // 已由全局 errorHandler 提示
    }
  };

  const columns: ProColumns<SystemPermission>[] = [
    {
      title: '权限名称',
      dataIndex: 'name',
      width: 220,
    },
    {
      title: '权限类型',
      dataIndex: 'type',
      width: 110,
      valueEnum: {
        directory: { text: '菜单目录', status: 'Processing' },
        menu: { text: '菜单页面', status: 'Success' },
        button: { text: '按钮权限', status: 'Default' },
      },
    },
    {
      title: '路由路径',
      dataIndex: 'path',
      width: 180,
      render: (_, record) => record.path ?? '-',
    },
    {
      title: '组件 key',
      dataIndex: 'component',
      width: 180,
      render: (_, record) => record.component ?? '-',
    },
    {
      title: '权限标识',
      dataIndex: 'permission',
      width: 210,
      render: (_, record) =>
        record.permission ? (
          <span className={styles.permissionCode}>{record.permission}</span>
        ) : (
          '-'
        ),
    },
    {
      title: '排序',
      dataIndex: 'order',
      width: 80,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 90,
      valueEnum: {
        active: { text: '启用', status: 'Success' },
        disabled: { text: '禁用', status: 'Default' },
      },
    },
    {
      title: '操作',
      valueType: 'option',
      width: 200,
      render: (_, record) => {
        const actions: React.ReactNode[] = [];
        if (canCreate && record.type !== 'button') {
          actions.push(
            <Button
              key="child"
              type="link"
              size="small"
              onClick={() => openCreate(record)}
            >
              新增子权限
            </Button>,
          );
        }
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
        if (canDelete) {
          actions.push(
            <Popconfirm
              key="delete"
              title={`确认删除「${record.name}」？`}
              description="存在子级时无法删除，删除后刷新页面路由生效。"
              okText="删除"
              cancelText="取消"
              onConfirm={() => handleDelete(record)}
            >
              <Button type="link" danger size="small">
                删除
              </Button>
            </Popconfirm>,
          );
        }
        return actions.length ? actions : '-';
      },
    },
  ];

  return (
    <>
      <div className={styles.tableWrap}>
        <ProTable<SystemPermission>
          headerTitle="权限管理"
          rowKey="id"
          actionRef={actionRef}
          columns={columns}
          search={false}
          pagination={false}
          scroll={{ y: 1 }}
          expandable={{ defaultExpandAllRows: true }}
          toolBarRender={() =>
            canCreate
              ? [
                  <Button
                    key="create"
                    type="primary"
                    onClick={() => openCreate()}
                  >
                    新建根权限
                  </Button>,
                ]
              : []
          }
          request={async () => {
            try {
              const data = await querySystemPermissions();
              setPermissionTree(data);
              return { data, total: data.length, success: true };
            } catch {
              return { data: [], total: 0, success: false };
            }
          }}
        />
      </div>

      <Modal
        title={editing ? '编辑权限' : '新建权限'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        confirmLoading={submitting}
        destroyOnHidden
        afterOpenChange={(open) => {
          if (!open) return;
          form.resetFields();
          if (editing) {
            form.setFieldsValue({
              parentId: editing.parentId ?? undefined,
              name: editing.name,
              type: editing.type,
              path: editing.path,
              component: editing.component,
              permission: editing.permission,
              icon: editing.icon,
              layoutMode: editing.layoutMode ?? 'fill',
              order: editing.order,
              status: editing.status,
            });
            return;
          }
          const nextType: PermissionType =
            createParent?.type === 'menu'
              ? 'button'
              : createParent?.type === 'directory'
              ? 'menu'
              : 'directory';
          form.setFieldsValue({
            parentId: createParent?.id,
            type: nextType,
            status: 'active',
            order: 1,
            layoutMode: 'fill',
          });
        }}
        width={620}
      >
        <Form form={form} layout="vertical" preserve={false}>
          <Form.Item
            name="type"
            label="权限类型"
            rules={[{ required: true, message: '请选择权限类型' }]}
          >
            <Select
              disabled={Boolean(editing?.children?.length)}
              options={[
                { value: 'directory', label: '菜单目录' },
                { value: 'menu', label: '菜单页面' },
                { value: 'button', label: '按钮权限' },
              ]}
              onChange={() => form.setFieldValue('parentId', undefined)}
            />
          </Form.Item>
          <Form.Item
            name="parentId"
            label="父级权限"
            rules={
              permissionType === 'button'
                ? [{ required: true, message: '按钮权限必须选择父级菜单' }]
                : undefined
            }
          >
            <TreeSelect
              allowClear
              treeDefaultExpandAll
              treeData={parentTreeData}
              placeholder={
                permissionType === 'button'
                  ? '请选择父级菜单'
                  : '不选则为根节点'
              }
            />
          </Form.Item>
          <Form.Item
            name="name"
            label="权限名称"
            rules={[{ required: true, message: '请输入权限名称' }]}
          >
            <Input placeholder="例如：用户管理" />
          </Form.Item>
          {permissionType !== 'button' ? (
            <Form.Item
              name="path"
              label="路由路径"
              rules={[
                { required: true, message: '请输入以 / 开头的路由路径' },
                {
                  pattern: /^\/[a-zA-Z0-9_-]+(?:\/[a-zA-Z0-9_-]+)*$/,
                  message: '请使用规范的绝对路径，不能包含空段',
                },
              ]}
            >
              <Input placeholder="例如：/system/user" />
            </Form.Item>
          ) : null}
          {permissionType === 'menu' ? (
            <Form.Item
              name="component"
              label="页面组件路径"
              rules={[{ required: true, message: '请输入页面组件路径' }]}
            >
              <Input placeholder="例如：@/pages/System/User" />
            </Form.Item>
          ) : null}
          <Form.Item
            name="permission"
            label="权限标识"
            rules={
              permissionType === 'directory'
                ? undefined
                : [
                    {
                      required: true,
                      message:
                        permissionType === 'button'
                          ? '请输入按钮权限标识'
                          : '请输入菜单权限标识',
                    },
                  ]
            }
          >
            <Input placeholder="例如：system:user:create" />
          </Form.Item>
          {permissionType !== 'button' ? (
            <Form.Item name="icon" label="图标">
              <Select
                allowClear
                placeholder="可选"
                options={routeIconKeys.map((key) => ({
                  value: key,
                  label: ICON_TEXT[key] ?? key,
                }))}
              />
            </Form.Item>
          ) : null}
          {permissionType === 'menu' ? (
            <Form.Item name="layoutMode" label="页面布局">
              <Select
                options={[
                  { value: 'fill', label: '撑满（表格页）' },
                  { value: 'page', label: '页面滚动（详情页）' },
                ]}
              />
            </Form.Item>
          ) : null}
          <Form.Item
            name="order"
            label="排序"
            rules={[{ required: true, message: '请输入排序值' }]}
          >
            <InputNumber min={0} precision={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="status" label="状态">
            <Select
              options={[
                { value: 'active', label: '启用' },
                { value: 'disabled', label: '禁用' },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default SystemPermissionPage;
