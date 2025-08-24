import React, { useRef, useState } from "react";
import MP4Box from "mp4box";

async function getMimeType(buffer: ArrayBuffer): Promise<string> {
    return new Promise((resolve, reject) => {
        const mp4boxfile = MP4Box.createFile();
        mp4boxfile.onReady = (info: any) => resolve(info.mime);
        mp4boxfile.onError = () => reject("解析失败");
        (buffer as any).fileStart = 0;
        mp4boxfile.appendBuffer(buffer);
        mp4boxfile.flush();
    });
}

const MSEPlayer: React.FC = () => {
    const videoRef = useRef<HTMLVideoElement>(null);

    const mediaSourceRef = useRef<MediaSource | null>(null);

    const sourceBuffersRef = useRef<{ video?: SourceBuffer; audio?: SourceBuffer }>({});

    const [segmentIndex, setSegmentIndex] = useState(0);

    const [isReady, setIsReady] = useState(false);

    // 获取分片数据
    const fetchSegment = async (streamId: number, isInit: boolean = false) => {
        const url = isInit
            ? `assets/init-stream${streamId}.m4s`
            : `assets/chunk-stream${streamId}-0000${segmentIndex}.m4s`;

        const response = await fetch(url);
        return response.arrayBuffer();
    };

    // 初始化 MediaSource
    const initMediaSource = async () => {
        if (!videoRef.current) return;

        const mediaSource = new MediaSource();
        mediaSourceRef.current = mediaSource;
        videoRef.current.src = URL.createObjectURL(mediaSource);

        mediaSource.addEventListener("sourceopen", async () => {
            try {
                const [videoInit, audioInit] = await Promise.all([
                    fetchSegment(0, true),
                    fetchSegment(1, true)
                ]);

                const videoMime = await getMimeType(videoInit);
                if (MediaSource.isTypeSupported(videoMime)) {
                    const videoSb = mediaSource.addSourceBuffer(videoMime);
                    sourceBuffersRef.current.video = videoSb;
                    videoSb.appendBuffer(videoInit);
                }

                const audioMime = await getMimeType(audioInit);
                if (MediaSource.isTypeSupported(audioMime)) {
                    const audioSb = mediaSource.addSourceBuffer(audioMime);
                    sourceBuffersRef.current.audio = audioSb;
                    audioSb.appendBuffer(audioInit);
                }

                setIsReady(true);
                setSegmentIndex(1);
            } catch (error) {
                console.error("初始化失败:", error);
            }
        });
    };

    // 添加媒体分片
    const appendSegment = async () => {
        if (!isReady) return;

        const { video, audio } = sourceBuffersRef.current;

        try {
            // 同时获取视频和音频分片
            const [videoSeg, audioSeg] = await Promise.all([
                fetchSegment(0),
                fetchSegment(1)
            ]);

            // 追加分片
            if (video && !video.updating) video.appendBuffer(videoSeg);
            if (audio && !audio.updating) audio.appendBuffer(audioSeg);

            setSegmentIndex(prev => prev + 1);
        } catch (err) {
            console.error("加载分片失败:", err);
        }
    };

    return (
        <div style={{ padding: 20 }}>
            <h2>MP4Box.js + MSE Demo</h2>
            <video ref={videoRef} controls width={640} autoPlay />
            <div style={{ marginTop: 10 }}>
                <button onClick={initMediaSource} disabled={isReady}>
                    初始化 MediaSource
                </button>
                <button onClick={appendSegment} disabled={!isReady}>
                    追加分片 {segmentIndex > 0 ? segmentIndex : 1}
                </button>
            </div>
        </div>
    );
};

export default MSEPlayer;