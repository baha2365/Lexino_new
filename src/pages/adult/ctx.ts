import { useOutletContext } from 'react-router-dom';
import type { Child } from '../../lib/types';

export interface AdultCtx {
  child: Child | null;
  kids: Child[];
  reload: () => Promise<void>;
}
export const useAdult = (): AdultCtx => useOutletContext<AdultCtx>();
