/**
 * RBAC 系统管理 mock
 * ------------------------------------------------------------------
 * 用户、角色、权限三张数据在开发进程内共享，增删改后刷新列表即可看到。
 * 权限树同时用于生成 /api/v1/routes 的动态路由：
 * 菜单权限会进入路由，按钮权限只作为角色授权点。
 */

export type SystemStatus = 'active' | 'disabled';
export type SystemPermissionType = 'directory' | 'menu' | 'button';
export type SystemLayoutMode = 'fill' | 'page';

export interface MockMenu {
  id: string;
  parentId: string | null;
  name: string;
  type: SystemPermissionType;
  path?: string;
  component?: string;
  permission?: string;
  icon?: string;
  layoutMode?: SystemLayoutMode;
  order: number;
  status: SystemStatus;
  createdAt: string;
}

export interface MockRole {
  id: string;
  name: string;
  code: string;
  description?: string;
  status: SystemStatus;
  permissionIds: string[];
  createdAt: string;
}

export interface MockUser {
  id: string;
  username: string;
  nickName: string;
  email?: string;
  mobile?: string;
  roleIds: string[];
  status: SystemStatus;
  createdAt: string;
}

const now = Date.now();
const day = 24 * 60 * 60 * 1000;
const createdAt = (offset: number) =>
  new Date(now - offset * day).toISOString();

/** 菜单种子数据：系统管理目录 + 三个页面 + 页面按钮权限 */
let menus: MockMenu[] = [
  {
    id: 'menu-system',
    parentId: null,
    name: '系统管理',
    type: 'directory',
    path: '/system',
    icon: 'system',
    order: 10,
    status: 'active',
    createdAt: createdAt(30),
  },
  {
    id: 'menu-system-user',
    parentId: 'menu-system',
    name: '用户管理',
    type: 'menu',
    path: '/system/user',
    component: 'System/User',
    permission: 'system:user:list',
    icon: 'user',
    layoutMode: 'fill',
    order: 1,
    status: 'active',
    createdAt: createdAt(29),
  },
  {
    id: 'menu-system-user-create',
    parentId: 'menu-system-user',
    name: '新增用户',
    type: 'button',
    permission: 'system:user:create',
    order: 1,
    status: 'active',
    createdAt: createdAt(28),
  },
  {
    id: 'menu-system-user-update',
    parentId: 'menu-system-user',
    name: '编辑用户',
    type: 'button',
    permission: 'system:user:update',
    order: 2,
    status: 'active',
    createdAt: createdAt(27),
  },
  {
    id: 'menu-system-user-delete',
    parentId: 'menu-system-user',
    name: '删除用户',
    type: 'button',
    permission: 'system:user:delete',
    order: 3,
    status: 'active',
    createdAt: createdAt(26),
  },
  {
    id: 'menu-system-role',
    parentId: 'menu-system',
    name: '角色管理',
    type: 'menu',
    path: '/system/role',
    component: 'System/Role',
    permission: 'system:role:list',
    icon: 'role',
    layoutMode: 'fill',
    order: 2,
    status: 'active',
    createdAt: createdAt(25),
  },
  {
    id: 'menu-system-role-create',
    parentId: 'menu-system-role',
    name: '新增角色',
    type: 'button',
    permission: 'system:role:create',
    order: 1,
    status: 'active',
    createdAt: createdAt(24),
  },
  {
    id: 'menu-system-role-update',
    parentId: 'menu-system-role',
    name: '编辑角色',
    type: 'button',
    permission: 'system:role:update',
    order: 2,
    status: 'active',
    createdAt: createdAt(23),
  },
  {
    id: 'menu-system-role-delete',
    parentId: 'menu-system-role',
    name: '删除角色',
    type: 'button',
    permission: 'system:role:delete',
    order: 3,
    status: 'active',
    createdAt: createdAt(22),
  },
  {
    id: 'menu-system-role-permission',
    parentId: 'menu-system-role',
    name: '角色授权',
    type: 'button',
    permission: 'system:role:permission',
    order: 4,
    status: 'active',
    createdAt: createdAt(21),
  },
  {
    id: 'menu-system-permission',
    parentId: 'menu-system',
    name: '权限管理',
    type: 'menu',
    path: '/system/permission',
    component: 'System/Permission',
    permission: 'system:permission:list',
    icon: 'menu',
    layoutMode: 'fill',
    order: 3,
    status: 'active',
    createdAt: createdAt(20),
  },
  {
    id: 'menu-system-permission-create',
    parentId: 'menu-system-permission',
    name: '新增权限',
    type: 'button',
    permission: 'system:permission:create',
    order: 1,
    status: 'active',
    createdAt: createdAt(19),
  },
  {
    id: 'menu-system-permission-update',
    parentId: 'menu-system-permission',
    name: '编辑权限',
    type: 'button',
    permission: 'system:permission:update',
    order: 2,
    status: 'active',
    createdAt: createdAt(18),
  },
  {
    id: 'menu-system-permission-delete',
    parentId: 'menu-system-permission',
    name: '删除权限',
    type: 'button',
    permission: 'system:permission:delete',
    order: 3,
    status: 'active',
    createdAt: createdAt(17),
  },
  {
    id: 'menu-example',
    parentId: null,
    name: '列表示例',
    type: 'menu',
    path: '/example',
    component: 'Example',
    permission: 'example:list',
    icon: 'table',
    layoutMode: 'fill',
    order: 20,
    status: 'active',
    createdAt: createdAt(16),
  },
];

