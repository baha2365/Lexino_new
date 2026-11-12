import { Navigate, useParams } from 'react-router-dom';
import { GAME_BY_ID } from '../lib/content';
import type { GameId } from '../lib/types';
import { GameShell } from '../components/GameShell';
import { SoundToys } from '../games/SoundToys';
import { Echo } from '../games/Echo';
import { Pick } from '../games/Pick';
import { Sort } from '../games/Sort';
import { Pairs } from '../games/Pairs';
import { Build } from '../games/Build';
import { Scenes } from '../games/Scenes';
import { Request } from '../games/Request';

const VIEW: Record<GameId, (p: { mode: string }) => JSX.Element> = {
  'sound-toys': SoundToys,
  echo: Echo,
  pick: Pick,
  sort: Sort,
  pairs: Pairs,
  build: Build,
  scenes: Scenes,
  request: Request,
};

export function Play() {
  const { id } = useParams();
  if (!id || !(id in GAME_BY_ID)) return <Navigate to="/games" replace />;
  const gid = id as GameId;
  const View = VIEW[gid];
  return <GameShell key={gid} id={gid}>{(mode) => <View mode={mode} />}</GameShell>;
}
