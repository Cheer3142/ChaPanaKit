// จำลอง window.storage ด้วย localStorage สำหรับรันบนเครื่องตัวเอง
function keyFor(key, shared) {
  return `chapanakit:${shared ? "shared" : "user"}:${key}`;
}

window.storage = {
  async get(key, shared = false) {
    const raw = localStorage.getItem(keyFor(key, shared));
    if (raw === null) return null;
    return { key, value: raw, shared };
  },
  async set(key, value, shared = false) {
    localStorage.setItem(keyFor(key, shared), value);
    return { key, value, shared };
  },
  async delete(key, shared = false) {
    localStorage.removeItem(keyFor(key, shared));
    return { key, deleted: true, shared };
  },
  async list(prefix = "", shared = false) {
    const p = keyFor(prefix, shared);
    const keys = Object.keys(localStorage).filter(k => k.startsWith(p));
    return { keys, prefix, shared };
  },
};