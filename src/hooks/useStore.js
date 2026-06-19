import { useCallback, useEffect, useState } from 'react';
import { getAll, add, update, remove, setAll } from '../lib/storage';

const listeners = new Set();
const notify = (collection) => listeners.forEach(fn => fn(collection));

export function useCollection(collection) {
  const [items, setItems] = useState(() => getAll(collection));

  useEffect(() => {
    const fn = (c) => { if (c === collection) setItems(getAll(collection)); };
    listeners.add(fn);
    return () => { listeners.delete(fn); };
  }, [collection]);

  const create = useCallback((item) => {
    const next = add(collection, item);
    notify(collection);
    return next;
  }, [collection]);

  const edit = useCallback((id, patch) => {
    const next = update(collection, id, patch);
    notify(collection);
    return next;
  }, [collection]);

  const destroy = useCallback((id) => {
    remove(collection, id);
    notify(collection);
  }, [collection]);

  const replaceAll = useCallback((items) => {
    setAll(collection, items);
    notify(collection);
  }, [collection]);

  return { items, create, edit, destroy, replaceAll };
}
