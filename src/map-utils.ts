export function setOrPush<K, I>(map: Map<K, I[]>, key: K, item: I) {
  const arr = map.get(key);
  if (arr) {
    arr.push(item);
  } else {
    map.set(key, [item]);
  }
}
