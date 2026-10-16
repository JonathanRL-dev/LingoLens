import { useRef, useState } from 'react';
import { CocoDetector } from '../../features/scanner/CocoDetector';
import { detectFromFile, type DetectorMission } from '../../features/scanner/useDetector';
import { useCamera } from '../../features/scanner/useCamera';
import type { Detection } from '../../features/scanner/detector';

type LabWord = { key: string; label: string };
type TrialSample = number | null;
type LabSummary = {
  label: string;
  minConfidence: number;
  passed: number;
  trials: number;
  percent: number;
  avgConfidence: number | null;
};

const WORDS: LabWord[] = [
  { key: 'cup', label: 'cup' },
  { key: 'bottle', label: 'bottle' },
  { key: 'bowl', label: 'bowl' },
  { key: 'spoon', label: 'spoon' },
  { key: 'banana', label: 'banana' },
  { key: 'apple', label: 'apple' },
  { key: 'book', label: 'book' },
  { key: 'clock', label: 'clock' },
  { key: 'backpack', label: 'backpack' },
  { key: 'chair', label: 'chair' },
  { key: 'laptop', label: 'laptop' },
  { key: 'phone', label: 'cell phone' },
];

const FIRST_WORD: LabWord = { key: 'cup', label: 'cup' };
const INITIAL_MIN_CONFIDENCE = 0.6;
const INITIAL_THRESHOLDS = Object.fromEntries(
  WORDS.map(({ key }) => [key, INITIAL_MIN_CONFIDENCE]),
) as Record<string, number>;

function getTargetConfidence(found: Detection[], targetLabel: string): number | null {
  const target = targetLabel.trim().toLowerCase();
  return found
    .filter(({ label }) => label.trim().toLowerCase() === target)
    .sort((a, b) => b.confidence - a.confidence)[0]?.confidence ?? null;
}