const allPermissionIds = () => menus.map((menu) => menu.id);

let roles: MockRole[] = [
  {
    id: 'role-super',
    name: '超级管理员',
    code: 'SUPER_ADMIN',
    description: '拥有系统全部菜单和按钮权限',
    status: 'active',
    permissionIds: allPermissionIds(),
    createdAt: createdAt(15),
  },
  {
    id: 'role-ops',
    name: '运营管理员',
    code: 'OPS_ADMIN',
    description: '负责用户与角色日常维护',
    status: 'active',
    permissionIds: [
      'menu-system',
      'menu-system-user',
      'menu-system-user-create',
      'menu-system-user-update',
      'menu-system-role',
      'menu-system-role-permission',
      'menu-example',
    ],
    createdAt: createdAt(14),
  },
  {
    id: 'role-auditor',
    name: '审计员',
    code: 'AUDITOR',
    description: '只读查看系统数据',
    status: 'active',
    permissionIds: [
      'menu-system',
      'menu-system-user',
      'menu-system-role',
      'menu-system-permission',
      'menu-example',
    ],
    createdAt: createdAt(13),
  },
  {
    id: 'role-disabled',
    name: '临时角色',
    code: 'TEMP_ROLE',
    description: '停用角色示例',
    status: 'disabled',
    permissionIds: ['menu-example'],
    createdAt: createdAt(12),
  },
];

const SURNAMES = ['张', '李', '王', '赵', '刘', '陈', '杨', '黄', '周', '吴'];
const GIVEN_NAMES = [
  '伟',
  '芳',
  '娜',
  '敏',
  '静',
  '磊',
  '洋',
  '勇',
  '艳',
  '杰',
];

