export interface MediaConfig {
  streams: {
    type: string;
    id: number;
  }[];
  initSegmentUrl: string;
  mediaSegmentUrl: string;
  mediaSegmentNum: number;
}

export const fmp4Conf: MediaConfig = {
  streams: [
    { type: 'video', id: 0 },
    { type: 'audio', id: 1 },
  ],
  initSegmentUrl: '../asset1s/init-stream{streamId}.m4s',
  mediaSegmentUrl: '../asset1s/chunk-stream{streamId}-0000{segmentIdx}.m4s',
  mediaSegmentNum: 8
};

