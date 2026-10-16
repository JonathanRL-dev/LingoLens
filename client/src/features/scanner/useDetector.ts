import { useCallback, useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';
import type { components } from '../../api/schema';
import { CocoDetector } from './CocoDetector';
import type { Detection, Detector } from './detector';

export type DetectorMission = Pick<components['schemas']['MissionDetail'], 'acceptedLabels'>;
export type DetectorStatus = 'idle' | 'loading' | 'ready' | 'running' | 'error';

const LOOP_DELAY_MS = 350;
const REQUIRED_CONSECUTIVE_DETECTIONS = 3;
const DEMO_SESSION_FLAG = 'lingolens:demo';
const DEMO_MODE_EVENT = 'lingolens:demo-mode';
const DEMO_MATCH_DELAY_MS = 2000;

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

function acceptedDetections(found: Detection[], mission: DetectorMission): Detection[] {
  const thresholds = new Map(
    mission.acceptedLabels.map(({ label, minConfidence }) => [
      label.trim().toLowerCase(),
      minConfidence,
    ]),
  );

  return found
    .filter(({ label, confidence }) => {
      const normalizedLabel = label.trim().toLowerCase();
      if (normalizedLabel === 'person') return false;
      const threshold = thresholds.get(normalizedLabel);
      return threshold !== undefined && confidence >= threshold;
    })
    .sort((a, b) => b.confidence - a.confidence);
}

export function isDemoMode(): boolean {
  if (typeof window === 'undefined') return false;
  if (new URLSearchParams(window.location.search).get('demo') === '1') return true;

  try {
    return window.sessionStorage.getItem(DEMO_SESSION_FLAG) === '1';
  } catch {
    return false;
  }
}

// JANGAN DIHAPUS: dipakai pada versi kumpul.
export async function detectFromFile(
  file: File,
  detector: Detector,
  mission: DetectorMission,
): Promise<Detection | null> {
  const imageUrl = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error('Unable to load selected image'));
      element.src = imageUrl;
    });

    const found = await detector.detect(image);
    return acceptedDetections(found, mission)[0] ?? null;
  } finally {
    URL.revokeObjectURL(imageUrl);
  }
}

export function useTripleTap(onTriple: () => void): () => void {
  const tapsRef = useRef<number[]>([]);

  return useCallback(() => {
    const now = Date.now();
    const taps = tapsRef.current.filter((tapTime) => now - tapTime <= 800);
    taps.push(now);

    if (taps.length < 3) {
      tapsRef.current = taps;
      return;
    }

    tapsRef.current = [];
    try {
      window.sessionStorage.setItem(DEMO_SESSION_FLAG, '1');
    } catch {
      // The callback still enables demo mode in the current view if storage is unavailable.
    }
    window.dispatchEvent(new Event(DEMO_MODE_EVENT));
    onTriple();
  }, [onTriple]);
}

export function useDetector(
  mission: DetectorMission,
  videoRef: RefObject<HTMLVideoElement | null>,
): { status: DetectorStatus; detections: Detection[]; match: Detection | null } {
  const [status, setStatus] = useState<DetectorStatus>('idle');
  const [detections, setDetections] = useState<Detection[]>([]);
  const [match, setMatch] = useState<Detection | null>(null);
  const [demoEnabled, setDemoEnabled] = useState(() => isDemoMode());
  const previousLabelRef = useRef<string | null>(null);
  const consecutiveCountRef = useRef(0);
  const acceptedLabelsKey = mission.acceptedLabels
    .map(({ label, minConfidence }) => `${label.trim().toLowerCase()}:${minConfidence}`)
    .sort()
    .join('|');

  useEffect(() => {
    const refreshDemoMode = () => setDemoEnabled(isDemoMode());
    window.addEventListener(DEMO_MODE_EVENT, refreshDemoMode);
    return () => window.removeEventListener(DEMO_MODE_EVENT, refreshDemoMode);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;
    let timer: ReturnType<typeof setTimeout> | undefined;

    previousLabelRef.current = null;
    consecutiveCountRef.current = 0;
    setDetections([]);
    setMatch(null);

    if (demoEnabled) {
      const target = mission.acceptedLabels[0];
      if (!target) {
        setStatus('error');
        return () => controller.abort();
      }

      setStatus('running');
      timer = setTimeout(() => {
        if (signal.aborted) return;
        const demoMatch: Detection = { label: target.label, confidence: 1 };
        setDetections([demoMatch]);
        setMatch(demoMatch);
        setStatus('ready');
      }, DEMO_MATCH_DELAY_MS);

      return () => {
        controller.abort();
        if (timer !== undefined) clearTimeout(timer);
      };
    }

    const video = videoRef.current;
    if (!video) {
      setStatus('idle');
      return () => controller.abort();
    }

    const detector = new CocoDetector();
    let initialized = false;
    let inferencing = false;

    setStatus('loading');

    const runDetection = async (): Promise<void> => {
      if (signal.aborted || document.visibilityState === 'hidden' || inferencing) return;
      inferencing = true;
      setStatus('running');

      try {
        const found = await detector.detect(video);
        if (signal.aborted) return;

        const eligible = acceptedDetections(found, mission);
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
  }, [acceptedLabelsKey, demoEnabled, mission.acceptedLabels, videoRef]);

  return { status, detections, match };
}