export function CvLab() {
  const { state: cameraState, videoRef, start, stop } = useCamera();
  const detectorRef = useRef<CocoDetector | null>(null);
  const [selectedWord, setSelectedWord] = useState(FIRST_WORD.key);
  const [source, setSource] = useState<'camera' | 'photo'>('camera');
  const [file, setFile] = useState<File | null>(null);
  const [thresholds, setThresholds] = useState(INITIAL_THRESHOLDS);
  const [samplesByWord, setSamplesByWord] = useState<Record<string, TrialSample[]>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');


  const word = WORDS.find(({ key }) => key === selectedWord) ?? FIRST_WORD;
  const samples = samplesByWord[selectedWord] ?? [];
  const threshold = thresholds[selectedWord] ?? INITIAL_MIN_CONFIDENCE;
  const detectedSamples = samples.filter((sample): sample is number => sample !== null);
  const passed = samples.filter((sample) => sample !== null && sample >= threshold).length;
  const percent = samples.length ? (passed / samples.length) * 100 : 0;
  const avgConfidence = detectedSamples.length
    ? detectedSamples.reduce((total, confidence) => total + confidence, 0) / detectedSamples.length
    : null;

  const getDetector = async () => {
    if (detectorRef.current) return detectorRef.current;

    const tf = await import('@tensorflow/tfjs');
    try {
      const webglReady = await tf.setBackend('webgl');
      if (!webglReady) await tf.setBackend('cpu');
    } catch {
      await tf.setBackend('cpu');
    }
    await tf.ready();

    const detector = new CocoDetector();
    await detector.load();
    detectorRef.current = detector;
    return detector;
  };

  const runTrial = async () => {
    if (samples.length >= 20 || busy) return;
    setBusy(true);
    setError('');

    try {
      const detector = await getDetector();
      let confidence: number | null;

      if (source === 'photo') {
        if (!file) throw new Error('Pilih foto terlebih dahulu.');
        const fileMission: DetectorMission = {
          acceptedLabels: [
            { model: 'coco-ssd', label: word.label, minConfidence: 0, vocabularyId: word.key },
          ],
        };
        confidence = (await detectFromFile(file, detector, fileMission))?.confidence ?? null;
      } else {
        if (cameraState !== 'ready' || !videoRef.current || videoRef.current.readyState < 2) {
          throw new Error('Mulai kamera dan tunggu pratinjau siap sebelum mencoba.');
        }
        confidence = getTargetConfidence(await detector.detect(videoRef.current), word.label);
      }

      setSamplesByWord((previous) => {
        const current = previous[selectedWord] ?? [];
        if (current.length >= 20) return previous;
        return { ...previous, [selectedWord]: [...current, confidence] };
      });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Percobaan gagal.');
    } finally {
      setBusy(false);
    }
  };

  const updateThreshold = (value: string) => {
    const next = Number(value);
    if (!Number.isFinite(next) || next < 0 || next > 1) return;
    setThresholds((previous) => ({ ...previous, [selectedWord]: next }));
  };

  const downloadJson = () => {
    const result = Object.fromEntries(
      WORDS.map(({ key, label }) => {
        const wordSamples = samplesByWord[key] ?? [];
        const minConfidence = thresholds[key] ?? INITIAL_MIN_CONFIDENCE;
        const wordPassed = wordSamples.filter(
          (sample) => sample !== null && sample >= minConfidence,
        ).length;
        const confidenceSamples = wordSamples.filter(
          (sample): sample is number => sample !== null,
        );
        const summary: LabSummary = {
          label,
          minConfidence,
          passed: wordPassed,
          trials: wordSamples.length,
          percent: wordSamples.length ? (wordPassed / wordSamples.length) * 100 : 0,
          avgConfidence: confidenceSamples.length
            ? confidenceSamples.reduce((total, confidence) => total + confidence, 0) /
              confidenceSamples.length
            : null,
        };
        return [key, summary];
      }),
    );
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'detection_labels.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', margin: '1rem auto', maxWidth: 760, padding: '0 1rem' }}>
      <h1>Lab pengukuran deteksi</h1>
      <p>Ukur hingga 20 percobaan untuk setiap kata. Persentase dihitung dari seluruh percobaan; rata-rata confidence memakai deteksi kata yang ditemukan.</p>

      <label style={{ display: 'block', margin: '1rem 0' }}>
        Kata{' '}
        <select value={selectedWord} onChange={(event) => setSelectedWord(event.target.value)}>
          {WORDS.map(({ key }) => <option key={key} value={key}>{key}</option>)}
        </select>
      </label>

      <label style={{ display: 'block', margin: '1rem 0' }}>
        minConfidence (0–1){' '}
        <input
          type="number"
          min="0"
          max="1"
          step="0.01"
          value={threshold}
          onChange={(event) => updateThreshold(event.target.value)}
        />
      </label>

      <label style={{ display: 'block', margin: '1rem 0' }}>
        Sumber percobaan{' '}
        <select value={source} onChange={(event) => setSource(event.target.value as 'camera' | 'photo')}>
          <option value="camera">Kamera</option>
          <option value="photo">Foto</option>
        </select>
      </label>

      {source === 'camera' ? (
        <>
          <video ref={videoRef} playsInline muted autoPlay style={{ background: '#111', maxWidth: '100%', width: 640 }} />
          <p>Status kamera: {cameraState}</p>
          <button type="button" onClick={() => void start()} disabled={cameraState === 'requesting' || cameraState === 'ready'}>
            Mulai kamera
          </button>{' '}
          <button type="button" onClick={stop} disabled={cameraState !== 'ready'}>Matikan kamera</button>
        </>
      ) : (
        <label style={{ display: 'block', margin: '1rem 0' }}>
          Pilih foto <input type="file" accept="image/*" onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
        </label>
      )}

      <p>
        <button type="button" onClick={() => void runTrial()} disabled={busy || samples.length >= 20}>
          {busy ? 'Mengukur…' : 'Percobaan'}
        </button>{' '}
        <button type="button" onClick={downloadJson}>Unduh JSON</button>
      </p>

      {error && <p role="alert" style={{ color: '#a83a17' }}>{error}</p>}
      <section aria-live="polite">
        <h2>{passed} dari 20 lolos</h2>
        <p>Percobaan: {samples.length}/20 · Persentase: {percent.toFixed(1)}% · Rata-rata confidence: {avgConfidence === null ? '—' : `${(avgConfidence * 100).toFixed(1)}%`}</p>
        {samples.length > 0 && percent < 85 && (
          <p role="alert" style={{ color: '#a83a17' }}>
            Hasil di bawah 85%. Pertimbangkan mengeluarkan kata dari misi demo; keluarkan spoon terlebih dahulu, lalu bowl.
          </p>
        )}
      </section>
    </main>
  );
}
