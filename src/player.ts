// player.ts
import { getMimeType } from './utils';

interface MediaStream {
  chunks: ArrayBuffer[];
  mime: string;
  sourceBuffer: SourceBuffer;
}

export function createPlayer() {
  const ms = new MediaSource();
  const source = URL.createObjectURL(ms);
  const streams = new Map<number, MediaStream>();
  let onReady: (() => void) | undefined;

  ms.addEventListener('sourceopen', () => {
    onReady?.();
  });

  const addChunk = async (streamId: number, buffer: ArrayBuffer) => {
    let stream = streams.get(streamId);

    if (!stream) {
      const mime = await getMimeType(buffer);
      if (!MediaSource.isTypeSupported(mime)) {
        throw new Error('MIME type not supported by browser');
      }

      const sourceBuffer = ms.addSourceBuffer(mime);
      sourceBuffer.addEventListener('updateend', () => {
        const nextChunk = stream?.chunks.shift();
        if (nextChunk) sourceBuffer.appendBuffer(nextChunk);
      });

      stream = { mime, sourceBuffer, chunks: [] };
      streams.set(streamId, stream);
    }

    stream.chunks.push(buffer);

    // 立即追加第一个分片
    if (!stream.sourceBuffer.updating) {
      const chunk = stream.chunks.shift();
      if (chunk) stream.sourceBuffer.appendBuffer(chunk);
    }
  };

  const destroy = () => {
    URL.revokeObjectURL(source);
    streams.forEach(stream => {
      if (ms.readyState === 'open') ms.removeSourceBuffer(stream.sourceBuffer);
      stream.chunks = [];
    });
    streams.clear();
    if (ms.readyState === 'open') ms.endOfStream();
  };

  return { source, addChunk, destroy, ms, streams, setOnReady: (cb: () => void) => (onReady = cb) };
}