let users: MockUser[] = [
  {
    id: 'user-admin',
    username: 'admin',
    nickName: '管理员',
    email: 'admin@example.com',
    mobile: '13800000000',
    roleIds: ['role-super'],
    status: 'active',
    createdAt: createdAt(11),
  },
  {
    id: 'user-operator',
    username: 'operator',
    nickName: '运营管理员',
    email: 'operator@example.com',
    mobile: '13800000001',
    roleIds: ['role-ops'],
    status: 'active',
    createdAt: createdAt(10),
  },
  {
    id: 'user-viewer',
    username: 'viewer',
    nickName: '审计员',
    email: 'viewer@example.com',
    mobile: '13800000002',
    roleIds: ['role-auditor'],
    status: 'active',
    createdAt: createdAt(9),
  },
  ...Array.from({ length: 23 }, (_, index): MockUser => {
    const roleId =
      index % 7 === 0
        ? 'role-ops'
        : index % 5 === 0
        ? 'role-auditor'
        : 'role-ops';
    return {
      id: `user-${index + 1}`,
      username: `user${String(index + 1).padStart(2, '0')}`,
      nickName: `${SURNAMES[index % SURNAMES.length]}${
        GIVEN_NAMES[index % GIVEN_NAMES.length]
      }`,
      email: `user${index + 1}@example.com`,
      mobile: `1380000${String(index + 1).padStart(4, '0')}`,
      roleIds: [roleId],
      status: index % 6 === 0 ? 'disabled' : 'active',
      createdAt: createdAt(index + 1),
    };
  }),
];

let nextUserId = 30;
let nextRoleId = 5;
let nextMenuId = 30;

/** 从 mock token 中解析用户名，token 形如 mock-token-admin-1690000000000 */
export function getUsernameFromToken(authorization?: string) {
  const token = String(authorization || '').replace(/^Bearer\s+/i, '');
  return /^mock-token-(.+?)-\d+$/.exec(token)?.[1];
}

export function getUsernameFromRequest(req: any) {
  return getUsernameFromToken(
    req.headers?.authorization || req.headers?.Authorization,
  );
}

/** 当前用户的权限码集合：超级管理员拥有全部权限，普通角色取角色权限并集 */
export function getUserPermissionCodes(username?: string): string[] {
  if (!username) return [];
  const user = users.find((item) => item.username === username);
  if (!user || user.status !== 'active') return [];
  const userRoles = roles.filter(
    (role) => user.roleIds.includes(role.id) && role.status === 'active',
  );
  if (userRoles.some((role) => role.code === 'SUPER_ADMIN')) {
    return Array.from(
      new Set(
        menus
          .filter((menu) => menu.status === 'active')
          .map((menu) => menu.permission)
          .filter((permission): permission is string => Boolean(permission)),
      ),
    );
  }
  const permissionIds = new Set(
    userRoles.flatMap((role) => role.permissionIds),
  );
  return Array.from(
    new Set(
      menus
        .filter(
          (menu) =>
            menu.status === 'active' &&
            permissionIds.has(menu.id) &&
            Boolean(menu.permission),
        )
        .map((menu) => menu.permission as string),
    ),
  );
}

/** 登录接口返回角色信息和菜单/按钮两类权限码 */
export function getUserAuthInfo(username?: string) {
  const user = users.find((item) => item.username === username);
  if (!user || user.status !== 'active') {
    return {
      roles: [],
      permissions: { menus: [], buttons: [] },
    };
  }
  const userRoles = roles.filter(
    (role) => user.roleIds.includes(role.id) && role.status === 'active',
  );
  const isSuper = userRoles.some((role) => role.code === 'SUPER_ADMIN');
  const permissionIds = new Set(
    userRoles.flatMap((role) => role.permissionIds),
  );
  const canUse = (menu: MockMenu) => isSuper || permissionIds.has(menu.id);

  return {
    roles: userRoles.map((role) => ({
      id: role.id,
      name: role.name,
      code: role.code,
    })),
    permissions: {
      // 菜单权限：能进入哪些页面/目录
      menus: menus
        .filter(
          (menu) =>
            menu.status === 'active' &&
            menu.type !== 'button' &&
            Boolean(menu.permission) &&
            canUse(menu),
        )
        .map((menu) => menu.permission as string),
      // 按钮权限：页面内可执行哪些操作
      buttons: menus
        .filter(
          (menu) =>
            menu.status === 'active' &&
            menu.type === 'button' &&
            Boolean(menu.permission) &&
            canUse(menu),
        )
        .map((menu) => menu.permission as string),
    },
  };
}

