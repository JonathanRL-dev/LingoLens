import { useCallback, useEffect, useRef, useState } from 'react';

export type CameraState = 'idle' | 'requesting' | 'ready' | 'denied' | 'noCamera' | 'error';

export function useCamera() {
  const [state, setState] = useState<CameraState>('idle');
  const stateRef = useRef<CameraState>('idle');
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const requestIdRef = useRef(0);
  const resumeWhenVisibleRef = useRef(false);

  const updateState = useCallback((nextState: CameraState) => {
    stateRef.current = nextState;
    setState(nextState);
  }, []);

  const stopTracks = useCallback(() => {
    requestIdRef.current += 1;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  const stop = useCallback(() => {
    resumeWhenVisibleRef.current = false;
    stopTracks();
    updateState('idle');
  }, [stopTracks, updateState]);

  const start = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      updateState('noCamera');
      return;
    }

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    updateState('requesting');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 640 } },
      });

      if (requestIdRef.current !== requestId) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = stream;
      if (!videoRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        updateState('error');
        return;
      }

      // Elemen <video> yang memakai hook ini harus memiliki playsInline, muted, dan autoPlay.
      videoRef.current.srcObject = stream;
      updateState('ready');
    } catch (error) {
      if (requestIdRef.current !== requestId) return;

      const name = error instanceof DOMException ? error.name : '';
      if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
        updateState('denied');
      } else if (name === 'NotFoundError' || name === 'OverconstrainedError') {
        updateState('noCamera');
      } else {
        updateState('error');
      }
    }
  }, [updateState]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        if (stateRef.current === 'ready' || streamRef.current) {
          resumeWhenVisibleRef.current = true;
          stopTracks();
        }
      } else if (resumeWhenVisibleRef.current) {
        resumeWhenVisibleRef.current = false;
        void start();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      resumeWhenVisibleRef.current = false;
      stopTracks();
    };
  }, [start, stopTracks]);

  return { state, videoRef, start, stop };
}
