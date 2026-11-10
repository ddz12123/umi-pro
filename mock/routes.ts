import { localRoutes } from '../src/router/local-routes';

/** 后端路由模式的开发示例；真实项目由接口适配层提供当前用户的路由。 */
export default {
  'GET /api/v1/routes': (_req: any, res: any) => {
    res.json({ code: 0, msg: 'ok', data: localRoutes });
  },
};