const hasPermission = (req: any, code: string) =>
  getUserPermissionCodes(getUsernameFromRequest(req)).includes(code);

const hasAnyPermission = (req: any, codes: string[]) => {
  const permissions = new Set(
    getUserPermissionCodes(getUsernameFromRequest(req)),
  );
  return codes.some((code) => permissions.has(code));
};

const ok = (res: any, data: unknown, msg = 'ok') =>
  res.json({ code: 0, msg, data });
const fail = (res: any, msg: string, code = 1001) =>
  res.json({ code, msg, data: null });

const text = (value: unknown) =>
  typeof value === 'string' ? value.trim() : '';

const pageParams = (query: any) => {
  const current = Math.max(1, Number(query?.current) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(query?.pageSize) || 10));
  return { current, pageSize };
};

/** 用户列表需要携带角色名称，避免前端再逐行请求角色详情 */
const decorateUser = (user: MockUser) => ({
  ...user,
  roleNames: user.roleIds
    .map((id) => roles.find((role) => role.id === id)?.name)
    .filter((name): name is string => Boolean(name)),
});

/** 角色列表携带使用人数，删除前可以直观看到是否仍被引用 */
const decorateRole = (role: MockRole) => ({
  ...role,
  userCount: users.filter((user) => user.roleIds.includes(role.id)).length,
});

/** 权限树同时用于权限管理和角色授权 */
const buildMenuTree = (parentId: string | null = null): any[] =>
  menus
    .filter((menu) => menu.parentId === parentId)
    .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name))
    .map((menu) => {
      const children = buildMenuTree(menu.id);
      return children.length ? { ...menu, children } : { ...menu };
    });

/** 校验父节点，禁止把节点挂到自己或自己的后代下面 */
const isDescendant = (menuId: string, parentId: string | null) => {
  let currentParentId = parentId;
  while (currentParentId) {
    if (currentParentId === menuId) return true;
    const parentIdToFind = currentParentId;
    currentParentId =
      menus.find((menu) => menu.id === parentIdToFind)?.parentId ?? null;
  }
  return false;
};

/**
 * 菜单表单校验与字段清洗
 * - 菜单权限必须有 path
 * - 菜单页面必须有 component
 * - 按钮权限必须有 permission，且只能挂在菜单页面下
 */
const parseMenuInput = (body: any, id?: string) => {
  const name = text(body.name);
  if (!name) throw new Error('权限名称不能为空');
  if (!['directory', 'menu', 'button'].includes(body.type)) {
    throw new Error('权限类型无效');
  }
  const type = body.type as SystemPermissionType;
  const parentId = body.parentId ? String(body.parentId) : null;
  if (parentId) {
    const parent = menus.find((menu) => menu.id === parentId);
    if (!parent) throw new Error('父级权限不存在');
    if (parent.type === 'button') throw new Error('按钮权限不能作为父级');
    if (type === 'button' && parent.type !== 'menu') {
      throw new Error('按钮权限必须挂在菜单页面下');
    }
    if (type !== 'button' && parent.type !== 'directory') {
      throw new Error('菜单权限只能挂在目录下');
    }
    if (id && isDescendant(id, parentId)) {
      throw new Error('不能把菜单移动到自己的子级');
    }
  } else if (type === 'button') {
    throw new Error('按钮权限必须选择父级菜单');
  }

  // 只有目录可以拥有子节点，避免把已有子权限的目录改成页面/按钮
  if (
    id &&
    type !== 'directory' &&
    menus.some((menu) => menu.parentId === id)
  ) {
    throw new Error('存在子权限时只能保持目录类型');
  }

  const path = type === 'button' ? undefined : text(body.path);
  if (type !== 'button' && (!path || !path.startsWith('/'))) {
    throw new Error('菜单权限必须填写以 / 开头的路径');
  }
  if (path && menus.some((menu) => menu.id !== id && menu.path === path)) {
    throw new Error('权限路径已存在');
  }
  if (
    type !== 'button' &&
    !/^\/[a-zA-Z0-9_-]+(?:\/[a-zA-Z0-9_-]+)*$/.test(path!)
  ) {
    throw new Error('权限路径必须是规范的绝对路径');
  }

  const component = type === 'menu' ? text(body.component) : undefined;
  if (type === 'menu' && !component) {
    throw new Error('菜单权限必须填写页面组件 key');
  }
  const permission = text(body.permission) || undefined;
  if (type !== 'directory' && !permission) {
    throw new Error('菜单权限和按钮权限必须填写权限标识');
  }

  return {
    name,
    parentId,
    type,
    path,
    component,
    permission,
    icon: text(body.icon) || undefined,
    layoutMode:
      type === 'menu' && body.layoutMode === 'page'
        ? 'page'
        : type === 'menu'
        ? 'fill'
        : undefined,
    order: Number.isFinite(Number(body.order)) ? Number(body.order) : 1,
    status: body.status === 'disabled' ? 'disabled' : 'active',
  } as const;
};

