import { useEffect, useRef, useState } from 'react';

type Prediction = { class: string; score: number };
type Detector = { detect: (video: HTMLVideoElement) => Promise<Prediction[]> };

export function CvSpike() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const runningRef = useRef(false);
  const [status, setStatus] = useState('idle');
  const [backend, setBackend] = useState('belum dimuat');
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [error, setError] = useState('');

  useEffect(() => () => {
    runningRef.current = false;
    streamRef.current?.getTracks().forEach((track) => track.stop());
  }, []);

  const start = async () => {
    if (status === 'loading' || status === 'running') return;
    setError('');
    runningRef.current = true;
    setStatus('loading');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 640 } },
      });
      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) throw new Error('Elemen video tidak tersedia.');
      video.srcObject = stream;
      await video.play();

      const tf = await import('@tensorflow/tfjs');
      const cocoSsd = await import('@tensorflow-models/coco-ssd');
      const model: Detector = await cocoSsd.load({ base: 'lite_mobilenet_v2' });
      setBackend(tf.getBackend() ?? 'tidak diketahui');
      setStatus('running');

      const detect = async () => {
        if (!runningRef.current) return;
        if (!videoRef.current || videoRef.current.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
          window.setTimeout(detect, 400);
          return;
        }
        try {
          const found = await model.detect(videoRef.current);
          setPredictions(found);
          found.forEach(({ class: label, score }) => console.info('[cv-spike]', label, score));
        } catch (cause) {
          if (!runningRef.current) return;
          runningRef.current = false;
          setError(cause instanceof Error ? cause.message : 'Inferensi gagal.');
          setStatus('error');
          return;
        }
        window.setTimeout(detect, 400);
      };
      void detect();
    } catch (cause) {
      runningRef.current = false;
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      setError(cause instanceof Error ? cause.message : 'Kamera atau model gagal dimuat.');
      setStatus('error');
    }
  };

  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', margin: '1rem auto', maxWidth: 720, padding: '0 1rem' }}>
      <h1>Spike kamera + COCO-SSD</h1>
      <p>Status: {status} · Backend TensorFlow.js: {backend}</p>
      <video ref={videoRef} playsInline muted autoPlay style={{ background: '#111', maxWidth: '100%', width: 640 }} />
      <p><button type="button" onClick={start} disabled={status === 'loading' || status === 'running'}>Mulai</button></p>
      {error && <p role="alert">{error}</p>}
      <h2>Deteksi terbaru</h2>
      {predictions.length ? (
        <ul>{predictions.map(({ class: label, score }, index) => <li key={`${label}-${index}`}>{label}: {(score * 100).toFixed(1)}%</li>)}</ul>
      ) : <p>Belum ada objek terdeteksi.</p>}
    </main>
  );
}
