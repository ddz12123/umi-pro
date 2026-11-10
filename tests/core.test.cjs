const assert = require('node:assert/strict');
const { test } = require('node:test');
const { createHarness } = require('./helpers.cjs');

test('静态路由只有首页和异常页，业务路由来自接口', async () => {
  let calls = 0;
  const { load } = createHarness({
    fetchRoutes: async () => {
      calls += 1;
      return [];
    },
  });
  load('@/utils/auth').setAuth('session');
  const { useRouteStore } = load('@/stores/routes');
  const routes = await useRouteStore.getState().loadRoutes();
  assert(routes.some((route) => route.path === '/home'));
  assert(routes.some((route) => route.path === '/exception/404'));
  assert(routes.some((route) => route.path === '/exception/500'));
  assert(!routes.some((route) => route.path === '/example'));
  assert.equal(calls, 1);
  const { umiRoutes } = load('@/router/static-routes');
  for (const path of ['/home', '/exception/404', '/exception/500']) {
    assert.deepEqual(umiRoutes.find((route) => route.path === path).wrappers, [
      '@/wrappers/auth',
    ]);
  }
  assert.equal(umiRoutes.find((route) => route.path === '/example'), undefined);
});

test('生产构建关闭 Mock，构建产物支持独立目录', () => {
  const { load } = createHarness({
    env: {
      NODE_ENV: 'production',
      UMI_APP_MOCK: 'true',
      UMI_BUILD_OUTPUT_PATH: 'build-check-test',
    },
  });
  const config = load('./.umirc.ts').default;
  assert.equal(config.mock, false);
  assert.equal(config.define.APP_MOCK_ENABLED, false);
  assert.equal(config.outputPath, 'build-check-test');
});

test('后端嵌套路由归一化、排序，并同步用于面包屑与页签匹配', () => {
  const { load } = createHarness();
  const { normalizeRoutes } = load('@/router/catalog');
  const routes = normalizeRoutes([
    {
      name: '示例',
      path: '/samples',
      children: [
        { name: '详情', path: ':id', component: './Example', order: 2 },
        { name: '列表', path: 'list', component: 'Example', order: 1 },
      ],
    },
  ]);
  const { matchRoute, getBreadcrumbChain } = load('@/router/routes');
  assert.equal(matchRoute('/samples', routes).route.path, '/samples/list');
  assert.equal(matchRoute('/samples/list?q=1#top', routes).route.name, '列表');
  assert.deepEqual(
    getBreadcrumbChain('/samples/42', routes).map((item) => item.name),
    ['示例', '详情'],
  );
});

test('接口路由拒绝未知组件、重复路径、保留路径和不合法的数据', () => {
  const { load } = createHarness();
  const { normalizeRoutes } = load('@/router/catalog');
  const valid = { name: '列表', path: '/list', component: 'Example' };
  for (const input of [
    null,
    {},
    [null],
    [{ ...valid, component: 'constructor' }],
    [{ ...valid, component: '../../arbitrary' }],
    [valid, valid],
    [{ ...valid, path: '/login' }],
    [{ ...valid, path: '/home' }],
    [{ ...valid, path: '/LOGIN' }],
    [{ ...valid, path: '/%6cogin' }],
    [{ ...valid, path: '//host' }],
    [{ ...valid, path: '/list/../login' }],
    [{ ...valid, children: {} }],
  ]) {
    assert.throws(() => normalizeRoutes(input));
  }
});

test('路由接口失败后保留错误并允许重试，不回退为本地示例', async () => {
  let calls = 0;
  const { load } = createHarness({
    fetchRoutes: async () => {
      calls += 1;
      if (calls === 1) throw new Error('菜单加载失败');
      return [{ name: '列表', path: '/list', component: 'Example' }];
    },
  });
  load('@/utils/auth').setAuth('session');
  const store = load('@/stores/routes').useRouteStore;
  await assert.rejects(store.getState().loadRoutes(), /菜单加载失败/);
  assert.equal(store.getState().ready, false);
  assert.equal(store.getState().error, '菜单加载失败');
  assert(
    !store.getState().routes.some((route) => route.component === 'Example'),
  );
  await store.getState().loadRoutes();
  assert.equal(store.getState().ready, true);
  assert.equal(store.getState().error, undefined);
  assert.equal(calls, 2);
});

