type StorageType = 'local' | 'session';
type StorageAdapter = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

/** 浏览器禁用存储、隐私模式或配额耗尽时，退回当前页面内存。 */
function createStorage(type: StorageType): StorageAdapter {
  const memory = new Map<string, string | null>();
  const getNative = () =>
    type === 'local' ? window.localStorage : window.sessionStorage;

  return {
    getItem(key) {
      if (memory.has(key)) return memory.get(key) ?? null;
      try {
        return getNative().getItem(key);
      } catch {
        return null;
      }
    },
    setItem(key, value) {
      memory.set(key, value);
      try {
        getNative().setItem(key, value);
        memory.delete(key);
      } catch {
        // 保留内存副本，使登录和布局在存储不可用时仍可工作。
      }
    },
    removeItem(key) {
      memory.set(key, null);
      try {
        getNative().removeItem(key);
        memory.delete(key);
      } catch {
        // 存储不可用时没有需要清理的持久化状态。
      }
    },
  };
}

/** 长期存储：关闭浏览器后仍保留。 */
export const local = createStorage('local');
/** 会话存储：关闭当前标签页后清空。 */
export const session = createStorage('session');
