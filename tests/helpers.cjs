const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');

function memoryStorage() {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  };
}

/** 在内存中加载 TypeScript，复用现有依赖，不启动服务或发送请求。 */
function createHarness(options = {}) {
  const cache = new Map();
  const navigations = [];
  const window = {
    localStorage: memoryStorage(),
    sessionStorage: memoryStorage(),
    location: {
      origin: 'https://app.test',
      pathname: '/example',
      search: '?page=2',
      hash: '#row-1',
      replace: (url) => navigations.push(url),
    },
  };
  const mocks = {
    '@/components/PageLoading': { __esModule: true, default: 'PageLoading' },
    react: {
      lazy: (loader) => ({ loader }),
      createElement: (type, props) => ({ type, props }),
    },
    '@umijs/max': {
      defineConfig: (config) => config,
      Navigate: 'Navigate',
      history: { replace: (url) => navigations.push(url) },
      request: options.request ?? (async () => ({ code: 0, data: null })),
    },
    '@/services/routes': {
      fetchUserRoutes: options.fetchRoutes ?? (async () => []),
    },
  };

  function load(specifier, from = path.join(root, 'test-entry.cjs')) {
    if (Object.prototype.hasOwnProperty.call(mocks, specifier))
      return mocks[specifier];
    if (
      !specifier.startsWith('.') &&
      !specifier.startsWith('@/') &&
      !path.isAbsolute(specifier)
    ) {
      return require(specifier);
    }
    let filename = specifier.startsWith('@/')
      ? path.join(root, 'src', specifier.slice(2))
      : path.resolve(path.dirname(from), specifier);
    filename = ['', '.ts', '.tsx', '/index.ts', '/index.tsx']
      .map((ext) => filename + ext)
      .find((name) => fs.existsSync(name) && fs.statSync(name).isFile());
    if (!filename) throw new Error(`Test module not found: ${specifier}`);
    if (cache.has(filename)) return cache.get(filename).exports;
    const module = { exports: {} };
    cache.set(filename, module);
    const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
      fileName: filename,
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        jsx: ts.JsxEmit.React,
        esModuleInterop: true,
      },
    }).outputText;
    const execute = new Function(
      'require',
      'module',
      'exports',
      'window',
      'APP_API_BASE_URL',
      'APP_MOCK_ENABLED',
      'process',
      compiled,
    );
    execute(
      (name) => load(name, filename),
      module,
      module.exports,
      window,
      options.baseURL ?? '',
      true,
      { env: options.env ?? {} },
    );
    return module.exports;
  }

  if (options.source)
    load('@/config/app').appConfig.routing.source = options.source;
  return { load, window, navigations };
}

module.exports = { createHarness };