test('并发路由加载只请求一次，退出后的旧响应不能恢复上个账号的路由', async () => {
  let resolve;
  let calls = 0;
  const pending = new Promise((done) => {
    resolve = done;
  });
  const { load } = createHarness({
    fetchRoutes: () => {
      calls += 1;
      return pending;
    },
  });
  load('@/utils/auth').setAuth('session');
  const store = load('@/stores/routes').useRouteStore;
  const first = store.getState().loadRoutes();
  assert.equal(first, store.getState().loadRoutes());
  await Promise.resolve();
  store.getState().reset();
  resolve([{ name: '旧页面', path: '/old', component: 'Example' }]);
  await assert.rejects(first, /会话已变更/);
  assert.equal(calls, 1);
  assert.equal(store.getState().ready, false);
  assert(!store.getState().routes.some((route) => route.path === '/old'));
});

test('动态路由区分全屏页面，多次 patch 不重复注入', async () => {
  const { load } = createHarness({
    fetchRoutes: async () => [
      {
        name: '分组',
        path: '/samples',
        children: [{ name: '列表', path: 'list', component: 'Example' }],
      },
      { name: '全屏', path: '/full', component: 'Example', fullScreen: true },
    ],
  });
  load('@/utils/auth').setAuth('test-session');
  await load('@/stores/routes').useRouteStore.getState().loadRoutes();
  const routes = [
    { id: '@@/global-layout', path: '/', children: [{ path: '/home' }] },
  ];
  const { applyDynamicRoutes } = load('@/router/runtime');
  applyDynamicRoutes(routes);
  applyDynamicRoutes(routes);
  assert.equal(routes.filter((route) => route.path === '/full').length, 1);
  assert(!routes[0].children.some((route) => route.path === '/full'));
  assert.equal(
    routes[0].children.filter((route) => route.path === '/samples/list').length,
    1,
  );
});

test('隐藏分组与参数路由不进入顶部菜单搜索', () => {
  const { load } = createHarness();
  const { getSearchEntries } = load('@/router/routes');
  assert.deepEqual(
    getSearchEntries([
      {
        name: '隐藏分组',
        path: '/hidden',
        hideInMenu: true,
        children: [
          { name: '页面', path: '/hidden/list', component: 'Example' },
        ],
      },
      { name: '详情', path: '/list/:id', component: 'Example' },
      { name: '列表', path: '/list', component: 'Example' },
    ]).map((entry) => entry.path),
    ['/list'],
  );
});

test('重新登录不遗留旧用户，过期凭证会清理，非法凭证不写入', () => {
  const { load, window } = createHarness();
  const auth = load('@/utils/auth');
  auth.setAuth('one', 60, { name: 'previous' });
  auth.setAuth('two');
  assert.equal(auth.getAuthUser(), undefined);
  assert.throws(() => auth.setAuth(''), /有效/);
  assert.throws(() => auth.setAuth('bad', 0), /有效期/);
  window.localStorage.setItem('umi-starter:expire-at', String(Date.now() - 1));
  assert.equal(auth.getToken(), '');
  assert.equal(window.localStorage.getItem(auth.AUTH_STORAGE_KEY), null);
});

test('禁用浏览器存储时仍能登录和退出，删除失败不会重新读出旧数据', () => {
  const { load, window } = createHarness();
  const storage = window.localStorage;
  storage.setItem('old', 'previous');
  storage.setItem = () => {
    throw new Error('QuotaExceededError');
  };
  storage.removeItem = () => {
    throw new Error('SecurityError');
  };
  const auth = load('@/utils/auth');
  auth.setAuth('memory-only', undefined, { name: 'current' });
  assert.equal(auth.getToken(), 'memory-only');
  assert.equal(auth.getAuthUser().name, 'current');
  auth.clearAuth();
  assert.equal(auth.getToken(), '');
  const { local } = load('@/utils/storage');
  local.removeItem('old');
  assert.equal(local.getItem('old'), null);
});

test('登录回跳保留查询参数和锚点，拒绝站外地址、编码绕过和登录循环', () => {
  const { load } = createHarness();
  const { getSafeRedirect, getLoginUrl } = load('@/utils/auth');
  const target = '/example?keyword=hello%20world#row-1';
  assert.equal(getSafeRedirect(target), target);
  assert.equal(
    new URL(
      getLoginUrl('/example', '?page=2', '#row-1'),
      'https://app.test',
    ).searchParams.get('redirect'),
    '/example?page=2#row-1',
  );
  for (const input of [
    'https://evil.test',
    '//evil.test',
    '/\\evil.test',
    '/%2f%2fevil.test',
    '/%5cevil.test',
    '/%09/evil.test',
    '/login?x=1',
    '/%6cogin',
    '/foo/../login',
    '/bad%',
  ]) {
    assert.equal(getSafeRedirect(input), undefined, input);
  }
  assert.equal(getSafeRedirect('/login-history'), '/login-history');
});

