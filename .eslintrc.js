module.exports = {
  extends: require.resolve('@umijs/max/eslint'),
  settings: {
    // React 由 Umi 提供，避免从项目根目录探测时误报未安装。
    react: { version: '18.3' },
  },
};
