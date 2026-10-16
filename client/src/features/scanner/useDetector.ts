import { useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';
import type { components } from '../../api/schema';
import { CocoDetector } from './CocoDetector';
import type { Detection } from './detector';

export type DetectorMission = Pick<components['schemas']['MissionDetail'], 'acceptedLabels'>;
export type DetectorStatus = 'idle' | 'loading' | 'ready' | 'running' | 'error';

const LOOP_DELAY_MS = 350;
const REQUIRED_CONSECUTIVE_DETECTIONS = 3;

function isDocumentVisible(): boolean {
  return document.visibilityState !== 'hidden';
}

function waitForVideo(video: HTMLVideoElement, signal: AbortSignal): Promise<boolean> {
  if (video.readyState >= 2) return Promise.resolve(true);
  if (signal.aborted) return Promise.resolve(false);

  return new Promise((resolve) => {
    const cleanup = () => {
      video.removeEventListener('loadeddata', onLoaded);
      signal.removeEventListener('abort', onAbort);
    };
    const onLoaded = () => {
      cleanup();
      resolve(true);
    };
    const onAbort = () => {
      cleanup();
      resolve(false);
    };

    video.addEventListener('loadeddata', onLoaded, { once: true });
    signal.addEventListener('abort', onAbort, { once: true });
  });
}

export function useDetector(
  mission: DetectorMission,
  videoRef: RefObject<HTMLVideoElement | null>,
): { status: DetectorStatus; detections: Detection[]; match: Detection | null } {
  const [status, setStatus] = useState<DetectorStatus>('idle');
  const [detections, setDetections] = useState<Detection[]>([]);
  const [match, setMatch] = useState<Detection | null>(null);
  const previousLabelRef = useRef<string | null>(null);
  const consecutiveCountRef = useRef(0);
  const acceptedLabelsKey = mission.acceptedLabels
    .map(({ label, minConfidence }) => `${label.trim().toLowerCase()}:${minConfidence}`)
    .sort()
    .join('|');

  useEffect(() => {
    const video = videoRef.current;
    if (!video) {
      setStatus('idle');
      setDetections([]);
      setMatch(null);
      return;
    }

    const controller = new AbortController();
    const { signal } = controller;
    const detector = new CocoDetector();
    const acceptedLabels = new Map(
      mission.acceptedLabels.map(({ label, minConfidence }) => [
        label.trim().toLowerCase(),
        minConfidence,
      ]),
    );
    let timer: ReturnType<typeof setTimeout> | undefined;
    let initialized = false;
    let inferencing = false;

    previousLabelRef.current = null;
    consecutiveCountRef.current = 0;
    setDetections([]);
    setMatch(null);
    setStatus('loading');

    const runDetection = async (): Promise<void> => {
      if (signal.aborted || document.visibilityState === 'hidden' || inferencing) return;
      inferencing = true;
      setStatus('running');

      try {
        const found = await detector.detect(video);
        if (signal.aborted) return;

        const eligible = found
          .filter(({ label, confidence }) => {
            const normalizedLabel = label.trim().toLowerCase();
            if (normalizedLabel === 'person') return false;
            const threshold = acceptedLabels.get(normalizedLabel);
            return threshold !== undefined && confidence >= threshold;
          })
          .sort((a, b) => b.confidence - a.confidence);
        const best = eligible[0];
        setDetections(eligible);

        if (!best) {
          previousLabelRef.current = null;
          consecutiveCountRef.current = 0;
          setMatch(null);
        } else {
          const label = best.label.trim().toLowerCase();
          if (previousLabelRef.current === label) {
            consecutiveCountRef.current += 1;
          } else {
            previousLabelRef.current = label;
            consecutiveCountRef.current = 1;
          }

          if (consecutiveCountRef.current >= REQUIRED_CONSECUTIVE_DETECTIONS) {
            setMatch(best);
          } else {
            setMatch(null);
          }
        }
      } catch {
        if (!signal.aborted) setStatus('error');
        return;
      } finally {
        inferencing = false;
      }

      if (!signal.aborted && isDocumentVisible()) {
        setStatus('running');
        timer = setTimeout(() => void runDetection(), LOOP_DELAY_MS);
      }
    };

    const resume = async () => {
      if (!initialized || signal.aborted || document.visibilityState === 'hidden') return;
      const videoReady = await waitForVideo(video, signal);
      if (videoReady && !signal.aborted && !inferencing && timer === undefined) {
        void runDetection();
      }
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        if (timer !== undefined) clearTimeout(timer);
        timer = undefined;
        previousLabelRef.current = null;
        consecutiveCountRef.current = 0;
        setDetections([]);
        setMatch(null);
        if (initialized) setStatus('ready');
      } else {
        void resume();
      }
    };

    document.addEventListener('visibilitychange', onVisibilityChange);

    const initialize = async () => {
      try {
        const tf = await import('@tensorflow/tfjs');
        try {
          const webglReady = await tf.setBackend('webgl');
          if (!webglReady) await tf.setBackend('cpu');
        } catch {
          await tf.setBackend('cpu');
        }
        await tf.ready();
        await detector.load();

        const videoReady = await waitForVideo(video, signal);
        if (!videoReady || signal.aborted) return;

        await detector.detect(video);
        if (signal.aborted) return;

        initialized = true;
        setStatus('ready');
        if (document.visibilityState !== 'hidden') void runDetection();
      } catch {
        if (!signal.aborted) setStatus('error');
      }
    };

    void initialize();

    return () => {
      controller.abort();
      if (timer !== undefined) clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [acceptedLabelsKey, mission.acceptedLabels, videoRef]);

  return { status, detections, match };
}

