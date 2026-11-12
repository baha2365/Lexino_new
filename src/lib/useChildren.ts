import { useCallback, useEffect, useState } from 'react';
import { useAuth } from './auth';
import { getActiveChildId, listChildren, setActiveChildId } from './repo';
import type { Child } from './types';

/** Children visible to this account (or to this device in local mode) and the one currently selected. */
export function useChildren() {
  const auth = useAuth();
  const userId = auth.session?.user.id ?? null;
  const [children, setChildren] = useState<Child[]>([]);
  const [activeId, setActive] = useState<string | null>(getActiveChildId());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const list = await listChildren();
      setChildren(list);
      const saved = getActiveChildId();
      const found = list.find((c) => c.id === saved) ?? list[0];
      if (found) {
        if (found.id !== saved) setActiveChildId(found.id);
        setActive(found.id);
      } else setActive(null);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load children');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (auth.loading) return;
    void reload();
  }, [auth.loading, userId, reload]);

  useEffect(() => {
    const on = () => setActive(getActiveChildId());
    window.addEventListener('lexino:child', on);
    return () => window.removeEventListener('lexino:child', on);
  }, []);

  const choose = useCallback((id: string) => {
    setActiveChildId(id);
    setActive(id);
  }, []);

  return { children, active: children.find((c) => c.id === activeId) ?? null, choose, reload, loading, error };
}
