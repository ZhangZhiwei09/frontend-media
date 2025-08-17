import { useEffect, useState, useCallback } from 'react';
import { createPlayer } from './player';
import { getSegments } from './utils';
import { fmp4Conf } from './config';

const App = () => {
  const [player, setPlayer] = useState<ReturnType<typeof createPlayer>>();
  const [num, setNum] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const p = createPlayer();
    p.setOnReady(() => setLoading(false));
    setPlayer(p);
    return () => p.destroy();
  }, []);

  const addChunk = useCallback(() => {
    if (!player) return;
    setLoading(true);
    getSegments(num, fmp4Conf).then(segments => {
      segments.forEach(segment => {
        player.addChunk(segment.id, segment.buffer);
      });
      setNum(n => n + 1);
      setLoading(false);
    });
  }, [player, num]);

  return (
    <>
      {num < fmp4Conf.mediaSegmentNum && (
        <button onClick={addChunk} disabled={loading}>
          {num === 0 ? '添加初始化分片' : `添加第${num}个媒体分片`}
        </button>
      )}
      <br />
      <video style={{ width: '500px' }} src={player?.source} controls autoPlay />
    </>
  );
};

export default App;
