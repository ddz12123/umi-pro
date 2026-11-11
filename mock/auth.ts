/**
 * 登录 mock：三个演示账号展示菜单权限与按钮权限两级过滤。
 * admin 全部权限；operator 有示例页但无删除/导出；viewer 仅首页。
 */

interface MockAccount {
  password: string;
  id: string;
  nickName: string;
  role: { id: string; name: string; code: string };
  permissions: { menus: string[]; buttons: string[] };
}

const ACCOUNTS: Record<string, MockAccount> = {
  admin: {
    password: '123456',
    id: 'user-admin',
    nickName: '管理员',
    role: { id: 'role-admin', name: '管理员', code: 'ADMIN' },
    permissions: {
      menus: ['example:list'],
      buttons: [
        'example:create',
        'example:update',
        'example:delete',
        'example:export',
      ],
    },
  },
  operator: {
    password: '123456',
    id: 'user-operator',
    nickName: '运营',
    role: { id: 'role-operator', name: '运营', code: 'OPERATOR' },
    permissions: {
      menus: ['example:list'],
      buttons: ['example:create', 'example:update'],
    },
  },
  viewer: {
    password: '123456',
    id: 'user-viewer',
    nickName: '访客',
    role: { id: 'role-viewer', name: '访客', code: 'VIEWER' },
    permissions: { menus: [], buttons: [] },
  },
};

interface LoginBody {
  username?: string;
  password?: string;
}

export default {
  'POST /api/v1/login': (req: any, res: any) => {
    const { username = '', password = '' } = (req.body || {}) as LoginBody;
    const account = ACCOUNTS[username];

    if (account && account.password === password) {
      res.json({
        code: 0,
        msg: 'ok',
        data: {
          token: `mock-token-${username}-${Date.now()}`,
          // 秒，前端据此计算过期时间
          expiresIn: 2 * 60 * 60,
          user: {
            id: account.id,
            name: username,
            nickName: account.nickName,
          },
          roles: [account.role],
          permissions: account.permissions,
        },
      });
      return;
    }

    res.json({
      code: 1001,
      msg: '用户名或密码错误',
      data: null,
    });
  },
};