export const systemRoutesMock = {
  'GET /api/v1/system/users': (req: any, res: any) => {
    if (!hasPermission(req, 'system:user:list')) {
      fail(res, '没有用户查看权限', 403);
      return;
    }
    const { keyword = '', roleId = '', status = '' } = req.query || {};
    const kw = String(keyword).trim().toLowerCase();
    const filtered = users
      .filter((user) => {
        const matchKeyword =
          !kw ||
          [user.username, user.nickName, user.email, user.mobile]
            .filter(Boolean)
            .some((value) => value!.toLowerCase().includes(kw));
        const matchRole = !roleId || user.roleIds.includes(String(roleId));
        const matchStatus = !status || user.status === status;
        return matchKeyword && matchRole && matchStatus;
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const { current, pageSize } = pageParams(req.query);
    ok(res, {
      list: filtered
        .slice((current - 1) * pageSize, current * pageSize)
        .map(decorateUser),
      total: filtered.length,
      current,
      pageSize,
    });
  },

  'POST /api/v1/system/users': (req: any, res: any) => {
    if (!hasPermission(req, 'system:user:create')) {
      fail(res, '没有用户新增权限', 403);
      return;
    }
    const body = req.body || {};
    const username = text(body.username);
    const nickName = text(body.nickName);
    if (!username || !nickName) {
      fail(res, '用户名和昵称不能为空');
      return;
    }
    if (users.some((user) => user.username === username)) {
      fail(res, `用户名 ${username} 已存在`);
      return;
    }
    const roleIds = Array.isArray(body.roleIds)
      ? body.roleIds.filter((id: string) =>
          roles.some((role) => role.id === id),
        )
      : [];
    if (!roleIds.length) {
      fail(res, '请至少选择一个角色');
      return;
    }
    const user: MockUser = {
      id: `user-${nextUserId++}`,
      username,
      nickName,
      email: text(body.email) || undefined,
      mobile: text(body.mobile) || undefined,
      roleIds,
      status: body.status === 'disabled' ? 'disabled' : 'active',
      createdAt: new Date().toISOString(),
    };
    users = [user, ...users];
    ok(res, decorateUser(user));
  },

  'PUT /api/v1/system/users/:id': (req: any, res: any) => {
    if (!hasPermission(req, 'system:user:update')) {
      fail(res, '没有用户编辑权限', 403);
      return;
    }
    const id = String(req.params?.id || '');
    const index = users.findIndex((user) => user.id === id);
    if (index < 0) {
      fail(res, '用户不存在', 4004);
      return;
    }
    const body = req.body || {};
    const username = text(body.username);
    if (users.some((user) => user.id !== id && user.username === username)) {
      fail(res, `用户名 ${username} 已存在`);
      return;
    }
    const roleIds = Array.isArray(body.roleIds)
      ? body.roleIds.filter((roleId: string) =>
          roles.some((role) => role.id === roleId),
        )
      : users[index].roleIds;
    if (!roleIds.length) {
      fail(res, '请至少选择一个角色');
      return;
    }
    users[index] = {
      ...users[index],
      username: username || users[index].username,
      nickName: text(body.nickName) || users[index].nickName,
      email: text(body.email) || undefined,
      mobile: text(body.mobile) || undefined,
      roleIds,
      status: body.status === 'disabled' ? 'disabled' : 'active',
    };
    ok(res, decorateUser(users[index]));
  },

  'DELETE /api/v1/system/users/:id': (req: any, res: any) => {
    if (!hasPermission(req, 'system:user:delete')) {
      fail(res, '没有用户删除权限', 403);
      return;
    }
    const id = String(req.params?.id || '');
    const user = users.find((item) => item.id === id);
    if (!user) {
      fail(res, '用户不存在', 4004);
      return;
    }
    if (user.username === 'admin') {
      fail(res, '内置管理员不能删除');
      return;
    }
    users = users.filter((item) => item.id !== id);
    ok(res, null);
  },

  'GET /api/v1/system/roles/options': (req: any, res: any) => {
    if (!hasAnyPermission(req, ['system:user:list', 'system:role:list'])) {
      fail(res, '没有角色选项查看权限', 403);
      return;
    }
    ok(
      res,
      roles
        .filter((role) => role.status === 'active')
        .map((role) => ({ id: role.id, name: role.name, code: role.code })),
    );
  },

  'GET /api/v1/system/roles': (req: any, res: any) => {
    if (!hasPermission(req, 'system:role:list')) {
      fail(res, '没有角色查看权限', 403);
      return;
    }
    const { keyword = '', status = '' } = req.query || {};
    const kw = String(keyword).trim().toLowerCase();
    const filtered = roles
      .filter((role) => {
        const matchKeyword =
          !kw ||
          role.name.toLowerCase().includes(kw) ||
          role.code.toLowerCase().includes(kw);
        return matchKeyword && (!status || role.status === status);
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const { current, pageSize } = pageParams(req.query);
    ok(res, {
      list: filtered
        .slice((current - 1) * pageSize, current * pageSize)
        .map(decorateRole),
      total: filtered.length,
      current,
      pageSize,
    });
  },

  'POST /api/v1/system/roles': (req: any, res: any) => {
    if (!hasPermission(req, 'system:role:create')) {
      fail(res, '没有角色新增权限', 403);
      return;
    }
    const body = req.body || {};
    const name = text(body.name);
    const code = text(body.code).toUpperCase();
    if (!name || !code) {
      fail(res, '角色名称和编码不能为空');
      return;
    }
    if (!/^[A-Z][A-Z0-9_]*$/.test(code)) {
      fail(res, '角色编码只能包含大写字母、数字和下划线');
      return;
    }
    if (roles.some((role) => role.code === code)) {
      fail(res, `角色编码 ${code} 已存在`);
      return;
    }
    const role: MockRole = {
      id: `role-${nextRoleId++}`,
      name,
      code,
      description: text(body.description) || undefined,
      status: body.status === 'disabled' ? 'disabled' : 'active',
      permissionIds: [],
      createdAt: new Date().toISOString(),
    };
    roles = [role, ...roles];
    ok(res, decorateRole(role));
  },

  'PUT /api/v1/system/roles/:id': (req: any, res: any) => {
    if (!hasPermission(req, 'system:role:update')) {
      fail(res, '没有角色编辑权限', 403);
      return;
    }
    const id = String(req.params?.id || '');
    const index = roles.findIndex((role) => role.id === id);
    if (index < 0) {
      fail(res, '角色不存在', 4004);
      return;
    }
    const body = req.body || {};
    const name = text(body.name) || roles[index].name;
    const code = (text(body.code) || roles[index].code).toUpperCase();
    if (roles[index].code === 'SUPER_ADMIN' && code !== 'SUPER_ADMIN') {
      fail(res, '超级管理员编码不能修改');
      return;
    }
    if (roles.some((role) => role.id !== id && role.code === code)) {
      fail(res, `角色编码 ${code} 已存在`);
      return;
    }
    roles[index] = {
      ...roles[index],
      name,
      code,
      description: text(body.description) || undefined,
      status: body.status === 'disabled' ? 'disabled' : 'active',
    };
    ok(res, decorateRole(roles[index]));
  },

  'DELETE /api/v1/system/roles/:id': (req: any, res: any) => {
    if (!hasPermission(req, 'system:role:delete')) {
      fail(res, '没有角色删除权限', 403);
      return;
    }
    const id = String(req.params?.id || '');
    const role = roles.find((item) => item.id === id);
    if (!role) {
      fail(res, '角色不存在', 4004);
      return;
    }
    if (role.code === 'SUPER_ADMIN') {
      fail(res, '超级管理员不能删除');
      return;
    }
    if (users.some((user) => user.roleIds.includes(id))) {
      fail(res, '该角色仍有用户使用，请先调整用户角色');
      return;
    }
    roles = roles.filter((item) => item.id !== id);
    ok(res, null);
  },

  'GET /api/v1/system/roles/:id/permissions': (req: any, res: any) => {
    if (!hasPermission(req, 'system:role:permission')) {
      fail(res, '没有角色授权查看权限', 403);
      return;
    }
    const role = roles.find((item) => item.id === String(req.params?.id || ''));
    if (!role) {
      fail(res, '角色不存在', 4004);
      return;
    }
    // 超级管理员始终拥有全部权限，权限新增后无需逐条补充
    ok(res, {
      permissionIds:
        role.code === 'SUPER_ADMIN'
          ? menus.map((menu) => menu.id)
          : role.permissionIds,
    });
  },

  'PUT /api/v1/system/roles/:id/permissions': (req: any, res: any) => {
    if (!hasPermission(req, 'system:role:permission')) {
      fail(res, '没有角色授权权限', 403);
      return;
    }
    const id = String(req.params?.id || '');
    const role = roles.find((item) => item.id === id);
    if (!role) {
      fail(res, '角色不存在', 4004);
      return;
    }
    if (role.code === 'SUPER_ADMIN') {
      fail(res, '超级管理员默认拥有全部权限，不能修改');
      return;
    }
    const validIds = new Set(menus.map((menu) => menu.id));
    const rawPermissionIds: unknown[] = Array.isArray(req.body?.permissionIds)
      ? req.body.permissionIds
      : [];
    const permissionIds = Array.from(
      new Set(
        rawPermissionIds.filter(
          (item): item is string =>
            typeof item === 'string' && validIds.has(item),
        ),
      ),
    );
    role.permissionIds = permissionIds;
    ok(res, { permissionIds });
  },

  'GET /api/v1/system/permissions': (req: any, res: any) => {
    if (
      !hasAnyPermission(req, [
        'system:permission:list',
        'system:role:permission',
      ])
    ) {
      fail(res, '没有查看权限配置的权限', 403);
      return;
    }
    ok(res, buildMenuTree());
  },

  'POST /api/v1/system/permissions': (req: any, res: any) => {
    if (!hasPermission(req, 'system:permission:create')) {
      fail(res, '没有新增权限的权限', 403);
      return;
    }
    try {
      const payload = parseMenuInput(req.body || {});
      const menu: MockMenu = {
        id: `menu-${nextMenuId++}`,
        ...payload,
        createdAt: new Date().toISOString(),
      };
      menus = [...menus, menu];
      ok(res, menu);
    } catch (error) {
      fail(res, error instanceof Error ? error.message : '权限创建失败');
    }
  },

  'PUT /api/v1/system/permissions/:id': (req: any, res: any) => {
    if (!hasPermission(req, 'system:permission:update')) {
      fail(res, '没有编辑权限的权限', 403);
      return;
    }
    const id = String(req.params?.id || '');
    const index = menus.findIndex((menu) => menu.id === id);
    if (index < 0) {
      fail(res, '权限不存在', 4004);
      return;
    }
    try {
      const payload = parseMenuInput(req.body || {}, id);
      menus[index] = { ...menus[index], ...payload, id };
      ok(res, menus[index]);
    } catch (error) {
      fail(res, error instanceof Error ? error.message : '权限更新失败');
    }
  },

  'DELETE /api/v1/system/permissions/:id': (req: any, res: any) => {
    if (!hasPermission(req, 'system:permission:delete')) {
      fail(res, '没有删除权限的权限', 403);
      return;
    }
    const id = String(req.params?.id || '');
    if (!menus.some((menu) => menu.id === id)) {
      fail(res, '权限不存在', 4004);
      return;
    }
    if (menus.some((menu) => menu.parentId === id)) {
      fail(res, '存在子菜单，不能直接删除');
      return;
    }
    menus = menus.filter((menu) => menu.id !== id);
    roles.forEach((role) => {
      role.permissionIds = role.permissionIds.filter(
        (permissionId) => permissionId !== id,
      );
    });
    ok(res, null);
  },
};

export default systemRoutesMock;

/**
 * 把权限树转换成动态路由
 * 只保留启用中的菜单权限，按钮权限只参与角色授权，不生成页面路由。
 * permissions 为 undefined 时代表超级管理员，返回全部菜单权限。
 */
interface MockRouteNode {
  name: string;
  path?: string;
  component?: string;
  icon?: string;
  layoutMode?: SystemLayoutMode;
  order: number;
  children?: MockRouteNode[];
}

function buildRoutes(permissions?: Set<string>): MockRouteNode[] {
  const walk = (parentId: string | null): MockRouteNode[] =>
    menus
      .filter(
        (menu) =>
          menu.parentId === parentId &&
          menu.status === 'active' &&
          menu.type !== 'button',
      )
      .sort((a, b) => a.order - b.order)
      .flatMap((menu): MockRouteNode[] => {
        if (menu.type === 'directory') {
          const children = walk(menu.id);
          // 空目录不注册，避免生成一个没有页面的分组路由
          return children.length
            ? [
                {
                  name: menu.name,
                  path: menu.path,
                  icon: menu.icon,
                  order: menu.order,
                  children,
                },
              ]
            : [];
        }
        // 普通角色只返回被授权的菜单；超级管理员不传 permissions
        if (permissions && !permissions.has(menu.id)) return [];
        if (!menu.path || !menu.component) return [];
        return [
          {
            name: menu.name,
            path: menu.path,
            component: menu.component,
            icon: menu.icon,
            layoutMode: menu.layoutMode ?? 'fill',
            order: menu.order,
          },
        ];
      });

  return walk(null);
}

/** 全量路由，主要用于没有当前用户上下文时的检查/调试 */
export function buildDynamicRoutes() {
  return buildRoutes();
}

/** 按当前登录用户的角色权限生成路由；没有用户或角色时返回空菜单 */
export function buildDynamicRoutesForUser(username?: string) {
  const user = users.find((item) => item.username === username);
  if (!user || user.status !== 'active') return [];
  const userRoles = roles.filter(
    (role) => user.roleIds.includes(role.id) && role.status === 'active',
  );
  if (userRoles.some((role) => role.code === 'SUPER_ADMIN')) {
    return buildRoutes();
  }
  const permissions = new Set(userRoles.flatMap((role) => role.permissionIds));
  return buildRoutes(permissions);
}