test('页签上限和各种关闭操作保留固定页签与完整页面地址', () => {
  const { load } = createHarness();
  const store = load('@/stores/tabs').useTabsStore;
  store.getState().setPinned(['/home']);
  for (let page = 0; page < 20; page += 1)
    store.getState().open(`/example?page=${page}#row`);
  assert.equal(store.getState().tabs.length, 12);
  assert(store.getState().tabs.includes('/home'));
  assert(store.getState().tabs.includes('/example?page=19#row'));
  store.getState().close('/home');
  assert(store.getState().tabs.includes('/home'));
  store.getState().closeLeft('/example?page=19#row');
  assert.deepEqual(store.getState().tabs, ['/home', '/example?page=19#row']);
  store.getState().closeRight('/home');
  assert.deepEqual(store.getState().tabs, ['/home']);
  store.getState().open('/example?page=2');
  store.getState().closeOthers('/example?page=2');
  assert.deepEqual(store.getState().tabs, ['/home', '/example?page=2']);
  store.getState().closeAll();
  assert.deepEqual(store.getState().tabs, ['/home']);
  store.getState().reset();
  assert.deepEqual(store.getState().tabs, []);
});

test('请求处理兼容数字与字符串成功码、普通 JSON、空响应和文件数据', () => {
  const { load } = createHarness();
  const { BizError, checkResponse, unwrapResponse } = load('@/utils/response');
  for (const code of [0, '0']) {
    checkResponse({ code, data: 42 });
    assert.equal(unwrapResponse({ code, data: 42 }), 42);
  }
  assert.throws(() => checkResponse({ code: 1001, msg: '失败' }), BizError);
  for (const value of [{ name: 'plain' }, [1, 2], null, new Blob(['data'])]) {
    checkResponse(value);
    assert.equal(unwrapResponse(value), value);
  }
});

test('HTTP 方法、文件模式和完整响应约定不会被 options 意外覆盖', async () => {
  const calls = [];
  const { load } = createHarness({
    request: async (url, options) => {
      calls.push({ url, options });
      return { code: 0, data: 42 };
    },
  });
  const { get, http } = load('@/utils/request');
  assert.equal(await get('/test', {}, { method: 'POST' }), 42);
  assert.equal(calls[0].options.method, 'GET');
  assert.equal(calls[0].options.getResponse, false);
  assert.deepEqual(await http('/test', { responseMode: 'raw' }), {
    code: 0,
    data: 42,
  });
});

test('token 仅自动附加到可信 API，保留显式鉴权头，支持跳过鉴权', () => {
  const { load } = createHarness({ baseURL: 'https://api.test/v1' });
  load('@/utils/auth').setAuth('session');
  const { request, isTrustedApi } = load('@/config/request');
  const intercept = request.requestInterceptors[0];
  assert.equal(
    intercept({ url: '/users' }).headers.Authorization,
    'Bearer session',
  );
  assert.equal(
    intercept({ url: 'https://other.test/users' }).headers,
    undefined,
  );
  assert.equal(intercept({ url: '/login', skipAuth: true }).headers, undefined);
  assert.equal(
    intercept({ url: '/users', headers: { authorization: 'Custom value' } })
      .headers.authorization,
    'Custom value',
  );
  assert.equal(isTrustedApi('//other.test/users'), false);
});

test('取消请求不提示，401 清理当前会话，旧账号迟到的 401 不影响新账号', () => {
  const { load, navigations } = createHarness();
  const errors = [];
  load('@/utils/feedback').bindErrorFeedback((error) => errors.push(error));
  const auth = load('@/utils/auth');
  const { request } = load('@/config/request');
  const handler = request.errorConfig.errorHandler;
  handler(Object.assign(new Error('cancel'), { code: 'ERR_CANCELED' }), {});
  assert.equal(errors.length, 0);
  auth.setAuth('old');
  const config = request.requestInterceptors[0]({ url: '/api/v1/list' });
  auth.setAuth('new');
  const error = Object.assign(new Error('Unauthorized'), {
    config,
    response: { status: 401 },
  });
  handler(error, {});
  assert.equal(auth.getToken(), 'new');
  assert.equal(navigations.length, 0);
  config.sessionToken = 'new';
  handler(error, { skipErrorHandler: true });
  assert.equal(auth.getToken(), '');
  assert.equal(navigations.length, 1);
  assert(navigations[0].includes('redirect='));
  assert.equal(errors.length, 0);
});
