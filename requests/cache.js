import NodeCache from "node-cache";
const cache = new NodeCache();

export const set = async (key, value, ttl = null) => {
  if (ttl) return cache.set(key, value, ttl);
  return cache.set(key, value);
};

export const get = async (key) => {
  return cache.get(key);
};

export const del = async (key) => {
  return cache.del(key);
};
