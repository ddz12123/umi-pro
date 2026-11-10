import { buildDynamicRoutesForUser, getUsernameFromRequest } from './system';

/**
 * 动态业务路由接口
 * ------------------------------------------------------------------
 * 路由树由权限管理数据生成，并按当前登录用户的角色权限过滤。
 * 静态首页和异常页不在这里返回。
 */
export default {
  'GET /api/v1/routes': (req: any, res: any) => {
    // mock token 形如 mock-token-admin-1690000000000
    const username = getUsernameFromRequest(req) || 'admin';

    res.json({
      code: 0,
      msg: 'ok',
      data: buildDynamicRoutesForUser(username),
    });
  },
};
